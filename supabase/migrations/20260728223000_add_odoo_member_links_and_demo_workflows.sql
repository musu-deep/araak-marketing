/*
# Odoo-linked platform members and demo competition workflows

- Persists the Odoo employee identifiers returned by ARAAK CEO.
- Adds four idempotent demo opportunities, tenders and workflow timelines.
- Assigns every stage to the operational platform member for the matching role.
- Marks demo records clearly so they can be filtered or removed later.
*/

-- =====================================================
-- 1) Persist the institutional Odoo identity on platform members
-- =====================================================
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS odoo_employee_id bigint,
  ADD COLUMN IF NOT EXISTS odoo_work_email text,
  ADD COLUMN IF NOT EXISTS odoo_department_id bigint,
  ADD COLUMN IF NOT EXISTS odoo_manager_id bigint,
  ADD COLUMN IF NOT EXISTS odoo_entity text,
  ADD COLUMN IF NOT EXISTS odoo_location text,
  ADD COLUMN IF NOT EXISTS workforce_source text NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS odoo_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_odoo_employee_id
  ON public.team_members(odoo_employee_id)
  WHERE odoo_employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_members_workforce_source
  ON public.team_members(workforce_source);

COMMENT ON COLUMN public.team_members.odoo_employee_id IS 'معرف الموظف في Odoo hr.employee';
COMMENT ON COLUMN public.team_members.odoo_work_email IS 'البريد الوظيفي كما هو مسجل في Odoo';
COMMENT ON COLUMN public.team_members.workforce_source IS 'مصدر السجل الوظيفي: local أو odoo';
COMMENT ON COLUMN public.team_members.odoo_synced_at IS 'آخر مزامنة ناجحة لسجل الموظف من Odoo';

-- =====================================================
-- 2) Mark demo records and their team source
-- =====================================================
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'platform';

ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_system text NOT NULL DEFAULT 'platform';

ALTER TABLE public.workflow_instances
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS team_source text NOT NULL DEFAULT 'platform',
  ADD COLUMN IF NOT EXISTS demo_scenario text;

CREATE INDEX IF NOT EXISTS idx_opportunities_is_demo ON public.opportunities(is_demo);
CREATE INDEX IF NOT EXISTS idx_tenders_is_demo ON public.tenders(is_demo);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_is_demo ON public.workflow_instances(is_demo);

-- =====================================================
-- 3) Internal helper used only by this migration
-- =====================================================
CREATE OR REPLACE FUNCTION public._seed_demo_competition_workflow(
  p_tender_id uuid,
  p_opportunity_id uuid,
  p_title text,
  p_reference text,
  p_received_at timestamptz,
  p_submission_deadline timestamptz,
  p_scenario text,
  p_progress jsonb,
  p_delay_stage text DEFAULT NULL,
  p_delay_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_template public.workflow_templates%ROWTYPE;
  v_workflow_id uuid;
  v_creator uuid;
  v_stage record;
  v_total_weight numeric;
  v_total_seconds numeric;
  v_elapsed_seconds numeric := 0;
  v_stage_seconds numeric;
  v_planned_start timestamptz;
  v_planned_end timestamptz;
  v_owner_id uuid;
  v_stage_id uuid;
  v_progress int;
  v_stage_status text;
  v_task_status text;
  v_actual_start timestamptz;
  v_actual_end timestamptz;
BEGIN
  SELECT id INTO v_creator
  FROM public.team_members
  WHERE is_active = true
    AND role_key IN ('marketing_lead', 'ceo', 'vp')
  ORDER BY CASE role_key WHEN 'marketing_lead' THEN 1 WHEN 'ceo' THEN 2 ELSE 3 END, full_name
  LIMIT 1;

  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'لا يوجد قائد منصة نشط لإنشاء المشاريع التجريبية.' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_template
  FROM public.workflow_templates
  WHERE key = 'building-project-tender' AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'قالب مشروع المباني غير موجود. طبّق Migration محرك المسارات أولاً.' USING ERRCODE = 'P0001';
  END IF;

  SELECT SUM(duration_weight) INTO v_total_weight
  FROM public.workflow_template_stages
  WHERE template_id = v_template.id;

  INSERT INTO public.workflow_instances (
    template_id, tender_id, opportunity_id, title, reference, project_type,
    received_at, submission_deadline, status, created_by,
    is_demo, team_source, demo_scenario, notes
  )
  VALUES (
    v_template.id, p_tender_id, p_opportunity_id, p_title, p_reference,
    v_template.project_type, p_received_at, p_submission_deadline, 'active', v_creator,
    true, 'odoo', p_scenario,
    'بيانات تجريبية لشرح المقياس الزمني. ملاك المراحل هم أعضاء فريق المنصة المرتبطون بدليل Odoo.'
  )
  RETURNING id INTO v_workflow_id;

  v_total_seconds := EXTRACT(EPOCH FROM (p_submission_deadline - p_received_at));

  FOR v_stage IN
    SELECT *
    FROM public.workflow_template_stages
    WHERE template_id = v_template.id
    ORDER BY sort_order
  LOOP
    v_stage_seconds := v_total_seconds * (v_stage.duration_weight / v_total_weight);
    v_planned_start := p_received_at + make_interval(secs => v_elapsed_seconds);
    v_elapsed_seconds := v_elapsed_seconds + v_stage_seconds;
    v_planned_end := CASE
      WHEN v_stage.sort_order = (
        SELECT MAX(sort_order)
        FROM public.workflow_template_stages
        WHERE template_id = v_template.id
      ) THEN p_submission_deadline
      ELSE p_received_at + make_interval(secs => v_elapsed_seconds)
    END;

    SELECT id INTO v_owner_id
    FROM public.team_members
    WHERE role_key = v_stage.owner_role_key AND is_active = true
    ORDER BY
      CASE WHEN odoo_employee_id IS NOT NULL THEN 0 ELSE 1 END,
      full_name
    LIMIT 1;

    v_progress := LEAST(GREATEST(COALESCE((p_progress ->> v_stage.stage_key)::int, 0), 0), 100);
    v_stage_status := CASE
      WHEN v_progress >= 100 THEN 'completed'
      WHEN v_stage.is_approval AND v_progress >= 70 THEN 'review'
      WHEN v_progress > 0 THEN 'in_progress'
      ELSE 'pending'
    END;
    v_task_status := CASE v_stage_status
      WHEN 'completed' THEN 'done'
      WHEN 'review' THEN 'review'
      WHEN 'in_progress' THEN 'in_progress'
      ELSE 'todo'
    END;
    v_actual_start := CASE
      WHEN v_progress > 0 THEN LEAST(v_planned_start + interval '2 hours', now())
      ELSE NULL
    END;
    v_actual_end := CASE
      WHEN v_progress >= 100 THEN LEAST(v_planned_end - interval '1 hour', now())
      ELSE NULL
    END;

    INSERT INTO public.workflow_stage_instances (
      workflow_id, template_stage_id, stage_key, stage_name, owner_role_key,
      owner_id, sort_order, duration_weight, planned_start, planned_end,
      actual_start, actual_end, status, progress_percent, expected_output,
      delay_reason, notes, color, is_approval, is_critical
    )
    VALUES (
      v_workflow_id, v_stage.id, v_stage.stage_key, v_stage.stage_name,
      v_stage.owner_role_key, v_owner_id, v_stage.sort_order, v_stage.duration_weight,
      v_planned_start, v_planned_end, v_actual_start, v_actual_end,
      v_stage_status, v_progress, v_stage.expected_output,
      CASE WHEN v_stage.stage_key = p_delay_stage THEN p_delay_reason ELSE NULL END,
      CASE
        WHEN v_stage.stage_key = p_delay_stage THEN 'مرحلة الاختناق في السيناريو التجريبي.'
        ELSE 'مرحلة تجريبية مرتبطة بمالك الدور من فريق Odoo.'
      END,
      v_stage.color, v_stage.is_approval, v_stage.is_critical
    )
    RETURNING id INTO v_stage_id;

    INSERT INTO public.tasks (
      title, description, opportunity_id, tender_id, assigned_to, assigned_by,
      status, priority, due_date, completed_at, start_at, due_at,
      estimated_hours, progress_percent, expected_output, tags,
      workflow_id, workflow_stage_id, task_type
    )
    VALUES (
      v_stage.stage_name,
      'مهمة تجريبية ضمن المسار التنفيذي: ' || p_title,
      p_opportunity_id, p_tender_id, v_owner_id, v_creator,
      v_task_status,
      CASE WHEN v_stage.is_critical THEN 'high' ELSE 'medium' END,
      v_planned_end::date, v_actual_end, v_planned_start, v_planned_end,
      ROUND(v_stage_seconds / 3600.0, 2), v_progress, v_stage.expected_output,
      ARRAY['مشروع تجريبي', 'فريق Odoo', v_stage.stage_key],
      v_workflow_id, v_stage_id,
      CASE WHEN v_stage.is_approval THEN 'approval' ELSE 'workflow_stage' END
    );

    -- The task trigger synchronises the stage. Restore the intended historical
    -- timestamps and delay note for the demo scenario after that synchronisation.
    UPDATE public.workflow_stage_instances
    SET
      actual_start = v_actual_start,
      actual_end = v_actual_end,
      delay_reason = CASE WHEN v_stage.stage_key = p_delay_stage THEN p_delay_reason ELSE NULL END,
      notes = CASE
        WHEN v_stage.stage_key = p_delay_stage THEN 'مرحلة الاختناق في السيناريو التجريبي.'
        ELSE 'مرحلة تجريبية مرتبطة بمالك الدور من فريق Odoo.'
      END,
      updated_at = now()
    WHERE id = v_stage_id;
  END LOOP;

  INSERT INTO public.workflow_handoffs (
    workflow_id, from_stage_id, to_stage_id, from_member_id, to_member_id,
    planned_handoff_at, sent_at, received_at, status, notes
  )
  SELECT
    v_workflow_id,
    current_stage.id,
    next_stage.id,
    current_stage.owner_id,
    next_stage.owner_id,
    current_stage.planned_end,
    CASE WHEN current_stage.progress_percent >= 100 THEN current_stage.actual_end ELSE NULL END,
    CASE WHEN next_stage.progress_percent > 0 THEN next_stage.actual_start ELSE NULL END,
    CASE
      WHEN next_stage.progress_percent > 0 THEN 'received'
      WHEN current_stage.progress_percent >= 100 THEN 'in_transit'
      ELSE 'pending'
    END,
    'انتقال تجريبي للملف بين عضوين مرتبطين بدليل Odoo.'
  FROM public.workflow_stage_instances AS current_stage
  JOIN public.workflow_stage_instances AS next_stage
    ON next_stage.workflow_id = current_stage.workflow_id
   AND next_stage.sort_order = current_stage.sort_order + 1
  WHERE current_stage.workflow_id = v_workflow_id;

  PERFORM public.refresh_workflow_progress(v_workflow_id);
  RETURN v_workflow_id;
END;
$$;

REVOKE ALL ON FUNCTION public._seed_demo_competition_workflow(
  uuid, uuid, text, text, timestamptz, timestamptz, text, jsonb, text, text
) FROM PUBLIC, anon, authenticated;

-- =====================================================
-- 4) Four professional demo scenarios
-- =====================================================
DO $$
DECLARE
  v_creator uuid;
  v_lead uuid;
  v_opportunity uuid;
  v_tender uuid;
BEGIN
  SELECT id INTO v_creator
  FROM public.team_members
  WHERE is_active = true AND role_key IN ('marketing_lead', 'ceo', 'vp')
  ORDER BY CASE role_key WHEN 'marketing_lead' THEN 1 WHEN 'ceo' THEN 2 ELSE 3 END, full_name
  LIMIT 1;

  SELECT id INTO v_lead
  FROM public.team_members
  WHERE is_active = true AND role_key = 'marketing_lead'
  ORDER BY CASE WHEN odoo_employee_id IS NOT NULL THEN 0 ELSE 1 END, full_name
  LIMIT 1;

  v_lead := COALESCE(v_lead, v_creator);

  -- Scenario 1: healthy progress, supplier quotations currently active.
  INSERT INTO public.opportunities (
    reference, title, client, entity, city, value, currency, deadline,
    publication_date, description, category, status, risk_level,
    created_by, is_demo, source_system, tags
  ) VALUES (
    'DEMO-OPP-BLD-001',
    'تجريبي | إنشاء مجمع إداري متكامل — الرياض',
    'هيئة تطوير افتراضية', 'قطاع المشروعات الحكومية', 'الرياض',
    18500000, 'SAR', (now() + interval '10 days')::date,
    (now() - interval '10 days')::date,
    'سيناريو تجريبي لمسار مبانٍ يسير ضمن الخطة ووصل إلى عروض الأسعار.',
    'مشروعات مبانٍ', 'in_progress', 'medium', v_creator, true, 'odoo-linked-demo',
    ARRAY['تجريبي','مبانٍ','فريق Odoo']
  )
  ON CONFLICT (reference) DO UPDATE SET
    title = EXCLUDED.title, deadline = EXCLUDED.deadline, publication_date = EXCLUDED.publication_date,
    is_demo = true, source_system = EXCLUDED.source_system, updated_at = now()
  RETURNING id INTO v_opportunity;

  INSERT INTO public.tenders (
    opportunity_id, reference, title, client, entity, value, currency,
    submission_deadline, current_stage, status, risk_level,
    assigned_lead, created_by, is_demo, source_system
  ) VALUES (
    v_opportunity, 'DEMO-TND-BLD-001',
    'تجريبي | كراسة المجمع الإداري المتكامل — الرياض',
    'هيئة تطوير افتراضية', 'قطاع المشروعات الحكومية', 18500000, 'SAR',
    (now() + interval '10 days')::date, 'financial', 'in_progress', 'medium',
    v_lead, v_creator, true, 'odoo-linked-demo'
  )
  ON CONFLICT (reference) DO UPDATE SET
    opportunity_id = EXCLUDED.opportunity_id, submission_deadline = EXCLUDED.submission_deadline,
    assigned_lead = EXCLUDED.assigned_lead, is_demo = true, source_system = EXCLUDED.source_system,
    updated_at = now()
  RETURNING id INTO v_tender;

  IF NOT EXISTS (SELECT 1 FROM public.workflow_instances WHERE reference = 'DEMO-WF-BLD-001') THEN
    PERFORM public._seed_demo_competition_workflow(
      v_tender, v_opportunity,
      'تجريبي | إنشاء مجمع إداري متكامل — الرياض', 'DEMO-WF-BLD-001',
      now() - interval '10 days', now() + interval '10 days',
      'ضمن الخطة — عروض الأسعار قيد الاستلام',
      '{"intake":100,"initial_assessment":100,"technical_study":100,"scope_and_boq":100,"supplier_quotes":65,"pricing_comparison":0,"project_approval":0,"return_to_platform":0,"final_submission":0,"safety_buffer":0}'::jsonb,
      NULL, NULL
    );
  END IF;

  -- Scenario 2: delayed at supplier quotations; shows a clear bottleneck.
  INSERT INTO public.opportunities (
    reference, title, client, entity, city, value, currency, deadline,
    publication_date, description, category, status, risk_level,
    created_by, is_demo, source_system, tags
  ) VALUES (
    'DEMO-OPP-BLD-002',
    'تجريبي | تأهيل وتوسعة مبنى صحي — جدة',
    'تجمع صحي افتراضي', 'القطاع الصحي', 'جدة',
    9200000, 'SAR', (now() + interval '4 days')::date,
    (now() - interval '18 days')::date,
    'سيناريو يوضح أثر تأخر الموردين في مرحلة عروض الأسعار على كامل المسار.',
    'تأهيل مبانٍ صحية', 'in_progress', 'high', v_creator, true, 'odoo-linked-demo',
    ARRAY['تجريبي','صحي','متأخر','فريق Odoo']
  )
  ON CONFLICT (reference) DO UPDATE SET
    title = EXCLUDED.title, deadline = EXCLUDED.deadline, publication_date = EXCLUDED.publication_date,
    is_demo = true, source_system = EXCLUDED.source_system, updated_at = now()
  RETURNING id INTO v_opportunity;

  INSERT INTO public.tenders (
    opportunity_id, reference, title, client, entity, value, currency,
    submission_deadline, current_stage, status, risk_level,
    assigned_lead, created_by, is_demo, source_system
  ) VALUES (
    v_opportunity, 'DEMO-TND-BLD-002',
    'تجريبي | كراسة تأهيل المبنى الصحي — جدة',
    'تجمع صحي افتراضي', 'القطاع الصحي', 9200000, 'SAR',
    (now() + interval '4 days')::date, 'financial', 'in_progress', 'high',
    v_lead, v_creator, true, 'odoo-linked-demo'
  )
  ON CONFLICT (reference) DO UPDATE SET
    opportunity_id = EXCLUDED.opportunity_id, submission_deadline = EXCLUDED.submission_deadline,
    assigned_lead = EXCLUDED.assigned_lead, is_demo = true, source_system = EXCLUDED.source_system,
    updated_at = now()
  RETURNING id INTO v_tender;

  IF NOT EXISTS (SELECT 1 FROM public.workflow_instances WHERE reference = 'DEMO-WF-BLD-002') THEN
    PERFORM public._seed_demo_competition_workflow(
      v_tender, v_opportunity,
      'تجريبي | تأهيل وتوسعة مبنى صحي — جدة', 'DEMO-WF-BLD-002',
      now() - interval '18 days', now() + interval '4 days',
      'متعثر — عروض الموردين لم تكتمل',
      '{"intake":100,"initial_assessment":100,"technical_study":100,"scope_and_boq":100,"supplier_quotes":35,"pricing_comparison":0,"project_approval":0,"return_to_platform":0,"final_submission":0,"safety_buffer":0}'::jsonb,
      'supplier_quotes', 'تأخر موردان رئيسيان في إرسال عروض مطابقة للمواصفات والمدة المطلوبة.'
    );
  END IF;

  -- Scenario 3: pricing is complete and the file is under project approval.
  INSERT INTO public.opportunities (
    reference, title, client, entity, city, value, currency, deadline,
    publication_date, description, category, status, risk_level,
    created_by, is_demo, source_system, tags
  ) VALUES (
    'DEMO-OPP-BLD-003',
    'تجريبي | تطوير مستودع مركزي ذكي — المدينة',
    'شركة لوجستية افتراضية', 'القطاع اللوجستي', 'المدينة المنورة',
    12800000, 'SAR', (now() + interval '6 days')::date,
    (now() - interval '16 days')::date,
    'سيناريو يعرض الملف في بوابة الاعتماد بعد اكتمال الدراسة الفنية والتسعير.',
    'مستودعات ولوجستيات', 'in_progress', 'medium', v_creator, true, 'odoo-linked-demo',
    ARRAY['تجريبي','مستودع','اعتماد','فريق Odoo']
  )
  ON CONFLICT (reference) DO UPDATE SET
    title = EXCLUDED.title, deadline = EXCLUDED.deadline, publication_date = EXCLUDED.publication_date,
    is_demo = true, source_system = EXCLUDED.source_system, updated_at = now()
  RETURNING id INTO v_opportunity;

  INSERT INTO public.tenders (
    opportunity_id, reference, title, client, entity, value, currency,
    submission_deadline, current_stage, status, risk_level,
    assigned_lead, created_by, is_demo, source_system
  ) VALUES (
    v_opportunity, 'DEMO-TND-BLD-003',
    'تجريبي | كراسة تطوير المستودع المركزي — المدينة',
    'شركة لوجستية افتراضية', 'القطاع اللوجستي', 12800000, 'SAR',
    (now() + interval '6 days')::date, 'submission', 'in_progress', 'medium',
    v_lead, v_creator, true, 'odoo-linked-demo'
  )
  ON CONFLICT (reference) DO UPDATE SET
    opportunity_id = EXCLUDED.opportunity_id, submission_deadline = EXCLUDED.submission_deadline,
    assigned_lead = EXCLUDED.assigned_lead, is_demo = true, source_system = EXCLUDED.source_system,
    updated_at = now()
  RETURNING id INTO v_tender;

  IF NOT EXISTS (SELECT 1 FROM public.workflow_instances WHERE reference = 'DEMO-WF-BLD-003') THEN
    PERFORM public._seed_demo_competition_workflow(
      v_tender, v_opportunity,
      'تجريبي | تطوير مستودع مركزي ذكي — المدينة', 'DEMO-WF-BLD-003',
      now() - interval '16 days', now() + interval '6 days',
      'قيد الاعتماد — مراجعة مسؤول المشاريع',
      '{"intake":100,"initial_assessment":100,"technical_study":100,"scope_and_boq":100,"supplier_quotes":100,"pricing_comparison":100,"project_approval":75,"return_to_platform":0,"final_submission":0,"safety_buffer":0}'::jsonb,
      NULL, NULL
    );
  END IF;

  -- Scenario 4: final upload is almost complete and deadline is close.
  INSERT INTO public.opportunities (
    reference, title, client, entity, city, value, currency, deadline,
    publication_date, description, category, status, risk_level,
    created_by, is_demo, source_system, tags
  ) VALUES (
    'DEMO-OPP-BLD-004',
    'تجريبي | إنشاء مركز تدريب مهني — الدمام',
    'مؤسسة تدريب افتراضية', 'قطاع التعليم والتدريب', 'الدمام',
    6700000, 'SAR', (now() + interval '2 days')::date,
    (now() - interval '20 days')::date,
    'سيناريو عاجل يوضح مرحلة الرفع النهائي وهامش الأمان قبل الإغلاق.',
    'مبانٍ تعليمية', 'in_progress', 'high', v_creator, true, 'odoo-linked-demo',
    ARRAY['تجريبي','تدريب','عاجل','فريق Odoo']
  )
  ON CONFLICT (reference) DO UPDATE SET
    title = EXCLUDED.title, deadline = EXCLUDED.deadline, publication_date = EXCLUDED.publication_date,
    is_demo = true, source_system = EXCLUDED.source_system, updated_at = now()
  RETURNING id INTO v_opportunity;

  INSERT INTO public.tenders (
    opportunity_id, reference, title, client, entity, value, currency,
    submission_deadline, current_stage, status, risk_level,
    assigned_lead, created_by, is_demo, source_system
  ) VALUES (
    v_opportunity, 'DEMO-TND-BLD-004',
    'تجريبي | كراسة مركز التدريب المهني — الدمام',
    'مؤسسة تدريب افتراضية', 'قطاع التعليم والتدريب', 6700000, 'SAR',
    (now() + interval '2 days')::date, 'submission', 'in_progress', 'high',
    v_lead, v_creator, true, 'odoo-linked-demo'
  )
  ON CONFLICT (reference) DO UPDATE SET
    opportunity_id = EXCLUDED.opportunity_id, submission_deadline = EXCLUDED.submission_deadline,
    assigned_lead = EXCLUDED.assigned_lead, is_demo = true, source_system = EXCLUDED.source_system,
    updated_at = now()
  RETURNING id INTO v_tender;

  IF NOT EXISTS (SELECT 1 FROM public.workflow_instances WHERE reference = 'DEMO-WF-BLD-004') THEN
    PERFORM public._seed_demo_competition_workflow(
      v_tender, v_opportunity,
      'تجريبي | إنشاء مركز تدريب مهني — الدمام', 'DEMO-WF-BLD-004',
      now() - interval '20 days', now() + interval '2 days',
      'عاجل — الرفع النهائي قيد الإقفال',
      '{"intake":100,"initial_assessment":100,"technical_study":100,"scope_and_boq":100,"supplier_quotes":100,"pricing_comparison":100,"project_approval":100,"return_to_platform":100,"final_submission":85,"safety_buffer":0}'::jsonb,
      NULL, NULL
    );
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public._seed_demo_competition_workflow(
  uuid, uuid, text, text, timestamptz, timestamptz, text, jsonb, text, text
);

NOTIFY pgrst, 'reload schema';

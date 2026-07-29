/*
# Competition workflow and file-engineering timeline

Creates a professional workflow engine for tenders and projects:
- reusable workflow templates and weighted stages
- live workflow instances linked to tenders/opportunities
- planned and actual stage dates
- file handoffs between departments
- automatic stage tasks and progress synchronisation
- building-project tender template
*/

-- =====================================================
-- 1) Workflow templates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  project_type text NOT NULL DEFAULT 'general',
  buffer_percent numeric(6,2) NOT NULL DEFAULT 10 CHECK (buffer_percent >= 0 AND buffer_percent < 100),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_template_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  stage_name text NOT NULL,
  owner_role_key text NOT NULL REFERENCES public.roles(key) ON DELETE RESTRICT,
  sort_order int NOT NULL,
  duration_weight numeric(8,3) NOT NULL CHECK (duration_weight > 0),
  expected_output text,
  color text NOT NULL DEFAULT '#0e8494',
  is_approval boolean NOT NULL DEFAULT false,
  is_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, stage_key),
  UNIQUE (template_id, sort_order)
);

-- =====================================================
-- 2) Workflow execution
-- =====================================================
CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.workflow_templates(id) ON DELETE RESTRICT,
  tender_id uuid REFERENCES public.tenders(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  title text NOT NULL,
  reference text,
  project_type text NOT NULL DEFAULT 'general',
  received_at timestamptz NOT NULL,
  submission_deadline timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','at_risk','completed','cancelled')),
  overall_progress int NOT NULL DEFAULT 0 CHECK (overall_progress BETWEEN 0 AND 100),
  current_stage_key text,
  notes text,
  created_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (submission_deadline > received_at)
);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_tender ON public.workflow_instances(tender_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_opportunity ON public.workflow_instances(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_deadline ON public.workflow_instances(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON public.workflow_instances(status);

CREATE TABLE IF NOT EXISTS public.workflow_stage_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  template_stage_id uuid REFERENCES public.workflow_template_stages(id) ON DELETE SET NULL,
  stage_key text NOT NULL,
  stage_name text NOT NULL,
  owner_role_key text NOT NULL REFERENCES public.roles(key) ON DELETE RESTRICT,
  owner_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  sort_order int NOT NULL,
  duration_weight numeric(8,3) NOT NULL CHECK (duration_weight > 0),
  planned_start timestamptz NOT NULL,
  planned_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','review','completed','blocked')),
  progress_percent int NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  expected_output text,
  delay_reason text,
  notes text,
  color text NOT NULL DEFAULT '#0e8494',
  is_approval boolean NOT NULL DEFAULT false,
  is_critical boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (planned_end > planned_start),
  UNIQUE (workflow_id, stage_key),
  UNIQUE (workflow_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_workflow_stages_workflow ON public.workflow_stage_instances(workflow_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_owner ON public.workflow_stage_instances(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_stages_planned_end ON public.workflow_stage_instances(planned_end);

CREATE TABLE IF NOT EXISTS public.workflow_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  from_stage_id uuid NOT NULL REFERENCES public.workflow_stage_instances(id) ON DELETE CASCADE,
  to_stage_id uuid NOT NULL REFERENCES public.workflow_stage_instances(id) ON DELETE CASCADE,
  from_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  to_member_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  planned_handoff_at timestamptz NOT NULL,
  sent_at timestamptz,
  received_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_transit','received','returned')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, from_stage_id, to_stage_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_handoffs_workflow ON public.workflow_handoffs(workflow_id, planned_handoff_at);

-- Link existing tasks to workflow stages.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS workflow_id uuid REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS workflow_stage_id uuid REFERENCES public.workflow_stage_instances(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'standalone' CHECK (task_type IN ('standalone','workflow_stage','handoff','approval'));

CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON public.tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_stage ON public.tasks(workflow_stage_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_one_per_workflow_stage
  ON public.tasks(workflow_stage_id)
  WHERE workflow_stage_id IS NOT NULL AND task_type = 'workflow_stage';

-- =====================================================
-- 3) Building-project tender template
-- =====================================================
INSERT INTO public.workflow_templates (
  key, name, description, project_type, buffer_percent, is_active
)
VALUES (
  'building-project-tender',
  'مشروع مبانٍ — هندلة ملف المنافسة',
  'مسار مهني يبدأ من استلام الفرصة وينتهي بالرفع النهائي قبل إغلاق التسليم، مع توزيع الملف بين المنصة والمكتب الفني والمشتريات والمالية وإدارة المشاريع والمتابعة التنفيذية.',
  'buildings',
  9,
  true
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  project_type = EXCLUDED.project_type,
  buffer_percent = EXCLUDED.buffer_percent,
  is_active = true,
  updated_at = now();

WITH selected_template AS (
  SELECT id FROM public.workflow_templates WHERE key = 'building-project-tender'
), stages(stage_key, stage_name, owner_role_key, sort_order, duration_weight, expected_output, color, is_approval, is_critical) AS (
  VALUES
    ('intake', 'استلام الفرصة وتسجيل الملف', 'marketing_lead', 1, 3, 'سجل فرصة مكتمل، الكراسة مرفوعة، وتاريخ الإغلاق مثبت.', '#0891b2', false, true),
    ('initial_assessment', 'الدراسة الأولية وقرار المشاركة', 'marketing_lead', 2, 7, 'قرار مبدئي موثق بالمشاركة أو الاعتذار مع المبررات.', '#0e7490', true, true),
    ('technical_study', 'الدراسة الفنية وتحليل الكراسة', 'technical_office', 3, 18, 'تحليل فني شامل للمواصفات والمخططات والاشتراطات والمخاطر.', '#2563eb', false, true),
    ('scope_and_boq', 'حصر البنود والكميات والمتطلبات', 'technical_office', 4, 14, 'جدول كميات ونطاق أعمال ومتطلبات موردين ومقاولين واضح.', '#4f46e5', false, true),
    ('supplier_quotes', 'طلب واستلام عروض الأسعار', 'warehouse_sales', 5, 18, 'عروض أسعار قابلة للمقارنة ومستوفية للمدد والمواصفات.', '#7c3aed', false, true),
    ('pricing_comparison', 'المقارنات وبناء مصفوفة التسعير', 'cfo', 6, 14, 'مقارنة مالية وتكلفة مباشرة وغير مباشرة وهامش ومخاطر وسعر موصى به.', '#a21caf', false, true),
    ('project_approval', 'مراجعة واعتماد مسؤول المشاريع', 'national_director', 7, 7, 'اعتماد فني وتشغيلي نهائي أو قائمة ملاحظات واجبة الإقفال.', '#c2410c', true, true),
    ('return_to_platform', 'إعادة الملف لمسؤول المنصة', 'executive_office', 8, 3, 'ملف موحد بنسخته النهائية مع جميع الاعتمادات والمرفقات.', '#d97706', false, false),
    ('final_submission', 'المراجعة النهائية والرفع', 'marketing_lead', 9, 7, 'كراسة مكتملة مرفوعة على المنصة الخارجية وإثبات تسليم محفوظ.', '#059669', true, true),
    ('safety_buffer', 'هامش الأمان قبل الإغلاق', 'executive_followup', 10, 9, 'نافذة احتياطية لمعالجة الملاحظات أو أعطال الرفع قبل موعد الإغلاق.', '#64748b', false, true)
)
INSERT INTO public.workflow_template_stages (
  template_id, stage_key, stage_name, owner_role_key, sort_order,
  duration_weight, expected_output, color, is_approval, is_critical
)
SELECT
  selected_template.id, stages.stage_key, stages.stage_name, stages.owner_role_key,
  stages.sort_order, stages.duration_weight, stages.expected_output, stages.color,
  stages.is_approval, stages.is_critical
FROM selected_template CROSS JOIN stages
ON CONFLICT (template_id, stage_key) DO UPDATE SET
  stage_name = EXCLUDED.stage_name,
  owner_role_key = EXCLUDED.owner_role_key,
  sort_order = EXCLUDED.sort_order,
  duration_weight = EXCLUDED.duration_weight,
  expected_output = EXCLUDED.expected_output,
  color = EXCLUDED.color,
  is_approval = EXCLUDED.is_approval,
  is_critical = EXCLUDED.is_critical;

-- =====================================================
-- 4) Progress and synchronisation functions
-- =====================================================
CREATE OR REPLACE FUNCTION public.refresh_workflow_progress(p_workflow_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress int;
  v_current_stage text;
  v_has_delay boolean;
  v_deadline timestamptz;
BEGIN
  SELECT
    COALESCE(ROUND(SUM(progress_percent * duration_weight) / NULLIF(SUM(duration_weight), 0)), 0)::int,
    (ARRAY_AGG(stage_key ORDER BY sort_order) FILTER (WHERE progress_percent < 100))[1],
    COALESCE(BOOL_OR(progress_percent < 100 AND planned_end < now()), false)
  INTO v_progress, v_current_stage, v_has_delay
  FROM public.workflow_stage_instances
  WHERE workflow_id = p_workflow_id;

  SELECT submission_deadline INTO v_deadline
  FROM public.workflow_instances
  WHERE id = p_workflow_id;

  UPDATE public.workflow_instances
  SET
    overall_progress = LEAST(GREATEST(COALESCE(v_progress, 0), 0), 100),
    current_stage_key = v_current_stage,
    status = CASE
      WHEN COALESCE(v_progress, 0) >= 100 THEN 'completed'
      WHEN v_has_delay OR (v_deadline < now() AND COALESCE(v_progress, 0) < 100) THEN 'at_risk'
      ELSE 'active'
    END,
    updated_at = now()
  WHERE id = p_workflow_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.workflow_stage_refresh_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_workflow_progress(COALESCE(NEW.workflow_id, OLD.workflow_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS workflow_stage_refresh_progress ON public.workflow_stage_instances;
CREATE TRIGGER workflow_stage_refresh_progress
AFTER INSERT OR UPDATE OR DELETE ON public.workflow_stage_instances
FOR EACH ROW EXECUTE FUNCTION public.workflow_stage_refresh_trigger();

CREATE OR REPLACE FUNCTION public.sync_workflow_stage_from_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stage_status text;
  v_completed_at timestamptz;
BEGIN
  IF NEW.workflow_stage_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_stage_status := CASE NEW.status
    WHEN 'todo' THEN 'pending'
    WHEN 'in_progress' THEN 'in_progress'
    WHEN 'review' THEN 'review'
    WHEN 'done' THEN 'completed'
    WHEN 'blocked' THEN 'blocked'
    ELSE 'pending'
  END;

  v_completed_at := CASE
    WHEN NEW.status = 'done' OR COALESCE(NEW.progress_percent, 0) >= 100
      THEN COALESCE(NEW.completed_at, now())
    ELSE NULL
  END;

  UPDATE public.workflow_stage_instances
  SET
    owner_id = NEW.assigned_to,
    progress_percent = CASE WHEN NEW.status = 'done' THEN 100 ELSE COALESCE(NEW.progress_percent, 0) END,
    status = CASE WHEN NEW.status = 'done' THEN 'completed' ELSE v_stage_status END,
    actual_start = CASE
      WHEN NEW.status <> 'todo' AND actual_start IS NULL THEN now()
      ELSE actual_start
    END,
    actual_end = v_completed_at,
    updated_at = now()
  WHERE id = NEW.workflow_stage_id;

  IF NEW.status = 'done' THEN
    UPDATE public.workflow_handoffs
    SET
      sent_at = COALESCE(sent_at, v_completed_at),
      status = CASE WHEN received_at IS NULL THEN 'in_transit' ELSE 'received' END,
      updated_at = now()
    WHERE from_stage_id = NEW.workflow_stage_id;
  END IF;

  IF NEW.status IN ('in_progress','review','done') THEN
    UPDATE public.workflow_handoffs
    SET
      received_at = COALESCE(received_at, now()),
      status = 'received',
      updated_at = now()
    WHERE to_stage_id = NEW.workflow_stage_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_sync_workflow_stage ON public.tasks;
CREATE TRIGGER tasks_sync_workflow_stage
AFTER INSERT OR UPDATE OF status, progress_percent, completed_at, assigned_to ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.sync_workflow_stage_from_task();

-- =====================================================
-- 5) Workflow creation RPC
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_competition_workflow(
  p_template_key text,
  p_title text,
  p_reference text,
  p_received_at timestamptz,
  p_submission_deadline timestamptz,
  p_tender_id uuid DEFAULT NULL,
  p_opportunity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  v_task_status text;
BEGIN
  v_creator := public.current_member_id();
  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'لا يوجد عضو منصة مرتبط بالمستخدم الحالي.' USING ERRCODE = '42501';
  END IF;

  IF p_submission_deadline <= p_received_at THEN
    RAISE EXCEPTION 'موعد التسليم يجب أن يكون بعد تاريخ استلام الفرصة.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_template
  FROM public.workflow_templates
  WHERE key = p_template_key AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'قالب المسار غير موجود أو غير مفعّل.' USING ERRCODE = '22023';
  END IF;

  SELECT SUM(duration_weight) INTO v_total_weight
  FROM public.workflow_template_stages
  WHERE template_id = v_template.id;

  IF COALESCE(v_total_weight, 0) <= 0 THEN
    RAISE EXCEPTION 'قالب المسار لا يحتوي مراحل زمنية صالحة.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.workflow_instances (
    template_id, tender_id, opportunity_id, title, reference, project_type,
    received_at, submission_deadline, status, created_by
  )
  VALUES (
    v_template.id, p_tender_id, p_opportunity_id, p_title, NULLIF(p_reference, ''),
    v_template.project_type, p_received_at, p_submission_deadline, 'active', v_creator
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
        SELECT MAX(sort_order) FROM public.workflow_template_stages WHERE template_id = v_template.id
      ) THEN p_submission_deadline
      ELSE p_received_at + make_interval(secs => v_elapsed_seconds)
    END;

    SELECT id INTO v_owner_id
    FROM public.team_members
    WHERE role_key = v_stage.owner_role_key AND is_active = true
    ORDER BY full_name
    LIMIT 1;

    v_task_status := CASE
      WHEN v_stage.sort_order = 1 AND p_received_at <= now() THEN 'in_progress'
      ELSE 'todo'
    END;

    INSERT INTO public.workflow_stage_instances (
      workflow_id, template_stage_id, stage_key, stage_name, owner_role_key,
      owner_id, sort_order, duration_weight, planned_start, planned_end,
      actual_start, status, progress_percent, expected_output, color,
      is_approval, is_critical
    )
    VALUES (
      v_workflow_id, v_stage.id, v_stage.stage_key, v_stage.stage_name,
      v_stage.owner_role_key, v_owner_id, v_stage.sort_order, v_stage.duration_weight,
      v_planned_start, v_planned_end,
      CASE WHEN v_task_status = 'in_progress' THEN now() ELSE NULL END,
      CASE WHEN v_task_status = 'in_progress' THEN 'in_progress' ELSE 'pending' END,
      0, v_stage.expected_output, v_stage.color, v_stage.is_approval, v_stage.is_critical
    )
    RETURNING id INTO v_stage_id;

    INSERT INTO public.tasks (
      title, description, opportunity_id, tender_id, assigned_to, assigned_by,
      status, priority, due_date, start_at, due_at, estimated_hours,
      progress_percent, expected_output, tags, workflow_id, workflow_stage_id, task_type
    )
    VALUES (
      v_stage.stage_name,
      'مرحلة ضمن المسار التنفيذي للمنافسة: ' || p_title,
      p_opportunity_id,
      p_tender_id,
      v_owner_id,
      v_creator,
      v_task_status,
      CASE WHEN v_stage.is_critical THEN 'high' ELSE 'medium' END,
      v_planned_end::date,
      v_planned_start,
      v_planned_end,
      ROUND(v_stage_seconds / 3600.0, 2),
      0,
      v_stage.expected_output,
      ARRAY['مسار المنافسة', v_stage.stage_key],
      v_workflow_id,
      v_stage_id,
      CASE WHEN v_stage.is_approval THEN 'approval' ELSE 'workflow_stage' END
    );
  END LOOP;

  INSERT INTO public.workflow_handoffs (
    workflow_id, from_stage_id, to_stage_id, from_member_id, to_member_id,
    planned_handoff_at, status
  )
  SELECT
    v_workflow_id,
    current_stage.id,
    next_stage.id,
    current_stage.owner_id,
    next_stage.owner_id,
    current_stage.planned_end,
    'pending'
  FROM public.workflow_stage_instances current_stage
  JOIN public.workflow_stage_instances next_stage
    ON next_stage.workflow_id = current_stage.workflow_id
   AND next_stage.sort_order = current_stage.sort_order + 1
  WHERE current_stage.workflow_id = v_workflow_id;

  PERFORM public.refresh_workflow_progress(v_workflow_id);
  RETURN v_workflow_id;
END;
$$;

-- =====================================================
-- 6) RLS and grants
-- =====================================================
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_template_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stage_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_handoffs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflow_templates_select ON public.workflow_templates;
CREATE POLICY workflow_templates_select ON public.workflow_templates
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS workflow_templates_manage ON public.workflow_templates;
CREATE POLICY workflow_templates_manage ON public.workflow_templates
FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS workflow_template_stages_select ON public.workflow_template_stages;
CREATE POLICY workflow_template_stages_select ON public.workflow_template_stages
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS workflow_template_stages_manage ON public.workflow_template_stages;
CREATE POLICY workflow_template_stages_manage ON public.workflow_template_stages
FOR ALL TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS workflow_instances_select ON public.workflow_instances;
CREATE POLICY workflow_instances_select ON public.workflow_instances
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS workflow_instances_insert ON public.workflow_instances;
CREATE POLICY workflow_instances_insert ON public.workflow_instances
FOR INSERT TO authenticated
WITH CHECK (public.is_platform_admin() OR created_by = public.current_member_id());

DROP POLICY IF EXISTS workflow_instances_update ON public.workflow_instances;
CREATE POLICY workflow_instances_update ON public.workflow_instances
FOR UPDATE TO authenticated
USING (public.is_platform_admin() OR created_by = public.current_member_id())
WITH CHECK (public.is_platform_admin() OR created_by = public.current_member_id());

DROP POLICY IF EXISTS workflow_instances_delete ON public.workflow_instances;
CREATE POLICY workflow_instances_delete ON public.workflow_instances
FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS workflow_stages_select ON public.workflow_stage_instances;
CREATE POLICY workflow_stages_select ON public.workflow_stage_instances
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS workflow_stages_update ON public.workflow_stage_instances;
CREATE POLICY workflow_stages_update ON public.workflow_stage_instances
FOR UPDATE TO authenticated
USING (public.is_platform_admin() OR owner_id = public.current_member_id())
WITH CHECK (public.is_platform_admin() OR owner_id = public.current_member_id());

DROP POLICY IF EXISTS workflow_handoffs_select ON public.workflow_handoffs;
CREATE POLICY workflow_handoffs_select ON public.workflow_handoffs
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS workflow_handoffs_update ON public.workflow_handoffs;
CREATE POLICY workflow_handoffs_update ON public.workflow_handoffs
FOR UPDATE TO authenticated
USING (
  public.is_platform_admin()
  OR from_member_id = public.current_member_id()
  OR to_member_id = public.current_member_id()
)
WITH CHECK (
  public.is_platform_admin()
  OR from_member_id = public.current_member_id()
  OR to_member_id = public.current_member_id()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_template_stages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_stage_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_handoffs TO authenticated;

REVOKE ALL ON FUNCTION public.create_competition_workflow(text, text, text, timestamptz, timestamptz, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_competition_workflow(text, text, text, timestamptz, timestamptz, uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.refresh_workflow_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_workflow_progress(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.create_competition_workflow IS
  'Creates a complete weighted tender workflow, stage schedule, handoffs and linked tasks from a template.';

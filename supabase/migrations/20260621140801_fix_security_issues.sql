/*
# إصلاح الثغرات الأمنية - منصة أراك

## المشاكل المعالجة:
1. Function Search Path Mutable: إضافة SET search_path = '' للدالتين
2. Public/Authenticated Can Execute SECURITY DEFINER Functions: سحب صلاحية EXECUTE من anon
3. RLS INSERT policies with WITH CHECK (true): تقييد الإدراج بشروط ملكية حقيقية
4. RLS UPDATE policies with WITH CHECK (true): إضافة شروط التحقق الصارمة
*/

-- =====================================================
-- 1) إصلاح الدوال: تثبيت search_path + سحب صلاحية anon
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND tm.role_key IN ('ceo','vp','marketing_lead')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_member_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT id FROM public.team_members
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());
$$;

-- سحب صلاحية التنفيذ العام (anon + authenticated)
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM anon, authenticated;

-- منح فقط لـ postgres (يستخدمها RLS داخلياً عبر SECURITY DEFINER)
-- ملاحظة: postgres دائماً يملك كامل الصلاحيات، لا حاجة لـ GRANT صريح

-- =====================================================
-- 2) إصلاح سياسات INSERT (WITH CHECK صارم بدلاً من true)
-- =====================================================

-- opportunities: المُدرج يجب أن يكون عضواً نشطاً في الفريق
DROP POLICY IF EXISTS "opp_insert_authenticated" ON public.opportunities;
CREATE POLICY "opp_insert_authenticated" ON public.opportunities FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      created_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
    OR (
      suggested_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- tenders: القائد أو المنشئ يجب أن يكون هو العضو الحالي
DROP POLICY IF EXISTS "tender_insert_authenticated" ON public.tenders;
CREATE POLICY "tender_insert_authenticated" ON public.tenders FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      (created_by = public.current_member_id() OR assigned_lead = public.current_member_id())
      AND public.current_member_id() IS NOT NULL
    )
  );

-- tasks: يمكن الإسناد فقط إذا كان assigned_by هو العضو الحالي
DROP POLICY IF EXISTS "task_insert_authenticated" ON public.tasks;
CREATE POLICY "task_insert_authenticated" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      assigned_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
    OR (
      assigned_to = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- documents: يجب أن يكون uploaded_by هو العضو الحالي
DROP POLICY IF EXISTS "doc_insert_authenticated" ON public.documents;
CREATE POLICY "doc_insert_authenticated" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      uploaded_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- document_versions: يجب أن يكون uploaded_by هو العضو الحالي
DROP POLICY IF EXISTS "docver_insert_auth" ON public.document_versions;
CREATE POLICY "docver_insert_auth" ON public.document_versions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      uploaded_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- accountability_alerts: يجب أن يكون created_by هو العضو الحالي
DROP POLICY IF EXISTS "alert_insert_auth" ON public.accountability_alerts;
CREATE POLICY "alert_insert_auth" ON public.accountability_alerts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      created_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- lessons_learned: يجب أن يكون author_id هو العضو الحالي
DROP POLICY IF EXISTS "lesson_insert_auth" ON public.lessons_learned;
CREATE POLICY "lesson_insert_auth" ON public.lessons_learned FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      author_id = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- reports: يجب أن يكون generated_by هو العضو الحالي
DROP POLICY IF EXISTS "report_insert_auth" ON public.reports;
CREATE POLICY "report_insert_auth" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      generated_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- ai_advisor_logs: يجب أن يكون generated_for هو العضو الحالي أو هو قائد المناقصة
DROP POLICY IF EXISTS "ai_log_insert_auth" ON public.ai_advisor_logs;
CREATE POLICY "ai_log_insert_auth" ON public.ai_advisor_logs FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      generated_for = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_id
          AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
      )
    )
  );

-- =====================================================
-- 3) إصلاح سياسات UPDATE (WITH CHECK صارم بدلاً من true)
-- =====================================================

-- opportunities UPDATE
DROP POLICY IF EXISTS "opp_update_admin_or_owner" ON public.opportunities;
CREATE POLICY "opp_update_admin_or_owner" ON public.opportunities FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.opportunity_assignments oa
      WHERE oa.opportunity_id = opportunities.id
        AND oa.team_member_id = public.current_member_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.opportunity_assignments oa
      WHERE oa.opportunity_id = opportunities.id
        AND oa.team_member_id = public.current_member_id()
    )
  );

-- opportunity_assignments UPDATE
DROP POLICY IF EXISTS "opp_assign_update_admin_or_creator" ON public.opportunity_assignments;
CREATE POLICY "opp_assign_update_admin_or_creator" ON public.opportunity_assignments FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id
        AND o.created_by = public.current_member_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR assigned_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = opportunity_id
        AND o.created_by = public.current_member_id()
    )
  );

-- tenders UPDATE
DROP POLICY IF EXISTS "tender_update_admin_or_assigned" ON public.tenders;
CREATE POLICY "tender_update_admin_or_assigned" ON public.tenders FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_lead = public.current_member_id()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.tender_id = tenders.id AND t.assigned_to = public.current_member_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR assigned_lead = public.current_member_id()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.tender_id = tenders.id AND t.assigned_to = public.current_member_id()
    )
  );

-- tender_stages UPDATE
DROP POLICY IF EXISTS "stage_update_admin_or_owner" ON public.tender_stages;
CREATE POLICY "stage_update_admin_or_owner" ON public.tender_stages FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR owner_id = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = tender_stages.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR owner_id = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = tender_stages.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  );

-- tender_checklists UPDATE
DROP POLICY IF EXISTS "checklist_update_admin_or_related" ON public.tender_checklists;
CREATE POLICY "checklist_update_admin_or_related" ON public.tender_checklists FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR checked_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = tender_checklists.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR checked_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM public.tenders t
      WHERE t.id = tender_checklists.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  );

-- tasks UPDATE
DROP POLICY IF EXISTS "task_update_admin_or_assigned" ON public.tasks;
CREATE POLICY "task_update_admin_or_assigned" ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_to = public.current_member_id()
    OR assigned_by = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR assigned_to = public.current_member_id()
    OR assigned_by = public.current_member_id()
  );

-- documents UPDATE
DROP POLICY IF EXISTS "doc_update_admin_or_uploader" ON public.documents;
CREATE POLICY "doc_update_admin_or_uploader" ON public.documents FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR uploaded_by = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR uploaded_by = public.current_member_id()
  );

-- accountability_alerts UPDATE
DROP POLICY IF EXISTS "alert_update_admin_or_target" ON public.accountability_alerts;
CREATE POLICY "alert_update_admin_or_target" ON public.accountability_alerts FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR target_member = public.current_member_id()
    OR created_by = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR target_member = public.current_member_id()
    OR created_by = public.current_member_id()
  );

-- lessons_learned UPDATE
DROP POLICY IF EXISTS "lesson_update_admin_or_author" ON public.lessons_learned;
CREATE POLICY "lesson_update_admin_or_author" ON public.lessons_learned FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR author_id = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR author_id = public.current_member_id()
  );

-- reports UPDATE
DROP POLICY IF EXISTS "report_update_admin_or_creator" ON public.reports;
CREATE POLICY "report_update_admin_or_creator" ON public.reports FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR generated_by = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR generated_by = public.current_member_id()
  );

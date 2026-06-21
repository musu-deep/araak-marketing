/*
# Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ø«ØºØ±Ø§Øª Ø§Ù„Ø£Ù…Ù†ÙŠØ© - Ù…Ù†ØµØ© Ø£Ø±Ø§Ùƒ

## Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø©:
1. Function Search Path Mutable: Ø¥Ø¶Ø§ÙØ© SET search_path = '' Ù„Ù„Ø¯Ø§Ù„ØªÙŠÙ†
2. Public/Authenticated Can Execute SECURITY DEFINER Functions: Ø³Ø­Ø¨ ØµÙ„Ø§Ø­ÙŠØ© EXECUTE Ù…Ù† anon
3. RLS INSERT policies with WITH CHECK (true): ØªÙ‚ÙŠÙŠØ¯ Ø§Ù„Ø¥Ø¯Ø±Ø§Ø¬ Ø¨Ø´Ø±ÙˆØ· Ù…Ù„ÙƒÙŠØ© Ø­Ù‚ÙŠÙ‚ÙŠØ©
4. RLS UPDATE policies with WITH CHECK (true): Ø¥Ø¶Ø§ÙØ© Ø´Ø±ÙˆØ· Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„ØµØ§Ø±Ù…Ø©
*/

-- =====================================================
-- 1) Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ø¯ÙˆØ§Ù„: ØªØ«Ø¨ÙŠØª search_path + Ø³Ø­Ø¨ ØµÙ„Ø§Ø­ÙŠØ© anon
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

-- Ø³Ø­Ø¨ ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„Ø¹Ø§Ù… (anon + authenticated)
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM anon, authenticated;

-- Ù…Ù†Ø­ ÙÙ‚Ø· Ù„Ù€ postgres (ÙŠØ³ØªØ®Ø¯Ù…Ù‡Ø§ RLS Ø¯Ø§Ø®Ù„ÙŠØ§Ù‹ Ø¹Ø¨Ø± SECURITY DEFINER)
-- Ù…Ù„Ø§Ø­Ø¸Ø©: postgres Ø¯Ø§Ø¦Ù…Ø§Ù‹ ÙŠÙ…Ù„Ùƒ ÙƒØ§Ù…Ù„ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§ØªØŒ Ù„Ø§ Ø­Ø§Ø¬Ø© Ù„Ù€ GRANT ØµØ±ÙŠØ­

-- =====================================================
-- 2) Ø¥ØµÙ„Ø§Ø­ Ø³ÙŠØ§Ø³Ø§Øª INSERT (WITH CHECK ØµØ§Ø±Ù… Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† true)
-- =====================================================

-- opportunities: Ø§Ù„Ù…ÙØ¯Ø±Ø¬ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¹Ø¶ÙˆØ§Ù‹ Ù†Ø´Ø·Ø§Ù‹ ÙÙŠ Ø§Ù„ÙØ±ÙŠÙ‚
DROP POLICY IF EXISTS "opp_insert_authenticated" ON marketing.opportunities;
CREATE POLICY "opp_insert_authenticated" ON marketing.opportunities FOR INSERT TO authenticated
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

-- tenders: Ø§Ù„Ù‚Ø§Ø¦Ø¯ Ø£Ùˆ Ø§Ù„Ù…Ù†Ø´Ø¦ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "tender_insert_authenticated" ON marketing.tenders;
CREATE POLICY "tender_insert_authenticated" ON marketing.tenders FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      (created_by = public.current_member_id() OR assigned_lead = public.current_member_id())
      AND public.current_member_id() IS NOT NULL
    )
  );

-- tasks: ÙŠÙ…ÙƒÙ† Ø§Ù„Ø¥Ø³Ù†Ø§Ø¯ ÙÙ‚Ø· Ø¥Ø°Ø§ ÙƒØ§Ù† assigned_by Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "task_insert_authenticated" ON marketing.tasks;
CREATE POLICY "task_insert_authenticated" ON marketing.tasks FOR INSERT TO authenticated
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

-- documents: ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† uploaded_by Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "doc_insert_authenticated" ON marketing.documents;
CREATE POLICY "doc_insert_authenticated" ON marketing.documents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      uploaded_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- document_versions: ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† uploaded_by Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "docver_insert_auth" ON marketing.document_versions;
CREATE POLICY "docver_insert_auth" ON marketing.document_versions FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      uploaded_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- accountability_alerts: ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† created_by Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "alert_insert_auth" ON marketing.accountability_alerts;
CREATE POLICY "alert_insert_auth" ON marketing.accountability_alerts FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      created_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- lessons_learned: ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† author_id Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "lesson_insert_auth" ON marketing.lessons_learned;
CREATE POLICY "lesson_insert_auth" ON marketing.lessons_learned FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      author_id = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- reports: ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† generated_by Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ
DROP POLICY IF EXISTS "report_insert_auth" ON marketing.reports;
CREATE POLICY "report_insert_auth" ON marketing.reports FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      generated_by = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
  );

-- ai_advisor_logs: ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† generated_for Ù‡Ùˆ Ø§Ù„Ø¹Ø¶Ùˆ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø£Ùˆ Ù‡Ùˆ Ù‚Ø§Ø¦Ø¯ Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ©
DROP POLICY IF EXISTS "ai_log_insert_auth" ON marketing.ai_advisor_logs;
CREATE POLICY "ai_log_insert_auth" ON marketing.ai_advisor_logs FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR (
      generated_for = public.current_member_id()
      AND public.current_member_id() IS NOT NULL
    )
    OR (
      EXISTS (
        SELECT 1 FROM marketing.tenders t
        WHERE t.id = tender_id
          AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
      )
    )
  );

-- =====================================================
-- 3) Ø¥ØµÙ„Ø§Ø­ Ø³ÙŠØ§Ø³Ø§Øª UPDATE (WITH CHECK ØµØ§Ø±Ù… Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù† true)
-- =====================================================

-- opportunities UPDATE
DROP POLICY IF EXISTS "opp_update_admin_or_owner" ON marketing.opportunities;
CREATE POLICY "opp_update_admin_or_owner" ON marketing.opportunities FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.opportunity_assignments oa
      WHERE oa.opportunity_id = opportunities.id
        AND oa.team_member_id = public.current_member_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.opportunity_assignments oa
      WHERE oa.opportunity_id = opportunities.id
        AND oa.team_member_id = public.current_member_id()
    )
  );

-- opportunity_assignments UPDATE
DROP POLICY IF EXISTS "opp_assign_update_admin_or_creator" ON marketing.opportunity_assignments;
CREATE POLICY "opp_assign_update_admin_or_creator" ON marketing.opportunity_assignments FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.opportunities o
      WHERE o.id = opportunity_id
        AND o.created_by = public.current_member_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR assigned_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.opportunities o
      WHERE o.id = opportunity_id
        AND o.created_by = public.current_member_id()
    )
  );

-- tenders UPDATE
DROP POLICY IF EXISTS "tender_update_admin_or_assigned" ON marketing.tenders;
CREATE POLICY "tender_update_admin_or_assigned" ON marketing.tenders FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_lead = public.current_member_id()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.tasks t
      WHERE t.tender_id = tenders.id AND t.assigned_to = public.current_member_id()
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR assigned_lead = public.current_member_id()
    OR created_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.tasks t
      WHERE t.tender_id = tenders.id AND t.assigned_to = public.current_member_id()
    )
  );

-- tender_stages UPDATE
DROP POLICY IF EXISTS "stage_update_admin_or_owner" ON marketing.tender_stages;
CREATE POLICY "stage_update_admin_or_owner" ON marketing.tender_stages FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR owner_id = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.tenders t
      WHERE t.id = tender_stages.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR owner_id = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.tenders t
      WHERE t.id = tender_stages.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  );

-- tender_checklists UPDATE
DROP POLICY IF EXISTS "checklist_update_admin_or_related" ON marketing.tender_checklists;
CREATE POLICY "checklist_update_admin_or_related" ON marketing.tender_checklists FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR checked_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.tenders t
      WHERE t.id = tender_checklists.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  )
  WITH CHECK (
    public.is_platform_admin()
    OR checked_by = public.current_member_id()
    OR EXISTS (
      SELECT 1 FROM marketing.tenders t
      WHERE t.id = tender_checklists.tender_id
        AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id())
    )
  );

-- tasks UPDATE
DROP POLICY IF EXISTS "task_update_admin_or_assigned" ON marketing.tasks;
CREATE POLICY "task_update_admin_or_assigned" ON marketing.tasks FOR UPDATE TO authenticated
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
DROP POLICY IF EXISTS "doc_update_admin_or_uploader" ON marketing.documents;
CREATE POLICY "doc_update_admin_or_uploader" ON marketing.documents FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR uploaded_by = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR uploaded_by = public.current_member_id()
  );

-- accountability_alerts UPDATE
DROP POLICY IF EXISTS "alert_update_admin_or_target" ON marketing.accountability_alerts;
CREATE POLICY "alert_update_admin_or_target" ON marketing.accountability_alerts FOR UPDATE TO authenticated
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
DROP POLICY IF EXISTS "lesson_update_admin_or_author" ON marketing.lessons_learned;
CREATE POLICY "lesson_update_admin_or_author" ON marketing.lessons_learned FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR author_id = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR author_id = public.current_member_id()
  );

-- reports UPDATE
DROP POLICY IF EXISTS "report_update_admin_or_creator" ON marketing.reports;
CREATE POLICY "report_update_admin_or_creator" ON marketing.reports FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR generated_by = public.current_member_id()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR generated_by = public.current_member_id()
  );



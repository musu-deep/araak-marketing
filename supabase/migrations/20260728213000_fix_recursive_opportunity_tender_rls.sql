/*
# Fix recursive RLS for opportunities and tenders

The original policies queried related tables whose policies queried the parent
relation again. Postgres therefore raised "infinite recursion detected in
policy" and PostgREST returned HTTP 500 for normal SELECT requests.

Access checks are moved into SECURITY DEFINER helpers owned by the migration
owner. The helpers read the related records without re-entering their RLS
policies, while still resolving the current authenticated platform member.
*/

-- =====================================================
-- 1) Non-recursive access helpers
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_access_opportunity(p_opportunity_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.opportunities AS opportunity
      WHERE opportunity.id = p_opportunity_id
        AND (
          opportunity.created_by = public.current_member_id()
          OR opportunity.suggested_by = public.current_member_id()
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.opportunity_assignments AS assignment
      WHERE assignment.opportunity_id = p_opportunity_id
        AND (
          assignment.team_member_id = public.current_member_id()
          OR assignment.assigned_by = public.current_member_id()
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_opportunity(p_opportunity_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.opportunities AS opportunity
      WHERE opportunity.id = p_opportunity_id
        AND opportunity.created_by = public.current_member_id()
    )
    OR EXISTS (
      SELECT 1
      FROM public.opportunity_assignments AS assignment
      WHERE assignment.opportunity_id = p_opportunity_id
        AND (
          assignment.team_member_id = public.current_member_id()
          OR assignment.assigned_by = public.current_member_id()
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_tender(p_tender_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.tenders AS tender
      WHERE tender.id = p_tender_id
        AND (
          tender.assigned_lead = public.current_member_id()
          OR tender.created_by = public.current_member_id()
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.tasks AS task
      WHERE task.tender_id = p_tender_id
        AND (
          task.assigned_to = public.current_member_id()
          OR task.assigned_by = public.current_member_id()
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.tender_stages AS stage
      WHERE stage.tender_id = p_tender_id
        AND stage.owner_id = public.current_member_id()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_tender(p_tender_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.tenders AS tender
      WHERE tender.id = p_tender_id
        AND (
          tender.assigned_lead = public.current_member_id()
          OR tender.created_by = public.current_member_id()
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.tasks AS task
      WHERE task.tender_id = p_tender_id
        AND (
          task.assigned_to = public.current_member_id()
          OR task.assigned_by = public.current_member_id()
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_opportunity(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_opportunity(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_access_tender(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_tender(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.can_access_opportunity(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_opportunity(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_tender(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_tender(uuid) TO authenticated, service_role;

-- =====================================================
-- 2) Opportunities and assignment policies
-- =====================================================
DROP POLICY IF EXISTS "opp_select_admin_or_assigned" ON public.opportunities;
CREATE POLICY "opp_select_admin_or_assigned"
ON public.opportunities FOR SELECT TO authenticated
USING (public.can_access_opportunity(id));

DROP POLICY IF EXISTS "opp_update_admin_or_owner" ON public.opportunities;
CREATE POLICY "opp_update_admin_or_owner"
ON public.opportunities FOR UPDATE TO authenticated
USING (public.can_manage_opportunity(id))
WITH CHECK (public.can_manage_opportunity(id));

DROP POLICY IF EXISTS "opp_assign_select_admin_or_self" ON public.opportunity_assignments;
CREATE POLICY "opp_assign_select_admin_or_self"
ON public.opportunity_assignments FOR SELECT TO authenticated
USING (
  public.is_platform_admin()
  OR team_member_id = public.current_member_id()
  OR assigned_by = public.current_member_id()
  OR public.can_access_opportunity(opportunity_id)
);

DROP POLICY IF EXISTS "opp_assign_insert_admin_or_creator" ON public.opportunity_assignments;
CREATE POLICY "opp_assign_insert_admin_or_creator"
ON public.opportunity_assignments FOR INSERT TO authenticated
WITH CHECK (
  public.is_platform_admin()
  OR assigned_by = public.current_member_id()
  OR public.can_manage_opportunity(opportunity_id)
);

DROP POLICY IF EXISTS "opp_assign_update_admin_or_creator" ON public.opportunity_assignments;
CREATE POLICY "opp_assign_update_admin_or_creator"
ON public.opportunity_assignments FOR UPDATE TO authenticated
USING (public.can_manage_opportunity(opportunity_id))
WITH CHECK (public.can_manage_opportunity(opportunity_id));

-- =====================================================
-- 3) Tenders, stages and checklist policies
-- =====================================================
DROP POLICY IF EXISTS "tender_select_admin_or_assigned" ON public.tenders;
CREATE POLICY "tender_select_admin_or_assigned"
ON public.tenders FOR SELECT TO authenticated
USING (public.can_access_tender(id));

DROP POLICY IF EXISTS "tender_update_admin_or_assigned" ON public.tenders;
CREATE POLICY "tender_update_admin_or_assigned"
ON public.tenders FOR UPDATE TO authenticated
USING (public.can_manage_tender(id))
WITH CHECK (public.can_manage_tender(id));

DROP POLICY IF EXISTS "stage_select_admin_or_assigned" ON public.tender_stages;
CREATE POLICY "stage_select_admin_or_assigned"
ON public.tender_stages FOR SELECT TO authenticated
USING (
  owner_id = public.current_member_id()
  OR public.can_access_tender(tender_id)
);

DROP POLICY IF EXISTS "stage_insert_admin_or_lead" ON public.tender_stages;
CREATE POLICY "stage_insert_admin_or_lead"
ON public.tender_stages FOR INSERT TO authenticated
WITH CHECK (public.can_manage_tender(tender_id));

DROP POLICY IF EXISTS "stage_update_admin_or_owner" ON public.tender_stages;
CREATE POLICY "stage_update_admin_or_owner"
ON public.tender_stages FOR UPDATE TO authenticated
USING (
  owner_id = public.current_member_id()
  OR public.can_manage_tender(tender_id)
)
WITH CHECK (
  owner_id = public.current_member_id()
  OR public.can_manage_tender(tender_id)
);

DROP POLICY IF EXISTS "checklist_select_admin_or_related" ON public.tender_checklists;
CREATE POLICY "checklist_select_admin_or_related"
ON public.tender_checklists FOR SELECT TO authenticated
USING (
  checked_by = public.current_member_id()
  OR public.can_access_tender(tender_id)
);

DROP POLICY IF EXISTS "checklist_insert_admin_or_lead" ON public.tender_checklists;
CREATE POLICY "checklist_insert_admin_or_lead"
ON public.tender_checklists FOR INSERT TO authenticated
WITH CHECK (public.can_manage_tender(tender_id));

DROP POLICY IF EXISTS "checklist_update_admin_or_related" ON public.tender_checklists;
CREATE POLICY "checklist_update_admin_or_related"
ON public.tender_checklists FOR UPDATE TO authenticated
USING (
  checked_by = public.current_member_id()
  OR public.can_manage_tender(tender_id)
)
WITH CHECK (
  checked_by = public.current_member_id()
  OR public.can_manage_tender(tender_id)
);

-- Keep the PostgREST schema cache current after replacing policy dependencies.
NOTIFY pgrst, 'reload schema';

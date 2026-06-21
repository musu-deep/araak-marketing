/*
# Ù…Ù†ØµØ© Ø£Ø±Ø§Ùƒ - Ù…Ø®Ø·Ø· Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ (Ù†Ø³Ø®Ø© 3 - Ù…ÙØµÙˆÙ„Ø©)

Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„: team_members, roles, departments, permissions, role_permissions,
user_permissions, opportunities, opportunity_assignments, tenders,
tender_stages, tender_checklists, tasks, documents, document_versions,
accountability_alerts, lessons_learned, reports, ai_advisor_logs, external_platforms

Ø§Ù„Ø£Ù…Ø§Ù†:
- RLS Ù…ÙØ¹Ù‘Ù„ Ø¹Ù„Ù‰ ÙƒÙ„ Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„
- is_platform_admin() ÙŠØ­Ø¯Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± (Ø±Ø¦ÙŠØ³ ØªÙ†ÙÙŠØ°ÙŠ/Ù†Ø§Ø¦Ø¨/Ù…Ø³Ø¤ÙˆÙ„ ØªØ³ÙˆÙŠÙ‚)
- Ø§Ù„Ø£Ø¹Ø¶Ø§Ø¡ ÙŠØ±ÙˆÙ† Ù…Ø§ Ø£ÙØ³Ù†ÙØ¯ Ø¥Ù„ÙŠÙ‡Ù… ÙÙ‚Ø·
*/

-- =====================================================
-- 1) Ø§Ù„Ø£Ù‚Ø³Ø§Ù…/Ø§Ù„ØªØ®ØµØµØ§Øª
-- =====================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  icon text,
  color text DEFAULT '#0e8494',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  name_en text,
  level int DEFAULT 3,
  is_admin boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  title text,
  role_key text NOT NULL REFERENCES public.roles(key) ON DELETE RESTRICT,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  phone text,
  avatar_url text,
  bio text,
  specialties text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  hire_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role_key);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  category text NOT NULL,
  description text,
  is_stage_permission boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_key text REFERENCES public.roles(key) ON DELETE CASCADE,
  permission_key text REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  team_member_id uuid REFERENCES public.team_members(id) ON DELETE CASCADE,
  permission_key text REFERENCES public.permissions(key) ON DELETE CASCADE,
  granted boolean DEFAULT true,
  granted_by uuid,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (team_member_id, permission_key)
);

CREATE TABLE IF NOT EXISTS marketing.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  title text NOT NULL,
  client text,
  entity text,
  city text,
  value numeric,
  currency text DEFAULT 'SAR',
  deadline date,
  publication_date date,
  description text,
  requirements text,
  category text,
  is_external boolean DEFAULT false,
  suggested_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  external_platform text,
  external_url text,
  status text DEFAULT 'new',
  status_history jsonb DEFAULT '[]',
  attractiveness_score int,
  win_probability int,
  risk_level text DEFAULT 'medium',
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON marketing.opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON marketing.opportunities(created_by);

CREATE TABLE IF NOT EXISTS marketing.opportunity_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES marketing.opportunities(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  role_in_project text NOT NULL,
  assigned_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (opportunity_id, team_member_id, role_in_project)
);
CREATE INDEX IF NOT EXISTS idx_opp_assignments_member ON marketing.opportunity_assignments(team_member_id);

CREATE TABLE IF NOT EXISTS marketing.tenders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES marketing.opportunities(id) ON DELETE SET NULL,
  reference text UNIQUE,
  title text NOT NULL,
  client text,
  entity text,
  value numeric,
  currency text DEFAULT 'SAR',
  submission_deadline date,
  presentation_date date,
  current_stage text DEFAULT 'intake',
  stage_history jsonb DEFAULT '[]',
  status text DEFAULT 'draft',
  win_probability int,
  risk_level text DEFAULT 'medium',
  ai_analysis jsonb,
  assigned_lead uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON marketing.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_lead ON marketing.tenders(assigned_lead);

CREATE TABLE IF NOT EXISTS marketing.tender_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES marketing.tenders(id) ON DELETE CASCADE,
  stage_key text NOT NULL,
  stage_label text NOT NULL,
  status text DEFAULT 'pending',
  sort_order int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  owner_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  notes text,
  UNIQUE (tender_id, stage_key)
);

CREATE TABLE IF NOT EXISTS marketing.tender_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES marketing.tenders(id) ON DELETE CASCADE,
  type text NOT NULL,
  item text NOT NULL,
  is_checked boolean DEFAULT false,
  checked_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  checked_at timestamptz,
  notes text,
  sort_order int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_checklists_tender ON marketing.tender_checklists(tender_id);

CREATE TABLE IF NOT EXISTS marketing.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  opportunity_id uuid REFERENCES marketing.opportunities(id) ON DELETE CASCADE,
  tender_id uuid REFERENCES marketing.tenders(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  due_date date,
  completed_at timestamptz,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON marketing.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON marketing.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_tender ON marketing.tasks(tender_id);

CREATE TABLE IF NOT EXISTS marketing.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text,
  category text,
  opportunity_id uuid REFERENCES marketing.opportunities(id) ON DELETE SET NULL,
  tender_id uuid REFERENCES marketing.tenders(id) ON DELETE SET NULL,
  file_url text,
  file_size bigint,
  mime_type text,
  current_version int DEFAULT 1,
  uploaded_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  description text,
  is_confidential boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_documents_tender ON marketing.documents(tender_id);

CREATE TABLE IF NOT EXISTS marketing.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES marketing.documents(id) ON DELETE CASCADE,
  version int NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  change_notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (document_id, version)
);

CREATE TABLE IF NOT EXISTS marketing.accountability_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  severity text DEFAULT 'medium',
  title text NOT NULL,
  message text,
  related_type text,
  related_id uuid,
  target_member uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  due_date date,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  escalation_level int DEFAULT 0,
  created_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_target ON marketing.accountability_alerts(target_member);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON marketing.accountability_alerts(is_read);

CREATE TABLE IF NOT EXISTS marketing.lessons_learned (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text DEFAULT 'general',
  outcome text,
  context text,
  recommendation text,
  related_opportunity_id uuid REFERENCES marketing.opportunities(id) ON DELETE SET NULL,
  related_tender_id uuid REFERENCES marketing.tenders(id) ON DELETE SET NULL,
  severity text DEFAULT 'info',
  shared_with_all boolean DEFAULT false,
  author_id uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  period text,
  status text DEFAULT 'draft',
  data jsonb,
  content text,
  generated_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.ai_advisor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid REFERENCES marketing.tenders(id) ON DELETE CASCADE,
  question text,
  analysis jsonb,
  win_probability int,
  risk_assessment jsonb,
  recommendations jsonb,
  generated_for uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing.external_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_url text,
  logo_url text,
  description text,
  is_active boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- Ø¯ÙˆØ§Ù„ Ù…Ø³Ø§Ø¹Ø¯Ø© (Ø¨Ø¹Ø¯ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
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
AS $$
  SELECT id FROM public.team_members
  WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid());
$$;

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.opportunity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.tender_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.tender_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.accountability_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.lessons_learned ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.ai_advisor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.external_platforms ENABLE ROW LEVEL SECURITY;

-- Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¹Ø§Ù…Ø© Ù„Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠØ©
DROP POLICY IF EXISTS "read_departments" ON public.departments;
CREATE POLICY "read_departments" ON public.departments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "read_roles" ON public.roles;
CREATE POLICY "read_roles" ON public.roles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "read_permissions" ON public.permissions;
CREATE POLICY "read_permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "read_role_permissions" ON public.role_permissions;
CREATE POLICY "read_role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "team_select_admin_or_self" ON public.team_members;
CREATE POLICY "team_select_admin_or_self" ON public.team_members FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR id = public.current_member_id());
DROP POLICY IF EXISTS "team_update_admin_or_self" ON public.team_members;
CREATE POLICY "team_update_admin_or_self" ON public.team_members FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR id = public.current_member_id())
  WITH CHECK (public.is_platform_admin() OR id = public.current_member_id());
DROP POLICY IF EXISTS "team_admin_insert" ON public.team_members;
CREATE POLICY "team_admin_insert" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());
DROP POLICY IF EXISTS "team_admin_delete" ON public.team_members;
CREATE POLICY "team_admin_delete" ON public.team_members FOR DELETE TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "user_perms_select_admin" ON public.user_permissions;
CREATE POLICY "user_perms_select_admin" ON public.user_permissions FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR team_member_id = public.current_member_id());
DROP POLICY IF EXISTS "user_perms_manage_admin" ON public.user_permissions;
CREATE POLICY "user_perms_manage_admin" ON public.user_permissions FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "opp_select_admin_or_assigned" ON marketing.opportunities;
CREATE POLICY "opp_select_admin_or_assigned" ON marketing.opportunities FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR created_by = public.current_member_id()
    OR suggested_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.opportunity_assignments oa WHERE oa.opportunity_id = opportunities.id AND oa.team_member_id = public.current_member_id())
  );
DROP POLICY IF EXISTS "opp_insert_authenticated" ON marketing.opportunities;
CREATE POLICY "opp_insert_authenticated" ON marketing.opportunities FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "opp_update_admin_or_owner" ON marketing.opportunities;
CREATE POLICY "opp_update_admin_or_owner" ON marketing.opportunities FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR created_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.opportunity_assignments oa WHERE oa.opportunity_id = opportunities.id AND oa.team_member_id = public.current_member_id())
  )
  WITH CHECK (true);
DROP POLICY IF EXISTS "opp_delete_admin" ON marketing.opportunities;
CREATE POLICY "opp_delete_admin" ON marketing.opportunities FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "opp_assign_select_admin_or_self" ON marketing.opportunity_assignments;
CREATE POLICY "opp_assign_select_admin_or_self" ON marketing.opportunity_assignments FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR team_member_id = public.current_member_id()
    OR assigned_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.opportunities o WHERE o.id = opportunity_assignments.opportunity_id AND (o.created_by = public.current_member_id() OR public.is_platform_admin()))
  );
DROP POLICY IF EXISTS "opp_assign_insert_admin_or_creator" ON marketing.opportunity_assignments;
CREATE POLICY "opp_assign_insert_admin_or_creator" ON marketing.opportunity_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR assigned_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.opportunities o WHERE o.id = opportunity_id AND o.created_by = public.current_member_id())
  );
DROP POLICY IF EXISTS "opp_assign_update_admin_or_creator" ON marketing.opportunity_assignments;
CREATE POLICY "opp_assign_update_admin_or_creator" ON marketing.opportunity_assignments FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.opportunities o WHERE o.id = opportunity_id AND o.created_by = public.current_member_id())
  )
  WITH CHECK (true);
DROP POLICY IF EXISTS "opp_assign_delete_admin" ON marketing.opportunity_assignments;
CREATE POLICY "opp_assign_delete_admin" ON marketing.opportunity_assignments FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "tender_select_admin_or_assigned" ON marketing.tenders;
CREATE POLICY "tender_select_admin_or_assigned" ON marketing.tenders FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_lead = public.current_member_id()
    OR created_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tasks t WHERE t.tender_id = tenders.id AND t.assigned_to = public.current_member_id())
    OR EXISTS (SELECT 1 FROM marketing.tender_stages ts WHERE ts.tender_id = tenders.id AND ts.owner_id = public.current_member_id())
  );
DROP POLICY IF EXISTS "tender_insert_authenticated" ON marketing.tenders;
CREATE POLICY "tender_insert_authenticated" ON marketing.tenders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tender_update_admin_or_assigned" ON marketing.tenders;
CREATE POLICY "tender_update_admin_or_assigned" ON marketing.tenders FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_lead = public.current_member_id()
    OR created_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tasks t WHERE t.tender_id = tenders.id AND t.assigned_to = public.current_member_id())
  )
  WITH CHECK (true);
DROP POLICY IF EXISTS "tender_delete_admin" ON marketing.tenders;
CREATE POLICY "tender_delete_admin" ON marketing.tenders FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "stage_select_admin_or_assigned" ON marketing.tender_stages;
CREATE POLICY "stage_select_admin_or_assigned" ON marketing.tender_stages FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR owner_id = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = tender_stages.tender_id AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "stage_insert_admin_or_lead" ON marketing.tender_stages;
CREATE POLICY "stage_insert_admin_or_lead" ON marketing.tender_stages FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = tender_id AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "stage_update_admin_or_owner" ON marketing.tender_stages;
CREATE POLICY "stage_update_admin_or_owner" ON marketing.tender_stages FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR owner_id = public.current_member_id())
  WITH CHECK (true);
DROP POLICY IF EXISTS "stage_delete_admin" ON marketing.tender_stages;
CREATE POLICY "stage_delete_admin" ON marketing.tender_stages FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "checklist_select_admin_or_related" ON marketing.tender_checklists;
CREATE POLICY "checklist_select_admin_or_related" ON marketing.tender_checklists FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR checked_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = tender_checklists.tender_id AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "checklist_insert_admin_or_lead" ON marketing.tender_checklists;
CREATE POLICY "checklist_insert_admin_or_lead" ON marketing.tender_checklists FOR INSERT TO authenticated
  WITH CHECK (
    public.is_platform_admin()
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = tender_id AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "checklist_update_admin_or_related" ON marketing.tender_checklists;
CREATE POLICY "checklist_update_admin_or_related" ON marketing.tender_checklists FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR checked_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = tender_checklists.tender_id AND t.assigned_lead = public.current_member_id())
  )
  WITH CHECK (true);
DROP POLICY IF EXISTS "checklist_delete_admin" ON marketing.tender_checklists;
CREATE POLICY "checklist_delete_admin" ON marketing.tender_checklists FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "task_select_admin_or_assigned" ON marketing.tasks;
CREATE POLICY "task_select_admin_or_assigned" ON marketing.tasks FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_to = public.current_member_id()
    OR assigned_by = public.current_member_id()
  );
DROP POLICY IF EXISTS "task_insert_authenticated" ON marketing.tasks;
CREATE POLICY "task_insert_authenticated" ON marketing.tasks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "task_update_admin_or_assigned" ON marketing.tasks;
CREATE POLICY "task_update_admin_or_assigned" ON marketing.tasks FOR UPDATE TO authenticated
  USING (
    public.is_platform_admin()
    OR assigned_to = public.current_member_id()
    OR assigned_by = public.current_member_id()
  )
  WITH CHECK (true);
DROP POLICY IF EXISTS "task_delete_admin_or_creator" ON marketing.tasks;
CREATE POLICY "task_delete_admin_or_creator" ON marketing.tasks FOR DELETE TO authenticated
  USING (public.is_platform_admin() OR assigned_by = public.current_member_id());

DROP POLICY IF EXISTS "doc_select_admin_or_related" ON marketing.documents;
CREATE POLICY "doc_select_admin_or_related" ON marketing.documents FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR uploaded_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tasks t WHERE t.tender_id = documents.tender_id AND t.assigned_to = public.current_member_id())
    OR EXISTS (SELECT 1 FROM marketing.tenders td WHERE td.id = documents.tender_id AND (td.assigned_lead = public.current_member_id() OR td.created_by = public.current_member_id()))
    OR EXISTS (SELECT 1 FROM marketing.opportunities o WHERE o.id = documents.opportunity_id AND (o.created_by = public.current_member_id() OR o.suggested_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "doc_insert_authenticated" ON marketing.documents;
CREATE POLICY "doc_insert_authenticated" ON marketing.documents FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "doc_update_admin_or_uploader" ON marketing.documents;
CREATE POLICY "doc_update_admin_or_uploader" ON marketing.documents FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR uploaded_by = public.current_member_id()) WITH CHECK (true);
DROP POLICY IF EXISTS "doc_delete_admin" ON marketing.documents;
CREATE POLICY "doc_delete_admin" ON marketing.documents FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "docver_select_admin_or_related" ON marketing.document_versions;
CREATE POLICY "docver_select_admin_or_related" ON marketing.document_versions FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR uploaded_by = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.documents d WHERE d.id = document_versions.document_id AND (d.uploaded_by = public.current_member_id() OR public.is_platform_admin()))
  );
DROP POLICY IF EXISTS "docver_insert_auth" ON marketing.document_versions;
CREATE POLICY "docver_insert_auth" ON marketing.document_versions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "alert_select_admin_or_target" ON marketing.accountability_alerts;
CREATE POLICY "alert_select_admin_or_target" ON marketing.accountability_alerts FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR target_member = public.current_member_id() OR created_by = public.current_member_id());
DROP POLICY IF EXISTS "alert_insert_auth" ON marketing.accountability_alerts;
CREATE POLICY "alert_insert_auth" ON marketing.accountability_alerts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "alert_update_admin_or_target" ON marketing.accountability_alerts;
CREATE POLICY "alert_update_admin_or_target" ON marketing.accountability_alerts FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR target_member = public.current_member_id()) WITH CHECK (true);
DROP POLICY IF EXISTS "alert_delete_admin" ON marketing.accountability_alerts;
CREATE POLICY "alert_delete_admin" ON marketing.accountability_alerts FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "lesson_select_all_shared_or_own" ON marketing.lessons_learned;
CREATE POLICY "lesson_select_all_shared_or_own" ON marketing.lessons_learned FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR author_id = public.current_member_id()
    OR shared_with_all = true
    OR EXISTS (SELECT 1 FROM marketing.opportunities o WHERE o.id = lessons_learned.related_opportunity_id AND (o.created_by = public.current_member_id() OR o.suggested_by = public.current_member_id()))
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = lessons_learned.related_tender_id AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "lesson_insert_auth" ON marketing.lessons_learned;
CREATE POLICY "lesson_insert_auth" ON marketing.lessons_learned FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "lesson_update_admin_or_author" ON marketing.lessons_learned;
CREATE POLICY "lesson_update_admin_or_author" ON marketing.lessons_learned FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR author_id = public.current_member_id()) WITH CHECK (true);
DROP POLICY IF EXISTS "lesson_delete_admin_or_author" ON marketing.lessons_learned;
CREATE POLICY "lesson_delete_admin_or_author" ON marketing.lessons_learned FOR DELETE TO authenticated
  USING (public.is_platform_admin() OR author_id = public.current_member_id());

DROP POLICY IF EXISTS "report_select_admin_or_related" ON marketing.reports;
CREATE POLICY "report_select_admin_or_related" ON marketing.reports FOR SELECT TO authenticated
  USING (public.is_platform_admin() OR generated_by = public.current_member_id() OR reviewed_by = public.current_member_id() OR status = 'published');
DROP POLICY IF EXISTS "report_insert_auth" ON marketing.reports;
CREATE POLICY "report_insert_auth" ON marketing.reports FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "report_update_admin_or_creator" ON marketing.reports;
CREATE POLICY "report_update_admin_or_creator" ON marketing.reports FOR UPDATE TO authenticated
  USING (public.is_platform_admin() OR generated_by = public.current_member_id()) WITH CHECK (true);
DROP POLICY IF EXISTS "report_delete_admin" ON marketing.reports;
CREATE POLICY "report_delete_admin" ON marketing.reports FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS "ai_log_select_admin_or_target" ON marketing.ai_advisor_logs;
CREATE POLICY "ai_log_select_admin_or_target" ON marketing.ai_advisor_logs FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR generated_for = public.current_member_id()
    OR EXISTS (SELECT 1 FROM marketing.tenders t WHERE t.id = ai_advisor_logs.tender_id AND (t.assigned_lead = public.current_member_id() OR t.created_by = public.current_member_id()))
  );
DROP POLICY IF EXISTS "ai_log_insert_auth" ON marketing.ai_advisor_logs;
CREATE POLICY "ai_log_insert_auth" ON marketing.ai_advisor_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ext_platform_read_all" ON marketing.external_platforms;
CREATE POLICY "ext_platform_read_all" ON marketing.external_platforms FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "ext_platform_admin_manage" ON marketing.external_platforms;
CREATE POLICY "ext_platform_admin_manage" ON marketing.external_platforms FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());


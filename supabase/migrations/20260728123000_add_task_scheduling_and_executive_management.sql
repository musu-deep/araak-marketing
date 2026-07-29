/*
# Task scheduling and executive management

This migration targets the public schema used by the base project.
*/

-- =====================================================
-- 1) Task scheduling
-- =====================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_at timestamptz,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_hours numeric(8,2),
  ADD COLUMN IF NOT EXISTS progress_percent int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expected_output text;

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_progress_percent_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_progress_percent_check
  CHECK (progress_percent BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_tasks_start_at ON public.tasks(start_at);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON public.tasks(due_at);

UPDATE public.tasks
SET due_at = due_date::timestamptz + interval '17 hours'
WHERE due_at IS NULL AND due_date IS NOT NULL;

-- =====================================================
-- 2) Executive permissions
-- =====================================================
INSERT INTO public.permissions (key, label, category, description, is_stage_permission)
VALUES
  ('executive_management', 'المتابعة والرقابة للإدارة العليا', 'executive', 'لوحة رقابة تنفيذية مخصصة للرئيس التنفيذي ونائبه', false),
  ('pricing_matrix', 'مصفوفة التسعير', 'executive', 'إدارة واعتماد التكلفة والهامش وسقف الخصم والأسعار', false)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_key, permission_key)
VALUES
  ('ceo', 'executive_management'),
  ('ceo', 'pricing_matrix'),
  ('vp', 'executive_management'),
  ('vp', 'pricing_matrix')
ON CONFLICT DO NOTHING;

-- At this migration stage auth_user_id does not exist yet, so use the
-- compatible email lookup. The following migration upgrades this function.
CREATE OR REPLACE FUNCTION public.is_executive_management()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.email = COALESCE(auth.jwt() ->> 'email', '')
      AND tm.is_active = true
      AND tm.role_key IN ('ceo', 'vp')
  );
$$;

-- =====================================================
-- 3) Pricing matrix
-- =====================================================
CREATE TABLE IF NOT EXISTS public.pricing_matrix (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  category text,
  base_cost numeric(18,2) NOT NULL CHECK (base_cost >= 0),
  overhead_percent numeric(6,2) NOT NULL DEFAULT 0 CHECK (overhead_percent >= 0 AND overhead_percent < 100),
  risk_percent numeric(6,2) NOT NULL DEFAULT 0 CHECK (risk_percent >= 0 AND risk_percent < 100),
  margin_percent numeric(6,2) NOT NULL DEFAULT 0 CHECK (margin_percent >= 0 AND margin_percent < 100),
  discount_ceiling_percent numeric(6,2) NOT NULL DEFAULT 0 CHECK (discount_ceiling_percent >= 0 AND discount_ceiling_percent < 100),
  currency text NOT NULL DEFAULT 'SAR',
  recommended_price numeric(18,2) NOT NULL CHECK (recommended_price >= 0),
  minimum_price numeric(18,2) NOT NULL CHECK (minimum_price >= 0),
  approval_status text NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'review', 'approved', 'archived')),
  notes text,
  created_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_matrix_status ON public.pricing_matrix(approval_status);
CREATE INDEX IF NOT EXISTS idx_pricing_matrix_category ON public.pricing_matrix(category);

ALTER TABLE public.pricing_matrix ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_matrix_executive_select ON public.pricing_matrix;
DROP POLICY IF EXISTS pricing_matrix_executive_insert ON public.pricing_matrix;
DROP POLICY IF EXISTS pricing_matrix_executive_update ON public.pricing_matrix;
DROP POLICY IF EXISTS pricing_matrix_executive_delete ON public.pricing_matrix;

CREATE POLICY pricing_matrix_executive_select
ON public.pricing_matrix FOR SELECT
TO authenticated
USING (public.is_executive_management());

CREATE POLICY pricing_matrix_executive_insert
ON public.pricing_matrix FOR INSERT
TO authenticated
WITH CHECK (public.is_executive_management());

CREATE POLICY pricing_matrix_executive_update
ON public.pricing_matrix FOR UPDATE
TO authenticated
USING (public.is_executive_management())
WITH CHECK (public.is_executive_management());

CREATE POLICY pricing_matrix_executive_delete
ON public.pricing_matrix FOR DELETE
TO authenticated
USING (public.is_executive_management());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing_matrix TO authenticated;

CREATE OR REPLACE FUNCTION public.set_pricing_matrix_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_matrix_set_updated_at ON public.pricing_matrix;
CREATE TRIGGER pricing_matrix_set_updated_at
BEFORE UPDATE ON public.pricing_matrix
FOR EACH ROW
EXECUTE FUNCTION public.set_pricing_matrix_updated_at();

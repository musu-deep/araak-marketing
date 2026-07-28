/*
# أعضاء منصة التسويق والدخول بالاسم والجوال والرمز الشخصي

- يضيف أعضاء المنصة التسعة بالأدوار والمسميات المعتمدة.
- يضيف ربط عضو الفريق بحساب Supabase Auth.
- يجهز أرقام الجوال للإدخال من صفحة فريق المنصة.
- يحدّث دوال تحديد العضو والإدارة لتعمل عبر auth_user_id مع دعم الحسابات القديمة بالبريد.
*/

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS access_claimed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_auth_user_id
  ON public.team_members(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

INSERT INTO public.roles (key, name, name_en, level, is_admin, description)
VALUES (
  'technical_office',
  'مسؤول المكتب الفني',
  'Technical Office Officer',
  3,
  false,
  'مسؤول الدراسات الفنية والمواصفات والعروض الفنية للمنافسات'
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  level = EXCLUDED.level,
  is_admin = EXCLUDED.is_admin,
  description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'technical_office', permission_key
FROM public.permissions
WHERE permission_key IN (
  'dashboard',
  'tender_management',
  'tasks',
  'team',
  'documents',
  'accountability',
  'stage_technical',
  'stage_submission'
)
ON CONFLICT DO NOTHING;

WITH member_seed(full_name, title, role_key, email) AS (
  VALUES
    ('د. علي العتيبي', 'الرئيس التنفيذي', 'ceo', 'ali.alotaibi@members.araak.local'),
    ('د. لؤي أحمد', 'نائب الرئيس التنفيذي', 'vp', 'loai.ahmed@members.araak.local'),
    ('محمود عوض', 'رئيس فريق منصة التسويق والمناقصات', 'marketing_lead', 'mahmoud.awad@members.araak.local'),
    ('م. عبد الرحمن الحسام', 'مدير تنفيذي اراك الوطنية', 'national_director', 'abdulrahman.alhussam@members.araak.local'),
    ('م. عبد الله العتيبي', 'مسؤول المتابعة التنفيذية', 'executive_followup', 'abdullah.alotaibi@members.araak.local'),
    ('م. محمد شكاك', 'مسؤول المشتريات والمستودعات', 'warehouse_sales', 'mohammed.shakkak@members.araak.local'),
    ('م. إسلام محمد', 'مسؤول المكتب الفني', 'technical_office', 'islam.mohammed@members.araak.local'),
    ('خالد العوبثاني', 'مسؤول المكتب التنفيذي', 'executive_office', 'khaled.alobthani@members.araak.local'),
    ('محمد السيمت', 'المدير المالي', 'cfo', 'mohammed.alsumait@members.araak.local')
)
UPDATE public.team_members AS member
SET
  title = seed.title,
  role_key = seed.role_key,
  is_active = true,
  updated_at = now()
FROM member_seed AS seed
WHERE btrim(member.full_name) = seed.full_name;

WITH member_seed(full_name, title, role_key, email) AS (
  VALUES
    ('د. علي العتيبي', 'الرئيس التنفيذي', 'ceo', 'ali.alotaibi@members.araak.local'),
    ('د. لؤي أحمد', 'نائب الرئيس التنفيذي', 'vp', 'loai.ahmed@members.araak.local'),
    ('محمود عوض', 'رئيس فريق منصة التسويق والمناقصات', 'marketing_lead', 'mahmoud.awad@members.araak.local'),
    ('م. عبد الرحمن الحسام', 'مدير تنفيذي اراك الوطنية', 'national_director', 'abdulrahman.alhussam@members.araak.local'),
    ('م. عبد الله العتيبي', 'مسؤول المتابعة التنفيذية', 'executive_followup', 'abdullah.alotaibi@members.araak.local'),
    ('م. محمد شكاك', 'مسؤول المشتريات والمستودعات', 'warehouse_sales', 'mohammed.shakkak@members.araak.local'),
    ('م. إسلام محمد', 'مسؤول المكتب الفني', 'technical_office', 'islam.mohammed@members.araak.local'),
    ('خالد العوبثاني', 'مسؤول المكتب التنفيذي', 'executive_office', 'khaled.alobthani@members.araak.local'),
    ('محمد السيمت', 'المدير المالي', 'cfo', 'mohammed.alsumait@members.araak.local')
)
INSERT INTO public.team_members (
  full_name,
  email,
  title,
  role_key,
  phone,
  specialties,
  is_active,
  hire_date
)
SELECT
  seed.full_name,
  seed.email,
  seed.title,
  seed.role_key,
  NULL,
  ARRAY[]::text[],
  true,
  CURRENT_DATE
FROM member_seed AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.team_members AS member
  WHERE btrim(member.full_name) = seed.full_name
);

CREATE OR REPLACE FUNCTION public.current_member_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT member.id
  FROM public.team_members AS member
  WHERE member.auth_user_id = auth.uid()
     OR (
       member.auth_user_id IS NULL
       AND member.email = COALESCE(auth.jwt() ->> 'email', '')
     )
  ORDER BY CASE WHEN member.auth_user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members AS member
    WHERE member.id = public.current_member_id()
      AND member.role_key IN ('ceo', 'vp', 'marketing_lead')
      AND member.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_executive_management()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members AS member
    WHERE member.id = public.current_member_id()
      AND member.role_key IN ('ceo', 'vp')
      AND member.is_active = true
  );
$$;

DROP POLICY IF EXISTS "Platform members can read active team" ON public.team_members;
CREATE POLICY "Platform members can read active team"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Platform admins can update member access" ON public.team_members;
CREATE POLICY "Platform admins can update member access"
  ON public.team_members
  FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

COMMENT ON COLUMN public.team_members.auth_user_id IS 'حساب Supabase Auth المرتبط بعضو المنصة بعد أول دخول';
COMMENT ON COLUMN public.team_members.access_claimed_at IS 'تاريخ تفعيل الرمز الشخصي لأول مرة';

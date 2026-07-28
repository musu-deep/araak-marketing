import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_CEO_API_URLS = [
  'https://nexgen-executives.vercel.app',
  'https://musu-deep-nexgen-executives-ar.vercel.app',
  'https://musu-deep-nexgen-executives-ar-4dip.vercel.app',
];

const ADMIN_ROLES = new Set(['ceo', 'vp', 'marketing_lead']);
const PLATFORM_TEAM_ROLES = [
  'marketing_lead',
  'executive_followup',
  'national_director',
  'warehouse_sales',
  'technical_office',
  'executive_office',
  'cfo',
];

interface TeamRequest {
  institutional_token?: string;
}

interface EmployeeRecord {
  id?: string;
  odoo_id?: number;
  name?: string;
  full_name?: string;
  email?: string;
  work_email?: string;
  work_phone?: string;
  mobile_phone?: string;
  phone?: string;
  title?: string;
  job_title?: string;
  department?: string;
  department_id?: number | null;
  manager?: string;
  manager_id?: number | null;
  coach?: string;
  entity?: string;
  location?: string;
  employee_type?: string;
  hire_date?: string | null;
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PlatformMember {
  id: string;
  full_name: string;
  email: string;
  title: string | null;
  role_key: string;
}

interface MatchedEmployee extends EmployeeRecord {
  platform_member_id: string;
  platform_role: string;
  platform_title: string | null;
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normaliseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function ceoApiUrls(): string[] {
  const configured = Deno.env.get('ARAAK_CEO_API_URL') || '';
  return Array.from(new Set(
    [configured, ...DEFAULT_CEO_API_URLS]
      .map(normaliseUrl)
      .filter(Boolean),
  ));
}

function normaliseEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function normaliseName(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/^(د|م|أ)\.?\s+/u, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

async function fetchJson(url: string, init: RequestInit): Promise<{ response: Response; payload: Record<string, unknown> }> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  return { response, payload };
}

async function listEmployees(institutionalToken: string): Promise<{
  employees: EmployeeRecord[];
  source: string;
  warning: string | null;
  baseUrl: string;
}> {
  const errors: string[] = [];

  for (const baseUrl of ceoApiUrls()) {
    try {
      const { response, payload } = await fetchJson(`${baseUrl}/api/employees`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${institutionalToken}`,
          Accept: 'application/json',
          'User-Agent': 'ARAAK-Marketing-Platform-Team/1.1',
        },
      });

      if (!response.ok) {
        errors.push(`${baseUrl}: HTTP ${response.status}`);
        continue;
      }

      const employees = Array.isArray(payload.employees)
        ? payload.employees.filter((item): item is EmployeeRecord => Boolean(item && typeof item === 'object'))
        : [];

      return {
        employees,
        source: String(payload.source || 'odoo'),
        warning: payload.warning ? String(payload.warning) : null,
        baseUrl,
      };
    } catch (error) {
      errors.push(`${baseUrl}: ${error instanceof Error ? error.message : 'network error'}`);
    }
  }

  throw new Error(`تعذر قراءة دليل الموظفين من ARAAK CEO. ${errors.join(' | ')}`);
}

function matchEmployee(member: PlatformMember, employees: EmployeeRecord[]): EmployeeRecord | null {
  const memberEmail = normaliseEmail(member.email);
  const memberName = normaliseName(member.full_name);

  const byEmail = memberEmail
    ? employees.find((employee) => {
      const email = normaliseEmail(employee.work_email || employee.email);
      return email && email === memberEmail;
    })
    : null;

  if (byEmail) return byEmail;

  return employees.find((employee) => {
    const name = normaliseName(employee.name || employee.full_name);
    return name && name === memberName;
  }) || null;
}

async function syncOdooIdentity(
  admin: ReturnType<typeof createClient>,
  employee: MatchedEmployee,
  source: string,
): Promise<{ ok: boolean; memberId: string; error?: string }> {
  const odooEmployeeId = Number(employee.odoo_id);
  if (!Number.isFinite(odooEmployeeId) || odooEmployeeId <= 0) {
    return { ok: false, memberId: employee.platform_member_id, error: 'معرف Odoo غير صالح.' };
  }

  const odooDepartmentId = Number(employee.department_id);
  const odooManagerId = Number(employee.manager_id);
  const phone = String(employee.mobile_phone || employee.work_phone || employee.phone || '').trim();

  const { error } = await admin
    .from('team_members')
    .update({
      odoo_employee_id: odooEmployeeId,
      odoo_work_email: normaliseEmail(employee.work_email || employee.email) || null,
      odoo_department_id: Number.isFinite(odooDepartmentId) && odooDepartmentId > 0 ? odooDepartmentId : null,
      odoo_manager_id: Number.isFinite(odooManagerId) && odooManagerId > 0 ? odooManagerId : null,
      odoo_entity: String(employee.entity || '').trim() || null,
      odoo_location: String(employee.location || '').trim() || null,
      workforce_source: source || 'odoo',
      odoo_synced_at: new Date().toISOString(),
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employee.platform_member_id);

  if (error) return { ok: false, memberId: employee.platform_member_id, error: error.message };
  return { ok: true, memberId: employee.platform_member_id };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'طريقة الطلب غير مدعومة.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ ok: false, message: 'إعدادات Supabase الداخلية غير مكتملة.' }, 500);
    }

    const authorization = request.headers.get('Authorization') || '';
    const platformToken = authorization.replace(/^Bearer\s+/i, '').trim();
    if (!platformToken) return json({ ok: false, message: 'جلسة المنصة غير موجودة.' }, 401);

    const body = await request.json() as TeamRequest;
    const institutionalToken = String(body.institutional_token || '').trim();
    if (!institutionalToken) {
      return json({ ok: false, message: 'انتهت جلسة ARAAK CEO؛ سجّل الدخول من جديد.' }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await admin.auth.getUser(platformToken);
    if (authError || !authData.user) return json({ ok: false, message: 'جلسة المنصة غير صالحة أو منتهية.' }, 401);

    const { data: currentMember, error: currentMemberError } = await admin
      .from('team_members')
      .select('id, full_name, email, role_key, is_active')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle();

    if (currentMemberError) throw currentMemberError;
    if (!currentMember?.is_active) return json({ ok: false, message: 'عضوية المنصة غير مفعلة.' }, 403);

    const { data: platformMembers, error: platformMembersError } = await admin
      .from('team_members')
      .select('id, full_name, email, title, role_key')
      .eq('is_active', true)
      .in('role_key', PLATFORM_TEAM_ROLES)
      .order('full_name', { ascending: true });

    if (platformMembersError) throw platformMembersError;

    const directory = await listEmployees(institutionalToken);
    const matched = (platformMembers as PlatformMember[])
      .map((platformMember): MatchedEmployee | null => {
        const employee = matchEmployee(platformMember, directory.employees);
        if (!employee) return null;
        return {
          ...employee,
          platform_member_id: platformMember.id,
          platform_role: platformMember.role_key,
          platform_title: platformMember.title,
        };
      })
      .filter((employee): employee is MatchedEmployee => employee !== null);

    const syncResults = await Promise.all(
      matched.map((employee) => syncOdooIdentity(admin, employee, directory.source)),
    );
    const linkedTotal = syncResults.filter((result) => result.ok).length;
    const syncErrors = syncResults.filter((result) => !result.ok && result.error);

    const isAdmin = ADMIN_ROLES.has(String(currentMember.role_key || ''));
    const currentEmail = normaliseEmail(currentMember.email);
    const currentName = normaliseName(currentMember.full_name);
    const visible = isAdmin
      ? matched
      : matched.filter((employee) =>
        normaliseEmail(employee.work_email || employee.email) === currentEmail
        || normaliseName(employee.name || employee.full_name) === currentName
      );

    const unmatchedCount = Math.max((platformMembers?.length || 0) - matched.length, 0);
    const warnings = [directory.warning];
    if (unmatchedCount > 0) {
      warnings.push(`${unmatchedCount} من أعضاء الفريق المعتمدين لا يملكون تطابقاً واضحاً في دليل Odoo.`);
    }
    if (syncErrors.length > 0) {
      warnings.push(`تعذر حفظ ربط Odoo لعدد ${syncErrors.length} من الأعضاء.`);
    }

    return json({
      ok: true,
      source: directory.source,
      gateway: directory.baseUrl,
      warning: warnings.filter(Boolean).join(' ') || null,
      employees: visible,
      total: visible.length,
      directory_total: platformMembers?.length || 0,
      matched_total: matched.length,
      odoo_linked_total: linkedTotal,
      odoo_directory_total: directory.employees.length,
      restricted: !isAdmin,
      team_scope: 'marketing-platform-operational-team',
      team_roles: PLATFORM_TEAM_ROLES,
    });
  } catch (error) {
    console.error('platform-team failed', error);
    return json({
      ok: false,
      message: error instanceof Error ? error.message : 'تعذر تحميل فريق المنصة من Odoo.',
    }, 500);
  }
});

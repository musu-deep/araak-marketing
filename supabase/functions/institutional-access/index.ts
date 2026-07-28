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

interface InstitutionalRequest {
  action?: 'login' | 'directory' | 'status';
  email?: string;
  password?: string;
  institutional_token?: string;
}

interface CeoUser {
  id?: string;
  email?: string;
  name?: string;
  title?: string;
  role?: string;
  active?: boolean;
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

function roleFromCeo(role = '', title = ''): string {
  const direct: Record<string, string> = {
    admin: 'marketing_lead',
    ceo: 'ceo',
    vp_development: 'vp',
    vp_investment: 'vp',
    tracker: 'executive_followup',
    dev_manager: 'national_director',
  };
  if (direct[role]) return direct[role];

  const text = title.toLowerCase();
  if (text.includes('الرئيس التنفيذي') && !text.includes('نائب')) return 'ceo';
  if (text.includes('نائب')) return 'vp';
  if (text.includes('مالي')) return 'cfo';
  if (text.includes('مشتريات') || text.includes('مستودع')) return 'warehouse_sales';
  if (text.includes('مكتب تنفيذي')) return 'executive_office';
  if (text.includes('متابعة')) return 'executive_followup';
  return 'national_director';
}

async function fetchJson(url: string, init: RequestInit): Promise<{ response: Response; payload: Record<string, unknown> }> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  return { response, payload };
}

async function loginWithCeo(email: string, password: string): Promise<{
  baseUrl: string;
  response: Response;
  payload: Record<string, unknown>;
}> {
  const errors: string[] = [];

  for (const baseUrl of ceoApiUrls()) {
    try {
      const result = await fetchJson(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'ARAAK-Marketing-Institutional-Access/2.1',
        },
        body: JSON.stringify({ email, password }),
      });

      if (result.response.ok || [400, 401, 403, 422, 429].includes(result.response.status)) {
        return { baseUrl, ...result };
      }

      errors.push(`${baseUrl}: HTTP ${result.response.status}`);
    } catch (error) {
      errors.push(`${baseUrl}: ${error instanceof Error ? error.message : 'network error'}`);
    }
  }

  throw new Error(`تعذر الوصول إلى بوابة ARAAK CEO. ${errors.join(' | ')}`);
}

async function deriveTechnicalPassword(secret: string, email: string, externalId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${email.toLowerCase()}:${externalId}`),
  );
  const digest = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${digest.slice(0, 36)}Aa1!`;
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
          'User-Agent': 'ARAAK-Marketing-Institutional-Access/2.1',
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

async function findAuthUser(admin: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((item) => String(item.email || '').toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 100) return null;
  }
  return null;
}

async function findMember(admin: ReturnType<typeof createClient>, email: string, fullName: string) {
  const byEmail = await admin.from('team_members').select('*').eq('email', email).maybeSingle();
  if (byEmail.error) throw byEmail.error;
  if (byEmail.data) return byEmail.data;

  if (!fullName) return null;
  const byName = await admin.from('team_members').select('*').eq('full_name', fullName).maybeSingle();
  if (byName.error) throw byName.error;
  return byName.data || null;
}

async function requirePlatformMember(
  request: Request,
  admin: ReturnType<typeof createClient>,
): Promise<Record<string, unknown>> {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('جلسة المنصة غير موجودة.');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('جلسة المنصة غير صالحة أو منتهية.');

  const { data: member, error: memberError } = await admin
    .from('team_members')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member || !member.is_active) throw new Error('عضوية المنصة غير مفعلة.');
  return member as Record<string, unknown>;
}

async function handleLogin(body: InstitutionalRequest) {
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) return json({ ok: false, message: 'أدخل البريد المؤسسي وكلمة المرور.' }, 422);

  const loginResult = await loginWithCeo(email, password);
  const { response, payload } = loginResult;

  if (!response.ok || !payload.access_token || !payload.user) {
    const message = String(payload.detail || payload.message || 'بيانات الدخول المؤسسية غير صحيحة.');
    return json({ ok: false, message }, response.status >= 400 && response.status < 500 ? response.status : 502);
  }

  const institutionalToken = String(payload.access_token);
  const ceoUser = payload.user as CeoUser;
  let employee: EmployeeRecord | null = null;
  let workforceSource = 'araak-ceo';
  let warning: string | null = null;
  let workforceGateway: string | null = null;

  try {
    const directory = await listEmployees(institutionalToken);
    workforceSource = directory.source;
    workforceGateway = directory.baseUrl;
    warning = directory.warning;
    employee = directory.employees.find((item) => String(item.work_email || item.email || '').toLowerCase() === email)
      || directory.employees.find((item) => String(item.name || item.full_name || '') === String(ceoUser.name || ''))
      || null;
  } catch (error) {
    warning = error instanceof Error ? error.message : 'تعذر قراءة سجل الموظف من Odoo.';
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ ok: false, message: 'إعدادات Supabase الداخلية غير مكتملة.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fullName = String(employee?.name || employee?.full_name || ceoUser.name || ceoUser.title || email).trim();
  const title = String(employee?.job_title || employee?.title || ceoUser.title || '').trim();
  const externalId = String(employee?.odoo_id || ceoUser.id || email);
  const technicalPassword = await deriveTechnicalPassword(serviceRoleKey, email, externalId);
  const roleKey = roleFromCeo(String(ceoUser.role || ''), title);

  let authUser = await findAuthUser(admin, email);
  const metadata = {
    identity_source: 'araak-ceo',
    identity_gateway: loginResult.baseUrl,
    odoo_employee_id: employee?.odoo_id || null,
    full_name: fullName,
    job_title: title,
  };

  if (authUser) {
    const { data, error } = await admin.auth.admin.updateUserById(authUser.id, {
      password: technicalPassword,
      email_confirm: true,
      user_metadata: { ...(authUser.user_metadata || {}), ...metadata },
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: technicalPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    authUser = data.user;
  }

  const existingMember = await findMember(admin, email, fullName);
  const memberPayload = {
    full_name: fullName,
    email,
    title,
    role_key: roleKey,
    phone: employee?.mobile_phone || employee?.work_phone || employee?.phone || existingMember?.phone || null,
    is_active: employee?.active ?? ceoUser.active ?? true,
    auth_user_id: authUser.id,
    access_claimed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let member;
  if (existingMember) {
    const { data, error } = await admin
      .from('team_members')
      .update(memberPayload)
      .eq('id', existingMember.id)
      .select('*')
      .single();
    if (error) throw error;
    member = data;
  } else {
    const { data, error } = await admin
      .from('team_members')
      .insert({
        ...memberPayload,
        specialties: [],
        hire_date: employee?.hire_date || new Date().toISOString().slice(0, 10),
      })
      .select('*')
      .single();
    if (error) throw error;
    member = data;
  }

  const { data: signedIn, error: signInError } = await publicClient.auth.signInWithPassword({
    email,
    password: technicalPassword,
  });
  if (signInError || !signedIn.session) throw signInError || new Error('تعذر إنشاء جلسة المنصة.');

  return json({
    ok: true,
    identity_source: 'araak-ceo',
    identity_gateway: loginResult.baseUrl,
    workforce_source: workforceSource,
    workforce_gateway: workforceGateway,
    warning,
    institutional_token: institutionalToken,
    session: signedIn.session,
    user: ceoUser,
    employee,
    member,
  });
}

async function handleDirectory(request: Request, body: InstitutionalRequest) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return json({ ok: false, message: 'إعدادات Supabase الداخلية غير مكتملة.' }, 500);

  const institutionalToken = String(body.institutional_token || '').trim();
  if (!institutionalToken) return json({ ok: false, message: 'انتهت جلسة ARAAK CEO؛ سجّل الدخول من جديد.' }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const member = await requirePlatformMember(request, admin);
  const directory = await listEmployees(institutionalToken);
  const isAdmin = ADMIN_ROLES.has(String(member.role_key || ''));
  const memberEmail = String(member.email || '').toLowerCase();
  const memberName = String(member.full_name || '').trim();
  const visible = isAdmin
    ? directory.employees
    : directory.employees.filter((item) =>
      String(item.work_email || item.email || '').toLowerCase() === memberEmail
      || String(item.name || item.full_name || '') === memberName
    );

  return json({
    ok: true,
    source: directory.source,
    gateway: directory.baseUrl,
    warning: directory.warning,
    employees: visible,
    total: visible.length,
    directory_total: directory.employees.length,
    restricted: !isAdmin,
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'طريقة الطلب غير مدعومة.' }, 405);

  try {
    const body = await request.json() as InstitutionalRequest;
    const action = body.action || 'login';
    if (action === 'login') return await handleLogin(body);
    if (action === 'directory' || action === 'status') return await handleDirectory(request, body);
    return json({ ok: false, message: 'العملية المطلوبة غير مدعومة.' }, 400);
  } catch (error) {
    console.error('institutional-access failed', error);
    return json({
      ok: false,
      message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع في بوابة الهوية المؤسسية.',
    }, 500);
  }
});

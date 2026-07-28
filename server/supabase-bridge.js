import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function env(name, aliases = []) {
  for (const key of [name, ...aliases]) {
    const value = String(process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

export function getSupabaseClients() {
  const url = env('SUPABASE_URL', ['VITE_SUPABASE_URL']);
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const publishableKey = env('SUPABASE_PUBLISHABLE_KEY', [
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
  ]);

  if (!url || !serviceRoleKey || !publishableKey) {
    const error = new Error('إعدادات جسر Supabase المؤقت غير مكتملة في Vercel.');
    error.status = 503;
    throw error;
  }

  return {
    admin: createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    publicClient: createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

function bridgeSecret() {
  const value = env('ARAAK_IDENTITY_BRIDGE_SECRET');
  if (!value || value.length < 24) {
    const error = new Error('ARAAK_IDENTITY_BRIDGE_SECRET يجب أن يكون قيمة سرية قوية لا تقل عن 24 حرفاً.');
    error.status = 503;
    throw error;
  }
  return value;
}

function deriveBridgePassword(email, externalId) {
  const digest = crypto
    .createHmac('sha256', bridgeSecret())
    .update(`${String(email).toLowerCase()}:${externalId}`)
    .digest('hex');
  return `${digest.slice(0, 36)}Aa1!`;
}

function roleFromCeo(role, title = '') {
  const direct = {
    admin: 'marketing_lead',
    ceo: 'ceo',
    vp_development: 'vp',
    vp_investment: 'vp',
    tracker: 'executive_followup',
    dev_manager: 'national_director',
  };
  if (direct[role]) return direct[role];

  const text = String(title || '').toLowerCase();
  if (text.includes('الرئيس التنفيذي') && !text.includes('نائب')) return 'ceo';
  if (text.includes('نائب')) return 'vp';
  if (text.includes('مالي')) return 'cfo';
  if (text.includes('مشتريات') || text.includes('مستودع')) return 'warehouse_sales';
  if (text.includes('مكتب تنفيذي')) return 'executive_office';
  if (text.includes('متابعة')) return 'executive_followup';
  return 'national_director';
}

async function findAuthUser(admin, email) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const found = data.users.find((item) => String(item.email || '').toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 100) return null;
    page += 1;
  }
  return null;
}

async function findMember(admin, email, fullName) {
  const byEmail = await admin
    .from('team_members')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (byEmail.error) throw byEmail.error;
  if (byEmail.data) return byEmail.data;

  if (!fullName) return null;
  const byName = await admin
    .from('team_members')
    .select('*')
    .eq('full_name', fullName)
    .maybeSingle();
  if (byName.error) throw byName.error;
  return byName.data || null;
}

export async function ensureInstitutionalSession({ ceoUser, employee }) {
  const { admin, publicClient } = getSupabaseClients();
  const email = String(employee?.work_email || ceoUser?.email || '').trim().toLowerCase();
  if (!email) {
    const error = new Error('الحساب المؤسسي لا يحتوي على بريد عمل معتمد.');
    error.status = 422;
    throw error;
  }

  const fullName = String(employee?.name || ceoUser?.name || ceoUser?.title || email).trim();
  const title = String(employee?.job_title || employee?.title || ceoUser?.title || '').trim();
  const externalId = employee?.odoo_id || ceoUser?.id || email;
  const password = deriveBridgePassword(email, externalId);
  const roleKey = roleFromCeo(ceoUser?.role, title);

  let authUser = await findAuthUser(admin, email);
  const userMetadata = {
    identity_source: 'araak-ceo',
    odoo_employee_id: employee?.odoo_id || null,
    full_name: fullName,
    job_title: title,
  };

  if (authUser) {
    const { data, error } = await admin.auth.admin.updateUserById(authUser.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(authUser.user_metadata || {}), ...userMetadata },
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
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
    phone: employee?.mobile_phone || employee?.work_phone || existingMember?.phone || null,
    is_active: employee?.active ?? ceoUser?.active ?? true,
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

  const { data: signInData, error: signInError } = await publicClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signInData.session) throw signInError || new Error('تعذر إنشاء جلسة المنصة.');

  return {
    session: signInData.session,
    user: ceoUser,
    member,
    employee: employee || null,
  };
}

export async function verifyPlatformToken(token) {
  const { admin, publicClient } = getSupabaseClients();
  const { data, error } = await publicClient.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error('جلسة المنصة غير صالحة أو منتهية.');
    authError.status = 401;
    throw authError;
  }

  const { data: member, error: memberError } = await admin
    .from('team_members')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member || !member.is_active) {
    const authError = new Error('عضوية المنصة غير مفعلة.');
    authError.status = 403;
    throw authError;
  }

  return { user: data.user, member };
}

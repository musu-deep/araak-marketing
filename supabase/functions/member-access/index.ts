import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AccessRequest {
  full_name?: string;
  phone?: string;
  pin?: string;
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalizeDigits(value: string): string {
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return value
    .split('')
    .map((character) => {
      const arabicIndex = arabic.indexOf(character);
      if (arabicIndex >= 0) return String(arabicIndex);
      const persianIndex = persian.indexOf(character);
      return persianIndex >= 0 ? String(persianIndex) : character;
    })
    .join('');
}

function normalizePhone(value: string): string {
  let digits = normalizeDigits(value).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('05') && digits.length === 10) digits = `966${digits.slice(1)}`;
  else if (digits.startsWith('5') && digits.length === 9) digits = `966${digits}`;
  return digits;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'طريقة الطلب غير مدعومة.' }, 405);

  try {
    const body = await request.json() as AccessRequest;
    const fullName = body.full_name?.trim() ?? '';
    const phone = normalizePhone(body.phone ?? '');
    const pin = normalizeDigits(body.pin ?? '').replace(/\D/g, '');

    if (!fullName || !phone) return json({ ok: false, message: 'أدخل الاسم ورقم الجوال.' });
    if (!/^\d{6}$/.test(pin)) return json({ ok: false, message: 'الرمز الشخصي يجب أن يتكون من 6 أرقام.' });
    if (phone.length < 9 || phone.length > 15) return json({ ok: false, message: 'رقم الجوال غير صحيح.' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ ok: false, message: 'إعدادات خدمة الدخول غير مكتملة.' }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: member, error: memberError } = await admin
      .from('team_members')
      .select('id, full_name, phone, auth_user_id, is_active')
      .eq('full_name', fullName)
      .eq('is_active', true)
      .maybeSingle();

    if (memberError) return json({ ok: false, message: 'تعذر التحقق من سجل العضو.' }, 500);
    if (!member) return json({ ok: false, message: 'الاسم غير موجود ضمن أعضاء فريق المنصة.' });
    if (!member.phone) return json({ ok: false, message: 'رقم جوالك لم يُهيأ بعد. تواصل مع مدير المنصة.' });
    if (normalizePhone(member.phone) !== phone) return json({ ok: false, message: 'رقم الجوال لا يطابق الرقم المسجل لهذا العضو.' });

    const email = `${member.id.replaceAll('-', '')}@access.araak.internal`;
    let authUserId = member.auth_user_id as string | null;
    let firstLogin = false;

    if (!authUserId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true,
        user_metadata: {
          team_member_id: member.id,
          full_name: member.full_name,
          phone,
          access_method: 'member_mobile_pin',
        },
      });

      if (createError) {
        const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existing = listed?.users.find((user) => user.email === email);
        if (listError || !existing) {
          return json({ ok: false, message: 'تعذر إنشاء حساب الدخول لأول مرة.' }, 500);
        }
        authUserId = existing.id;
      } else {
        authUserId = created.user.id;
        firstLogin = true;
      }

      const { error: bindError } = await admin
        .from('team_members')
        .update({ auth_user_id: authUserId, access_claimed_at: new Date().toISOString() })
        .eq('id', member.id)
        .is('auth_user_id', null);

      if (bindError) {
        if (firstLogin && authUserId) await admin.auth.admin.deleteUser(authUserId);
        return json({ ok: false, message: 'تعذر ربط حساب الدخول بعضو المنصة.' }, 500);
      }
    }

    return json({ ok: true, email, first_login: firstLogin });
  } catch (error) {
    console.error('member-access failed', error);
    return json({ ok: false, message: 'حدث خطأ غير متوقع في خدمة الدخول.' }, 500);
  }
});

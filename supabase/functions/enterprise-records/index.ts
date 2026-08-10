import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CEO_GATEWAY = (Deno.env.get('ARAAK_CEO_API_URL') || 'https://ceo-office-platform.onrender.com')
  .trim()
  .replace(/\/+$/, '');

interface GatewayRequest {
  institutional_token?: string;
  payload?: Record<string, unknown>;
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function requireActivePlatformMember(request: Request) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('جلسة منصة التسويق غير موجودة.');

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('إعدادات Supabase الداخلية غير مكتملة.');

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('جلسة منصة التسويق غير صالحة أو منتهية.');

  const { data: member, error: memberError } = await admin
    .from('team_members')
    .select('id,email,role_key,is_active')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();
  if (memberError) throw memberError;
  if (!member || !member.is_active) throw new Error('عضوية منصة التسويق غير مفعلة.');
  return member;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ ok: false, message: 'طريقة الطلب غير مدعومة.' }, 405);

  try {
    await requireActivePlatformMember(request);
    const body = await request.json() as GatewayRequest;
    const institutionalToken = String(body.institutional_token || '').trim();
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    if (!institutionalToken) {
      return json({ ok: false, message: 'انتهت جلسة ARAAK CEO؛ سجّل الدخول من جديد.' }, 401);
    }

    const response = await fetch(`${CEO_GATEWAY}/api/marketing`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${institutionalToken}`,
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
        'User-Agent': 'ARAAK-Marketing-Enterprise-Records/1.0',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    return new Response(responseText, {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8' },
    });
  } catch (error) {
    console.error('enterprise-records failed', error);
    return json({
      ok: false,
      message: error instanceof Error ? error.message : 'تعذر الوصول إلى السجل المؤسسي.',
    }, 500);
  }
});

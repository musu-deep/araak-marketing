function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function bodyOf(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function env(name, aliases = []) {
  for (const key of [name, ...aliases]) {
    const value = String(process.env[key] || '').trim();
    if (value) return value;
  }
  return '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const supabaseUrl = env('VITE_SUPABASE_URL', ['SUPABASE_URL']);
    const publishableKey = env('VITE_SUPABASE_PUBLISHABLE_KEY', [
      'SUPABASE_PUBLISHABLE_KEY',
      'VITE_SUPABASE_ANON_KEY',
      'SUPABASE_ANON_KEY',
    ]);

    if (!supabaseUrl || !publishableKey) {
      return send(res, 500, {
        ok: false,
        message: 'متغيرا VITE_SUPABASE_URL وVITE_SUPABASE_PUBLISHABLE_KEY غير مضافين إلى بيئة Vercel الحالية.',
      });
    }

    const body = bodyOf(req);
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/functions/v1/institutional-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
        'User-Agent': 'ARAAK-Marketing-Legacy-Login-Proxy/2.0',
      },
      body: JSON.stringify({
        action: 'login',
        email: String(body.email || '').trim().toLowerCase(),
        password: String(body.password || ''),
      }),
    });

    const payload = await response.json().catch(() => ({
      ok: false,
      message: `بوابة الهوية المؤسسية أعادت HTTP ${response.status}.`,
    }));

    return send(res, response.status, payload);
  } catch (error) {
    return send(res, 502, {
      ok: false,
      message: error instanceof Error
        ? error.message
        : 'تعذر الاتصال بوظيفة الدخول المؤسسي.',
    });
  }
}

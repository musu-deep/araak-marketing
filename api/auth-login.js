import { loginWithCeo } from '../server/ceo.js';
import { getOdooEmployees } from '../server/odoo.js';
import { ensureInstitutionalSession } from '../server/supabase-bridge.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, message: 'Method not allowed' });
  }

  try {
    const body = bodyOf(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || !password) {
      return send(res, 422, { ok: false, message: 'أدخل البريد المؤسسي وكلمة المرور.' });
    }

    const ceoPayload = await loginWithCeo(email, password);
    let employee = null;
    let warning = null;

    try {
      const employees = await getOdooEmployees();
      employee = employees.find((item) => item.work_email === email)
        || employees.find((item) => item.name === ceoPayload.user?.name)
        || null;
    } catch (error) {
      warning = error instanceof Error ? error.message : 'تعذر قراءة بيانات الموظف من Odoo.';
    }

    const bridged = await ensureInstitutionalSession({
      ceoUser: ceoPayload.user,
      employee,
    });

    return send(res, 200, {
      ok: true,
      identity_source: 'araak-ceo',
      workforce_source: employee ? 'odoo' : 'araak-ceo',
      warning,
      ...bridged,
    });
  } catch (error) {
    const status = Number(error?.status || 500);
    const message = error instanceof Error ? error.message : 'تعذر إكمال الدخول المؤسسي.';
    return send(res, status >= 400 && status < 600 ? status : 500, { ok: false, message });
  }
}

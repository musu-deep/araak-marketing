import { getOdooStatus } from '../server/odoo.js';
import { verifyPlatformToken } from '../server/supabase-bridge.js';

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function bearerToken(req) {
  const header = String(req.headers.authorization || '');
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { message: 'Method not allowed' });
  }

  try {
    const token = bearerToken(req);
    if (!token) return send(res, 401, { message: 'يلزم تسجيل الدخول.' });
    await verifyPlatformToken(token);
    return send(res, 200, await getOdooStatus());
  } catch (error) {
    const status = Number(error?.status || 500);
    return send(res, status >= 400 && status < 600 ? status : 500, {
      provider: 'odoo',
      connected: false,
      message: error instanceof Error ? error.message : 'تعذر فحص اتصال Odoo.',
    });
  }
}

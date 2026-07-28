import { getOdooEmployees } from '../server/odoo.js';
import { verifyPlatformToken } from '../server/supabase-bridge.js';

const ADMIN_ROLES = new Set(['ceo', 'vp', 'marketing_lead']);

function send(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, max-age=60');
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

    const { member } = await verifyPlatformToken(token);
    const employees = await getOdooEmployees();
    const isAdmin = ADMIN_ROLES.has(member.role_key);
    const memberEmail = String(member.email || '').toLowerCase();
    const memberName = String(member.full_name || '').trim();

    const visible = isAdmin
      ? employees
      : employees.filter((item) => item.work_email === memberEmail || item.name === memberName);

    return send(res, 200, {
      source: 'odoo',
      employees: visible,
      total: visible.length,
      directory_total: employees.length,
      restricted: !isAdmin,
    });
  } catch (error) {
    const status = Number(error?.status || 500);
    return send(res, status >= 400 && status < 600 ? status : 500, {
      message: error instanceof Error ? error.message : 'تعذر تحميل دليل الموظفين من Odoo.',
    });
  }
}

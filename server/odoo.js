const EMPLOYEE_FIELDS = [
  'id',
  'name',
  'active',
  'work_email',
  'work_phone',
  'mobile_phone',
  'department_id',
  'job_id',
  'parent_id',
  'coach_id',
  'company_id',
  'work_location_id',
  'employee_type',
  'barcode',
  'first_contract_date',
  'create_date',
  'write_date',
];

function normaliseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function many2oneId(value) {
  if (Array.isArray(value) && value.length > 0) return Number(value[0]) || null;
  return Number.isInteger(value) ? value : null;
}

function many2oneName(value) {
  if (Array.isArray(value) && value.length > 1) return String(value[1] || '');
  return typeof value === 'string' ? value : '';
}

export function getOdooConfig() {
  const apiKey = String(process.env.ODOO_API_KEY || '').trim();
  return {
    enabled: String(process.env.ODOO_ENABLED || (apiKey ? 'true' : 'false')).toLowerCase() === 'true',
    url: normaliseUrl(process.env.ODOO_URL || 'https://araakceo.odoo.com'),
    database: String(process.env.ODOO_DATABASE || '').trim(),
    apiKey,
    timeoutMs: Math.max(3000, Number(process.env.ODOO_TIMEOUT_MS || 20000)),
    language: String(process.env.ODOO_LANGUAGE || 'en_US').trim() || 'en_US',
  };
}

function configured(config) {
  return Boolean(config.enabled && config.url && config.apiKey);
}

async function odooJson2(model, method, body) {
  const config = getOdooConfig();
  if (!configured(config)) {
    const error = new Error('إعدادات Odoo غير مكتملة في بيئة الخادم.');
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers = {
    Authorization: `bearer ${config.apiKey}`,
    'Content-Type': 'application/json; charset=utf-8',
    'User-Agent': 'ARAAK-Marketing-Odoo-Bridge/1.0',
  };
  if (config.database) headers['X-Odoo-Database'] = config.database;

  try {
    const response = await fetch(`${config.url}/json/2/${model}/${method}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...body,
        context: { lang: config.language, ...(body.context || {}) },
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.error) {
      const detail = payload?.error?.message || payload?.error || payload?.message || `Odoo HTTP ${response.status}`;
      const error = new Error(String(detail));
      error.status = response.status || 502;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

export async function getOdooEmployees() {
  const records = await odooJson2('hr.employee', 'search_read', {
    domain: [['active', '=', true]],
    fields: EMPLOYEE_FIELDS,
    limit: 1000,
    order: 'name asc, id asc',
  });

  if (!Array.isArray(records)) throw new Error('استجابة دليل الموظفين من Odoo غير صالحة.');

  return records.map((record) => {
    const id = Number(record.id || 0);
    const title = many2oneName(record.job_id);
    const email = String(record.work_email || '').trim().toLowerCase();
    return {
      id: `odoo-employee-${id}`,
      odoo_id: id,
      source: 'odoo',
      employee_number: record.barcode || `ODOO-${id}`,
      name: record.name || `Employee ${id}`,
      full_name: record.name || `Employee ${id}`,
      email,
      work_email: email,
      work_phone: record.work_phone || '',
      mobile_phone: record.mobile_phone || '',
      phone: record.mobile_phone || record.work_phone || '',
      title,
      job_title: title,
      department: many2oneName(record.department_id),
      department_id: many2oneId(record.department_id),
      manager: many2oneName(record.parent_id),
      manager_id: many2oneId(record.parent_id),
      coach: many2oneName(record.coach_id),
      entity: many2oneName(record.company_id),
      location: many2oneName(record.work_location_id),
      employee_type: record.employee_type || 'employee',
      hire_date: record.first_contract_date || record.create_date || null,
      active: Boolean(record.active ?? true),
      created_at: record.create_date || null,
      updated_at: record.write_date || null,
    };
  });
}

export async function getOdooStatus() {
  const config = getOdooConfig();
  if (!configured(config)) {
    return {
      provider: 'odoo',
      configured: false,
      connected: false,
      url: config.url,
      message: 'إعدادات Odoo غير مكتملة.',
    };
  }

  try {
    const employees = await odooJson2('hr.employee', 'search_read', {
      domain: [['active', '=', true]],
      fields: ['id'],
      limit: 1,
      order: 'id asc',
    });
    return {
      provider: 'odoo',
      configured: true,
      connected: Array.isArray(employees),
      url: config.url,
      language: config.language,
      message: 'تم الاتصال ببيئة Odoo بنجاح.',
    };
  } catch (error) {
    return {
      provider: 'odoo',
      configured: true,
      connected: false,
      url: config.url,
      language: config.language,
      message: error instanceof Error ? error.message : 'تعذر الاتصال بـ Odoo.',
    };
  }
}

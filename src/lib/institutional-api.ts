import type { Session } from '@supabase/supabase-js';

export interface InstitutionalUser {
  id: string;
  email: string;
  name?: string;
  title?: string;
  role?: string;
  active?: boolean;
}

export interface OdooEmployee {
  id: string;
  odoo_id: number;
  source: 'odoo';
  employee_number: string;
  name: string;
  full_name: string;
  email: string;
  work_email: string;
  work_phone: string;
  mobile_phone: string;
  phone: string;
  title: string;
  job_title: string;
  department: string;
  department_id: number | null;
  manager: string;
  manager_id: number | null;
  coach: string;
  entity: string;
  location: string;
  employee_type: string;
  hire_date: string | null;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface ErrorPayload {
  message?: string;
  detail?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as T & ErrorPayload;
  if (!response.ok) {
    throw new Error(payload.message || payload.detail || `HTTP ${response.status}`);
  }
  return payload;
}

export async function institutionalSignIn(email: string, password: string): Promise<{
  session: Session;
  user: InstitutionalUser;
  identitySource: string;
  workforceSource: string;
  warning?: string | null;
}> {
  const response = await fetch('/api/auth-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const payload = await readJson<{
    ok: boolean;
    session: Session;
    user: InstitutionalUser;
    identity_source: string;
    workforce_source: string;
    warning?: string | null;
  }>(response);

  if (!payload.ok || !payload.session?.access_token || !payload.session?.refresh_token) {
    throw new Error('تعذر إنشاء جلسة المنصة المؤسسية.');
  }

  return {
    session: payload.session,
    user: payload.user,
    identitySource: payload.identity_source,
    workforceSource: payload.workforce_source,
    warning: payload.warning,
  };
}

export async function fetchOdooEmployees(accessToken: string): Promise<{
  employees: OdooEmployee[];
  total: number;
  directoryTotal: number;
  restricted: boolean;
}> {
  const response = await fetch('/api/odoo-employees', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const payload = await readJson<{
    employees: OdooEmployee[];
    total: number;
    directory_total: number;
    restricted: boolean;
  }>(response);

  return {
    employees: payload.employees ?? [],
    total: payload.total ?? 0,
    directoryTotal: payload.directory_total ?? payload.total ?? 0,
    restricted: Boolean(payload.restricted),
  };
}

export async function fetchOdooStatus(accessToken: string): Promise<{
  configured: boolean;
  connected: boolean;
  url?: string;
  message: string;
}> {
  const response = await fetch('/api/odoo-status', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return readJson(response);
}

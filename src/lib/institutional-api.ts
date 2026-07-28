import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

const INSTITUTIONAL_TOKEN_KEY = 'araak_ceo_access_token';

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
  platform_member_id?: string;
  platform_role?: string;
  platform_title?: string;
}

interface InstitutionalErrorPayload {
  ok?: boolean;
  message?: string;
  detail?: string;
}

async function edgeErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const payload = await context.clone().json() as InstitutionalErrorPayload;
        if (payload.message || payload.detail) return payload.message || payload.detail || '';
      } catch {
        // Fall through to the generic message below.
      }
    }
  }
  return error instanceof Error ? error.message : 'تعذر الاتصال ببوابة الهوية المؤسسية.';
}

async function invokeEdge<T extends InstitutionalErrorPayload>(
  functionName: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(functionName, { body });
  if (error) throw new Error(await edgeErrorMessage(error));
  if (!data) throw new Error('لم تُرجع الخدمة المؤسسية استجابة صالحة.');
  if (data.ok === false) throw new Error(data.message || data.detail || 'تعذر تنفيذ العملية المؤسسية.');
  return data;
}

export async function institutionalSignIn(email: string, password: string): Promise<{
  session: Session;
  user: InstitutionalUser;
  identitySource: string;
  workforceSource: string;
  warning?: string | null;
}> {
  const payload = await invokeEdge<{
    ok: boolean;
    session: Session;
    user: InstitutionalUser;
    identity_source: string;
    workforce_source: string;
    institutional_token: string;
    warning?: string | null;
  }>('institutional-access', {
    action: 'login',
    email,
    password,
  });

  if (!payload.session?.access_token || !payload.session?.refresh_token) {
    throw new Error('تعذر إنشاء جلسة المنصة المؤسسية.');
  }

  if (payload.institutional_token) {
    sessionStorage.setItem(INSTITUTIONAL_TOKEN_KEY, payload.institutional_token);
  }

  return {
    session: payload.session,
    user: payload.user,
    identitySource: payload.identity_source,
    workforceSource: payload.workforce_source,
    warning: payload.warning,
  };
}

export function clearInstitutionalSession(): void {
  sessionStorage.removeItem(INSTITUTIONAL_TOKEN_KEY);
}

export async function fetchOdooEmployees(accessToken: string): Promise<{
  employees: OdooEmployee[];
  total: number;
  directoryTotal: number;
  restricted: boolean;
}> {
  if (!accessToken) throw new Error('جلسة المنصة غير موجودة.');
  const institutionalToken = sessionStorage.getItem(INSTITUTIONAL_TOKEN_KEY);
  if (!institutionalToken) throw new Error('انتهت جلسة ARAAK CEO؛ سجّل الخروج ثم ادخل من جديد.');

  const payload = await invokeEdge<{
    ok: boolean;
    employees: OdooEmployee[];
    total: number;
    directory_total: number;
    matched_total?: number;
    odoo_directory_total?: number;
    restricted: boolean;
  }>('platform-team', {
    institutional_token: institutionalToken,
  });

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
  if (!accessToken) throw new Error('جلسة المنصة غير موجودة.');
  const institutionalToken = sessionStorage.getItem(INSTITUTIONAL_TOKEN_KEY);
  if (!institutionalToken) throw new Error('انتهت جلسة ARAAK CEO؛ سجّل الدخول من جديد.');

  const result = await invokeEdge<{
    ok: boolean;
    source?: string;
    directory_total?: number;
    warning?: string | null;
  }>('institutional-access', {
    action: 'status',
    institutional_token: institutionalToken,
  });

  return {
    configured: true,
    connected: true,
    message: result.warning || `تم الاتصال بالدليل المؤسسي (${result.directory_total ?? 0} موظف).`,
  };
}

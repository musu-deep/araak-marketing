import { supabase } from './supabase';

const INSTITUTIONAL_TOKEN_KEY = 'araak_ceo_access_token';

export type EnterpriseRecordKind = 'opportunity' | 'tender';

export interface EnterpriseAttachment {
  id: number;
  name: string;
  mime_type: string;
  file_size: number;
  created_at: string | null;
}

export interface EnterpriseRecord {
  id: number;
  kind: EnterpriseRecordKind;
  title: string;
  reference: string | null;
  client: string | null;
  entity: string | null;
  city: string | null;
  value: number | null;
  deadline: string | null;
  publication_date: string | null;
  description: string | null;
  requirements: string | null;
  source: string;
  source_url: string | null;
  status: string;
  current_stage: string;
  stage_label: string;
  probability: number;
  owner: string | null;
  team: string | null;
  created_at: string | null;
  updated_at: string | null;
  attachments: EnterpriseAttachment[];
}

export interface EnterpriseRecordInput {
  title: string;
  reference?: string;
  client?: string;
  entity?: string;
  city?: string;
  value?: string | number;
  deadline?: string;
  publication_date?: string;
  description?: string;
  requirements?: string;
  source: string;
  source_url?: string;
}

interface GatewayPayload {
  ok?: boolean;
  message?: string;
  detail?: string;
  records?: EnterpriseRecord[];
  total?: number;
  sources?: string[];
  file?: {
    id: number;
    name: string;
    mime_type: string;
    file_size: number;
    data_base64: string;
  };
  record?: EnterpriseRecord;
}

function publicMessage(message: string): string {
  return message
    .replace(/Odoo/gi, 'السجل المركزي')
    .replace(/ARAAK CEO/gi, 'البوابة المؤسسية');
}

function institutionalToken(): string {
  const token = sessionStorage.getItem(INSTITUTIONAL_TOKEN_KEY);
  if (!token) throw new Error('انتهت الجلسة المؤسسية؛ سجّل الخروج ثم ادخل من جديد.');
  return token;
}

async function functionErrorMessage(error: unknown): Promise<string> {
  const fallback = error instanceof Error ? error.message : 'تعذر الوصول إلى السجل المركزي.';
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json() as { message?: string; detail?: string };
      return publicMessage(payload.message || payload.detail || fallback);
    } catch {
      try {
        const text = await context.clone().text();
        return publicMessage(text || fallback);
      } catch {
        return publicMessage(fallback);
      }
    }
  }
  return publicMessage(fallback);
}

async function gatewayRequest<T extends GatewayPayload>(body: Record<string, unknown>): Promise<T> {
  const token = institutionalToken();
  const { data, error } = await supabase.functions.invoke('enterprise-records', {
    body: {
      institutional_token: token,
      payload: body,
    },
  });

  if (error) throw new Error(await functionErrorMessage(error));
  const payload = (data || {}) as T;
  if (payload.ok === false) {
    throw new Error(publicMessage(payload.message || payload.detail || 'تعذر تنفيذ العملية في السجل المركزي.'));
  }
  return payload;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',')[1] : value);
    };
    reader.onerror = () => reject(new Error(`تعذر قراءة الملف ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export async function listEnterpriseRecords(kind: EnterpriseRecordKind): Promise<EnterpriseRecord[]> {
  const payload = await gatewayRequest<GatewayPayload>({ action: 'list', kind });
  return payload.records ?? [];
}

export async function listEnterpriseSources(): Promise<string[]> {
  const payload = await gatewayRequest<GatewayPayload>({ action: 'sources' });
  return payload.sources ?? ['اعتماد', 'فرصة', 'منافس', 'مناقصات', 'إحالة مباشرة', 'مصدر داخلي'];
}

export async function createEnterpriseRecord(
  kind: EnterpriseRecordKind,
  record: EnterpriseRecordInput,
  files: File[],
): Promise<EnterpriseRecord | null> {
  const encodedFiles = await Promise.all(files.map(async (file) => ({
    name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size: file.size,
    data_base64: await fileToBase64(file),
  })));

  const payload = await gatewayRequest<GatewayPayload>({
    action: 'create',
    kind,
    record,
    files: encodedFiles,
  });
  return payload.record ?? null;
}

export async function downloadEnterpriseAttachment(attachment: EnterpriseAttachment): Promise<void> {
  const payload = await gatewayRequest<GatewayPayload>({
    action: 'download',
    attachment_id: attachment.id,
  });
  if (!payload.file?.data_base64) throw new Error('تعذر استرجاع الملف من السجل المركزي.');

  const binary = atob(payload.file.data_base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const blob = new Blob([bytes], { type: payload.file.mime_type || attachment.mime_type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = payload.file.name || attachment.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

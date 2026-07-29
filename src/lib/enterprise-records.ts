const INSTITUTIONAL_TOKEN_KEY = 'araak_ceo_access_token';

const DEFAULT_GATEWAYS = [
  'https://musu-deep-nexgen-executives-ar.vercel.app',
  'https://nexgen-executives.vercel.app',
  'https://musu-deep-nexgen-executives-ar-4dip.vercel.app',
];

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

function gatewayUrls(): string[] {
  const configured = String(import.meta.env.VITE_ARAAK_CEO_API_URL || '').trim().replace(/\/+$/, '');
  return Array.from(new Set([configured, ...DEFAULT_GATEWAYS].filter(Boolean)));
}

function institutionalToken(): string {
  const token = sessionStorage.getItem(INSTITUTIONAL_TOKEN_KEY);
  if (!token) throw new Error('انتهت الجلسة المؤسسية؛ سجّل الخروج ثم ادخل من جديد.');
  return token;
}

async function gatewayRequest<T extends GatewayPayload>(body: Record<string, unknown>): Promise<T> {
  const token = institutionalToken();
  const errors: string[] = [];

  for (const baseUrl of gatewayUrls()) {
    try {
      const response = await fetch(`${baseUrl}/api/marketing`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({})) as T;

      if (response.ok && payload.ok !== false) return payload;
      const message = publicMessage(payload.message || payload.detail || `HTTP ${response.status}`);
      if ([400, 401, 403, 413, 422].includes(response.status)) throw new Error(message);
      errors.push(`${baseUrl}: ${message}`);
    } catch (error) {
      if (error instanceof Error && /الجلسة|مطلوب|يتجاوز|القراءة فقط/.test(error.message)) throw error;
      errors.push(`${baseUrl}: ${error instanceof Error ? error.message : 'تعذر الاتصال'}`);
    }
  }

  throw new Error(publicMessage(`تعذر الوصول إلى السجل المركزي. ${errors.join(' | ')}`));
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

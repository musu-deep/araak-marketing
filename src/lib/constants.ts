import type {
  OpportunityStatus,
  TenderStatus,
  TenderStageKey,
  TaskStatus,
  TaskPriority,
  RiskLevel,
  AlertSeverity,
  RoleKey,
} from './types';

// حالة الفرصة
export const OPPORTUNITY_STATUS_CONFIG: Record<
  OpportunityStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  new: { label: 'جديدة', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  under_review: { label: 'قيد الدراسة', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  qualified: { label: 'مؤهّلة', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  won: { label: 'مكتسبة', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  lost: { label: 'مفقودة', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  withdrawn: { label: 'مسحوبة', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
};

// حالة المناقصة
export const TENDER_STATUS_CONFIG: Record<
  TenderStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  draft: { label: 'مسودة', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
  in_progress: { label: 'قيد العمل', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  submitted: { label: 'تم التقديم', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  won: { label: 'فائزة', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  lost: { label: 'خاسرة', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  cancelled: { label: 'ملغاة', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
};

// مراحل المناقصة
export const TENDER_STAGE_CONFIG: Record<
  TenderStageKey,
  { label: string; icon: string }
> = {
  intake: { label: 'الاستقبال والتسجيل', icon: 'inbox' },
  qualification: { label: 'التأهيل المبدئي', icon: 'filter' },
  technical: { label: 'الدراسة الفنية', icon: 'file-cog' },
  financial: { label: 'الدراسة المالية', icon: 'calculator' },
  submission: { label: 'إعداد التقديم', icon: 'send' },
  presentation: { label: 'العرض والدفاع', icon: 'presentation' },
  result: { label: 'النتيجة والإعلان', icon: 'trophy' },
};

export const TENDER_STAGE_ORDER: TenderStageKey[] = [
  'intake', 'qualification', 'technical', 'financial', 'submission', 'presentation', 'result',
];

// حالة المهمة
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  todo: { label: 'للبدء', color: 'text-navy-700', bg: 'bg-navy-50', border: 'border-navy-200', dot: 'bg-navy-400' },
  in_progress: { label: 'قيد التنفيذ', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
  review: { label: 'للمراجعة', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  done: { label: 'مكتملة', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  blocked: { label: 'محظورة', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-400' },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string }
> = {
  low: { label: 'منخفضة', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'متوسطة', color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { label: 'عالية', color: 'text-orange-700', bg: 'bg-orange-100' },
  critical: { label: 'حرجة', color: 'text-red-700', bg: 'bg-red-100' },
};

export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; color: string }
> = {
  low: { label: 'منخفض', color: 'text-emerald-600' },
  medium: { label: 'متوسط', color: 'text-amber-600' },
  high: { label: 'عالٍ', color: 'text-orange-600' },
  critical: { label: 'حرج', color: 'text-red-600' },
};

export const ALERT_SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; color: string; bg: string; border: string }
> = {
  info: { label: 'معلومة', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  warning: { label: 'تحذير', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  high: { label: 'عالٍ', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  critical: { label: 'حرجة', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
};

// أسماء الأدوار بالعربية
export const ROLE_LABELS: Record<RoleKey, string> = {
  ceo: 'الرئيس التنفيذي',
  vp: 'نائب الرئيس التنفيذي',
  marketing_lead: 'مسؤول فريق تسويق المشاريع',
  executive_followup: 'مسؤول المتابعة التنفيذية',
  national_director: 'مدير المشاريع الوطنية',
  warehouse_sales: 'مسؤول المستودعات والمبيعات',
  cfo: 'المدير المالي',
  executive_office: 'مسؤول المكتب التنفيذي',
  logistics: 'مسؤول اللوجستية',
};

export const ADMIN_ROLES: RoleKey[] = ['ceo', 'vp', 'marketing_lead'];

export function isAdminRole(role: RoleKey): boolean {
  return ADMIN_ROLES.includes(role);
}

// اختصار الأرقام بالعربية
export function formatCurrency(value: number | null, currency = 'SAR'): string {
  if (value === null || value === undefined) return '—';
  const symbols: Record<string, string> = { SAR: 'ر.س', USD: '$', EUR: '€' };
  const symbol = symbols[currency] ?? currency;
  return `${new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(value)} ${symbol}`;
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('ar-SA').format(value);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function formatShortDate(date: string | null): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  const parts = name.replace(/^(د\.|أ\.|م\.|د |أ |م )/, '').trim().split(' ');
  return parts.slice(0, 2).map(p => p[0]).join('');
}

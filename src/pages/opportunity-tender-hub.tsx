import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  Download,
  ExternalLink,
  FileCog,
  FileText,
  Link2,
  Loader2,
  MapPin,
  Paperclip,
  Plus,
  Radar,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader } from '@/components/ui/primitives';
import { formatCurrency, formatDate } from '@/lib/constants';
import {
  createEnterpriseRecord,
  downloadEnterpriseAttachment,
  listEnterpriseRecords,
  listEnterpriseSources,
  type EnterpriseAttachment,
  type EnterpriseRecord,
  type EnterpriseRecordKind,
} from '@/lib/enterprise-records';

type HubTab = 'opportunities' | 'tenders';
type PageKey = 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team' | 'documents' | 'accountability' | 'lessons' | 'reports' | 'ai-advisor' | 'settings';

interface Props {
  onNavigate: (page: PageKey) => void;
  initialTab?: HubTab;
}

const FALLBACK_SOURCES = ['اعتماد', 'فرصة', 'منافس', 'مناقصات', 'إحالة مباشرة', 'مصدر داخلي'];
const OTHER_SOURCE = '__other__';
const MAX_FILES = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_TOTAL_SIZE = 3 * 1024 * 1024;

function statusLabel(record: EnterpriseRecord): string {
  if (record.kind === 'opportunity') {
    if (record.status === 'new') return 'فرصة جديدة';
    if (record.status === 'qualified') return 'مؤهلة';
    if (record.status === 'lost') return 'غير مناسبة';
    return 'قيد الدراسة';
  }
  if (record.status === 'submitted') return 'تم التقديم';
  if (record.status === 'won') return 'فائزة';
  if (record.status === 'lost') return 'لم تُرسَ';
  return 'قيد العمل';
}

function statusClasses(record: EnterpriseRecord): string {
  if (record.status === 'won') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (record.status === 'lost' || record.status === 'cancelled') return 'bg-red-50 text-red-700 border-red-200';
  if (record.status === 'submitted') return 'bg-sky-50 text-sky-700 border-sky-200';
  return record.kind === 'tender'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-araak-50 text-araak-700 border-araak-200';
}

export function OpportunityTenderHubPage({ onNavigate: _onNavigate, initialTab = 'opportunities' }: Props) {
  const { member, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [showForm, setShowForm] = useState(false);
  const [opportunities, setOpportunities] = useState<EnterpriseRecord[]>([]);
  const [tenders, setTenders] = useState<EnterpriseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const canCreate = hasPermission('manage_opportunities') || hasPermission('tender_management');

  const loadRecords = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [opportunityRows, tenderRows] = await Promise.all([
        listEnterpriseRecords('opportunity'),
        listEnterpriseRecords('tender'),
      ]);
      setOpportunities(opportunityRows);
      setTenders(tenderRows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الفرص والمنافسات.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const visibleRecords = activeTab === 'opportunities' ? opportunities : tenders;

  const handleDownload = async (attachment: EnterpriseAttachment) => {
    setDownloadingId(attachment.id);
    setError('');
    try {
      await downloadEnterpriseAttachment(attachment);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'تعذر تنزيل الملف.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="الفرص والمنافسات"
        subtitle="مسار موحد للرصد والدراسة والتقديم وحفظ المستندات في السجل المركزي"
        icon={Briefcase}
        action={member ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadRecords(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-600 font-semibold hover:bg-navy-50 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"
              >
                <Plus className="w-4 h-4" />
                فرصة أو منافسة جديدة
              </button>
            )}
          </div>
        ) : null}
      />

      <GlassCard className="p-2">
        <div className="grid sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('opportunities')}
            className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-right transition-all ${
              activeTab === 'opportunities'
                ? 'bg-gradient-to-l from-araak-500 to-araak-700 text-white shadow-lg'
                : 'bg-navy-50/70 text-navy-700 hover:bg-navy-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'opportunities' ? 'bg-white/15' : 'bg-white'}`}>
                <Radar className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-bold">الفرص الواردة</span>
                <span className={`block text-xs mt-0.5 ${activeTab === 'opportunities' ? 'text-white/75' : 'text-navy-500'}`}>
                  الرصد والدراسة الأولية وقرار المشاركة
                </span>
              </span>
            </span>
            <span className={`text-xl font-bold ${activeTab === 'opportunities' ? 'text-white' : 'text-araak-700'}`}>{opportunities.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tenders')}
            className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 text-right transition-all ${
              activeTab === 'tenders'
                ? 'bg-gradient-to-l from-navy-600 to-navy-800 text-white shadow-lg'
                : 'bg-navy-50/70 text-navy-700 hover:bg-navy-100'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'tenders' ? 'bg-white/15' : 'bg-white'}`}>
                <FileCog className="w-5 h-5" />
              </span>
              <span>
                <span className="block font-bold">المنافسات قيد العمل</span>
                <span className={`block text-xs mt-0.5 ${activeTab === 'tenders' ? 'text-white/75' : 'text-navy-500'}`}>
                  الدراسة الفنية والمالية والتقديم والنتيجة
                </span>
              </span>
            </span>
            <span className={`text-xl font-bold ${activeTab === 'tenders' ? 'text-white' : 'text-navy-700'}`}>{tenders.length}</span>
          </button>
        </div>
      </GlassCard>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <GlassCard className="p-12">
          <div className="flex flex-col items-center gap-3 text-navy-500">
            <Loader2 className="w-8 h-8 animate-spin text-araak-600" />
            <span className="text-sm font-medium">جارٍ تحميل السجل المركزي...</span>
          </div>
        </GlassCard>
      ) : visibleRecords.length === 0 ? (
        <GlassCard className="p-12">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-navy-50 flex items-center justify-center">
              {activeTab === 'opportunities' ? <Radar className="w-7 h-7 text-araak-600" /> : <FileCog className="w-7 h-7 text-navy-600" />}
            </div>
            <div>
              <h3 className="font-bold text-navy-900">لا توجد سجلات في هذا القسم</h3>
              <p className="text-sm text-navy-500 mt-1">استخدم زر الإضافة لإنشاء أول سجل وحفظ مستنداته معه.</p>
            </div>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {visibleRecords.map((record) => (
            <GlassCard key={`${record.kind}-${record.id}`} hover className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${record.kind === 'tender' ? 'bg-gradient-to-br from-navy-500 to-navy-700' : 'bg-gradient-to-br from-araak-500 to-araak-700'}`}>
                  {record.kind === 'tender' ? <FileCog className="w-6 h-6 text-white" /> : <Radar className="w-6 h-6 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-navy-900 text-lg">{record.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold ${statusClasses(record)}`}>
                          {statusLabel(record)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-navy-500">
                        {record.reference && <span>#{record.reference}</span>}
                        {record.client && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{record.client}</span>}
                        {record.city && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{record.city}</span>}
                        {record.deadline && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(record.deadline)}</span>}
                        {record.value && <span className="font-semibold text-emerald-700">{formatCurrency(record.value)}</span>}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] text-navy-400">المرحلة الحالية</div>
                      <div className="text-sm font-bold text-araak-700">{record.stage_label || record.current_stage}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600">
                      المصدر: {record.source}
                    </span>
                    {record.source_url && (
                      <a
                        href={record.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-araak-50 px-2.5 py-1 text-[11px] font-medium text-araak-700 hover:bg-araak-100"
                      >
                        <ExternalLink className="w-3 h-3" /> فتح المصدر
                      </a>
                    )}
                  </div>

                  {record.description && (
                    <p className="mt-3 text-sm leading-6 text-navy-600 line-clamp-2">{record.description}</p>
                  )}

                  {record.attachments.length > 0 && (
                    <div className="mt-4 border-t border-navy-100 pt-3">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-navy-700">
                        <Paperclip className="w-3.5 h-3.5" />
                        المستندات ({record.attachments.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {record.attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => void handleDownload(attachment)}
                            disabled={downloadingId === attachment.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-navy-100 bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-araak-200 hover:bg-araak-50 disabled:opacity-60"
                          >
                            {downloadingId === attachment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-araak-600" />}
                            <span className="max-w-48 truncate">{attachment.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showForm && (
        <UnifiedEntryForm
          defaultType={activeTab === 'tenders' ? 'tender' : 'opportunity'}
          onClose={() => setShowForm(false)}
          onSaved={async (entryType) => {
            setShowForm(false);
            setActiveTab(entryType === 'tender' ? 'tenders' : 'opportunities');
            await loadRecords(true);
          }}
        />
      )}
    </div>
  );
}

function UnifiedEntryForm({
  defaultType,
  onClose,
  onSaved,
}: {
  defaultType: EnterpriseRecordKind;
  onClose: () => void;
  onSaved: (entryType: EnterpriseRecordKind) => Promise<void> | void;
}) {
  const [entryType, setEntryType] = useState<EnterpriseRecordKind>(defaultType);
  const [sources, setSources] = useState<string[]>(FALLBACK_SOURCES);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    reference: '',
    client: '',
    entity: '',
    city: '',
    value: '',
    deadline: '',
    publication_date: '',
    description: '',
    requirements: '',
    source: 'مصدر داخلي',
    other_source: '',
    source_url: '',
  });

  useEffect(() => {
    listEnterpriseSources().then((items) => {
      if (items.length > 0) setSources(items);
    }).catch(() => undefined);
  }, []);

  const sourceOptions = useMemo(() => Array.from(new Set([...sources, ...FALLBACK_SOURCES])), [sources]);
  const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const selected = Array.from(incoming);
    const oversized = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`الملف ${oversized.name} يتجاوز الحد المسموح 2 ميجابايت.`);
      return;
    }
    const next = [...files, ...selected].slice(0, MAX_FILES);
    const total = next.reduce((sum, file) => sum + file.size, 0);
    if (total > MAX_TOTAL_SIZE) {
      setError('إجمالي الملفات يتجاوز 3 ميجابايت. قلّل العدد أو الحجم ثم أعد المحاولة.');
      return;
    }
    setFiles(next);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const sourceName = form.source === OTHER_SOURCE ? form.other_source.trim() : form.source;
      if (!sourceName) throw new Error('حدد مصدر الفرصة أو اكتب اسم المصدر الآخر.');

      await createEnterpriseRecord(entryType, {
        title: form.title,
        reference: form.reference,
        client: form.client,
        entity: form.entity,
        city: form.city,
        value: form.value,
        deadline: form.deadline,
        publication_date: form.publication_date,
        description: form.description,
        requirements: form.requirements,
        source: sourceName,
        source_url: form.source_url,
      }, files);

      await onSaved(entryType);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'تعذر حفظ الفرصة أو المنافسة.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/65 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 glass-nav px-6 py-4 flex items-center justify-between border-b border-navy-100 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-navy-900">فرصة أو منافسة جديدة</h2>
            <p className="text-xs text-navy-500 mt-0.5">إنشاء سجل مركزي وإرفاق المستندات به مباشرة</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-navy-50 border border-navy-100">
            <button
              type="button"
              onClick={() => setEntryType('opportunity')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${entryType === 'opportunity' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500'}`}
            >
              <Radar className="w-4 h-4" /> فرصة أولية
            </button>
            <button
              type="button"
              onClick={() => setEntryType('tender')}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${entryType === 'tender' ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500'}`}
            >
              <FileCog className="w-4 h-4" /> منافسة مباشرة
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">العنوان *</label>
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-navy-900"
              placeholder="مثال: مشروع إنشاء مبنى إداري أو توريد معدات..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">مصدر الفرصة أو المنافسة *</label>
              <select
                required
                value={form.source}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-navy-900"
              >
                {sourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
                <option value={OTHER_SOURCE}>أخرى</option>
              </select>
            </div>
            {form.source === OTHER_SOURCE ? (
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">اسم المصدر الآخر *</label>
                <input
                  required
                  value={form.other_source}
                  onChange={(event) => setForm({ ...form, other_source: event.target.value })}
                  className="glass-input w-full px-4 py-3 rounded-xl text-navy-900"
                  placeholder="اكتب اسم المنصة أو الجهة"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">رابط المصدر</label>
                <div className="relative">
                  <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    dir="ltr"
                    value={form.source_url}
                    onChange={(event) => setForm({ ...form, source_url: event.target.value })}
                    className="glass-input w-full pr-10 pl-4 py-3 rounded-xl text-navy-900"
                    placeholder="https://"
                  />
                </div>
              </div>
            )}
          </div>

          {form.source === OTHER_SOURCE && (
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">رابط المصدر</label>
              <input
                dir="ltr"
                value={form.source_url}
                onChange={(event) => setForm({ ...form, source_url: event.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-navy-900"
                placeholder="https://"
              />
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">رقم المرجع</label>
              <input dir="ltr" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">العميل/الجهة</label>
              <input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">المدينة</label>
              <input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">القيمة التقديرية (ر.س)</label>
              <input type="number" min="0" dir="ltr" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">تاريخ النشر/الاستلام</label>
              <input type="date" dir="ltr" value={form.publication_date} onChange={(event) => setForm({ ...form, publication_date: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">موعد الإغلاق/التسليم</label>
              <input type="date" dir="ltr" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">الوصف</label>
              <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900 resize-none" placeholder="نبذة عن نطاق العمل والهدف..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">المتطلبات الرئيسية</label>
              <textarea rows={3} value={form.requirements} onChange={(event) => setForm({ ...form, requirements: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900 resize-none" placeholder="الشهادات، الضمانات، الخبرات، المتطلبات الفنية..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">المستندات والملفات</label>
            <label className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-araak-200 bg-araak-50/50 px-5 py-6 cursor-pointer hover:border-araak-400 hover:bg-araak-50 transition-all">
              <UploadCloud className="w-7 h-7 text-araak-600 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-sm font-bold text-navy-800">اختر ملفات الفرصة أو المنافسة</span>
              <span className="text-xs text-navy-500">حتى 3 ملفات، وإجمالي 3 ميجابايت في عملية الرفع الواحدة</span>
              <input
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.zip"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>

            {files.length > 0 && (
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-3 py-2.5">
                    <span className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-araak-600" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-semibold text-navy-800 truncate">{file.name}</span>
                      <span className="block text-[10px] text-navy-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </span>
                    <button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-navy-500">
                <Paperclip className="w-3.5 h-3.5" />
                إجمالي المرفقات: {(totalFileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60">
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ والرفع...</>
              ) : (
                <><Send className="w-4 h-4" /> حفظ {entryType === 'tender' ? 'المنافسة' : 'الفرصة'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  BriefcaseBusiness,
  FileCog,
  FileText,
  Link2,
  Paperclip,
  Plus,
  Radar,
  Send,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { GlassCard, SectionHeader } from '@/components/ui/primitives';
import { OpportunityRadarPage } from '@/pages/opportunity-radar';
import { TenderManagementPage } from '@/pages/tender-management';
import type { ExternalPlatform } from '@/lib/types';

type HubTab = 'opportunities' | 'tenders';
type EntryType = 'opportunity' | 'tender';
type PageKey = 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team' | 'documents' | 'accountability' | 'lessons' | 'reports' | 'ai-advisor' | 'settings';

interface Props {
  onNavigate: (page: PageKey) => void;
  initialTab?: HubTab;
}

const FALLBACK_SOURCES = ['اعتماد', 'فرصة', 'منافس', 'مناقصات', 'إحالة مباشرة', 'مصدر داخلي'];
const OTHER_SOURCE = '__other__';
const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function OpportunityTenderHubPage({ onNavigate, initialTab = 'opportunities' }: Props) {
  const { member, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<HubTab>(initialTab);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [counts, setCounts] = useState({ opportunities: 0, tenders: 0 });

  const canCreate = hasPermission('manage_opportunities') || hasPermission('tender_management');

  const loadCounts = async () => {
    const [opportunities, tenders] = await Promise.all([
      supabase.from('opportunities').select('id', { count: 'exact', head: true }),
      supabase.from('tenders').select('id', { count: 'exact', head: true }),
    ]);
    setCounts({
      opportunities: opportunities.count ?? 0,
      tenders: tenders.count ?? 0,
    });
  };

  useEffect(() => {
    void loadCounts();
  }, [refreshKey]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="الفرص والمنافسات"
        subtitle="مسار موحد لرصد الفرصة، اعتماد المشاركة، وإدارة المنافسة حتى النتيجة"
        icon={BriefcaseBusiness}
        action={canCreate && member ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            فرصة أو منافسة جديدة
          </button>
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
            <span className={`text-xl font-bold ${activeTab === 'opportunities' ? 'text-white' : 'text-araak-700'}`}>{counts.opportunities}</span>
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
            <span className={`text-xl font-bold ${activeTab === 'tenders' ? 'text-white' : 'text-navy-700'}`}>{counts.tenders}</span>
          </button>
        </div>
      </GlassCard>

      {activeTab === 'opportunities' ? (
        <div key={`opportunities-${refreshKey}`} className="[&>div>div:first-child]:hidden">
          <OpportunityRadarPage onNavigate={onNavigate} />
        </div>
      ) : (
        <div key={`tenders-${refreshKey}`} className="[&>div>div:first-child]:hidden">
          <TenderManagementPage onNavigate={onNavigate} />
        </div>
      )}

      {showForm && member && (
        <UnifiedEntryForm
          memberId={member.id}
          defaultType={activeTab === 'tenders' ? 'tender' : 'opportunity'}
          onClose={() => setShowForm(false)}
          onSaved={(entryType) => {
            setShowForm(false);
            setActiveTab(entryType === 'tender' ? 'tenders' : 'opportunities');
            setRefreshKey((value) => value + 1);
          }}
        />
      )}
    </div>
  );
}

function UnifiedEntryForm({
  memberId,
  defaultType,
  onClose,
  onSaved,
}: {
  memberId: string;
  defaultType: EntryType;
  onClose: () => void;
  onSaved: (entryType: EntryType) => void;
}) {
  const [entryType, setEntryType] = useState<EntryType>(defaultType);
  const [platforms, setPlatforms] = useState<ExternalPlatform[]>([]);
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
    supabase
      .from('external_platforms')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setPlatforms((data ?? []) as ExternalPlatform[]));
  }, []);

  const sourceOptions = platforms.length > 0
    ? Array.from(new Set(platforms.map((platform) => platform.name)))
    : FALLBACK_SOURCES;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const selected = Array.from(incoming);
    const oversized = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`الملف ${oversized.name} يتجاوز الحد الأقصى 25 ميجابايت.`);
      return;
    }
    const combined = [...files, ...selected].slice(0, MAX_FILES);
    setFiles(combined);
    setError('');
  };

  const uploadFiles = async (opportunityId: string, tenderId: string | null) => {
    for (const file of files) {
      const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '-');
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const storagePath = `opportunities/${opportunityId}/${unique}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from('opportunity-documents')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });
      if (uploadError) throw uploadError;

      const { error: documentError } = await supabase.from('documents').insert({
        title: file.name,
        type: file.type || null,
        category: entryType === 'tender' ? 'مرفقات المنافسة' : 'مرفقات الفرصة',
        opportunity_id: opportunityId,
        tender_id: tenderId,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
        current_version: 1,
        uploaded_by: memberId,
        tags: [entryType === 'tender' ? 'منافسة' : 'فرصة'],
      });
      if (documentError) throw documentError;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const sourceName = form.source === OTHER_SOURCE ? form.other_source.trim() : form.source;
      if (!sourceName) throw new Error('حدد مصدر الفرصة أو اكتب المصدر الآخر.');

      const { data: opportunity, error: opportunityError } = await supabase
        .from('opportunities')
        .insert({
          reference: form.reference || null,
          title: form.title,
          client: form.client || null,
          entity: form.entity || null,
          city: form.city || null,
          value: form.value ? Number(form.value) : null,
          deadline: form.deadline || null,
          publication_date: form.publication_date || null,
          description: form.description || null,
          requirements: form.requirements || null,
          is_external: !['مصدر داخلي', 'إحالة مباشرة'].includes(sourceName),
          external_platform: sourceName,
          external_url: form.source_url || null,
          status: entryType === 'tender' ? 'in_progress' : 'new',
          created_by: memberId,
        })
        .select('id')
        .single();
      if (opportunityError || !opportunity) throw opportunityError || new Error('تعذر إنشاء السجل.');

      let tenderId: string | null = null;
      if (entryType === 'tender') {
        const { data: tender, error: tenderError } = await supabase
          .from('tenders')
          .insert({
            opportunity_id: opportunity.id,
            reference: form.reference || null,
            title: form.title,
            client: form.client || null,
            entity: form.entity || null,
            value: form.value ? Number(form.value) : null,
            submission_deadline: form.deadline || null,
            status: 'draft',
            current_stage: 'intake',
            created_by: memberId,
            assigned_lead: memberId,
          })
          .select('id')
          .single();
        if (tenderError || !tender) throw tenderError || new Error('تعذر إنشاء المنافسة المرتبطة.');
        tenderId = tender.id;
      }

      if (files.length > 0) await uploadFiles(opportunity.id, tenderId);
      onSaved(entryType);
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
            <p className="text-xs text-navy-500 mt-0.5">سجل موحد يبدأ من المصدر ويحفظ المستندات مع دورة العمل</p>
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
              <input dir="ltr" value={form.source_url} onChange={(event) => setForm({ ...form, source_url: event.target.value })} className="glass-input w-full px-4 py-3 rounded-xl text-navy-900" placeholder="https://" />
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
              <span className="text-sm font-bold text-navy-800">اختر أو اسحب ملفات الفرصة والمنافسة</span>
              <span className="text-xs text-navy-500">حتى 10 ملفات، وبحد أقصى 25 ميجابايت للملف</span>
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
          </div>

          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60">
              {submitting ? (
                <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> جارٍ الحفظ والرفع...</>
              ) : (
                <><Send className="w-4 h-4" /> حفظ {entryType === 'tender' ? 'المنافسة' : 'الفرصة'}</>
              )}
            </button>
          </div>

          {files.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-navy-500">
              <Paperclip className="w-3.5 h-3.5" />
              ستُحفظ الملفات تلقائيًا في مركز الوثائق وترتبط بالسجل الجديد.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

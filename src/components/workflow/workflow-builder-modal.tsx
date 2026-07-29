import { useMemo, useState } from 'react';
import { CalendarClock, FileStack, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { WorkflowSourceOpportunity, WorkflowSourceTender, WorkflowTemplate } from '@/lib/workflow-types';

function toLocalInput(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

interface WorkflowBuilderModalProps {
  templates: WorkflowTemplate[];
  tenders: WorkflowSourceTender[];
  opportunities: WorkflowSourceOpportunity[];
  onClose: () => void;
  onCreated: (workflowId: string) => void;
}

export function WorkflowBuilderModal({
  templates,
  tenders,
  opportunities,
  onClose,
  onCreated,
}: WorkflowBuilderModalProps) {
  const now = useMemo(() => new Date(), []);
  const defaultDeadline = useMemo(() => new Date(now.getTime() + 12 * 86_400_000), [now]);
  const [form, setForm] = useState({
    template_key: templates[0]?.key ?? 'building-project-tender',
    source: '',
    title: '',
    reference: '',
    received_at: toLocalInput(now),
    submission_deadline: toLocalInput(defaultDeadline),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = templates.find((item) => item.key === form.template_key);

  const applySource = (value: string) => {
    if (!value) {
      setForm((current) => ({ ...current, source: value }));
      return;
    }

    const [type, id] = value.split(':');
    if (type === 'tender') {
      const tender = tenders.find((item) => item.id === id);
      if (!tender) return;
      setForm((current) => ({
        ...current,
        source: value,
        title: tender.title,
        reference: tender.reference ?? '',
        submission_deadline: tender.submission_deadline ? toLocalInput(new Date(tender.submission_deadline)) : current.submission_deadline,
      }));
      return;
    }

    const opportunity = opportunities.find((item) => item.id === id);
    if (!opportunity) return;
    setForm((current) => ({
      ...current,
      source: value,
      title: opportunity.title,
      reference: opportunity.reference ?? '',
      received_at: opportunity.publication_date ? toLocalInput(new Date(opportunity.publication_date)) : current.received_at,
      submission_deadline: opportunity.deadline ? toLocalInput(new Date(opportunity.deadline)) : current.submission_deadline,
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) return setError('أدخل عنوان المنافسة أو المشروع.');
    const receivedAt = new Date(form.received_at);
    const deadline = new Date(form.submission_deadline);
    if (!Number.isFinite(receivedAt.getTime()) || !Number.isFinite(deadline.getTime())) return setError('تواريخ المسار غير صالحة.');
    if (deadline <= receivedAt) return setError('تاريخ التسليم يجب أن يكون بعد تاريخ استلام الفرصة.');

    const [sourceType, sourceId] = form.source ? form.source.split(':') : ['', ''];
    setSaving(true);
    const { data, error: rpcError } = await supabase.rpc('create_competition_workflow', {
      p_template_key: form.template_key,
      p_title: form.title.trim(),
      p_reference: form.reference.trim(),
      p_received_at: receivedAt.toISOString(),
      p_submission_deadline: deadline.toISOString(),
      p_tender_id: sourceType === 'tender' ? sourceId : null,
      p_opportunity_id: sourceType === 'opportunity' ? sourceId : null,
    });
    setSaving(false);

    if (rpcError) return setError(rpcError.message);
    if (!data) return setError('تم إنشاء المسار لكن لم يرجع النظام معرفه. حدّث الصفحة للتحقق.');
    onCreated(String(data));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/65 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_35px_100px_-35px_rgba(3,24,39,.9)]" onClick={(event) => event.stopPropagation()}>
        <div className="relative overflow-hidden bg-gradient-to-l from-navy-950 via-[#064354] to-araak-700 px-6 py-5 text-white">
          <div className="absolute -left-10 -top-20 h-52 w-52 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-100"><Sparkles className="h-4 w-4" /> محرك الهندلة الزمنية</div>
              <h2 className="mt-2 text-2xl font-extrabold">إنشاء المسار التنفيذي للمنافسة</h2>
              <p className="mt-1 text-xs leading-6 text-cyan-50/70">سيقسّم النظام كامل الفترة إلى مراحل موزونة، يحدد مالك كل مرحلة، وينشئ المهام ونقاط تسليم الملف تلقائيًا.</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-white/15 bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <form onSubmit={submit} className="max-h-[78vh] space-y-5 overflow-y-auto p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-navy-700">قالب المسار</span>
              <select
                value={form.template_key}
                onChange={(event) => setForm({ ...form, template_key: event.target.value })}
                className="glass-input w-full rounded-xl px-4 py-3"
              >
                {templates.map((template) => <option key={template.id} value={template.key}>{template.name}</option>)}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold text-navy-700">الربط بمنافسة أو فرصة</span>
              <select value={form.source} onChange={(event) => applySource(event.target.value)} className="glass-input w-full rounded-xl px-4 py-3">
                <option value="">مسار مستقل / إدخال يدوي</option>
                {tenders.length > 0 && <optgroup label="المنافسات">{tenders.map((item) => <option key={item.id} value={`tender:${item.id}`}>{item.reference ? `${item.reference} — ` : ''}{item.title}</option>)}</optgroup>}
                {opportunities.length > 0 && <optgroup label="الفرص">{opportunities.map((item) => <option key={item.id} value={`opportunity:${item.id}`}>{item.reference ? `${item.reference} — ` : ''}{item.title}</option>)}</optgroup>}
              </select>
            </label>
          </div>

          {selectedTemplate && (
            <div className="flex items-start gap-3 rounded-2xl border border-araak-100 bg-araak-50/70 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-araak-600 text-white"><Sparkles className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-bold text-araak-900">{selectedTemplate.name}</div>
                <p className="mt-1 text-xs leading-6 text-araak-800/75">{selectedTemplate.description}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-navy-700">عنوان المنافسة / المشروع</span>
              <div className="relative">
                <FileStack className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="glass-input w-full rounded-xl py-3 pl-4 pr-10" placeholder="مثال: إنشاء مجمع مبانٍ إدارية" />
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-navy-700">المرجع</span>
              <input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} className="glass-input w-full rounded-xl px-4 py-3" placeholder="رقم المنافسة" dir="ltr" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-navy-700">استلام الفرصة / بداية العمل</span>
              <div className="relative">
                <CalendarClock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input required type="datetime-local" value={form.received_at} onChange={(event) => setForm({ ...form, received_at: event.target.value })} className="glass-input w-full rounded-xl py-3 pl-4 pr-10" />
              </div>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-bold text-navy-700">إغلاق التسليم / رفع الكراسة</span>
              <div className="relative">
                <CalendarClock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-400" />
                <input required type="datetime-local" value={form.submission_deadline} onChange={(event) => setForm({ ...form, submission_deadline: event.target.value })} className="glass-input w-full rounded-xl py-3 pl-4 pr-10" />
              </div>
            </label>
          </div>

          <div className="rounded-2xl bg-navy-950/[.035] p-4 text-xs leading-7 text-navy-600">
            <strong className="block text-navy-900">ما الذي سيحدث بعد الإنشاء؟</strong>
            توزيع كامل المدة على مراحل الدراسة الأولية والفنية وحصر البنود وعروض الأسعار والمقارنات والاعتماد والرفع، إنشاء مهمة لكل مرحلة، تعيين المسؤول حسب دوره، وإنشاء نقاط انتقال الملف بين الإدارات مع مراقبة التأخير تلقائيًا.
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-navy-100 pt-5 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-navy-200 px-4 py-3 text-sm font-bold text-navy-600">إلغاء</button>
            <button disabled={saving} className="flex-[1.5] rounded-xl bg-gradient-to-l from-araak-600 to-navy-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-araak-100 disabled:opacity-60">
              {saving ? 'جارٍ هندلة المسار...' : 'إنشاء المسار والمهام تلقائيًا'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

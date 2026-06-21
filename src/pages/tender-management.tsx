import { useEffect, useState } from 'react';
import {
  FileCog, Plus, X, Check, CheckCircle2, Circle, Clock,
  ChevronLeft, Calendar, DollarSign, User,
  ListChecks, Workflow,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, EmptyState, LoadingState, StatusBadge, ProgressBar } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import {
  TENDER_STATUS_CONFIG, TENDER_STAGE_CONFIG, TENDER_STAGE_ORDER,
  formatCurrency, formatDate, classNames,
} from '@/lib/constants';
import type { Tender, TenderStage, TenderChecklist, TeamMember, TenderStageKey } from '@/lib/types';

type PageKey = 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team' | 'documents' | 'accountability' | 'lessons' | 'reports' | 'ai-advisor' | 'settings';

interface Props {
  onNavigate: (p: PageKey) => void;
}

export function TenderManagementPage({ onNavigate: _onNavigate }: Props) {
  const { member, hasPermission } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tender | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadTenders(); }, []);

  const loadTenders = async () => {
    setLoading(true);
    const { data } = await supabase.from('tenders').select('*').order('created_at', { ascending: false });
    if (data) setTenders(data as Tender[]);
    setLoading(false);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="إدارة المناقصات"
        subtitle="سير عمل المناقصات من الاستقبال حتى النتيجة"
        icon={FileCog}
        action={
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all">
            <Plus className="w-4 h-4" />مناقصة جديدة
          </button>
        }
      />
      {loading ? <LoadingState /> : tenders.length === 0 ? (
        <GlassCard>
          <EmptyState icon={FileCog} title="لا توجد مناقصات" description="عند إنشاء مناقصات ستظهر هنا مع سير العمل والمراحل والقوائم."
            action={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"><Plus className="w-4 h-4" />إنشاء مناقصة</button>} />
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {tenders.map((tender) => {
            const cfg = TENDER_STATUS_CONFIG[tender.status];
            const stageCfg = TENDER_STAGE_CONFIG[tender.current_stage];
            return (
              <GlassCard key={tender.id} hover className="p-5 cursor-pointer">
                <div onClick={() => setSelected(tender)} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center flex-shrink-0">
                    <FileCog className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-navy-900 text-lg">{tender.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-navy-500 mt-1">
                          {tender.reference && <span>#{tender.reference}</span>}
                          {tender.client && <span>{tender.client}</span>}
                          {tender.value && <span className="font-semibold text-emerald-700">{formatCurrency(tender.value)}</span>}
                        </div>
                      </div>
                      <StatusBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-navy-400">المرحلة:</span>
                        <span className="font-semibold text-araak-700">{stageCfg.label}</span>
                      </div>
                      {tender.submission_deadline && (
                        <div className="flex items-center gap-1.5 text-xs text-navy-500">
                          <Calendar className="w-3.5 h-3.5" />{formatDate(tender.submission_deadline)}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-navy-300 flex-shrink-0" />
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
      {showForm && member && <NewTenderForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadTenders(); }} member={member} />}
      {selected && <TenderDetail tender={selected} onClose={() => setSelected(null)} canEdit={hasPermission('tender_management')} />}
    </div>
  );
}

function NewTenderForm({ onClose, onSaved, member }: { onClose: () => void; onSaved: () => void; member: TeamMember }) {
  const [form, setForm] = useState({ title: '', reference: '', client: '', value: '', submission_deadline: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('tenders').insert({
      title: form.title, reference: form.reference || null, client: form.client || null,
      value: form.value ? parseFloat(form.value) : null,
      submission_deadline: form.submission_deadline || null,
      status: 'draft', current_stage: 'intake', created_by: member.id, assigned_lead: member.id,
    });
    if (insertError) { setError(insertError.message); setSubmitting(false); return; }
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-navy-100">
          <h2 className="text-xl font-bold text-navy-900">مناقصة جديدة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">عنوان المناقصة *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="مثال: مناقصة توريد معدات..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">المرجع</label>
              <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">العميل</label>
              <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">القيمة (ر.س)</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">تاريخ التقديم</label>
              <input type="date" value={form.submission_deadline} onChange={(e) => setForm({ ...form, submission_deadline: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" dir="ltr" />
            </div>
          </div>
          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60">{submitting ? 'جارٍ الحفظ...' : 'إنشاء'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TenderDetail({ tender, onClose, canEdit }: { tender: Tender; onClose: () => void; canEdit: boolean }) {
  const [stages, setStages] = useState<TenderStage[]>([]);
  const [checklists, setChecklists] = useState<TenderChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workflow' | 'checklists'>('workflow');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [stagesRes, checklistRes] = await Promise.all([
        supabase.from('tender_stages').select('*').eq('tender_id', tender.id).order('sort_order'),
        supabase.from('tender_checklists').select('*').eq('tender_id', tender.id).order('type'),
      ]);
      if (stagesRes.data) {
        let stagesData = stagesRes.data as TenderStage[];
        if (stagesData.length === 0) {
          const newStages = TENDER_STAGE_ORDER.map((key, i) => ({
            tender_id: tender.id, stage_key: key as TenderStageKey,
            stage_label: TENDER_STAGE_CONFIG[key].label, status: 'pending' as const, sort_order: i,
          }));
          const { data: created } = await supabase.from('tender_stages').insert(newStages).select('*');
          if (created) stagesData = created as TenderStage[];
        }
        setStages(stagesData);
      }
      if (checklistRes.data) setChecklists(checklistRes.data as TenderChecklist[]);
      setLoading(false);
    })();
  }, [tender.id]);

  const updateStageStatus = async (stageId: string, status: TenderStage['status']) => {
    const updates: Partial<TenderStage> = {
      status,
      started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
      completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    };
    const { data } = await supabase.from('tender_stages').update(updates).eq('id', stageId).select('*').single();
    if (data) {
      const updated = data as TenderStage;
      setStages((prev) => prev.map((s) => (s.id === stageId ? updated : s)));
      if (status === 'completed') {
        setStages((prev) => {
          const idx = prev.findIndex((x) => x.id === stageId);
          const next = prev[idx + 1];
          if (next) supabase.from('tenders').update({ current_stage: next.stage_key }).eq('id', tender.id);
          return prev;
        });
      }
    }
  };

  const toggleChecklist = async (item: TenderChecklist) => {
    const { data } = await supabase
      .from('tender_checklists')
      .update({ is_checked: !item.is_checked, checked_at: !item.is_checked ? new Date().toISOString() : null })
      .eq('id', item.id).select('*').single();
    if (data) setChecklists((prev) => prev.map((c) => (c.id === item.id ? data as TenderChecklist : c)));
  };

  const cfg = TENDER_STATUS_CONFIG[tender.status];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm" onClick={onClose}>
        <LoadingState label="جارٍ تحميل تفاصيل المناقصة..." />
      </div>
    );
  }

  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const progressPercent = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;
  const checklistTypes = [
    { key: 'technical', label: 'فنية' }, { key: 'financial', label: 'مالية' },
    { key: 'operational', label: 'تشغيلية' }, { key: 'procurement', label: 'مشتريات' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-between border-b border-navy-100 rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <StatusBadge label={cfg.label} color={cfg.color} bg={cfg.bg} border={cfg.border} />
            <ProgressBar value={progressPercent} color="araak" height={6} />
            <span className="text-xs text-navy-500 font-medium">{progressPercent}%</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            {tender.reference && <div className="inline-flex items-center gap-1 mb-2 px-2 py-1 rounded-full bg-navy-100 text-navy-700 text-xs font-bold">#{tender.reference}</div>}
            <h2 className="text-2xl font-bold text-navy-900">{tender.title}</h2>
            <div className="flex items-center gap-4 text-sm text-navy-600 mt-2">
              {tender.client && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{tender.client}</span>}
              {tender.value && <span className="flex items-center gap-1 text-emerald-700 font-semibold"><DollarSign className="w-3.5 h-3.5" />{formatCurrency(tender.value)}</span>}
              {tender.submission_deadline && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(tender.submission_deadline)}</span>}
            </div>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-navy-50">
            <button onClick={() => setActiveTab('workflow')} className={classNames('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === 'workflow' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              <Workflow className="w-4 h-4" />سير العمل
            </button>
            <button onClick={() => setActiveTab('checklists')} className={classNames('flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors', activeTab === 'checklists' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              <ListChecks className="w-4 h-4" />قوائم الفحص
            </button>
          </div>
          {activeTab === 'workflow' && (
            <div className="space-y-2">
              {stages.map((stage, i) => {
                const stageCfg = TENDER_STAGE_CONFIG[stage.stage_key];
                const isCompleted = stage.status === 'completed';
                const inProgress = stage.status === 'in_progress';
                return (
                  <div key={stage.id} className={classNames('flex items-center gap-3 p-4 rounded-xl border transition-all', isCompleted ? 'bg-emerald-50 border-emerald-200' : inProgress ? 'bg-araak-50 border-araak-200' : 'bg-navy-50 border-navy-100')}>
                    <button onClick={() => canEdit && updateStageStatus(stage.id, isCompleted ? 'pending' : inProgress ? 'completed' : 'in_progress')} disabled={!canEdit} className="flex-shrink-0">
                      {isCompleted ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : inProgress ? <Clock className="w-6 h-6 text-araak-600" /> : <Circle className="w-6 h-6 text-navy-300" />}
                    </button>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-navy-400">المرحلة {i + 1}</span>
                      <div className="font-semibold text-navy-900 text-sm">{stageCfg.label}</div>
                      {stage.notes && <p className="text-xs text-navy-500 mt-0.5">{stage.notes}</p>}
                    </div>
                    {isCompleted && stage.completed_at && <span className="text-[10px] text-emerald-600 font-medium">{formatDate(stage.completed_at)}</span>}
                  </div>
                );
              })}
            </div>
          )}
          {activeTab === 'checklists' && (
            <div className="space-y-4">
              {checklistTypes.map((type) => {
                const items = checklists.filter((c) => c.type === type.key);
                return (
                  <div key={type.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-navy-900 text-sm">{type.label}</h4>
                      <span className="text-xs text-navy-400">({items.filter((i) => i.is_checked).length}/{items.length})</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-xs text-navy-400 px-3 py-2 bg-navy-50 rounded-lg">لا توجد بنود</p>
                    ) : (
                      <div className="space-y-1">
                        {items.map((item) => (
                          <button key={item.id} onClick={() => canEdit && toggleChecklist(item)} disabled={!canEdit}
                            className={classNames('w-full flex items-center gap-2 p-2.5 rounded-lg text-right transition-colors', item.is_checked ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-navy-50 text-navy-700')}>
                            {item.is_checked ? <Check className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-navy-300" />}
                            <span className={classNames('text-sm flex-1', item.is_checked ? 'line-through opacity-70' : '')}>{item.item}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {checklists.length === 0 && (
                <div className="text-center py-6 text-navy-400 text-sm">
                  <ListChecks className="w-8 h-8 mx-auto mb-2 text-navy-200" />لا توجد بنود قائمة فحص بعد
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  Radar as RadarIcon, Plus, ExternalLink, Search,
  MapPin, Calendar, DollarSign, User, ArrowLeft, X, Send,
  Sparkles, Users as UsersIcon, ChevronLeft, Star,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, EmptyState, StatusBadge, LoadingState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import {
  OPPORTUNITY_STATUS_CONFIG, formatCurrency, formatDate, daysUntil,
  RISK_LEVEL_CONFIG, classNames,
} from '@/lib/constants';
import type { Opportunity, TeamMember, OpportunityAssignment } from '@/lib/types';

type PageKey = 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team' | 'documents' | 'accountability' | 'lessons' | 'reports' | 'ai-advisor' | 'settings';

interface Props {
  onNavigate: (p: PageKey) => void;
}

export function OpportunityRadarPage({ onNavigate }: Props) {
  const { member, hasPermission } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const canCreate = hasPermission('manage_opportunities');
  const canProposeExternal = hasPermission('propose_external');

  useEffect(() => {
    loadOpportunities();
    if (hasPermission('manage_opportunities')) {
      supabase.from('team_members').select('*').eq('is_active', true).then(({ data }) => {
        if (data) setTeamMembers(data as TeamMember[]);
      });
    }
  }, [hasPermission]);

  const loadOpportunities = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOpportunities(data as Opportunity[]);
    setLoading(false);
  };

  const filtered = opportunities.filter((o) => {
    const statusMatch = filter === 'all' || o.status === filter;
    const searchMatch = !search ||
      o.title.includes(search) ||
      (o.client?.includes(search) ?? false) ||
      (o.reference?.includes(search) ?? false);
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="رادار الفرص"
        subtitle="استكشاف وإدارة المنافسات والفرص الاستثمارية"
        icon={RadarIcon}
        action={
          (canCreate || canProposeExternal) && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"
            >
              <Plus className="w-4 h-4" />
              فرصة جديدة
            </button>
          )
        }
      />

      {/* الفلاتر */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-64">
            <Search className="w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعنوان، العميل، أو المرجع..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-navy-800 placeholder-navy-400"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={classNames(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                filter === 'all' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
              )}
            >
              الكل ({opportunities.length})
            </button>
            {(['new', 'under_review', 'qualified', 'in_progress', 'won', 'lost'] as const).map((s) => {
              const cfg = OPPORTUNITY_STATUS_CONFIG[s];
              const count = opportunities.filter((o) => o.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={classNames(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                    filter === s ? `${cfg.bg} ${cfg.color}` : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                  )}
                >
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* قائمة الفرص */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={RadarIcon}
            title="لا توجد فرص"
            description="عند إضافة فرص جديدة ستظهر هنا. يمكنك إضافة فرصة جديدة أو اقتراح فرصة من منصة خارجية."
            action={
              (canCreate || canProposeExternal) && (
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"
                >
                  <Plus className="w-4 h-4" />
                  إضافة فرصة
                </button>
              )
            }
          />
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((opp) => {
            const cfg = OPPORTUNITY_STATUS_CONFIG[opp.status];
            const days = daysUntil(opp.deadline);
            const overdue = days !== null && days < 0 && opp.status !== 'won' && opp.status !== 'lost';
            return (
              <GlassCard
                key={opp.id}
                hover
                className="p-5 cursor-pointer"
              >
                <div onClick={() => setSelected(opp)}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      {opp.external_platform && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <ExternalLink className="w-3 h-3 text-araak-500" />
                          <span className="text-[10px] font-bold text-araak-600">{opp.external_platform}</span>
                        </div>
                      )}
                      <h3 className="font-bold text-navy-900 line-clamp-2 text-sm leading-snug">
                        {opp.title}
                      </h3>
                    </div>
                    <span className={classNames('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0', cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-navy-600 mb-3">
                    {opp.client && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-navy-400" />
                        <span className="truncate">{opp.client}</span>
                      </div>
                    )}
                    {opp.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-navy-400" />
                        <span>{opp.city}</span>
                      </div>
                    )}
                    {opp.value && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-navy-400" />
                        <span className="font-semibold text-emerald-700">{formatCurrency(opp.value)}</span>
                      </div>
                    )}
                    {opp.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-navy-400" />
                        <span className={overdue ? 'text-red-600 font-bold' : days !== null && days < 7 ? 'text-amber-600 font-semibold' : ''}>
                          {formatDate(opp.deadline)}
                        </span>
                        {days !== null && (
                          <span className={classNames('text-[10px] px-1.5 py-0.5 rounded-full', overdue ? 'bg-red-100 text-red-700' : days < 7 ? 'bg-amber-100 text-amber-700' : 'bg-navy-100 text-navy-600')}>
                            {overdue ? `متأخرة ${Math.abs(days)} يوم` : `باقي ${days} يوم`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-navy-100">
                    <div className="flex items-center gap-2">
                      {opp.risk_level !== 'medium' && (
                        <span className={classNames('text-[10px] font-medium', RISK_LEVEL_CONFIG[opp.risk_level].color)}>
                          مخاطر: {RISK_LEVEL_CONFIG[opp.risk_level].label}
                        </span>
                      )}
                      {opp.attractiveness_score !== null && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold-500" />
                          <span className="text-[10px] font-bold text-navy-700">{opp.attractiveness_score}%</span>
                        </div>
                      )}
                    </div>
                    <ChevronLeft className="w-4 h-4 text-navy-300" />
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* نموذج الإضافة */}
      {showForm && (
        <OpportunityForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadOpportunities();
          }}
          canCreate={canCreate}
          canProposeExternal={canProposeExternal}
          currentMemberId={member!.id}
        />
      )}

      {/* تفاصيل الفرصة */}
      {selected && (
        <OpportunityDetail
          opportunity={selected}
          teamMembers={teamMembers}
          onClose={() => setSelected(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

/* نموذج إضافة فرصة جديدة */
function OpportunityForm({
  onClose, onSaved, canCreate, canProposeExternal, currentMemberId,
}: {
  onClose: () => void;
  onSaved: () => void;
  canCreate: boolean;
  canProposeExternal: boolean;
  currentMemberId: string;
}) {
  const [isExternal, setIsExternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', client: '', entity: '', city: '', value: '',
    deadline: '', description: '', requirements: '',
    external_platform: '', external_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const finalIsExternal = isExternal && canProposeExternal;
    const isProposal = finalIsExternal && !canCreate;

    const payload: Record<string, unknown> = {
      title: form.title,
      client: form.client || null,
      entity: form.entity || null,
      city: form.city || null,
      value: form.value ? parseFloat(form.value) : null,
      deadline: form.deadline || null,
      description: form.description || null,
      requirements: form.requirements || null,
      is_external: finalIsExternal,
      external_platform: finalIsExternal ? form.external_platform || null : null,
      external_url: finalIsExternal ? form.external_url || null : null,
      status: isProposal ? 'new' : 'new',
      suggested_by: isProposal ? currentMemberId : null,
      created_by: canCreate ? currentMemberId : null,
    };

    if (isProposal) {
      // اقتراح فرصة خارجية - ينتظر موافقة مدير التسويق
      payload.suggested_by = currentMemberId;
    }

    const { error: insertError } = await supabase.from('opportunities').insert(payload);

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-between border-b border-navy-100 rounded-t-3xl z-10">
          <h2 className="text-xl font-bold text-navy-900">فرصة جديدة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {canProposeExternal && canCreate && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-araak-50 border border-araak-100">
              <input
                type="checkbox"
                id="isExternal"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="w-4 h-4 accent-araak-500"
              />
              <label htmlFor="isExternal" className="text-sm text-navy-700 cursor-pointer">
                فرصة خارجية من منصة منافسات عامة (اعتماد، فرصة، منافس)
              </label>
            </div>
          )}

          {canProposeExternal && !canCreate && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>اقتراح فرصة خارجية - سيتم توجيهها لمسؤول فريق التسويق للمراجعة والإسناد</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">عنوان الفرصة *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
              placeholder="مثال: توريد معدات لوجستية لوزارة..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">العميل/الجهة</label>
              <input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
                placeholder="اسم الجهة"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">المدينة</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
                placeholder="الرياض، جدة..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">القيمة التقديرية (ر.س)</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
                placeholder="0"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">الموعد النهائي</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
                dir="ltr"
              />
            </div>
          </div>

          {isExternal && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">المنصة المصدر</label>
                <select
                  value={form.external_platform}
                  onChange={(e) => setForm({ ...form, external_platform: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
                >
                  <option value="">-- اختر --</option>
                  <option value="اعتماد">اعتماد</option>
                  <option value="فرصة">فرصة</option>
                  <option value="منافس">منافس</option>
                  <option value="مناقصات">مناقصات</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">رابط المنافسة</label>
                <input
                  value={form.external_url}
                  onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900"
                  placeholder="https://"
                  dir="ltr"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">الوصف والمتطلبات</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900 resize-none"
              placeholder="تفاصيل الفرصة وأهم متطلباتها..."
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60"
            >
              {submitting ? 'جارٍ الحفظ...' : (
                <>
                  <Send className="w-4 h-4" />
                  {isExternal && !canCreate ? 'إرسال الاقتراح' : 'حفظ الفرصة'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* تفاصيل الفرصة والإسناد */
function OpportunityDetail({
  opportunity, teamMembers, onClose, onNavigate,
}: {
  opportunity: Opportunity;
  teamMembers: TeamMember[];
  onClose: () => void;
  onNavigate: (p: PageKey) => void;
}) {
  const { hasPermission, isAdmin } = useAuth();
  const [assignments, setAssignments] = useState<OpportunityAssignment[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('opportunity_assignments')
        .select(`
          *,
          team_member:team_members!opportunity_assignments_team_member_id_fkey(*)
        `)
        .eq('opportunity_id', opportunity.id);
      if (data) setAssignments(data as OpportunityAssignment[]);
    })();
  }, [opportunity.id]);

  const handleAssign = async () => {
    if (!selectedMember || !selectedRole) return;
    setAssigning(true);
    const { data, error } = await supabase
      .from('opportunity_assignments')
      .insert({
        opportunity_id: opportunity.id,
        team_member_id: selectedMember,
        role_in_project: selectedRole,
        assigned_by: null,
      })
      .select(`
        *,
        team_member:team_members!opportunity_assignments_team_member_id_fkey(*)
      `)
      .single();

    if (!error && data) {
      setAssignments((prev) => [...prev, data as OpportunityAssignment]);
      setSelectedMember('');
      setSelectedRole('');
    }
    setAssigning(false);
  };

  const cfg = OPPORTUNITY_STATUS_CONFIG[opportunity.status];
  const days = daysUntil(opportunity.deadline);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="glass-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 glass-nav px-6 py-4 flex items-center justify-between border-b border-navy-100 rounded-t-3xl z-10">
          <StatusBadge label={cfg.label} color={cfg.color} bg={cfg.bg} />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            {opportunity.external_platform && (
              <div className="inline-flex items-center gap-1 mb-2 px-2 py-1 rounded-full bg-araak-50 text-araak-700 text-xs font-bold">
                <ExternalLink className="w-3 h-3" />
                {opportunity.external_platform}
              </div>
            )}
            <h2 className="text-2xl font-bold text-navy-900">{opportunity.title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {opportunity.client && (
              <div className="p-3 rounded-xl bg-navy-50">
                <div className="text-[11px] text-navy-500 mb-0.5">العميل</div>
                <div className="text-sm font-semibold text-navy-900">{opportunity.client}</div>
              </div>
            )}
            {opportunity.city && (
              <div className="p-3 rounded-xl bg-navy-50">
                <div className="text-[11px] text-navy-500 mb-0.5">المدينة</div>
                <div className="text-sm font-semibold text-navy-900">{opportunity.city}</div>
              </div>
            )}
            {opportunity.value && (
              <div className="p-3 rounded-xl bg-emerald-50">
                <div className="text-[11px] text-emerald-600 mb-0.5">القيمة</div>
                <div className="text-sm font-bold text-emerald-700">{formatCurrency(opportunity.value)}</div>
              </div>
            )}
            {opportunity.deadline && (
              <div className="p-3 rounded-xl bg-navy-50">
                <div className="text-[11px] text-navy-500 mb-0.5">الموعد النهائي</div>
                <div className="text-sm font-semibold text-navy-900">{formatDate(opportunity.deadline)}</div>
                {days !== null && (
                  <div className={classNames(
                    'text-[10px] mt-0.5 font-medium',
                    days < 0 ? 'text-red-600' : days < 7 ? 'text-amber-600' : 'text-navy-500'
                  )}>
                    {days < 0 ? `متأخرة ${Math.abs(days)} يوم` : `باقي ${days} يوم`}
                  </div>
                )}
              </div>
            )}
          </div>

          {opportunity.description && (
            <div>
              <h3 className="font-semibold text-navy-900 text-sm mb-1">الوصف</h3>
              <p className="text-sm text-navy-600 leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
            </div>
          )}

          {opportunity.external_url && (
            <a
              href={opportunity.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-araak-600 hover:text-araak-700 font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              فتح في المنصة المصدر
            </a>
          )}

          {/* الإسناد */}
          {hasPermission('assign_tasks') && (
            <div className="pt-4 border-t border-navy-100">
              <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-araak-500" />
                إسناد الفريق
              </h3>

              {assignments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {assignments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-l from-araak-50 to-navy-50 border border-araak-100">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-xs flex items-center justify-center font-bold">
                          {a.team_member?.full_name.split(' ')[1]?.[0] ?? '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-navy-900">{a.team_member?.full_name}</div>
                          <div className="text-xs text-navy-500">{a.role_in_project}</div>
                        </div>
                      </div>
                      {(isAdmin || a.assigned_by === null) && (
                        <button
                          onClick={async () => {
                            await supabase.from('opportunity_assignments').delete().eq('id', a.id);
                            setAssignments((prev) => prev.filter((x) => x.id !== a.id));
                          }}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          إزالة
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {teamMembers.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="glass-input px-3 py-2 rounded-lg text-sm text-navy-900"
                  >
                    <option value="">اختر عضو الفريق...</option>
                    {teamMembers.filter((m) => !assignments.find((a) => a.team_member_id === m.id)).map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                  <input
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    placeholder="الدور (مثال: دراسة فنية)"
                    className="glass-input px-3 py-2 rounded-lg text-sm text-navy-900"
                  />
                </div>
              )}
              {selectedMember && selectedRole && (
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-araak-500 text-white text-sm font-semibold hover:bg-araak-600 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {assigning ? 'جارٍ الإسناد...' : 'إسناد'}
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => onNavigate('tenders')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-araak-200 text-araak-700 font-semibold hover:bg-araak-50"
          >
            <ArrowLeft className="w-4 h-4" />
            تحويل إلى مناقصة مفصّلة
          </button>
        </div>
      </div>
    </div>
  );
}

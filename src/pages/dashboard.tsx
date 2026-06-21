import { useEffect, useState } from 'react';
import {
  Target, Award, DollarSign, Timer, Activity, ChevronLeft, Plus,
  Briefcase, Users, FileText, CheckCircle2, XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, KpiCard, ProgressRing, ProgressBar } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import {
  OPPORTUNITY_STATUS_CONFIG, formatCurrency,
  formatNumber, formatDate, daysUntil,
} from '@/lib/constants';
import type { Opportunity, Tender, Task, TeamMember } from '@/lib/types';

type PageKey = 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team' | 'documents' | 'accountability' | 'lessons' | 'reports' | 'ai-advisor' | 'settings';

interface Props {
  onNavigate: (p: PageKey) => void;
}

interface DashboardStats {
  totalOpportunities: number;
  newOpportunities: number;
  activeTenders: number;
  wonTenders: number;
  lostTenders: number;
  totalValue: number;
  wonValue: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  teamMembers: number;
  overdueTasks: number;
  winRate: number;
}

export function DashboardPage({ onNavigate }: Props) {
  const { member, isAdmin } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member) return;
    (async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const [opps, tendersData, tasksData, teamData] = await Promise.all([
            supabase.from('opportunities').select('*').order('created_at', { ascending: false }).limit(10),
            supabase.from('tenders').select('*').order('created_at', { ascending: false }),
            supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(20),
            supabase.from('team_members').select('*').eq('is_active', true),
          ]);
          if (opps.data) setOpportunities(opps.data as Opportunity[]);
          if (tendersData.data) setTenders(tendersData.data as Tender[]);
          if (tasksData.data) setTasks(tasksData.data as Task[]);
          if (teamData.data) setTeamMembers(teamData.data as TeamMember[]);
        } else {
          const [myTasksRes, myOpps] = await Promise.all([
            supabase.from('tasks').select('*').eq('assigned_to', member!.id).order('created_at', { ascending: false }),
            supabase
              .from('opportunity_assignments')
              .select('opportunity:opportunities(*)')
              .eq('team_member_id', member!.id),
          ]);
          if (myTasksRes.data) setTasks(myTasksRes.data as Task[]);
          if (myOpps.data) {
            const opps = myOpps.data
              .map((o: { opportunity: Opportunity | Opportunity[] }) => Array.isArray(o.opportunity) ? o.opportunity[0] : o.opportunity)
              .filter((o): o is Opportunity => o != null) as Opportunity[];
            setOpportunities(opps);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [member, isAdmin]);

  const stats: DashboardStats = {
    totalOpportunities: opportunities.length,
    newOpportunities: opportunities.filter((o) => o.status === 'new').length,
    activeTenders: tenders.filter((t) => t.status === 'in_progress' || t.status === 'draft').length,
    wonTenders: tenders.filter((t) => t.status === 'won').length,
    lostTenders: tenders.filter((t) => t.status === 'lost').length,
    totalValue: opportunities.reduce((sum, o) => sum + (o.value ?? 0), 0),
    wonValue: tenders.filter((t) => t.status === 'won').reduce((sum, t) => sum + (t.value ?? 0), 0),
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length,
    completedTasks: tasks.filter((t) => t.status === 'done').length,
    teamMembers: teamMembers.length,
    overdueTasks: tasks.filter((t) => t.due_date !== null && daysUntil(t.due_date) !== null && daysUntil(t.due_date)! < 0 && t.status !== 'done').length,
    winRate: tenders.length > 0
      ? Math.round((tenders.filter((t) => t.status === 'won').length / tenders.length) * 100)
      : 0,
  };

  const recentOpportunities = [...opportunities].slice(0, 5);
  const urgentTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (daysUntil(a.due_date) ?? 999) - (daysUntil(b.due_date) ?? 999))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-araak-100 border-t-araak-500 rounded-full animate-spin" />
        <p className="mt-3 text-sm text-navy-500">جارٍ تحميل اللوحة التنفيذية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ترحيب */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">
            مرحباً، {member?.full_name}
          </h1>
          <p className="text-navy-500 mt-1">
            {isAdmin
              ? 'عرض شامل لكافة الفرص والمناقصات والمهام والإحصائيات التنفيذية'
              : 'عرض المهام والفرص المُسنَدة إليك'}
          </p>
        </div>
        <button
          onClick={() => onNavigate('opportunities')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          فرصة جديدة
        </button>
      </div>

      {/* مؤشرات الأداء */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="إجمالي الفرص"
          value={stats.totalOpportunities}
          icon={Target}
          trend={`${stats.newOpportunities} جديدة`}
          trendUp
          color="araak"
        />
        <KpiCard
          label="مناقصات نشطة"
          value={stats.activeTenders}
          icon={Briefcase}
          trend={`${stats.wonTenders} مكتسبة`}
          trendUp
          color="gold"
        />
        <KpiCard
          label="قيمة الفرص"
          value={formatNumber(stats.totalValue)}
          suffix="ر.س"
          icon={DollarSign}
          color="navy"
        />
        <KpiCard
          label="المهام المعلّقة"
          value={stats.pendingTasks}
          icon={Timer}
          trend={stats.overdueTasks > 0 ? `${stats.overdueTasks} متأخرة` : 'ضمن الجدول'}
          trendUp={stats.overdueTasks === 0}
          color={stats.overdueTasks > 0 ? 'sand' : 'araak'}
        />
      </div>

      {/* صف المؤشرات التفصيلية */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* نسبة الفوز */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900">معدل الفوز</h3>
              <p className="text-xs text-navy-500">من إجمالي المناقصات المنتهية</p>
            </div>
            <Award className="w-5 h-5 text-gold-500" />
          </div>
          <div className="flex justify-center my-4">
            <ProgressRing
              value={stats.winRate}
              size={130}
              label="نسبة الفوز"
              color={stats.winRate >= 50 ? '#16a34a' : '#0e8494'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center mt-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <div className="text-xl font-bold text-emerald-700">{stats.wonTenders}</div>
              <div className="text-[11px] text-emerald-600 font-medium">فائزة</div>
            </div>
            <div className="p-2 rounded-xl bg-red-50">
              <div className="text-xl font-bold text-red-700">{stats.lostTenders}</div>
              <div className="text-[11px] text-red-600 font-medium">خاسرة</div>
            </div>
          </div>
        </GlassCard>

        {/* توزيع حالات الفرص */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900">توزيع الفرص</h3>
              <p className="text-xs text-navy-500">حسب الحالة الحالية</p>
            </div>
            <Activity className="w-5 h-5 text-araak-500" />
          </div>
          <div className="space-y-3 mt-4">
            {(['new', 'under_review', 'qualified', 'in_progress', 'won'] as const).map((status) => {
              const count = opportunities.filter((o) => o.status === status).length;
              const cfg = OPPORTUNITY_STATUS_CONFIG[status];
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-xs font-bold text-navy-700">{count}</span>
                  </div>
                  <ProgressBar
                    value={count}
                    max={Math.max(stats.totalOpportunities, 1)}
                    color={status === 'won' ? 'emerald' : status === 'in_progress' ? 'navy' : 'araak'}
                    height={6}
                  />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* الإنجاز */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900">إنجاز المهام</h3>
              <p className="text-xs text-navy-500">المهام المكتملة من الإجمالي</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex justify-center my-4">
            <ProgressRing
              value={stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
              size={130}
              label="مكتمل"
              color="#16a34a"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center mt-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <div className="text-xl font-bold text-emerald-700">{stats.completedTasks}</div>
              <div className="text-[11px] text-emerald-600 font-medium">مكتملة</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50">
              <div className="text-xl font-bold text-amber-700">{stats.pendingTasks}</div>
              <div className="text-[11px] text-amber-600 font-medium">قيد العمل</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* أحدث الفرص + المهام العاجلة */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* أحدث الفرص */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900">أحدث الفرص</h3>
            <button
              onClick={() => onNavigate('opportunities')}
              className="flex items-center gap-1 text-xs text-araak-600 hover:text-araak-700 font-medium"
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {recentOpportunities.length === 0 ? (
              <div className="py-8 text-center text-navy-400 text-sm">
                <Target className="w-8 h-8 mx-auto mb-2 text-navy-200" />
                لا توجد فرص بعد
              </div>
            ) : (
              recentOpportunities.map((opp) => {
                const cfg = OPPORTUNITY_STATUS_CONFIG[opp.status];
                const days = daysUntil(opp.deadline);
                return (
                  <button
                    key={opp.id}
                    onClick={() => onNavigate('opportunities')}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-navy-100 hover:border-araak-200 hover:bg-araak-50/50 transition-all text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="status-dot bg-blue-400" />
                        <p className="text-sm font-semibold text-navy-900 truncate">{opp.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-navy-500">
                        {opp.client && <span>{opp.client}</span>}
                        {opp.value && <span>{formatCurrency(opp.value)}</span>}
                        {opp.deadline && (
                          <span className={days !== null && days < 7 ? 'text-red-600 font-medium' : ''}>
                            {days !== null && days >= 0 ? `باقي ${days} يوم` : days !== null && days < 0 ? `متأخرة ${Math.abs(days)} يوم` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
                      {cfg.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* المهام العاجلة */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900">{isAdmin ? 'المهام الأكثر إلحاحاً' : 'مهامي العاجلة'}</h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="flex items-center gap-1 text-xs text-araak-600 hover:text-araak-700 font-medium"
            >
              عرض الكل
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {urgentTasks.length === 0 ? (
              <div className="py-8 text-center text-navy-400 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-navy-200" />
                لا توجد مهام عاجلة
              </div>
            ) : (
              urgentTasks.map((task) => {
                const days = daysUntil(task.due_date);
                const overdue = days !== null && days < 0;
                return (
                  <button
                    key={task.id}
                    onClick={() => onNavigate('tasks')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-navy-100 hover:border-araak-200 hover:bg-araak-50/50 transition-all text-right"
                  >
                    {overdue ? <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" /> : <Timer className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-navy-500 mt-0.5">
                        {task.due_date && (
                          <span className={overdue ? 'text-red-600 font-medium' : ''}>
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      task.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority === 'critical' ? 'حرجة' : task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>

      {/* اختصارات سريعة */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إضافة فرصة', icon: Target, page: 'opportunities' as const, color: 'from-araak-500 to-araak-700' },
            { label: 'إدارة المهام', icon: Timer, page: 'tasks' as const, color: 'from-navy-500 to-navy-700' },
            { label: 'التقارير', icon: FileText, page: 'reports' as const, color: 'from-gold-500 to-gold-700' },
            { label: 'الفريق', icon: Users, page: 'team' as const, color: 'from-sand-500 to-sand-700' },
          ].map((shortcut, i) => (
            <button
              key={i}
              onClick={() => onNavigate(shortcut.page)}
              className="group glass-card rounded-2xl p-5 hover:shadow-glass-lg transition-all hover:-translate-y-0.5"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${shortcut.color} flex items-center justify-center shadow-glow mb-3 group-hover:scale-110 transition-transform`}>
                <shortcut.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-navy-900">{shortcut.label}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

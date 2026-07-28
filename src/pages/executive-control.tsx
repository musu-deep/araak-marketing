import { AlertTriangle, CheckCircle2, Clock3, ListChecks, ShieldCheck, UserRoundX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { GlassCard, KpiCard, LoadingState, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, classNames, initials } from '@/lib/constants';
import type { Task, TeamMember } from '@/lib/types';

interface ScheduledTask extends Task {
  due_at: string | null;
  progress_percent: number;
  expected_output: string | null;
}

const dueOf = (task: ScheduledTask) => task.due_at ?? task.due_date;
const overdue = (task: ScheduledTask) => Boolean(dueOf(task) && task.status !== 'done' && new Date(dueOf(task)!) < new Date());
const shortDate = (value: string | null) => value ? new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'غير محدد';

export function ExecutiveControlPage() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [taskResult, memberResult] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('team_members').select('*').eq('is_active', true).order('full_name'),
      ]);
      setError(taskResult.error?.message ?? null);
      setTasks((taskResult.data ?? []) as ScheduledTask[]);
      setMembers((memberResult.data ?? []) as TeamMember[]);
      setLoading(false);
    };
    void load();
  }, []);

  const summary = useMemo(() => {
    const open = tasks.filter((task) => task.status !== 'done');
    const completed = tasks.filter((task) => task.status === 'done');
    return {
      open,
      completed,
      overdue: open.filter(overdue),
      blocked: open.filter((task) => task.status === 'blocked'),
      unassigned: open.filter((task) => !task.assigned_to),
      completion: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const owners = useMemo(() => members.map((member) => {
    const owned = tasks.filter((task) => task.assigned_to === member.id);
    const open = owned.filter((task) => task.status !== 'done');
    return {
      member,
      total: owned.length,
      open: open.length,
      overdue: open.filter(overdue).length,
      done: owned.filter((task) => task.status === 'done').length,
      progress: owned.length ? Math.round(owned.reduce((sum, task) => sum + (task.progress_percent ?? 0), 0) / owned.length) : 0,
    };
  }).filter((row) => row.total).sort((a, b) => b.overdue - a.overdue || b.open - a.open), [members, tasks]);

  const watchlist = useMemo(() => tasks
    .filter((task) => overdue(task) || task.status === 'blocked' || task.priority === 'critical')
    .sort((a, b) => Number(overdue(b)) - Number(overdue(a)))
    .slice(0, 10), [tasks]);

  if (loading) return <LoadingState label="جارٍ إعداد لوحة الرقابة التنفيذية..." />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader title="المتابعة والرقابة" subtitle="لوحة الإدارة العليا لمراقبة المسؤوليات والتعثر والتأخير ومستوى الإنجاز" icon={ShieldCheck} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="المهام المفتوحة" value={summary.open.length} icon={ListChecks} color="navy" />
        <KpiCard label="المهام المتأخرة" value={summary.overdue.length} icon={Clock3} color="gold" />
        <KpiCard label="المهام المحظورة" value={summary.blocked.length} icon={AlertTriangle} color="sand" />
        <KpiCard label="غير المسندة" value={summary.unassigned.length} icon={UserRoundX} color="araak" />
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        <GlassCard className="p-5">
          <div className="flex justify-between items-center"><div><h3 className="font-bold text-navy-900">مؤشر الإنجاز العام</h3><p className="text-xs text-navy-500">المكتمل من إجمالي المسؤوليات</p></div><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
          <div className="text-4xl font-black text-navy-900 my-5">{summary.completion}%</div>
          <ProgressBar value={summary.completion} color="emerald" label="الإنجاز الكلي" />
          <div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-xl bg-navy-50 p-3 text-center"><b className="text-xl">{summary.completed.length}</b><div className="text-[11px]">مكتملة</div></div><div className="rounded-xl bg-araak-50 p-3 text-center"><b className="text-xl">{tasks.length}</b><div className="text-[11px]">الإجمالي</div></div></div>
        </GlassCard>

        <GlassCard className="overflow-hidden xl:col-span-2">
          <div className="px-5 py-4 border-b border-navy-100"><h3 className="font-bold text-navy-900">مصفوفة الالتزام حسب المسؤول</h3><p className="text-xs text-navy-500">الأكثر تأخراً يظهر أولاً</p></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-navy-50 text-xs text-navy-500"><tr><th className="text-right px-4 py-3">المسؤول</th><th className="px-3">مفتوحة</th><th className="px-3">متأخرة</th><th className="px-3">مكتملة</th><th className="text-right px-4 min-w-40">متوسط الإنجاز</th></tr></thead><tbody className="divide-y divide-navy-100">
            {owners.map((row) => <tr key={row.member.id}><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-araak-600 text-white flex items-center justify-center text-xs">{initials(row.member.full_name)}</span><div><b className="text-navy-900">{row.member.full_name}</b><div className="text-[10px] text-navy-400">{row.member.title}</div></div></div></td><td className="text-center">{row.open}</td><td className="text-center"><span className={classNames('rounded-full px-2 py-1 text-xs font-bold', row.overdue ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700')}>{row.overdue}</span></td><td className="text-center text-emerald-700 font-bold">{row.done}</td><td className="px-4"><ProgressBar value={row.progress} /></td></tr>)}
            {!owners.length && <tr><td colSpan={5} className="py-10 text-center text-navy-400">لا توجد مهام مسندة.</td></tr>}
          </tbody></table></div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-navy-100 flex justify-between"><div><h3 className="font-bold text-navy-900">قائمة التدخل التنفيذي</h3><p className="text-xs text-navy-500">المتأخرة أو المحظورة أو الحرجة</p></div><span className="bg-red-50 text-red-700 rounded-full px-3 py-1 text-xs font-bold h-fit">{watchlist.length}</span></div>
        <div className="divide-y divide-navy-100">{watchlist.map((task) => {
          const owner = members.find((member) => member.id === task.assigned_to);
          const status = TASK_STATUS_CONFIG[task.status];
          const priority = TASK_PRIORITY_CONFIG[task.priority];
          return <div key={task.id} className="p-4 grid lg:grid-cols-12 gap-3 items-center"><div className="lg:col-span-5"><div className="flex gap-2"><span className={classNames('w-2.5 h-2.5 rounded-full mt-1.5', status.dot)} /><div><b className="text-navy-900">{task.title}</b>{task.expected_output && <div className="text-xs text-navy-500">المخرج: {task.expected_output}</div>}</div></div></div><div className="lg:col-span-2 text-xs">{owner?.full_name ?? 'غير مسندة'}</div><div className="lg:col-span-2 text-xs">{shortDate(dueOf(task))}</div><div className="lg:col-span-1"><span className={classNames('text-[10px] px-2 py-1 rounded', priority.bg, priority.color)}>{priority.label}</span></div><div className="lg:col-span-2"><ProgressBar value={task.progress_percent ?? 0} /></div></div>;
        })}{!watchlist.length && <div className="py-12 text-center text-emerald-700">لا توجد حالات حرجة حالياً.</div>}</div>
      </GlassCard>
    </div>
  );
}

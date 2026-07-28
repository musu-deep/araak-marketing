import { Calendar, CalendarDays, Clock3, LayoutGrid, ListTodo, Plus, Target, UserCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { EmptyState, GlassCard, LoadingState, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, classNames, initials } from '@/lib/constants';
import type { Task, TaskPriority, TaskStatus, TeamMember } from '@/lib/types';

interface ScheduledTask extends Task {
  start_at: string | null;
  due_at: string | null;
  estimated_hours: number | null;
  progress_percent: number;
  expected_output: string | null;
}

type ViewMode = 'board' | 'schedule';
type FilterMode = 'all' | 'mine' | 'overdue' | 'week';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'للبدء' },
  { key: 'in_progress', label: 'قيد التنفيذ' },
  { key: 'review', label: 'للمراجعة' },
  { key: 'done', label: 'مكتملة' },
  { key: 'blocked', label: 'محظورة' },
];

const dueOf = (task: ScheduledTask) => task.due_at ?? task.due_date;
const isOverdue = (task: ScheduledTask) => Boolean(dueOf(task) && task.status !== 'done' && new Date(dueOf(task)!) < new Date());

function dateTime(value: string | null): string {
  if (!value) return 'غير محدد';
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

export function TaskManagementPage() {
  const { member, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<ViewMode>('board');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [error, setError] = useState<string | null>(null);
  const canAssign = hasPermission('assign_tasks');

  const load = async () => {
    setLoading(true);
    const [taskResult, memberResult] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('*').eq('is_active', true).order('full_name'),
    ]);
    setError(taskResult.error?.message ?? null);
    setTasks((taskResult.data ?? []) as ScheduledTask[]);
    setMembers((memberResult.data ?? []) as TeamMember[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const visibleTasks = useMemo(() => {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    return tasks.filter((task) => {
      const due = dueOf(task) ? new Date(dueOf(task)!) : null;
      if (filter === 'mine') return task.assigned_to === member?.id;
      if (filter === 'overdue') return isOverdue(task);
      if (filter === 'week') return Boolean(due && due >= now && due <= week);
      return true;
    });
  }, [filter, member?.id, tasks]);

  const updateTask = async (task: ScheduledTask, status: TaskStatus, progress: number) => {
    const changes = {
      status,
      progress_percent: progress,
      completed_at: progress === 100 ? new Date().toISOString() : null,
    };
    const { error: updateError } = await supabase.from('tasks').update(changes).eq('id', task.id);
    if (updateError) return setError(updateError.message);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...changes } : item));
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="إدارة المهام والتزمين"
        subtitle="مسؤول واضح، وقت بدء وانتهاء، مخرج متوقع، وساعات ونسبة إنجاز لكل مهمة"
        icon={ListTodo}
        action={canAssign && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold">
            <Plus className="w-4 h-4" /> مهمة مجدولة
          </button>
        )}
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <GlassCard className="p-3">
        <div className="flex flex-col lg:flex-row justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'كل المهام'], ['mine', 'مسؤولياتي'], ['overdue', 'المتأخرة'], ['week', 'هذا الأسبوع'],
            ] as [FilterMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)} className={classNames('px-3 py-2 rounded-lg text-xs font-semibold', filter === key ? 'bg-araak-600 text-white' : 'bg-navy-50 text-navy-600')}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl bg-navy-50 p-1">
            <button onClick={() => setView('board')} className={classNames('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold', view === 'board' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              <LayoutGrid className="w-4 h-4" /> لوحة
            </button>
            <button onClick={() => setView('schedule')} className={classNames('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold', view === 'schedule' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              <CalendarDays className="w-4 h-4" /> الجدول الزمني
            </button>
          </div>
        </div>
      </GlassCard>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLUMNS.map((column) => {
            const columnTasks = visibleTasks.filter((task) => task.status === column.key);
            const config = TASK_STATUS_CONFIG[column.key];
            return (
              <div key={column.key} className="space-y-2">
                <div className={classNames('flex justify-between px-3 py-2 rounded-xl border', config.bg, config.border)}>
                  <span className={classNames('text-xs font-bold', config.color)}>{column.label}</span>
                  <span className={classNames('text-xs font-bold', config.color)}>{columnTasks.length}</span>
                </div>
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} members={members} canManage={canAssign || task.assigned_to === member?.id} onUpdate={updateTask} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="divide-y divide-navy-100">
            {[...visibleTasks].sort((a, b) => new Date(a.start_at ?? dueOf(a) ?? '9999').getTime() - new Date(b.start_at ?? dueOf(b) ?? '9999').getTime()).map((task) => {
              const owner = members.find((item) => item.id === task.assigned_to);
              return (
                <div key={task.id} className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-4">
                    <div className="font-bold text-navy-900">{task.title}</div>
                    {task.expected_output && <div className="text-xs text-navy-500 mt-1">المخرج: {task.expected_output}</div>}
                  </div>
                  <div className="lg:col-span-3 text-xs space-y-1">
                    <div className="flex gap-2"><Clock3 className="w-3.5 h-3.5" /> {dateTime(task.start_at)}</div>
                    <div className={classNames('flex gap-2', isOverdue(task) && 'text-red-700 font-bold')}><Calendar className="w-3.5 h-3.5" /> {dateTime(dueOf(task))}</div>
                  </div>
                  <div className="lg:col-span-2 text-xs font-semibold text-navy-700">{owner?.full_name ?? 'غير مسندة'}</div>
                  <div className="lg:col-span-3"><ProgressBar value={task.progress_percent ?? 0} label="الإنجاز" /></div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {visibleTasks.length === 0 && <GlassCard><EmptyState icon={ListTodo} title="لا توجد مهام" description="أنشئ مهمة وحدد المسؤول والوقت والمخرج المطلوب." /></GlassCard>}

      {showForm && member && <TaskForm members={members} currentMemberId={member.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
    </div>
  );
}

function TaskCard({ task, members, canManage, onUpdate }: {
  task: ScheduledTask;
  members: TeamMember[];
  canManage: boolean;
  onUpdate: (task: ScheduledTask, status: TaskStatus, progress: number) => Promise<void>;
}) {
  const owner = members.find((item) => item.id === task.assigned_to);
  const priority = TASK_PRIORITY_CONFIG[task.priority];
  return (
    <GlassCard hover className="p-3">
      <div className="flex justify-between gap-2">
        <h4 className="text-sm font-semibold text-navy-900">{task.title}</h4>
        <span className={classNames('text-[10px] px-1.5 py-0.5 rounded h-fit', priority.bg, priority.color)}>{priority.label}</span>
      </div>
      {task.expected_output && <div className="mt-2 rounded-lg bg-araak-50 p-2 text-[11px] text-araak-800"><Target className="inline w-3 h-3 ml-1" />{task.expected_output}</div>}
      <div className="mt-2 space-y-1 text-[11px] text-navy-500">
        <div className={classNames('flex gap-1.5', isOverdue(task) && 'text-red-700 font-bold')}><Calendar className="w-3 h-3" />{dateTime(dueOf(task))}</div>
        {task.estimated_hours !== null && <div className="flex gap-1.5"><Clock3 className="w-3 h-3" />{task.estimated_hours} ساعة</div>}
        <div className="flex gap-1.5 items-center">
          {owner ? <><span className="w-5 h-5 rounded-full bg-araak-600 text-white flex items-center justify-center text-[9px]">{initials(owner.full_name)}</span>{owner.full_name}</> : <><UserCheck className="w-3 h-3" />غير مسندة</>}
        </div>
      </div>
      <div className="mt-3"><ProgressBar value={task.progress_percent ?? 0} label="الإنجاز" /></div>
      {canManage && (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {([25, 50, 75, 100] as number[]).map((value) => (
            <button key={value} onClick={() => void onUpdate(task, value === 100 ? 'done' : 'in_progress', value)} className="text-[9px] py-1 rounded bg-navy-50 text-navy-600">{value}%</button>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function TaskForm({ members, currentMemberId, onClose, onSaved }: {
  members: TeamMember[];
  currentMemberId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ title: '', description: '', expected_output: '', assigned_to: '', priority: 'medium' as TaskPriority, start_at: '', due_at: '', estimated_hours: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.assigned_to || !form.start_at || !form.due_at) return setError('حدد المسؤول ووقت البدء والانتهاء.');
    if (new Date(form.due_at) <= new Date(form.start_at)) return setError('وقت الانتهاء يجب أن يكون بعد وقت البدء.');
    setSaving(true);
    const { error: saveError } = await supabase.from('tasks').insert({
      title: form.title, description: form.description || null, expected_output: form.expected_output,
      assigned_to: form.assigned_to, assigned_by: currentMemberId, priority: form.priority,
      start_at: new Date(form.start_at).toISOString(), due_at: new Date(form.due_at).toISOString(),
      due_date: form.due_at.slice(0, 10), estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      progress_percent: 0, status: 'todo', tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    });
    setSaving(false);
    if (saveError) return setError(saveError.message);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-4 flex justify-between border-b border-navy-100"><div><h2 className="text-xl font-bold text-navy-900">مهمة مجدولة</h2><p className="text-xs text-navy-500">حدد المسؤول والمخرج ونافذة التنفيذ.</p></div><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
          <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl" placeholder="عنوان المهمة" />
          <div className="grid md:grid-cols-2 gap-4">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" rows={3} placeholder="وصف التنفيذ" />
            <textarea required value={form.expected_output} onChange={(event) => setForm({ ...form, expected_output: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" rows={3} placeholder="المخرج المتوقع" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <select required value={form.assigned_to} onChange={(event) => setForm({ ...form, assigned_to: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl"><option value="">المسؤول</option>{members.map((item) => <option key={item.id} value={item.id}>{item.full_name} — {ROLE_LABELS[item.role_key]}</option>)}</select>
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })} className="glass-input px-4 py-2.5 rounded-xl"><option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="critical">حرجة</option></select>
            <input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={(event) => setForm({ ...form, estimated_hours: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" placeholder="الساعات التقديرية" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input required type="datetime-local" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" />
            <input required type="datetime-local" value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" />
          </div>
          <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl" placeholder="وسوم مفصولة بفاصلة" />
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200">إلغاء</button><button disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-araak-700 text-white font-semibold">{saving ? 'جارٍ الحفظ...' : 'إسناد وجدولة'}</button></div>
        </form>
      </div>
    </div>
  );
}

import { ListTodo, Plus, X, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, EmptyState, LoadingState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import {
  TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, formatShortDate,
  daysUntil, classNames, initials, ROLE_LABELS,
} from '@/lib/constants';
import type { Task, TeamMember, TaskStatus, TaskPriority } from '@/lib/types';
import { useState, useEffect } from 'react';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'للبدء' },
  { key: 'in_progress', label: 'قيد التنفيذ' },
  { key: 'review', label: 'للمراجعة' },
  { key: 'done', label: 'مكتملة' },
  { key: 'blocked', label: 'محظورة' },
];

export function TaskManagementPage() {
  const { member, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const canAssign = hasPermission('assign_tasks');

  useEffect(() => {
    loadTasks();
    if (canAssign) {
      supabase.from('team_members').select('*').eq('is_active', true).then(({ data }) => {
        if (data) setTeamMembers(data as TeamMember[]);
      });
    }
  }, [canAssign]);

  const loadTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'done') updates.completed_at = new Date().toISOString();
    await supabase.from('tasks').update(updates).eq('id', taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="إدارة المهام"
        subtitle={canAssign ? 'إدارة وإسناد المهام لأعضاء الفريق' : 'متابعة المهام المُسنَدة إليك'}
        icon={ListTodo}
        action={canAssign && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all">
            <Plus className="w-4 h-4" /> مهمة جديدة
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          const cfg = TASK_STATUS_CONFIG[col.key];
          return (
            <div key={col.key} className="flex flex-col gap-2">
              <div className={classNames('flex items-center justify-between px-3 py-2 rounded-xl border', cfg.bg, cfg.border)}>
                <div className="flex items-center gap-2">
                  <span className={classNames('w-2.5 h-2.5 rounded-full', cfg.dot)} />
                  <span className={classNames('text-xs font-bold', cfg.color)}>{col.label}</span>
                </div>
                <span className={classNames('text-xs font-bold px-2 rounded-full bg-white/70', cfg.color)}>{colTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-32">
                {colTasks.length === 0 ? (
                  <div className="text-center py-6 text-navy-300 text-xs">فارغ</div>
                ) : (
                  colTasks.map((task) => {
                    const priorityCfg = TASK_PRIORITY_CONFIG[task.priority];
                    const days = daysUntil(task.due_date);
                    const overdue = days !== null && days < 0 && task.status !== 'done';
                    const mem = teamMembers.find((m) => m.id === task.assigned_to);
                    return (
                      <GlassCard key={task.id} hover className="p-3 cursor-pointer group">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-navy-900 leading-snug">{task.title}</h4>
                          <span className={classNames('text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0', priorityCfg.bg, priorityCfg.color)}>{priorityCfg.label}</span>
                        </div>
                        {task.description && <p className="text-xs text-navy-500 line-clamp-2 mb-2">{task.description}</p>}
                        <div className="space-y-1.5">
                          {task.due_date && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <Calendar className="w-3 h-3 text-navy-400" />
                              <span className={overdue ? 'text-red-600 font-bold' : 'text-navy-500'}>{formatShortDate(task.due_date)}{overdue ? ` (${days} يوم)` : ''}</span>
                            </div>
                          )}
                          {mem && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-[10px] flex items-center justify-center font-bold">{initials(mem.full_name)}</div>
                              <span className="text-[11px] text-navy-600">{mem.full_name}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 pt-2 border-t border-navy-50 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                            <button key={c.key} onClick={() => moveTask(task.id, c.key)} className="text-[10px] px-2 py-1 rounded bg-navy-50 text-navy-600 hover:bg-araak-50 hover:text-araak-700 transition-colors" title={`نقل إلى ${c.label}`}>{c.label}</button>
                          ))}
                        </div>
                      </GlassCard>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <GlassCard>
          <EmptyState icon={ListTodo} title="لا توجد مهام" description={canAssign ? 'ابدأ بإسناد مهام لأعضاء الفريق حسب التخصص.' : 'لا توجد مهام مُسنَدة إليك حالياً.'} action={canAssign && (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all">
              <Plus className="w-4 h-4" /> إنشاء مهمة
            </button>
          )} />
        </GlassCard>
      )}

      {showForm && member && (
        <TaskForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadTasks(); }} teamMembers={teamMembers} currentMemberId={member.id} />
      )}
    </div>
  );
}

function TaskForm({ onClose, onSaved, teamMembers, currentMemberId }: { onClose: () => void; onSaved: () => void; teamMembers: TeamMember[]; currentMemberId: string }) {
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium' as TaskPriority, due_date: '', tags: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      assigned_by: currentMemberId,
      priority: form.priority,
      due_date: form.due_date || null,
      status: 'todo' as TaskStatus,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-navy-100">
          <h2 className="text-xl font-bold text-navy-900">مهمة جديدة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">عنوان المهمة *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="ما المهمة المطلوبة؟" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">الوصف</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">إسناد إلى</label>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900">
                <option value="">-- اختر العضو --</option>
                {teamMembers.map((m) => (<option key={m.id} value={m.id}>{m.full_name} — {ROLE_LABELS[m.role_key]}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">الأولوية</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900">
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">الموعد النهائي</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">الوسوم (مفصولة بفاصلة)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="تقنية، مالية" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60">{submitting ? 'جارٍ الحفظ...' : 'إسناد المهمة'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

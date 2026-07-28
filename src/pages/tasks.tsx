import {
  Calendar,
  Clock3,
  LayoutGrid,
  ListTodo,
  Plus,
  RefreshCw,
  Route,
  Target,
  UserCheck,
  X,
  ChartGantt,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { EmptyState, GlassCard, LoadingState, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, classNames, initials } from '@/lib/constants';
import type { TaskPriority, TaskStatus, TeamMember } from '@/lib/types';
import type {
  ScheduledWorkflowTask,
  WorkflowHandoff,
  WorkflowInstance,
  WorkflowSourceOpportunity,
  WorkflowSourceTender,
  WorkflowStageInstance,
  WorkflowTemplate,
} from '@/lib/workflow-types';
import { WorkflowTimeline } from '@/components/workflow/workflow-timeline';
import { WorkflowGantt } from '@/components/workflow/workflow-gantt';
import { WorkflowHandoffs } from '@/components/workflow/workflow-handoffs';
import { WorkflowBuilderModal } from '@/components/workflow/workflow-builder-modal';

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'للبدء' },
  { key: 'in_progress', label: 'قيد التنفيذ' },
  { key: 'review', label: 'للمراجعة' },
  { key: 'done', label: 'مكتملة' },
  { key: 'blocked', label: 'محظورة' },
];

type WorkspaceView = 'timeline' | 'gantt' | 'board';
type FilterMode = 'all' | 'mine' | 'overdue' | 'week';

const dueOf = (task: ScheduledWorkflowTask) => task.due_at ?? task.due_date;
const isOverdue = (task: ScheduledWorkflowTask) => Boolean(dueOf(task) && task.status !== 'done' && new Date(dueOf(task)!) < new Date());

function dateTime(value: string | null): string {
  if (!value) return 'غير محدد';
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

export function TaskManagementPage() {
  const { member, hasPermission } = useAuth();
  const [tasks, setTasks] = useState<ScheduledWorkflowTask[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([]);
  const [stages, setStages] = useState<WorkflowStageInstance[]>([]);
  const [handoffs, setHandoffs] = useState<WorkflowHandoff[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [tenders, setTenders] = useState<WorkflowSourceTender[]>([]);
  const [opportunities, setOpportunities] = useState<WorkflowSourceOpportunity[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [view, setView] = useState<WorkspaceView>('timeline');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [error, setError] = useState<string | null>(null);
  const canAssign = hasPermission('assign_tasks');

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const [
      taskResult,
      memberResult,
      workflowResult,
      stageResult,
      handoffResult,
      templateResult,
      tenderResult,
      opportunityResult,
    ] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('*').eq('is_active', true).order('full_name'),
      supabase.from('workflow_instances').select('*').order('submission_deadline', { ascending: true }),
      supabase.from('workflow_stage_instances').select('*').order('sort_order', { ascending: true }),
      supabase.from('workflow_handoffs').select('*').order('planned_handoff_at', { ascending: true }),
      supabase.from('workflow_templates').select('*').eq('is_active', true).order('name'),
      supabase.from('tenders').select('id,title,reference,submission_deadline').order('created_at', { ascending: false }).limit(100),
      supabase.from('opportunities').select('id,title,reference,deadline,publication_date').order('created_at', { ascending: false }).limit(100),
    ]);

    const firstError = [
      taskResult.error,
      memberResult.error,
      workflowResult.error,
      stageResult.error,
      handoffResult.error,
      templateResult.error,
      tenderResult.error,
      opportunityResult.error,
    ].find(Boolean);

    if (firstError) setError(firstError.message);
    setTasks((taskResult.data ?? []) as ScheduledWorkflowTask[]);
    setMembers((memberResult.data ?? []) as TeamMember[]);
    setWorkflows((workflowResult.data ?? []) as WorkflowInstance[]);
    setStages((stageResult.data ?? []) as WorkflowStageInstance[]);
    setHandoffs((handoffResult.data ?? []) as WorkflowHandoff[]);
    setTemplates((templateResult.data ?? []) as WorkflowTemplate[]);
    setTenders((tenderResult.data ?? []) as WorkflowSourceTender[]);
    setOpportunities((opportunityResult.data ?? []) as WorkflowSourceOpportunity[]);

    const availableWorkflows = (workflowResult.data ?? []) as WorkflowInstance[];
    setSelectedWorkflowId((current) => {
      if (current && availableWorkflows.some((item) => item.id === current)) return current;
      return availableWorkflows[0]?.id ?? '';
    });

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const activeWorkflow = workflows.find((item) => item.id === selectedWorkflowId) ?? null;
  const activeStages = useMemo(
    () => stages.filter((stage) => stage.workflow_id === selectedWorkflowId).sort((a, b) => a.sort_order - b.sort_order),
    [selectedWorkflowId, stages],
  );
  const activeHandoffs = useMemo(
    () => handoffs.filter((handoff) => handoff.workflow_id === selectedWorkflowId),
    [handoffs, selectedWorkflowId],
  );
  const activeWorkflowTasks = useMemo(
    () => tasks.filter((task) => task.workflow_id === selectedWorkflowId),
    [selectedWorkflowId, tasks],
  );

  const visibleTasks = useMemo(() => {
    const source = activeWorkflow ? activeWorkflowTasks : tasks;
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86_400_000);
    return source.filter((task) => {
      const due = dueOf(task) ? new Date(dueOf(task)!) : null;
      if (filter === 'mine') return task.assigned_to === member?.id;
      if (filter === 'overdue') return isOverdue(task);
      if (filter === 'week') return Boolean(due && due >= now && due <= week);
      return true;
    });
  }, [activeWorkflow, activeWorkflowTasks, filter, member?.id, tasks]);

  const updateTask = async (task: ScheduledWorkflowTask, status: TaskStatus, progress: number) => {
    const changes = {
      status,
      progress_percent: progress,
      completed_at: progress === 100 ? new Date().toISOString() : null,
    };
    const { error: updateError } = await supabase.from('tasks').update(changes).eq('id', task.id);
    if (updateError) return setError(updateError.message);
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, ...changes } : item));
    setStages((current) => current.map((stage) => stage.id === task.workflow_stage_id ? {
      ...stage,
      progress_percent: progress,
      status: progress === 100 ? 'completed' : status === 'review' ? 'review' : 'in_progress',
      actual_end: progress === 100 ? changes.completed_at : stage.actual_end,
    } : stage));
    window.setTimeout(() => void load(true), 500);
  };

  const updateStageProgress = async (stage: WorkflowStageInstance, progress: number) => {
    const linkedTask = tasks.find((task) => task.workflow_stage_id === stage.id);
    const status: TaskStatus = progress === 100 ? 'done' : stage.is_approval && progress >= 75 ? 'review' : 'in_progress';
    if (linkedTask) {
      await updateTask(linkedTask, status, progress);
      return;
    }

    const { error: updateError } = await supabase
      .from('workflow_stage_instances')
      .update({
        progress_percent: progress,
        status: progress === 100 ? 'completed' : status === 'review' ? 'review' : 'in_progress',
        actual_start: stage.actual_start ?? new Date().toISOString(),
        actual_end: progress === 100 ? new Date().toISOString() : null,
      })
      .eq('id', stage.id);
    if (updateError) return setError(updateError.message);
    await load(true);
  };

  const handleWorkflowCreated = async (workflowId: string) => {
    setShowWorkflowBuilder(false);
    setSelectedWorkflowId(workflowId);
    setView('timeline');
    await load(true);
    setSelectedWorkflowId(workflowId);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <SectionHeader
        title="إدارة المهام والهندلة الزمنية"
        subtitle="مسار واضح لانتقال ملف المنافسة من الاستلام والدراسة الفنية والتسعير والاعتماد حتى الرفع النهائي"
        icon={ListTodo}
        action={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-xs font-bold text-navy-600 hover:border-araak-300 hover:text-araak-700 disabled:opacity-50"
            >
              <RefreshCw className={classNames('h-4 w-4', refreshing && 'animate-spin')} /> تحديث
            </button>
            {canAssign && (
              <button onClick={() => setShowTaskForm(true)} className="inline-flex items-center gap-2 rounded-xl border border-araak-200 bg-araak-50 px-4 py-2.5 text-xs font-bold text-araak-800">
                <Plus className="h-4 w-4" /> مهمة إضافية
              </button>
            )}
            {canAssign && (
              <button onClick={() => setShowWorkflowBuilder(true)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-araak-500 to-navy-800 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-araak-100">
                <Sparkles className="h-4 w-4" /> هندلة مسار منافسة
              </button>
            )}
          </div>
        )}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error.includes('workflow_') && <span className="mr-2 font-bold">طبّق Migration محرك المسارات ثم حدّث الصفحة.</span>}
        </div>
      )}

      <GlassCard className="p-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-600"><Route className="h-4 w-4 text-araak-600" /> المنافسة النشطة</div>
            <select
              value={selectedWorkflowId}
              onChange={(event) => setSelectedWorkflowId(event.target.value)}
              className="glass-input min-w-0 flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-800 xl:max-w-2xl"
            >
              {workflows.length === 0 && <option value="">لا يوجد مسار بعد</option>}
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.reference ? `${workflow.reference} — ` : ''}{workflow.title} ({workflow.overall_progress}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl bg-navy-50 p-1">
            <ViewButton active={view === 'timeline'} onClick={() => setView('timeline')} icon={Workflow} label="المسار التنفيذي" />
            <ViewButton active={view === 'gantt'} onClick={() => setView('gantt')} icon={ChartGantt} label="مخطط Gantt" />
            <ViewButton active={view === 'board'} onClick={() => setView('board')} icon={LayoutGrid} label="لوحة المهام" />
          </div>
        </div>
      </GlassCard>

      {!activeWorkflow ? (
        <GlassCard className="overflow-hidden">
          <div className="relative grid min-h-[420px] place-items-center overflow-hidden bg-gradient-to-br from-white via-araak-50/40 to-navy-50 p-8 text-center">
            <div className="absolute h-72 w-72 rounded-full bg-araak-200/30 blur-3xl" />
            <div className="relative max-w-xl">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-araak-500 to-navy-800 text-white shadow-2xl shadow-araak-200"><Route className="h-9 w-9" /></div>
              <h2 className="mt-6 text-2xl font-extrabold text-navy-900">ابدأ بهندلة ملف المنافسة</h2>
              <p className="mt-3 text-sm leading-7 text-navy-500">اختر المنافسة وحدد تاريخ الاستلام والإغلاق؛ سيبني النظام تلقائيًا مراحل الدراسة الفنية وعروض الأسعار والمقارنات والاعتماد والرفع مع مسؤول ومدة ومخرج لكل مرحلة.</p>
              {canAssign && <button onClick={() => setShowWorkflowBuilder(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-araak-700 px-6 py-3 text-sm font-bold text-white shadow-lg"><Sparkles className="h-4 w-4" /> إنشاء أول مسار تنفيذي</button>}
            </div>
          </div>
        </GlassCard>
      ) : (
        <>
          {view === 'timeline' && (
            <>
              <WorkflowTimeline
                workflow={activeWorkflow}
                stages={activeStages}
                tasks={activeWorkflowTasks}
                members={members}
                canManage={canAssign}
                currentMemberId={member?.id}
                onProgress={updateStageProgress}
              />
              <WorkflowHandoffs stages={activeStages} handoffs={activeHandoffs} members={members} />
            </>
          )}

          {view === 'gantt' && (
            <>
              <WorkflowGantt workflow={activeWorkflow} stages={activeStages} members={members} />
              <WorkflowHandoffs stages={activeStages} handoffs={activeHandoffs} members={members} />
            </>
          )}

          {view === 'board' && (
            <TaskBoard
              tasks={visibleTasks}
              allWorkflowTasks={activeWorkflowTasks}
              members={members}
              memberId={member?.id}
              canAssign={canAssign}
              filter={filter}
              onFilter={setFilter}
              onUpdate={updateTask}
            />
          )}
        </>
      )}

      {showWorkflowBuilder && (
        <WorkflowBuilderModal
          templates={templates}
          tenders={tenders}
          opportunities={opportunities}
          onClose={() => setShowWorkflowBuilder(false)}
          onCreated={handleWorkflowCreated}
        />
      )}

      {showTaskForm && member && (
        <TaskForm
          members={members}
          currentMemberId={member.id}
          activeWorkflow={activeWorkflow}
          stages={activeStages}
          onClose={() => setShowTaskForm(false)}
          onSaved={() => { setShowTaskForm(false); void load(true); }}
        />
      )}
    </div>
  );
}

function ViewButton({ active, onClick, icon: Icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: typeof Workflow;
  label: string;
}) {
  return (
    <button onClick={onClick} className={classNames('flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition', active ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500 hover:text-navy-800')}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function TaskBoard({ tasks, allWorkflowTasks, members, memberId, canAssign, filter, onFilter, onUpdate }: {
  tasks: ScheduledWorkflowTask[];
  allWorkflowTasks: ScheduledWorkflowTask[];
  members: TeamMember[];
  memberId?: string;
  canAssign: boolean;
  filter: FilterMode;
  onFilter: (filter: FilterMode) => void;
  onUpdate: (task: ScheduledWorkflowTask, status: TaskStatus, progress: number) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <GlassCard className="p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'كل مراحل المسار'], ['mine', 'مسؤولياتي'], ['overdue', 'المتأخرة'], ['week', 'هذا الأسبوع'],
            ] as [FilterMode, string][]).map(([key, label]) => (
              <button key={key} onClick={() => onFilter(key)} className={classNames('rounded-lg px-3 py-2 text-xs font-bold', filter === key ? 'bg-araak-600 text-white' : 'bg-navy-50 text-navy-600')}>
                {label}
              </button>
            ))}
          </div>
          <div className="text-xs text-navy-500">{allWorkflowTasks.length} مهمة مرحلية مرتبطة بالمسار</div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.key);
          const config = TASK_STATUS_CONFIG[column.key];
          return (
            <div key={column.key} className="space-y-2">
              <div className={classNames('flex justify-between rounded-xl border px-3 py-2', config.bg, config.border)}>
                <span className={classNames('text-xs font-bold', config.color)}>{column.label}</span>
                <span className={classNames('text-xs font-bold', config.color)}>{columnTasks.length}</span>
              </div>
              {columnTasks.map((task) => (
                <TaskCard key={task.id} task={task} members={members} canManage={canAssign || task.assigned_to === memberId} onUpdate={onUpdate} />
              ))}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && <GlassCard><EmptyState icon={ListTodo} title="لا توجد مهام ضمن هذا المرشح" description="غيّر المرشح أو حدّث تقدم مراحل المسار." /></GlassCard>}
    </div>
  );
}

function TaskCard({ task, members, canManage, onUpdate }: {
  task: ScheduledWorkflowTask;
  members: TeamMember[];
  canManage: boolean;
  onUpdate: (task: ScheduledWorkflowTask, status: TaskStatus, progress: number) => Promise<void>;
}) {
  const owner = members.find((item) => item.id === task.assigned_to);
  const priority = TASK_PRIORITY_CONFIG[task.priority];
  return (
    <GlassCard hover className="p-3">
      <div className="flex justify-between gap-2">
        <h4 className="text-sm font-semibold text-navy-900">{task.title}</h4>
        <span className={classNames('h-fit rounded px-1.5 py-0.5 text-[10px]', priority.bg, priority.color)}>{priority.label}</span>
      </div>
      {task.task_type !== 'standalone' && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-araak-50 px-2 py-1 text-[9px] font-bold text-araak-700"><Route className="h-3 w-3" /> مرحلة ضمن مسار المنافسة</div>}
      {task.expected_output && <div className="mt-2 rounded-lg bg-araak-50 p-2 text-[11px] text-araak-800"><Target className="ml-1 inline h-3 w-3" />{task.expected_output}</div>}
      <div className="mt-2 space-y-1 text-[11px] text-navy-500">
        <div className={classNames('flex gap-1.5', isOverdue(task) && 'font-bold text-red-700')}><Calendar className="h-3 w-3" />{dateTime(dueOf(task))}</div>
        {task.estimated_hours !== null && <div className="flex gap-1.5"><Clock3 className="h-3 w-3" />{task.estimated_hours} ساعة</div>}
        <div className="flex items-center gap-1.5">
          {owner ? <><span className="flex h-5 w-5 items-center justify-center rounded-full bg-araak-600 text-[9px] text-white">{initials(owner.full_name)}</span>{owner.full_name}</> : <><UserCheck className="h-3 w-3" />غير مسندة</>}
        </div>
      </div>
      <div className="mt-3"><ProgressBar value={task.progress_percent ?? 0} label="الإنجاز" /></div>
      {canManage && task.status !== 'done' && (
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map((value) => (
            <button key={value} disabled={task.progress_percent >= value} onClick={() => void onUpdate(task, value === 100 ? 'done' : task.task_type === 'approval' && value >= 75 ? 'review' : 'in_progress', value)} className="rounded bg-navy-50 py-1 text-[9px] text-navy-600 disabled:opacity-35">{value}%</button>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

function TaskForm({ members, currentMemberId, activeWorkflow, stages, onClose, onSaved }: {
  members: TeamMember[];
  currentMemberId: string;
  activeWorkflow: WorkflowInstance | null;
  stages: WorkflowStageInstance[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: '', description: '', expected_output: '', assigned_to: '', priority: 'medium' as TaskPriority,
    start_at: '', due_at: '', estimated_hours: '', tags: '', workflow_stage_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectStage = (stageId: string) => {
    const stage = stages.find((item) => item.id === stageId);
    if (!stage) {
      setForm((current) => ({ ...current, workflow_stage_id: '' }));
      return;
    }
    setForm((current) => ({
      ...current,
      workflow_stage_id: stage.id,
      title: current.title || `مهمة مساندة — ${stage.stage_name}`,
      expected_output: current.expected_output || stage.expected_output || '',
      assigned_to: current.assigned_to || stage.owner_id || '',
      start_at: current.start_at || new Date(stage.planned_start).toISOString().slice(0, 16),
      due_at: current.due_at || new Date(stage.planned_end).toISOString().slice(0, 16),
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.assigned_to || !form.start_at || !form.due_at) return setError('حدد المسؤول ووقت البدء والانتهاء.');
    if (new Date(form.due_at) <= new Date(form.start_at)) return setError('وقت الانتهاء يجب أن يكون بعد وقت البدء.');
    setSaving(true);
    const { error: saveError } = await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      expected_output: form.expected_output,
      assigned_to: form.assigned_to,
      assigned_by: currentMemberId,
      priority: form.priority,
      start_at: new Date(form.start_at).toISOString(),
      due_at: new Date(form.due_at).toISOString(),
      due_date: form.due_at.slice(0, 10),
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      progress_percent: 0,
      status: 'todo',
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      workflow_id: activeWorkflow?.id ?? null,
      workflow_stage_id: form.workflow_stage_id || null,
      tender_id: activeWorkflow?.tender_id ?? null,
      opportunity_id: activeWorkflow?.opportunity_id ?? null,
      task_type: form.workflow_stage_id ? 'standalone' : 'standalone',
    });
    setSaving(false);
    if (saveError) return setError(saveError.message);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-between border-b border-navy-100 px-6 py-4">
          <div><h2 className="text-xl font-bold text-navy-900">مهمة إضافية مجدولة</h2><p className="text-xs text-navy-500">أضف مهمة مساندة مستقلة أو اربطها بإحدى مراحل المسار.</p></div>
          <button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {activeWorkflow && (
            <select value={form.workflow_stage_id} onChange={(event) => selectStage(event.target.value)} className="glass-input w-full rounded-xl px-4 py-2.5">
              <option value="">مهمة عامة مرتبطة بالمنافسة دون مرحلة محددة</option>
              {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.sort_order}. {stage.stage_name}</option>)}
            </select>
          )}
          <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="glass-input w-full rounded-xl px-4 py-2.5" placeholder="عنوان المهمة" />
          <div className="grid gap-4 md:grid-cols-2">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="glass-input rounded-xl px-4 py-2.5" rows={3} placeholder="وصف التنفيذ" />
            <textarea required value={form.expected_output} onChange={(event) => setForm({ ...form, expected_output: event.target.value })} className="glass-input rounded-xl px-4 py-2.5" rows={3} placeholder="المخرج المتوقع" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <select required value={form.assigned_to} onChange={(event) => setForm({ ...form, assigned_to: event.target.value })} className="glass-input rounded-xl px-4 py-2.5">
              <option value="">المسؤول</option>
              {members.map((item) => <option key={item.id} value={item.id}>{item.full_name} — {ROLE_LABELS[item.role_key] ?? item.title}</option>)}
            </select>
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })} className="glass-input rounded-xl px-4 py-2.5">
              <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option><option value="critical">حرجة</option>
            </select>
            <input type="number" min="0.5" step="0.5" value={form.estimated_hours} onChange={(event) => setForm({ ...form, estimated_hours: event.target.value })} className="glass-input rounded-xl px-4 py-2.5" placeholder="الساعات التقديرية" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input required type="datetime-local" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} className="glass-input rounded-xl px-4 py-2.5" />
            <input required type="datetime-local" value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} className="glass-input rounded-xl px-4 py-2.5" />
          </div>
          <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className="glass-input w-full rounded-xl px-4 py-2.5" placeholder="وسوم مفصولة بفاصلة" />
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-navy-200 px-4 py-2.5">إلغاء</button><button disabled={saving} className="flex-1 rounded-xl bg-araak-700 px-4 py-2.5 font-semibold text-white">{saving ? 'جارٍ الحفظ...' : 'إسناد وجدولة'}</button></div>
        </form>
      </div>
    </div>
  );
}

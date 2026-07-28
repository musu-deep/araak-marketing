import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Gauge,
  Hourglass,
  ShieldAlert,
  TimerReset,
  UserRoundCheck,
  Zap,
} from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import type { ScheduledWorkflowTask, WorkflowInstance, WorkflowStageInstance } from '@/lib/workflow-types';
import { classNames, formatDate } from '@/lib/constants';

const DAY = 86_400_000;

const ROLE_LABELS: Record<string, string> = {
  marketing_lead: 'مسؤول المنصة',
  technical_office: 'المكتب الفني',
  warehouse_sales: 'المشتريات والمستودعات',
  cfo: 'المالية والتسعير',
  national_director: 'مسؤول المشاريع',
  executive_office: 'المكتب التنفيذي',
  executive_followup: 'المتابعة التنفيذية',
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function fullDateTime(value: string) {
  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function delayDays(stage: WorkflowStageInstance) {
  if (stage.progress_percent >= 100) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(stage.planned_end).getTime()) / DAY));
}

function stageState(stage: WorkflowStageInstance, currentStageId?: string) {
  const delayed = delayDays(stage) > 0;
  if (stage.status === 'blocked') return { label: 'متوقفة', tone: 'red' as const, delayed };
  if (stage.progress_percent >= 100 || stage.status === 'completed') return { label: 'مكتملة', tone: 'green' as const, delayed: false };
  if (delayed) return { label: 'متأخرة', tone: 'red' as const, delayed };
  if (stage.id === currentStageId || stage.status === 'in_progress') return { label: 'قيد التنفيذ', tone: 'blue' as const, delayed };
  if (stage.status === 'review') return { label: 'للاعتماد', tone: 'amber' as const, delayed };
  return { label: 'قادمة', tone: 'slate' as const, delayed };
}

const TONE_CLASSES = {
  green: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
  blue: 'border-sky-200 bg-sky-50/70 text-sky-800',
  amber: 'border-amber-200 bg-amber-50/70 text-amber-800',
  red: 'border-red-200 bg-red-50/80 text-red-800',
  slate: 'border-slate-200 bg-slate-50/80 text-slate-700',
};

interface WorkflowTimelineProps {
  workflow: WorkflowInstance;
  stages: WorkflowStageInstance[];
  tasks: ScheduledWorkflowTask[];
  members: TeamMember[];
  canManage: boolean;
  currentMemberId?: string;
  onProgress: (stage: WorkflowStageInstance, value: number) => Promise<void>;
}

export function WorkflowTimeline({
  workflow,
  stages,
  tasks,
  members,
  canManage,
  currentMemberId,
  onProgress,
}: WorkflowTimelineProps) {
  const orderedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const currentStage = orderedStages.find((stage) => stage.progress_percent < 100) ?? orderedStages.at(-1);
  const delayedStages = orderedStages.filter((stage) => delayDays(stage) > 0);
  const blockedStages = orderedStages.filter((stage) => stage.status === 'blocked');
  const bottleneck = [...blockedStages, ...delayedStages]
    .sort((a, b) => delayDays(b) - delayDays(a))[0] ?? null;

  const start = new Date(workflow.received_at).getTime();
  const end = new Date(workflow.submission_deadline).getTime();
  const now = Date.now();
  const totalDays = Math.max(1, Math.ceil((end - start) / DAY));
  const remainingDays = Math.ceil((end - now) / DAY);
  const elapsedPercent = clamp(((now - start) / Math.max(end - start, 1)) * 100);
  const currentOwner = members.find((item) => item.id === currentStage?.owner_id);
  const workflowRisk = workflow.status === 'at_risk' || delayedStages.length > 0 || remainingDays < 0;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-navy-950 via-[#063b4f] to-[#087f8c] p-5 lg:p-7 text-white shadow-[0_28px_80px_-40px_rgba(3,24,39,0.9)]">
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-28 right-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-cyan-100">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">المسار التنفيذي للمنافسة</span>
              {workflow.reference && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1" dir="ltr">{workflow.reference}</span>}
              <span className={classNames(
                'rounded-full border px-3 py-1 font-semibold',
                workflowRisk ? 'border-red-300/40 bg-red-400/20 text-red-50' : 'border-emerald-300/40 bg-emerald-400/20 text-emerald-50',
              )}>
                {workflowRisk ? 'المسار يحتاج تدخلاً' : 'المسار ضمن الخطة'}
              </span>
            </div>
            <h2 className="mt-4 text-2xl lg:text-3xl font-extrabold leading-tight">{workflow.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-cyan-50/75">
              هندلة زمنية متكاملة من لحظة استلام الملف إلى الرفع النهائي، مع تحديد المالك والمخرج والمدة ونقطة التسليم لكل مرحلة.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon={CalendarClock} label="استلام الفرصة" value={formatDate(workflow.received_at)} />
              <Metric icon={FileCheck2} label="إغلاق التسليم" value={formatDate(workflow.submission_deadline)} />
              <Metric icon={Hourglass} label="المدة الكلية" value={`${totalDays} يوم`} />
              <Metric
                icon={TimerReset}
                label={remainingDays >= 0 ? 'المتبقي' : 'تجاوز الإغلاق'}
                value={`${Math.abs(remainingDays)} يوم`}
                danger={remainingDays < 2}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-cyan-100/70">الإنجاز الكلي المرجّح</div>
                <div className="mt-1 text-4xl font-black">{workflow.overall_progress}%</div>
              </div>
              <div
                className="grid h-24 w-24 place-items-center rounded-full p-2 shadow-[0_18px_45px_-20px_rgba(0,0,0,0.8)]"
                style={{ background: `conic-gradient(#5eead4 ${workflow.overall_progress * 3.6}deg, rgba(255,255,255,.15) 0)` }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-navy-950/90 text-xl font-black">
                  {workflow.overall_progress}%
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-[11px] text-cyan-100/70">
                <span>الزمن المنقضي {Math.round(elapsedPercent)}%</span>
                <span>الإنجاز {workflow.overall_progress}%</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                <div className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-teal-300 to-cyan-400" style={{ width: `${workflow.overall_progress}%` }} />
                <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_white]" style={{ right: `${elapsedPercent}%` }} />
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-black/10 px-3 py-2">
                <span className="flex items-center gap-2 text-cyan-100/70"><Zap className="h-4 w-4" /> المرحلة الحالية</span>
                <strong>{currentStage?.stage_name ?? 'مكتمل'}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/10 px-3 py-2">
                <span className="flex items-center gap-2 text-cyan-100/70"><UserRoundCheck className="h-4 w-4" /> المسؤول الحالي</span>
                <strong>{currentOwner?.full_name ?? ROLE_LABELS[currentStage?.owner_role_key ?? ''] ?? 'غير مسند'}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-black/10 px-3 py-2">
                <span className="flex items-center gap-2 text-cyan-100/70"><ShieldAlert className="h-4 w-4" /> مراحل متأخرة</span>
                <strong className={delayedStages.length ? 'text-red-200' : 'text-emerald-200'}>{delayedStages.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {bottleneck && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-gradient-to-l from-red-50 to-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-700"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold text-red-900">موضع الاختناق الحالي: {bottleneck.stage_name}</div>
              <div className="mt-1 text-xs leading-6 text-red-700">
                الملف لدى {ROLE_LABELS[bottleneck.owner_role_key] ?? bottleneck.owner_role_key}، والتأخير الحالي {delayDays(bottleneck)} يوم. المخرج المطلوب: {bottleneck.expected_output || 'إقفال المرحلة وتسليم الملف للمرحلة التالية'}.
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-red-600 px-4 py-2 text-center text-xs font-bold text-white shadow-lg shadow-red-200">
            تدخل تنفيذي مطلوب
          </div>
        </div>
      )}

      <section className="rounded-[28px] border border-navy-100 bg-white/80 p-4 lg:p-6 shadow-[0_24px_70px_-46px_rgba(15,23,42,0.6)] backdrop-blur-xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-navy-900"><Gauge className="h-5 w-5 text-araak-600" /> المسار المرحلي ثلاثي الأبعاد</h3>
            <p className="mt-1 text-xs text-navy-500">كل بطاقة تمثل محطة تسليم واضحة بين إدارة وأخرى؛ مرّر أفقيًا لاستعراض كامل الرحلة.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            <Legend className="bg-emerald-500" label="مكتملة" />
            <Legend className="bg-sky-500" label="قيد التنفيذ" />
            <Legend className="bg-amber-500" label="للاعتماد" />
            <Legend className="bg-red-500" label="متأخرة/متوقفة" />
          </div>
        </div>

        <div className="overflow-x-auto pb-5 pt-2">
          <div className="flex min-w-max items-stretch gap-3" dir="rtl">
            {orderedStages.map((stage, index) => {
              const owner = members.find((item) => item.id === stage.owner_id);
              const task = tasks.find((item) => item.workflow_stage_id === stage.id);
              const canEditStage = canManage || stage.owner_id === currentMemberId;
              const state = stageState(stage, currentStage?.id);
              return (
                <div key={stage.id} className="flex items-center">
                  <StageCard
                    stage={stage}
                    owner={owner}
                    task={task}
                    state={state}
                    canManage={canEditStage}
                    isCurrent={stage.id === currentStage?.id}
                    onProgress={onProgress}
                  />
                  {index < orderedStages.length - 1 && (
                    <div className="relative mx-1 flex w-14 items-center justify-center">
                      <div className="h-1 w-full rounded-full bg-gradient-to-l from-araak-400 to-navy-200 shadow-[0_5px_12px_rgba(14,132,148,.25)]" />
                      <ArrowLeft className="absolute -left-1 h-5 w-5 text-araak-600" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, danger = false }: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className={classNames('rounded-2xl border p-3 backdrop-blur-lg', danger ? 'border-red-300/30 bg-red-400/15' : 'border-white/10 bg-white/8')}>
      <Icon className={classNames('h-4 w-4', danger ? 'text-red-200' : 'text-cyan-200')} />
      <div className="mt-2 text-[11px] text-cyan-100/65">{label}</div>
      <div className="mt-0.5 text-sm font-bold">{value}</div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 px-2.5 py-1 text-navy-600"><i className={classNames('h-2 w-2 rounded-full', className)} />{label}</span>;
}

function StageCard({
  stage,
  owner,
  task,
  state,
  canManage,
  isCurrent,
  onProgress,
}: {
  stage: WorkflowStageInstance;
  owner?: TeamMember;
  task?: ScheduledWorkflowTask;
  state: ReturnType<typeof stageState>;
  canManage: boolean;
  isCurrent: boolean;
  onProgress: (stage: WorkflowStageInstance, value: number) => Promise<void>;
}) {
  const daysLate = delayDays(stage);
  return (
    <article
      className={classNames(
        'relative w-[238px] overflow-hidden rounded-3xl border p-4 transition-all duration-300 hover:-translate-y-2',
        TONE_CLASSES[state.tone],
        isCurrent && 'ring-2 ring-cyan-400 ring-offset-2',
      )}
      style={{
        transform: isCurrent ? 'perspective(900px) rotateX(1deg) translateY(-4px)' : 'perspective(900px) rotateX(3deg)',
        boxShadow: `0 24px 45px -30px ${stage.color}, inset 0 1px 0 rgba(255,255,255,.8)`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold opacity-60">المرحلة {stage.sort_order}</div>
          <h4 className="mt-1 min-h-10 text-sm font-extrabold leading-5 text-navy-900">{stage.stage_name}</h4>
        </div>
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full p-[5px] shadow-inner"
          style={{ background: `conic-gradient(${stage.color} ${clamp(stage.progress_percent) * 3.6}deg, #e2e8f0 0)` }}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-white text-[11px] font-black text-navy-900">{stage.progress_percent}%</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold">{state.label}</span>
        {stage.is_approval && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800"><CheckCircle2 className="h-3 w-3" /> اعتماد</span>}
      </div>

      <div className="mt-3 space-y-2 rounded-2xl border border-white/70 bg-white/60 p-3 text-[11px] text-navy-600 shadow-inner">
        <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{ROLE_LABELS[stage.owner_role_key] ?? stage.owner_role_key}</span></div>
        <div className="flex items-start gap-2"><UserRoundCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{owner?.full_name ?? 'بانتظار إسناد المسؤول'}</span></div>
        <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{shortDate(stage.planned_start)} ← {shortDate(stage.planned_end)}</span></div>
      </div>

      {stage.expected_output && (
        <div className="mt-3 line-clamp-3 rounded-xl bg-navy-950/[.04] p-2.5 text-[10px] leading-5 text-navy-600">
          <strong className="block text-navy-800">المخرج المطلوب</strong>
          {stage.expected_output}
        </div>
      )}

      {daysLate > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-[10px] font-bold text-white shadow-lg shadow-red-200">
          <AlertTriangle className="h-3.5 w-3.5" /> متأخرة {daysLate} يوم — كان التسليم {fullDateTime(stage.planned_end)}
        </div>
      )}

      {canManage && stage.progress_percent < 100 && (
        <div className="mt-3 grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => void onProgress(stage, value)}
              disabled={(task?.progress_percent ?? stage.progress_percent) >= value}
              className="rounded-lg border border-white bg-white/75 py-1.5 text-[9px] font-bold text-navy-600 transition hover:bg-araak-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
            >
              {value}%
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

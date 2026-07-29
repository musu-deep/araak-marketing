import { AlertTriangle, CalendarDays, Clock3, Milestone, UserRound } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import type { WorkflowInstance, WorkflowStageInstance } from '@/lib/workflow-types';
import { classNames } from '@/lib/constants';

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

function shortDate(value: number | string) {
  return new Intl.DateTimeFormat('ar-SA', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function lateDays(stage: WorkflowStageInstance) {
  if (stage.progress_percent >= 100) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(stage.planned_end).getTime()) / DAY));
}

interface WorkflowGanttProps {
  workflow: WorkflowInstance;
  stages: WorkflowStageInstance[];
  members: TeamMember[];
}

export function WorkflowGantt({ workflow, stages, members }: WorkflowGanttProps) {
  const ordered = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const start = new Date(workflow.received_at).getTime();
  const end = new Date(workflow.submission_deadline).getTime();
  const span = Math.max(end - start, DAY);
  const totalDays = Math.max(1, Math.ceil(span / DAY));
  const tickCount = Math.min(12, Math.max(5, totalDays));
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => start + (span * index / tickCount));
  const todayPosition = clamp(((Date.now() - start) / span) * 100);

  return (
    <section className="overflow-hidden rounded-[28px] border border-navy-100 bg-white shadow-[0_26px_70px_-48px_rgba(15,23,42,.65)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 bg-gradient-to-l from-navy-50 to-white px-5 py-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-navy-900"><CalendarDays className="h-5 w-5 text-araak-600" /> مخطط Gantt التشغيلي</h3>
          <p className="mt-1 text-xs text-navy-500">المراحل والإدارات مقابل نافذة التسليم؛ الخط العمودي يحدد موقع اليوم الحالي.</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-navy-500">
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-araak-500" /> المدة المخططة</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> المنجز</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-red-500" /> تأخير</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1050px]">
          <div className="grid grid-cols-[300px_1fr] border-b border-navy-100 bg-navy-950/[.02]">
            <div className="border-l border-navy-100 px-5 py-3 text-xs font-bold text-navy-600">المرحلة والمسؤول</div>
            <div className="relative h-14 px-3">
              {ticks.map((tick, index) => (
                <div
                  key={tick}
                  className="absolute inset-y-0 border-r border-dashed border-navy-200"
                  style={{ right: `${(index / tickCount) * 100}%` }}
                >
                  <span className="absolute right-1 top-3 whitespace-nowrap text-[10px] text-navy-400">{shortDate(tick)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {todayPosition >= 0 && todayPosition <= 100 && (
              <div className="pointer-events-none absolute bottom-0 top-0 z-20" style={{ right: `calc(300px + (100% - 300px) * ${todayPosition / 100})` }}>
                <div className="h-full w-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,.55)]" />
                <span className="absolute -right-5 top-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white">اليوم</span>
              </div>
            )}

            {ordered.map((stage) => {
              const owner = members.find((item) => item.id === stage.owner_id);
              const stageStart = new Date(stage.planned_start).getTime();
              const stageEnd = new Date(stage.planned_end).getTime();
              const right = clamp(((stageStart - start) / span) * 100);
              const width = Math.max(1.5, clamp(((stageEnd - stageStart) / span) * 100, 1.5, 100 - right));
              const delay = lateDays(stage);
              const completedWidth = width * clamp(stage.progress_percent) / 100;

              return (
                <div key={stage.id} className="grid min-h-[78px] grid-cols-[300px_1fr] border-b border-navy-50 transition hover:bg-araak-50/30">
                  <div className="flex items-center gap-3 border-l border-navy-100 px-4 py-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${stage.color}, ${stage.color}bb)` }}>
                      <Milestone className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-extrabold text-navy-900">{stage.stage_name}</div>
                      <div className="mt-1 flex items-center gap-1.5 truncate text-[10px] text-navy-500">
                        <UserRound className="h-3 w-3 shrink-0" />
                        {owner?.full_name ?? ROLE_LABELS[stage.owner_role_key] ?? 'غير مسند'}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-navy-400">
                        <Clock3 className="h-3 w-3" /> {shortDate(stage.planned_start)} — {shortDate(stage.planned_end)}
                      </div>
                    </div>
                    {delay > 0 && (
                      <span className="mr-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[9px] font-bold text-red-700"><AlertTriangle className="h-3 w-3" /> {delay}ي</span>
                    )}
                  </div>

                  <div className="relative px-3 py-4">
                    {ticks.map((tick, index) => (
                      <div key={tick} className="absolute inset-y-0 border-r border-dashed border-navy-100" style={{ right: `${(index / tickCount) * 100}%` }} />
                    ))}
                    <div
                      className={classNames(
                        'absolute top-1/2 h-9 -translate-y-1/2 overflow-hidden rounded-xl border bg-slate-100 shadow-[0_12px_28px_-18px_rgba(15,23,42,.55)]',
                        delay > 0 ? 'border-red-300 ring-2 ring-red-100' : 'border-white',
                      )}
                      style={{ right: `${right}%`, width: `${width}%` }}
                    >
                      <div className="absolute inset-y-0 right-0 opacity-25" style={{ width: '100%', background: `linear-gradient(90deg, transparent, ${stage.color})` }} />
                      <div
                        className="absolute inset-y-0 right-0 rounded-xl"
                        style={{ width: `${clamp(stage.progress_percent)}%`, background: `linear-gradient(90deg, ${stage.color}bb, ${stage.color})` }}
                      />
                      <div className="relative z-10 flex h-full items-center justify-between px-3 text-[10px] font-bold">
                        <span className={stage.progress_percent > 20 ? 'text-white' : 'text-navy-700'}>{stage.progress_percent}%</span>
                        <span className="text-navy-700/70">{Math.max(1, Math.ceil((stageEnd - stageStart) / DAY))} يوم</span>
                      </div>
                    </div>
                    {delay > 0 && (
                      <div
                        className="absolute top-[60%] h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,.5)]"
                        style={{ right: `${right + completedWidth}%`, width: `${Math.min(8, Math.max(2, delay / Math.max(totalDays, 1) * 100))}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

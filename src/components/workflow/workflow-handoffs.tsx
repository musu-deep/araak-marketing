import { ArrowLeft, Building2, CheckCircle2, Clock3, FileOutput, RotateCcw, Send, TimerOff } from 'lucide-react';
import type { TeamMember } from '@/lib/types';
import type { WorkflowHandoff, WorkflowStageInstance } from '@/lib/workflow-types';
import { classNames } from '@/lib/constants';

const ROLE_LABELS: Record<string, string> = {
  marketing_lead: 'مسؤول المنصة',
  technical_office: 'المكتب الفني',
  warehouse_sales: 'المشتريات والمستودعات',
  cfo: 'المالية والتسعير',
  national_director: 'مسؤول المشاريع',
  executive_office: 'المكتب التنفيذي',
  executive_followup: 'المتابعة التنفيذية',
};

function dateTime(value: string | null) {
  if (!value) return 'لم يتم';
  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(value));
}

function hoursBetween(start: string, end: string | null) {
  const startTime = new Date(start).getTime();
  const endTime = end ? new Date(end).getTime() : Date.now();
  return Math.max(0, Math.round((endTime - startTime) / 3_600_000));
}

interface WorkflowHandoffsProps {
  stages: WorkflowStageInstance[];
  handoffs: WorkflowHandoff[];
  members: TeamMember[];
}

export function WorkflowHandoffs({ stages, handoffs, members }: WorkflowHandoffsProps) {
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
  const ordered = [...handoffs].sort((a, b) => new Date(a.planned_handoff_at).getTime() - new Date(b.planned_handoff_at).getTime());

  return (
    <section className="rounded-[28px] border border-navy-100 bg-white p-5 shadow-[0_24px_65px_-48px_rgba(15,23,42,.65)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-navy-900"><Send className="h-5 w-5 text-araak-600" /> سجل انتقال الملف بين الإدارات</h3>
          <p className="mt-1 text-xs text-navy-500">يوضح موعد التسليم المخطط، الإرسال الفعلي، الاستلام، ووقت انتظار الملف عند كل نقطة انتقال.</p>
        </div>
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 p-8 text-center text-sm text-navy-500">لا توجد نقاط تسليم مسجلة لهذا المسار.</div>
      ) : (
        <div className="space-y-3">
          {ordered.map((handoff) => {
            const fromStage = stageMap.get(handoff.from_stage_id);
            const toStage = stageMap.get(handoff.to_stage_id);
            if (!fromStage || !toStage) return null;
            const fromMember = members.find((item) => item.id === handoff.from_member_id) ?? members.find((item) => item.id === fromStage.owner_id);
            const toMember = members.find((item) => item.id === handoff.to_member_id) ?? members.find((item) => item.id === toStage.owner_id);
            const overdue = !handoff.sent_at && new Date(handoff.planned_handoff_at).getTime() < Date.now();
            const waitHours = handoff.sent_at ? hoursBetween(handoff.sent_at, handoff.received_at) : 0;

            return (
              <article
                key={handoff.id}
                className={classNames(
                  'grid gap-3 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg lg:grid-cols-[1fr_auto_1fr_220px]',
                  overdue ? 'border-red-200 bg-red-50/45' : handoff.status === 'received' ? 'border-emerald-100 bg-emerald-50/35' : 'border-navy-100 bg-white',
                )}
              >
                <HandoffParty
                  label="من"
                  stage={fromStage.stage_name}
                  department={ROLE_LABELS[fromStage.owner_role_key] ?? fromStage.owner_role_key}
                  member={fromMember?.full_name}
                  color={fromStage.color}
                />

                <div className="flex items-center justify-center px-2">
                  <div className="relative flex w-full min-w-20 items-center justify-center">
                    <div className={classNames('h-1 w-full rounded-full', overdue ? 'bg-red-300' : handoff.status === 'received' ? 'bg-emerald-300' : 'bg-araak-200')} />
                    <ArrowLeft className={classNames('absolute -left-1 h-5 w-5', overdue ? 'text-red-600' : handoff.status === 'received' ? 'text-emerald-600' : 'text-araak-600')} />
                  </div>
                </div>

                <HandoffParty
                  label="إلى"
                  stage={toStage.stage_name}
                  department={ROLE_LABELS[toStage.owner_role_key] ?? toStage.owner_role_key}
                  member={toMember?.full_name}
                  color={toStage.color}
                />

                <div className="grid content-center gap-1.5 rounded-xl bg-navy-950/[.035] p-3 text-[10px] text-navy-600">
                  <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> المخطط</span><strong>{dateTime(handoff.planned_handoff_at)}</strong></div>
                  <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1"><FileOutput className="h-3 w-3" /> أُرسل</span><strong>{dateTime(handoff.sent_at)}</strong></div>
                  <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> استُلم</span><strong>{dateTime(handoff.received_at)}</strong></div>
                  {waitHours > 0 && <div className="mt-1 flex items-center justify-between rounded-lg bg-amber-100 px-2 py-1 text-amber-800"><span>زمن الانتظار</span><strong>{waitHours} ساعة</strong></div>}
                  {overdue && <div className="mt-1 flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 font-bold text-white"><TimerOff className="h-3 w-3" /> لم يُسلّم في موعده</div>}
                  {handoff.status === 'returned' && <div className="mt-1 flex items-center gap-1 rounded-lg bg-orange-100 px-2 py-1 font-bold text-orange-800"><RotateCcw className="h-3 w-3" /> أُعيد للمعالجة</div>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HandoffParty({ label, stage, department, member, color }: {
  label: string;
  stage: string;
  department: string;
  member?: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-lg" style={{ background: `linear-gradient(145deg, ${color}, ${color}bb)` }}>
        <Building2 className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold text-navy-400">{label}</div>
        <div className="truncate text-xs font-extrabold text-navy-900">{department}</div>
        <div className="mt-0.5 truncate text-[10px] text-navy-500">{stage}</div>
        <div className="mt-1 truncate text-[10px] font-semibold text-araak-700">{member ?? 'غير مسند'}</div>
      </div>
    </div>
  );
}

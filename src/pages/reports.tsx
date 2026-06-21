import { useEffect, useState } from 'react';
import { BarChart3, Calendar, Users, TrendingUp, Target, Award, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, KpiCard, ProgressBar, ProgressRing, LoadingState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatNumber, formatDate } from '@/lib/constants';
import type { Opportunity, Tender, Task } from '@/lib/types';

export function ReportsPage() {
  const { member, isAdmin } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!member) return;
      setLoading(true);
      if (isAdmin) {
        const [oppRes, tenderRes, taskRes] = await Promise.all([
          supabase.from('opportunities').select('*'),
          supabase.from('tenders').select('*'),
          supabase.from('tasks').select('*'),
        ]);
        if (oppRes.data) setOpportunities(oppRes.data as Opportunity[]);
        if (tenderRes.data) setTenders(tenderRes.data as Tender[]);
        if (taskRes.data) setTasks(taskRes.data as Task[]);
      }
      setLoading(false);
    })();
  }, [member, isAdmin]);

  if (loading) return <LoadingState />;

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto">
        <SectionHeader title="التقارير التنفيذية" subtitle="تقارير شاملة لأداء المنظومة" icon={BarChart3} />
        <GlassCard className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-navy-300 mb-3" />
          <h3 className="font-bold text-navy-900">التقارير متاحة لمديري النظام</h3>
          <p className="text-sm text-navy-500 mt-1">التقارير التنفيذية الشاملة متاحة فقط للرئيس التنفيذي ونائبه ومسؤول التسويق.</p>
        </GlassCard>
      </div>
    );
  }

  const totalValue = opportunities.reduce((s, o) => s + (o.value ?? 0), 0);
  const wonCount = tenders.filter((t) => t.status === 'won').length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const winRate = tenders.length > 0 ? Math.round((wonCount / tenders.length) * 100) : 0;

  // توزيع حسب الجهة
  const byEntity = opportunities.reduce((acc, o) => {
    const key = o.entity ?? o.client ?? 'غير محدد';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topEntities = Object.entries(byEntity).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SectionHeader title="التقارير التنفيذية" subtitle="رؤية شاملة لأداء منظومة المنافسات والمشاريع" icon={BarChart3} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="إجمالي الفرص" value={opportunities.length} icon={Target} color="araak" />
        <KpiCard label="مناقصات مكتسبة" value={wonCount} icon={Award} trend={`${winRate}% نسبة الفوز`} trendUp color="gold" />
        <KpiCard label="إنجاز المهام" value={`${completionRate}%`} icon={TrendingUp} color="navy" />
        <KpiCard label="قيمة الفرص" value={formatNumber(totalValue)} suffix="ر.س" icon={BarChart3} color="sand" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-araak-500" /> توزيع الفرص حسب الجهة</h3>
          <div className="space-y-3">
            {topEntities.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-4">لا توجد بيانات</p>
            ) : (
              topEntities.map(([entity, count]) => (
                <div key={entity}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-navy-700 font-medium">{entity}</span>
                    <span className="text-navy-500">{count}</span>
                  </div>
                  <ProgressBar value={count} max={Math.max(...Object.values(byEntity))} color="araak" height={6} />
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-gold-500" /> أداء المناقصات</h3>
          <div className="flex justify-center">
            <ProgressRing value={winRate} size={140} label="نسبة الفوز" color="#c89c2e" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="p-2 rounded-xl bg-navy-50">
              <div className="text-lg font-bold text-navy-900">{tenders.length}</div>
              <div className="text-[11px] text-navy-500">إجمالي</div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50">
              <div className="text-lg font-bold text-emerald-700">{wonCount}</div>
              <div className="text-[11px] text-emerald-600">فائزة</div>
            </div>
            <div className="p-2 rounded-xl bg-red-50">
              <div className="text-lg font-bold text-red-700">{tenders.filter((t) => t.status === 'lost').length}</div>
              <div className="text-[11px] text-red-600">خاسرة</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-araak-500" /> أحدث الفرص</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-navy-500 text-xs">
                <th className="text-right py-2 px-3 font-medium">الفرصة</th>
                <th className="text-right py-2 px-3 font-medium">العميل</th>
                <th className="text-right py-2 px-3 font-medium">القيمة</th>
                <th className="text-right py-2 px-3 font-medium">الموعد</th>
                <th className="text-right py-2 px-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.slice(0, 8).map((o) => (
                <tr key={o.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                  <td className="py-2 px-3 font-medium text-navy-800">{o.title}</td>
                  <td className="py-2 px-3 text-navy-600">{o.client ?? '—'}</td>
                  <td className="py-2 px-3 text-emerald-700 font-semibold">{o.value ? formatCurrency(o.value) : '—'}</td>
                  <td className="py-2 px-3 text-navy-500">{formatDate(o.deadline)}</td>
                  <td className="py-2 px-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy-50 text-navy-600">{o.status}</span>
                  </td>
                </tr>
              ))}
              {opportunities.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-navy-400">لا توجد بيانات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

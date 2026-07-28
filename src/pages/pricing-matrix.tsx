import { BadgeDollarSign, Calculator, CheckCircle2, CircleDollarSign, Plus, ShieldCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, KpiCard, LoadingState, SectionHeader } from '@/components/ui/primitives';
import { formatCurrency } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface PricingItem {
  id: string;
  service_name: string;
  category: string | null;
  base_cost: number;
  overhead_percent: number;
  risk_percent: number;
  margin_percent: number;
  discount_ceiling_percent: number;
  currency: string;
  recommended_price: number;
  minimum_price: number;
  approval_status: 'draft' | 'review' | 'approved' | 'archived';
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

const statusLabel: Record<PricingItem['approval_status'], string> = { draft: 'مسودة', review: 'للمراجعة', approved: 'معتمدة', archived: 'مؤرشفة' };
const statusStyle: Record<PricingItem['approval_status'], string> = { draft: 'bg-navy-50 text-navy-600', review: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', archived: 'bg-gray-100 text-gray-600' };
const price = (base: number, overhead: number, risk: number, margin: number) => Math.round(base * (1 + overhead / 100 + risk / 100) / Math.max(0.01, 1 - margin / 100));

export function PricingMatrixPage() {
  const { member } = useAuth();
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const result = await supabase.from('pricing_matrix').select('*').order('created_at', { ascending: false });
    setError(result.error?.message ?? null);
    setItems((result.data ?? []) as PricingItem[]);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const summary = useMemo(() => ({
    approved: items.filter((item) => item.approval_status === 'approved').length,
    review: items.filter((item) => item.approval_status === 'review').length,
    margin: items.length ? Math.round(items.reduce((sum, item) => sum + item.margin_percent, 0) / items.length) : 0,
    discount: items.length ? Math.round(items.reduce((sum, item) => sum + item.discount_ceiling_percent, 0) / items.length) : 0,
  }), [items]);

  const approve = async (item: PricingItem, approval_status: PricingItem['approval_status']) => {
    if (!member) return;
    const changes = { approval_status, approved_by: approval_status === 'approved' ? member.id : null, approved_at: approval_status === 'approved' ? new Date().toISOString() : null };
    const result = await supabase.from('pricing_matrix').update(changes).eq('id', item.id);
    if (result.error) return setError(result.error.message);
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...changes } : row));
  };

  if (loading) return <LoadingState label="جارٍ تحميل مصفوفة التسعير..." />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader title="مصفوفة التسعير" subtitle="ربط التكلفة والمخاطر والهامش وسقف الخصم بقرار اعتماد واضح" icon={BadgeDollarSign} action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-araak-700 text-white font-semibold"><Plus className="w-4 h-4" /> بند جديد</button>} />
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="بنود معتمدة" value={summary.approved} icon={CheckCircle2} color="araak" />
        <KpiCard label="بانتظار المراجعة" value={summary.review} icon={ShieldCheck} color="gold" />
        <KpiCard label="متوسط هامش الربح" value={summary.margin} suffix="%" icon={CircleDollarSign} color="navy" />
        <KpiCard label="متوسط سقف الخصم" value={summary.discount} suffix="%" icon={Calculator} color="sand" />
      </div>

      <GlassCard className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-sm"><thead className="bg-navy-50 text-xs text-navy-500"><tr><th className="text-right px-4 py-3">الخدمة</th><th className="text-right px-3">الفئة</th><th>التكلفة</th><th>تشغيل</th><th>مخاطر</th><th>هامش</th><th>السعر الموصى</th><th>الحد الأدنى</th><th>سقف الخصم</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody className="divide-y divide-navy-100">
        {items.map((item) => <tr key={item.id} className="hover:bg-araak-50/30"><td className="px-4 py-3"><b className="text-navy-900">{item.service_name}</b>{item.notes && <div className="text-[11px] text-navy-400 max-w-56">{item.notes}</div>}</td><td className="px-3">{item.category ?? 'عام'}</td><td className="text-center font-semibold">{formatCurrency(item.base_cost, item.currency)}</td><td className="text-center">{item.overhead_percent}%</td><td className="text-center">{item.risk_percent}%</td><td className="text-center font-bold text-araak-700">{item.margin_percent}%</td><td className="text-center font-bold">{formatCurrency(item.recommended_price, item.currency)}</td><td className="text-center font-bold text-amber-700">{formatCurrency(item.minimum_price, item.currency)}</td><td className="text-center">{item.discount_ceiling_percent}%</td><td className="text-center"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyle[item.approval_status]}`}>{statusLabel[item.approval_status]}</span></td><td className="text-center">{item.approval_status === 'approved' ? <button onClick={() => void approve(item, 'review')} className="bg-navy-50 text-navy-600 rounded-lg px-3 py-1.5 text-[11px] font-bold">إعادة للمراجعة</button> : <button onClick={() => void approve(item, 'approved')} className="bg-emerald-50 text-emerald-700 rounded-lg px-3 py-1.5 text-[11px] font-bold">اعتماد</button>}</td></tr>)}
        {!items.length && <tr><td colSpan={11} className="py-14 text-center text-navy-400">لا توجد بنود تسعير بعد.</td></tr>}
      </tbody></table></div></GlassCard>

      {showForm && member && <PricingForm memberId={member.id} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load(); }} />}
    </div>
  );
}

function PricingForm({ memberId, onClose, onSaved }: { memberId: string; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ service_name: '', category: '', base_cost: '', overhead: '10', risk: '5', margin: '25', discount: '10', currency: 'SAR', status: 'review' as PricingItem['approval_status'], notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = Number(form.base_cost) || 0;
  const recommended = price(base, Number(form.overhead), Number(form.risk), Number(form.margin));
  const minimum = Math.round(recommended * (1 - Number(form.discount) / 100));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (base <= 0) return setError('أدخل تكلفة أساسية أكبر من صفر.');
    if (Number(form.margin) >= 100 || Number(form.discount) >= 100) return setError('الهامش وسقف الخصم يجب أن يكونا أقل من 100%.');
    setSaving(true);
    const result = await supabase.from('pricing_matrix').insert({
      service_name: form.service_name, category: form.category || null, base_cost: base,
      overhead_percent: Number(form.overhead), risk_percent: Number(form.risk), margin_percent: Number(form.margin), discount_ceiling_percent: Number(form.discount),
      currency: form.currency, recommended_price: recommended, minimum_price: minimum, approval_status: form.status, notes: form.notes || null, created_by: memberId,
    });
    setSaving(false);
    if (result.error) return setError(result.error.message);
    onSaved();
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm" onClick={onClose}><div className="glass-card rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}><div className="px-6 py-4 flex justify-between border-b border-navy-100"><div><h2 className="text-xl font-bold text-navy-900">بند تسعير جديد</h2><p className="text-xs text-navy-500">السعر الموصى والحد الأدنى يحتسبان آلياً.</p></div><button onClick={onClose}><X className="w-5 h-5" /></button></div><form onSubmit={submit} className="p-6 space-y-4">
    {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
    <div className="grid md:grid-cols-2 gap-4"><input required value={form.service_name} onChange={(event) => setForm({ ...form, service_name: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" placeholder="الخدمة أو البند" /><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" placeholder="الفئة" /></div>
    <div className="grid md:grid-cols-3 gap-4"><input required type="number" min="0" step="0.01" value={form.base_cost} onChange={(event) => setForm({ ...form, base_cost: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl" placeholder="التكلفة الأساسية" /><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="glass-input px-4 py-2.5 rounded-xl"><option value="SAR">ريال سعودي</option><option value="USD">دولار</option><option value="EUR">يورو</option></select><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as PricingItem['approval_status'] })} className="glass-input px-4 py-2.5 rounded-xl"><option value="draft">مسودة</option><option value="review">للمراجعة</option></select></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Percent label="تشغيل" value={form.overhead} onChange={(value) => setForm({ ...form, overhead: value })} /><Percent label="مخاطر" value={form.risk} onChange={(value) => setForm({ ...form, risk: value })} /><Percent label="هامش" value={form.margin} onChange={(value) => setForm({ ...form, margin: value })} /><Percent label="سقف الخصم" value={form.discount} onChange={(value) => setForm({ ...form, discount: value })} /></div>
    <GlassCard className="p-4 bg-araak-50"><div className="grid sm:grid-cols-2 gap-4"><div><div className="text-xs text-navy-500">السعر الموصى</div><b className="text-2xl text-navy-900">{formatCurrency(recommended, form.currency)}</b></div><div><div className="text-xs text-navy-500">الحد الأدنى</div><b className="text-2xl text-amber-700">{formatCurrency(minimum, form.currency)}</b></div></div></GlassCard>
    <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="glass-input w-full px-4 py-2.5 rounded-xl" placeholder="ملاحظات وضوابط" />
    <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200">إلغاء</button><button disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-araak-700 text-white font-semibold">{saving ? 'جارٍ الحفظ...' : 'حفظ البند'}</button></div>
  </form></div></div>;
}

function Percent({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs text-navy-700">{label} %<input type="number" min="0" max="99" step="0.5" value={value} onChange={(event) => onChange(event.target.value)} className="glass-input w-full px-3 py-2.5 rounded-xl mt-1.5" /></label>;
}

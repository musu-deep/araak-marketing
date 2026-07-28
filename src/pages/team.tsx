import { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { EmptyState, GlassCard, LoadingState, SectionHeader } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { formatDate, initials } from '@/lib/constants';
import type { Department, TeamMember } from '@/lib/types';

interface PlatformMember extends TeamMember {
  auth_user_id: string | null;
  access_claimed_at: string | null;
}

export function TeamPage() {
  const { isAdmin, member } = useAuth();
  const [members, setMembers] = useState<PlatformMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('team_members')
      .select('*, department:departments(*)')
      .eq('is_active', true);
    if (!isAdmin && member) query = query.eq('id', member.id);

    const [memberResult, departmentResult] = await Promise.all([
      query.order('hire_date', { ascending: true }),
      supabase.from('departments').select('*').order('sort_order'),
    ]);

    if (memberResult.error) setError(memberResult.error.message);
    setMembers((memberResult.data ?? []) as PlatformMember[]);
    setDepartments((departmentResult.data ?? []) as Department[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [isAdmin, member?.id]);

  const startPhoneEdit = (platformMember: PlatformMember) => {
    setEditingId(platformMember.id);
    setPhoneDraft(platformMember.phone ?? '');
    setError(null);
  };

  const savePhone = async (memberId: string) => {
    const phone = phoneDraft.trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      setError('أدخل رقم جوال صحيحاً مع مفتاح الدولة عند الحاجة.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase
      .from('team_members')
      .update({ phone, updated_at: new Date().toISOString() })
      .eq('id', memberId);
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMembers((current) => current.map((item) => item.id === memberId ? { ...item, phone } : item));
    setEditingId(null);
    setPhoneDraft('');
  };

  if (loading) return <LoadingState />;

  const visibleMembers = members.length > 0 ? members : (member ? [member as PlatformMember] : []);
  const configuredCount = visibleMembers.filter((item) => item.phone).length;
  const activeAccessCount = visibleMembers.filter((item) => item.auth_user_id).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="فريق المنصة"
        subtitle={isAdmin ? 'أعضاء منصة التسويق والمناقصات وتهيئة بيانات الدخول' : 'بيانات عضويتك في المنصة'}
        icon={Users}
      />

      {isAdmin && (
        <div className="grid sm:grid-cols-3 gap-3">
          <GlassCard className="p-4">
            <div className="text-xs text-navy-500">إجمالي الأعضاء</div>
            <div className="text-2xl font-bold text-navy-900 mt-1">{visibleMembers.length}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-xs text-navy-500">أرقام الجوال المهيأة</div>
            <div className="text-2xl font-bold text-araak-700 mt-1">{configuredCount}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-xs text-navy-500">حسابات تم تفعيلها</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{activeAccessCount}</div>
          </GlassCard>
        </div>
      )}

      {!isAdmin && (
        <GlassCard className="p-4 bg-araak-50 border border-araak-100">
          <p className="text-sm text-araak-800">لك صلاحية رؤية بياناتك فقط. لتعديل رقم الجوال تواصل مع مدير المنصة.</p>
        </GlassCard>
      )}

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {visibleMembers.length === 0 ? (
        <GlassCard><EmptyState icon={Users} title="لا يوجد أعضاء" description="لم يتم العثور على أعضاء فريق المنصة" /></GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMembers.map((platformMember) => {
            const department = departments.find((item) => item.id === platformMember.department_id);
            const editing = editingId === platformMember.id;
            const accessReady = Boolean(platformMember.phone);
            const accessActive = Boolean(platformMember.auth_user_id);

            return (
              <GlassCard key={platformMember.id} hover className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-araak-400 to-araak-600 text-white text-lg flex items-center justify-center font-bold flex-shrink-0">
                    {initials(platformMember.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy-900 text-sm">{platformMember.full_name}</h3>
                    <p className="text-xs text-araak-700 font-medium">{platformMember.title}</p>
                    {department && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ background: department.color }}>
                        {department.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${accessActive ? 'bg-emerald-50 text-emerald-700' : accessReady ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  {accessActive ? <CheckCircle2 className="w-4 h-4" /> : accessReady ? <ShieldCheck className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  {accessActive ? 'تم تفعيل دخول العضو' : accessReady ? 'جاهز للدخول الأول' : 'رقم الجوال غير مهيأ'}
                </div>

                {platformMember.bio && <p className="text-xs text-navy-600 leading-relaxed mb-3 line-clamp-3">{platformMember.bio}</p>}

                <div className="space-y-2 text-xs text-navy-500 pt-3 border-t border-navy-50">
                  <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /><span className="truncate" dir="ltr">{platformMember.email}</span></div>

                  {editing ? (
                    <div className="space-y-2 rounded-xl bg-navy-50 p-3">
                      <label className="block text-[11px] font-semibold text-navy-700">رقم الجوال المعتمد للدخول</label>
                      <input
                        autoFocus
                        value={phoneDraft}
                        onChange={(event) => setPhoneDraft(event.target.value)}
                        className="glass-input w-full rounded-lg px-3 py-2 text-navy-900"
                        placeholder="+9665xxxxxxxx"
                        dir="ltr"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => void savePhone(platformMember.id)} disabled={saving} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-araak-600 px-2 py-1.5 text-white disabled:opacity-60">
                          <Save className="w-3 h-3" /> {saving ? 'حفظ...' : 'حفظ'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="inline-flex items-center justify-center rounded-lg border border-navy-200 px-3 py-1.5 text-navy-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr" className="truncate">{platformMember.phone ?? 'غير مسجل'}</span>
                      </div>
                      {isAdmin && (
                        <button onClick={() => startPhoneEdit(platformMember)} className="inline-flex items-center gap-1 rounded-lg bg-navy-50 px-2 py-1 text-[10px] font-medium text-navy-600 hover:bg-araak-50 hover:text-araak-700">
                          <Pencil className="w-3 h-3" /> تهيئة
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /><span>منضم منذ {formatDate(platformMember.hire_date)}</span></div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

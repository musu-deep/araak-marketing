import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, LoadingState, EmptyState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, initials, formatDate } from '@/lib/constants';
import type { TeamMember, Department } from '@/lib/types';

export function TeamPage() {
  const { isAdmin, member } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from('team_members').select(`*, department:departments(*)`).eq('is_active', true);
      if (!isAdmin && member) query = query.eq('id', member.id);
      const { data } = await query.order('hire_date', { ascending: true });
      if (data) setMembers((data as unknown as { id: string; team_members: TeamMember }[]).map((r) => (r as unknown) as TeamMember));
      const { data: deps } = await supabase.from('departments').select('*').order('sort_order');
      if (deps) setDepartments(deps as Department[]);
      setLoading(false);
    })();
  }, [isAdmin, member]);

  if (loading) return <LoadingState />;

  const visibleMembers = members.length > 0 ? members : (member ? [member] : []);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader title="تعاون الفريق" subtitle={isAdmin ? 'أعضاء فريق أراك ومصفوفة المسؤوليات' : 'بطاقتك الشخصية'} icon={Users} />
      {!isAdmin && (
        <GlassCard className="p-4 bg-araak-50 border border-araak-100">
          <p className="text-sm text-araak-800">لك صلاحية رؤية بياناتك فقط. للوصول لقائمة الفريق الكاملة، تواصل مع مسؤول النظام.</p>
        </GlassCard>
      )}
      {visibleMembers.length === 0 ? (
        <GlassCard><EmptyState icon={Users} title="لا يوجد أعضاء" description="لم يتم العثور على أعضاء فريق" /></GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleMembers.map((m) => {
            const dept = departments.find((d) => d.id === m.department_id);
            return (
              <GlassCard key={m.id} hover className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-araak-400 to-araak-600 text-white text-lg flex items-center justify-center font-bold flex-shrink-0">{initials(m.full_name)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy-900 text-sm">{m.full_name}</h3>
                    <p className="text-xs text-araak-700 font-medium">{ROLE_LABELS[m.role_key] ?? m.title}</p>
                    {dept && <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ background: dept.color }}>{dept.name}</span>}
                  </div>
                </div>
                {m.bio && <p className="text-xs text-navy-600 leading-relaxed mb-3 line-clamp-3">{m.bio}</p>}
                {m.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {m.specialties.slice(0, 3).map((s, i) => (<span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-navy-50 text-navy-600">{s}</span>))}
                  </div>
                )}
                <div className="space-y-1.5 text-xs text-navy-500 pt-3 border-t border-navy-50">
                  <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /><span className="truncate" dir="ltr">{m.email}</span></div>
                  {m.phone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /><span dir="ltr">{m.phone}</span></div>}
                  <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /><span>منضم منذ {formatDate(m.hire_date)}</span></div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

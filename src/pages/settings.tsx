import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Plus, X, Check, Star, Building2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, LoadingState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, initials, classNames } from '@/lib/constants';
import type { TeamMember, Permission, ExternalPlatform } from '@/lib/types';

export function SettingsPage() {
  const { member, hasPermission } = useAuth();
  const [tab, setTab] = useState<'profile' | 'users' | 'permissions' | 'platforms'>('profile');
  const canManageUsers = hasPermission('manage_users');

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="الإعدادات"
        subtitle="الملف الشخصي وإدارة المستخدمين والصلاحيات"
        icon={SettingsIcon}
      />

      <div className="flex gap-1 p-1 rounded-xl bg-navy-50 w-fit flex-wrap">
        <button onClick={() => setTab('profile')} className={classNames('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'profile' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
          الملف الشخصي
        </button>
        {canManageUsers && (
          <>
            <button onClick={() => setTab('users')} className={classNames('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'users' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              المستخدمون
            </button>
            <button onClick={() => setTab('permissions')} className={classNames('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'permissions' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              الصلاحيات
            </button>
            <button onClick={() => setTab('platforms')} className={classNames('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'platforms' ? 'bg-white text-araak-700 shadow-sm' : 'text-navy-500')}>
              المنصات الخارجية
            </button>
          </>
        )}
      </div>

      {tab === 'profile' && member && <ProfileTab member={member} />}
      {tab === 'users' && canManageUsers && <UsersTab />}
      {tab === 'permissions' && canManageUsers && <PermissionsTab />}
      {tab === 'platforms' && canManageUsers && <PlatformsTab />}
    </div>
  );
}

function ProfileTab({ member }: { member: TeamMember }) {
  return (
    <div className="max-w-2xl">
      <GlassCard className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-araak-400 to-araak-600 text-white text-2xl flex items-center justify-center font-bold">
            {initials(member.full_name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900">{member.full_name}</h2>
            <p className="text-araak-700 font-medium text-sm">{ROLE_LABELS[member.role_key] ?? member.title}</p>
            <p className="text-navy-500 text-xs mt-1" dir="ltr">{member.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InfoCell label="القسم" value={member.department_name ?? '—'} />
          <InfoCell label="تاريخ الانضمام" value={member.hire_date} />
          <InfoCell label="الهاتف" value={member.phone ?? '—'} />
          <InfoCell label="الحالة" value={member.is_active ? 'نشط' : 'غير نشط'} />
        </div>
        {member.bio && (
          <div className="mt-5 pt-5 border-t border-navy-100">
            <p className="text-sm font-semibold text-navy-900 mb-1">نبذة</p>
            <p className="text-sm text-navy-600 leading-relaxed">{member.bio}</p>
          </div>
        )}
        {member.specialties.length > 0 && (
          <div className="mt-5 pt-5 border-t border-navy-100">
            <p className="text-sm font-semibold text-navy-900 mb-2">التخصصات</p>
            <div className="flex flex-wrap gap-2">
              {member.specialties.map((s, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-araak-50 text-araak-700">{s}</span>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-navy-50">
      <p className="text-[11px] text-navy-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function UsersTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('team_members').select(`
        *,
        department:departments(*)
      `).order('role_key');
      if (data) setMembers(data as unknown as TeamMember[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-navy-900">أعضاء فريق أراك ({members.length})</h3>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-araak-500 text-white text-sm font-semibold hover:bg-araak-600">
          <Plus className="w-4 h-4" /> إضافة عضو
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => (
          <GlassCard key={m.id} hover className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-araak-400 to-araak-600 text-white text-sm flex items-center justify-center font-bold">
                {initials(m.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-navy-900 text-sm truncate">{m.full_name}</h4>
                <p className="text-xs text-araak-700">{ROLE_LABELS[m.role_key]}</p>
              </div>
              <span className={classNames('w-2 h-2 rounded-full', m.is_active ? 'bg-emerald-500' : 'bg-gray-300')} />
            </div>
            <div className="text-xs text-navy-500 space-y-1">
              <p className="truncate" dir="ltr">{m.email}</p>
              {m.department_name && <p>{m.department_name}</p>}
            </div>
          </GlassCard>
        ))}
      </div>
      {showForm && <UserAddForm onClose={() => setShowForm(false)} onSaved={() => setShowForm(false)} />}
    </div>
  );
}

function UserAddForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [formData, setFormData] = useState({ full_name: '', email: '', title: '', role_key: 'executive_followup' as string, specialties: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    // إنشاء حساب Auth + بطاقات فريق
    const { error: authError } = await supabase.auth.admin.createUser({
      email: formData.email,
      password: formData.password || 'TempPass123!',
      email_confirm: true,
    });
    if (authError) {
      setError(`فشل إنشاء الحساب: ${authError.message}`);
      setSubmitting(false);
      return;
    }
    const { error: memberError } = await supabase.from('team_members').insert({
      full_name: formData.full_name,
      email: formData.email,
      title: formData.title || null,
      role_key: formData.role_key,
      specialties: formData.specialties ? formData.specialties.split(',').map((s) => s.trim()) : [],
      is_active: true,
    });
    if (memberError) {
      setError(`تم إنشاء الحساب لكن فشلت إضافة بطاقة الفريق: ${memberError.message}`);
    } else {
      onSaved();
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-navy-100">
          <h2 className="text-xl font-bold text-navy-900">إضافة عضو جديد</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">الاسم الكامل *</label>
            <input required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">البريد *</label>
              <input required type="email" dir="ltr" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">كلمة مرور مؤقتة</label>
              <input dir="ltr" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="TempPass123!" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">الدور</label>
            <select value={formData.role_key} onChange={(e) => setFormData({ ...formData, role_key: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900">
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">المسمى الوظيفي</label>
            <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">التخصصات (مفصولة بفاصلة)</label>
            <input value={formData.specialties} onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="الاستثمار، التسويق" />
          </div>
          {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60">
              {submitting ? 'جارٍ الإضافة...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermissionsTab() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('');

  useEffect(() => {
    (async () => {
      const [permsRes, membersRes] = await Promise.all([
        supabase.from('permissions').select('*').order('category, label'),
        supabase.from('team_members').select('*').order('role_key'),
      ]);
      if (permsRes.data) setPermissions(permsRes.data as Permission[]);
      if (membersRes.data) {
        const membersData = membersRes.data as TeamMember[];
        setMembers(membersData);
        if (membersData.length > 0) setSelectedMember(membersData[0].id);
        // قراءة الصلاحيات المخصصة لكل عضو
        const userPerms: Record<string, Record<string, boolean>> = {};
        const { data: upData } = await supabase.from('user_permissions').select('*');
        if (upData) {
          for (const up of upData as { team_member_id: string; permission_key: string; granted: boolean }[]) {
            if (!userPerms[up.team_member_id]) userPerms[up.team_member_id] = {};
            userPerms[up.team_member_id][up.permission_key] = up.granted;
          }
        }
        setUserPermissions(userPerms);
      }
      setLoading(false);
    })();
  }, []);

  const togglePermission = async (memberId: string, permKey: string) => {
    const currentGranted = userPermissions[memberId]?.[permKey] ?? null;
    if (currentGranted === true) {
      // حذف الصلاحية الممنوحة
      await supabase.from('user_permissions').delete().eq('team_member_id', memberId).eq('permission_key', permKey);
      setUserPermissions((prev) => {
        const next = { ...prev };
        if (next[memberId]) delete next[memberId][permKey];
        return next;
      });
    } else {
      // منح الصلاحية
      await supabase.from('user_permissions').upsert({
        team_member_id: memberId,
        permission_key: permKey,
        granted: true,
      });
      setUserPermissions((prev) => ({
        ...prev,
        [memberId]: { ...(prev[memberId] ?? {}), [permKey]: true },
      }));
    }
  };

  if (loading) return <LoadingState />;

  const selectedMemberObj = members.find((m) => m.id === selectedMember);
  const groupedPerms = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const categoryLabels: Record<string, string> = {
    modules: 'الأقسام الرئيسية',
    stages: 'مراحل المنافسة',
    admin: 'صلاحيات إدارية',
  };

  return (
    <div className="space-y-4">
      <div className="mb-3">
        <label className="block text-sm font-medium text-navy-700 mb-1.5">اختر المستخدم</label>
        <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}
          className="glass-input px-4 py-2.5 rounded-xl text-navy-900 max-w-md">
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name} — {ROLE_LABELS[m.role_key]}</option>
          ))}
        </select>
      </div>

      {selectedMemberObj && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-navy-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-araak-400 to-araak-600 text-white text-sm flex items-center justify-center font-bold">
              {initials(selectedMemberObj.full_name)}
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-sm">{selectedMemberObj.full_name}</h3>
              <p className="text-xs text-araak-700">{ROLE_LABELS[selectedMemberObj.role_key]}</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedPerms).map(([cat, perms]) => (
              <div key={cat}>
                <h4 className="text-xs font-bold text-navy-400 uppercase mb-2">{categoryLabels[cat] ?? cat}</h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {perms.map((p) => {
                    const isGranted = userPermissions[selectedMember]?.[p.key] === true;
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePermission(selectedMember, p.key)}
                        className={classNames(
                          'flex items-center justify-between p-3 rounded-xl border text-right transition-all',
                          isGranted ? 'bg-emerald-50 border-emerald-200' : 'bg-navy-50 border-navy-100 hover:border-navy-200'
                        )}
                      >
                        <div>
                          <div className="text-sm font-semibold text-navy-900">{p.label}</div>
                          {p.description && <div className="text-[11px] text-navy-500">{p.description}</div>}
                        </div>
                        <div className={classNames(
                          'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0',
                          isGranted ? 'bg-emerald-500 text-white' : 'bg-white border border-navy-200'
                        )}>
                          {isGranted && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function PlatformsTab() {
  const [platforms, setPlatforms] = useState<ExternalPlatform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('external_platforms').select('*');
      if (data) setPlatforms(data as ExternalPlatform[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 bg-gold-50 border border-gold-100">
        <div className="flex items-start gap-2">
          <Star className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gold-800">
            هذه قائمة منصات المنافسات العامة التي يمكن التكامل معها مستقبلاً لمزامنة الفرص تلقائياً — اعتماد، فرصة، منافس. التكامل سيفعل قريباً.
          </p>
        </div>
      </GlassCard>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((p) => (
          <GlassCard key={p.id} hover className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-navy-900 text-sm">{p.name}</h3>
                <div className="flex items-center gap-1 text-[11px] text-navy-500">
                  <LinkIcon className="w-3 h-3" />
                  <span className="truncate" dir="ltr">{p.base_url}</span>
                </div>
              </div>
            </div>
            {p.description && <p className="text-xs text-navy-500 leading-relaxed mb-3">{p.description}</p>}
            <div className="flex items-center justify-between pt-3 border-t border-navy-50">
              <span className={classNames('text-[10px] px-2 py-0.5 rounded-full font-medium', p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50 text-navy-500')}>
                {p.is_active ? 'متاح' : 'قريباً'}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

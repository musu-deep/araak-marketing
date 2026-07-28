import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { EmptyState, GlassCard, LoadingState, SectionHeader } from '@/components/ui/primitives';
import { fetchOdooEmployees, type OdooEmployee } from '@/lib/institutional-api';
import { formatDate, initials } from '@/lib/constants';

export function TeamPage() {
  const { isAdmin, member, session } = useAuth();
  const [employees, setEmployees] = useState<OdooEmployee[]>([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!session?.access_token) return;
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchOdooEmployees(session.access_token);
      setEmployees(result.employees);
      setDirectoryTotal(result.directoryTotal);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل دليل الموظفين من Odoo.');
      setEmployees([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useEffect(() => { void load(); }, [load]);

  const fallbackEmployee = useMemo<OdooEmployee | null>(() => {
    if (!member) return null;
    return {
      id: member.id,
      odoo_id: 0,
      source: 'odoo',
      employee_number: member.id,
      name: member.full_name,
      full_name: member.full_name,
      email: member.email,
      work_email: member.email,
      work_phone: '',
      mobile_phone: member.phone ?? '',
      phone: member.phone ?? '',
      title: member.title,
      job_title: member.title,
      department: member.department_name ?? '',
      department_id: null,
      manager: '',
      manager_id: null,
      coach: '',
      entity: 'مجموعة اراك للتنمية',
      location: '',
      employee_type: 'employee',
      hire_date: member.hire_date,
      active: member.is_active,
      created_at: null,
      updated_at: null,
    };
  }, [member]);

  const visibleEmployees = employees.length > 0
    ? employees
    : fallbackEmployee
      ? [fallbackEmployee]
      : [];

  const departmentCount = new Set(
    visibleEmployees.map((employee) => employee.department).filter(Boolean)
  ).size;

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="فريق المنصة"
        subtitle={isAdmin
          ? 'دليل الموظفين المؤسسي المستدعى مباشرة من Odoo'
          : 'بياناتك الوظيفية كما هي مسجلة في Odoo'}
        icon={Users}
        action={(
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 hover:border-araak-300 hover:text-araak-700 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث من Odoo
          </button>
        )}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-semibold text-emerald-800">المصدر المؤسسي: Odoo</div>
          <p className="text-xs text-emerald-700 mt-0.5">
            لا تُدخل بيانات الأعضاء في هذه المنصة مرة أخرى؛ الاسم والمسمى والإدارة والجوال والحالة الوظيفية تأتي من النظام المركزي.
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="grid sm:grid-cols-3 gap-3">
          <GlassCard className="p-4">
            <div className="text-xs text-navy-500">الموظفون الظاهرون</div>
            <div className="text-2xl font-bold text-navy-900 mt-1">{visibleEmployees.length}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-xs text-navy-500">إجمالي دليل Odoo</div>
            <div className="text-2xl font-bold text-araak-700 mt-1">{directoryTotal || visibleEmployees.length}</div>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="text-xs text-navy-500">الإدارات الممثلة</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{departmentCount}</div>
          </GlassCard>
        </div>
      )}

      {!isAdmin && (
        <GlassCard className="p-4 bg-araak-50 border border-araak-100">
          <p className="text-sm text-araak-800">تعرض لك المنصة بياناتك الوظيفية فقط، بينما تظهر الإدارة الدليل المؤسسي الكامل.</p>
        </GlassCard>
      )}

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error} تم عرض بيانات العضوية المحلية المؤقتة بدلًا من ذلك.
        </div>
      )}

      {visibleEmployees.length === 0 ? (
        <GlassCard>
          <EmptyState icon={Users} title="لا يوجد موظفون ظاهرون" description="لم يعثر Odoo على سجل وظيفي مرتبط بحسابك المؤسسي" />
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEmployees.map((employee) => (
            <GlassCard key={employee.id} hover className="p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-araak-400 to-araak-600 text-white text-lg flex items-center justify-center font-bold flex-shrink-0">
                  {initials(employee.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy-900 text-sm">{employee.name}</h3>
                  <p className="text-xs text-araak-700 font-medium">{employee.job_title || 'موظف مؤسسي'}</p>
                  {employee.department && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy-50 text-navy-700">
                      <Building2 className="w-3 h-3" /> {employee.department}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                موظف نشط ومزامن من Odoo
              </div>

              <div className="space-y-2 text-xs text-navy-500 pt-3 border-t border-navy-50">
                {employee.work_email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate" dir="ltr">{employee.work_email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />
                    <span className="truncate" dir="ltr">{employee.phone}</span>
                  </div>
                )}
                {employee.manager && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3" />
                    <span>المدير: {employee.manager}</span>
                  </div>
                )}
                {employee.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>{employee.location}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>منضم منذ {formatDate(employee.hire_date)}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

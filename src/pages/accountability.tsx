import { useEffect, useState } from 'react';
import { BellRing, AlertTriangle, Clock, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, LoadingState, EmptyState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { ALERT_SEVERITY_CONFIG, formatDate, classNames, initials } from '@/lib/constants';
import type { AccountabilityAlert, TeamMember } from '@/lib/types';

export function AccountabilityPage() {
  const { member, isAdmin } = useAuth();
  const [alerts, setAlerts] = useState<AccountabilityAlert[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    (async () => {
      if (!member) return;
      setLoading(true);
      let query = supabase.from('accountability_alerts').select(`
        *,
        target_member_obj:team_members!accountability_alerts_target_member_fkey(id, full_name, email, role_key)
      `);
      if (!isAdmin) {
        query = query.or(`target_member.eq.${member.id},created_by.eq.${member.id}`);
      }
      const { data } = await query.order('created_at', { ascending: false });
      if (data) setAlerts(data as AccountabilityAlert[]);

      if (isAdmin) {
        const { data: members } = await supabase.from('team_members').select('*').eq('is_active', true);
        if (members) setTeamMembers(members as TeamMember[]);
      }
      setLoading(false);
    })();
  }, [member, isAdmin]);

  const markAsRead = async (id: string) => {
    await supabase.from('accountability_alerts').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  };

  const filtered = filter === 'unread' ? alerts.filter((a) => !a.is_read) : alerts;

  if (loading) return <LoadingState />;

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="المتابعة والمساءلة"
        subtitle="تنبيهات المتابعة والتصعيد الآلي"
        icon={BellRing}
      />

      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={classNames('px-4 py-2 rounded-xl text-sm font-medium', filter === 'all' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}>
          الكل ({alerts.length})
        </button>
        <button onClick={() => setFilter('unread')} className={classNames('px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2', filter === 'unread' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}>
          غير مقروء ({unreadCount})
        </button>
      </div>

      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState icon={BellRing} title="لا توجد تنبيهات" description="التنبيهات الفعالة ستظهر هنا" />
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const cfg = ALERT_SEVERITY_CONFIG[alert.severity];
            const target = alert.target_member_obj ?? teamMembers.find((m) => m.id === alert.target_member);
            return (
              <GlassCard key={alert.id} hover className={classNames('p-4', !alert.is_read && 'border-r-4 border-r-araak-500')}>
                <div className="flex items-start gap-3">
                  <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    {alert.severity === 'critical' || alert.severity === 'high' ? (
                      <AlertTriangle className={classNames('w-5 h-5', cfg.color)} />
                    ) : alert.is_read ? (
                      <CheckCircle2 className="w-5 h-5 text-navy-400" />
                    ) : (
                      <Clock className={classNames('w-5 h-5', cfg.color)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={classNames('font-semibold text-navy-900 text-sm', !alert.is_read && 'font-bold')}>{alert.title}</h3>
                      <span className={classNames('text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0', cfg.bg, cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    {alert.message && <p className="text-xs text-navy-600 mt-1 leading-relaxed">{alert.message}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-navy-500">
                      <span>{formatDate(alert.created_at)}</span>
                      {target && (
                        <span className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-[8px] flex items-center justify-center font-bold">
                            {initials(target.full_name)}
                          </div>
                          {target.full_name}
                        </span>
                      )}
                      {alert.due_date && <span>الموعد: {formatDate(alert.due_date)}</span>}
                      {alert.escalation_level > 0 && (
                        <span className="text-red-600 font-medium">تصعيد ({alert.escalation_level})</span>
                      )}
                    </div>
                  </div>
                  {!alert.is_read && (
                    <button onClick={() => markAsRead(alert.id)} className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400" title="تعليم كمقروء">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

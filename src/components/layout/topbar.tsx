import { useState, useEffect } from 'react';
import { Menu, Bell, Search, LogOut, ChevronDown, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, initials } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { AccountabilityAlert } from '@/lib/types';
import { ALERT_SEVERITY_CONFIG } from '@/lib/constants';
import { formatShortDate } from '@/lib/constants';

type PageKey =
  | 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team'
  | 'documents' | 'accountability' | 'lessons' | 'reports'
  | 'ai-advisor' | 'settings';

interface Props {
  onMenuClick: () => void;
  onNavigate: (p: PageKey) => void;
}

export function Topbar({ onMenuClick, onNavigate }: Props) {
  const { member, signOut } = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<AccountabilityAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!member) return;
    const loadAlerts = async () => {
      const { data } = await supabase
        .from('accountability_alerts')
        .select(`
          *,
          target_member_obj:team_members!accountability_alerts_target_member_fkey(id, full_name, email, role_key)
        `)
        .or(`target_member.eq.${member.id},created_by.eq.${member.id}`)
        .order('created_at', { ascending: false })
        .limit(8);
      if (data) {
        setAlerts(data as AccountabilityAlert[]);
        setUnreadCount(data.filter((a: AccountabilityAlert) => !a.is_read).length);
      }
    };
    loadAlerts();
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, [member]);

  const markAsRead = async (id: string) => {
    await supabase
      .from('accountability_alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <header className="sticky top-0 z-30 glass-nav">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-navy-600 hover:bg-navy-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 border border-navy-100 w-72">
            <Search className="w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="بحث في المنصة..."
              className="bg-transparent border-none outline-none text-sm w-full placeholder-navy-400 text-navy-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* التنبيهات */}
          <div className="relative">
            <button
              onClick={() => setAlertsOpen(!alertsOpen)}
              className="relative p-2.5 rounded-xl text-navy-600 hover:bg-navy-50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {unreadCount}
                </span>
              )}
            </button>

            {alertsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAlertsOpen(false)} />
                <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white shadow-glass-lg border border-navy-100 z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-navy-100 flex items-center justify-between">
                    <span className="font-semibold text-navy-900 text-sm">التنبيهات</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
                        {unreadCount} غير مقروء
                      </span>
                    )}
                  </div>
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-navy-400 text-sm">لا توجد تنبيهات</div>
                  ) : (
                    <div className="divide-y divide-navy-50">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-3 hover:bg-navy-50/50 cursor-pointer ${!alert.is_read ? 'bg-araak-50/50' : ''}`}
                          onClick={() => markAsRead(alert.id)}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`status-dot mt-1.5 ${
                              alert.severity === 'critical' ? 'bg-red-500' :
                              alert.severity === 'high' ? 'bg-orange-500' :
                              alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-navy-900 truncate">{alert.title}</p>
                              {alert.message && (
                                <p className="text-xs text-navy-600 mt-0.5 line-clamp-2">{alert.message}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${ALERT_SEVERITY_CONFIG[alert.severity].bg} ${ALERT_SEVERITY_CONFIG[alert.severity].color}`}>
                                  {ALERT_SEVERITY_CONFIG[alert.severity].label}
                                </span>
                                {alert.due_date && (
                                  <span className="text-[10px] text-navy-500">{formatShortDate(alert.due_date)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { onNavigate('accountability'); setAlertsOpen(false); }}
                    className="w-full px-4 py-3 text-center text-sm text-araak-700 hover:bg-araak-50 border-t border-navy-100 font-medium"
                  >
                    عرض كل التنبيهات
                  </button>
                </div>
              </>
            )}
          </div>

          {/* قائمة المستخدم */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-navy-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-xs flex items-center justify-center font-bold">
                {member ? initials(member.full_name) : ''}
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs font-semibold text-navy-900 leading-tight">{member?.full_name}</div>
                <div className="text-[10px] text-navy-500">{member ? ROLE_LABELS[member.role_key] : ''}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-navy-400 hidden md:block" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white shadow-glass-lg border border-navy-100 z-50 animate-scale-in overflow-hidden">
                  <div className="p-4 bg-gradient-to-l from-araak-50 to-navy-50 border-b border-navy-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-sm flex items-center justify-center font-bold">
                        {member ? initials(member.full_name) : ''}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-navy-900 truncate">{member?.full_name}</div>
                        <div className="text-[11px] text-navy-600 truncate">{member?.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { onNavigate('settings'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-navy-700 hover:bg-navy-50"
                    >
                      <UserIcon className="w-4 h-4" />
                      الملف الشخصي
                    </button>
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

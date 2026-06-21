import {
  LayoutDashboard, Radar, FileCog, ListTodo, Users, FolderOpen,
  BellRing, Lightbulb, BarChart3, Brain, Settings as SettingsIcon,
  X, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, initials } from '@/lib/constants';
import type { PermissionKey } from '@/lib/types';

type PageKey =
  | 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team'
  | 'documents' | 'accountability' | 'lessons' | 'reports'
  | 'ai-advisor' | 'settings';

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm: PermissionKey;
  group: 'main' | 'tools' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'اللوحة التنفيذية', icon: LayoutDashboard, perm: 'dashboard', group: 'main' },
  { key: 'opportunities', label: 'رادار الفرص', icon: Radar, perm: 'opportunity_radar', group: 'main' },
  { key: 'tenders', label: 'إدارة المناقصات', icon: FileCog, perm: 'tender_management', group: 'main' },
  { key: 'tasks', label: 'إدارة المهام', icon: ListTodo, perm: 'tasks', group: 'main' },
  { key: 'team', label: 'تعاون الفريق', icon: Users, perm: 'team', group: 'main' },
  { key: 'documents', label: 'مركز الوثائق', icon: FolderOpen, perm: 'documents', group: 'main' },
  { key: 'accountability', label: 'المتابعة والمساءلة', icon: BellRing, perm: 'accountability', group: 'main' },
  { key: 'ai-advisor', label: 'مستشار AI', icon: Brain, perm: 'ai_advisor', group: 'tools' },
  { key: 'lessons', label: 'الدروس المستفادة', icon: Lightbulb, perm: 'lessons', group: 'tools' },
  { key: 'reports', label: 'التقارير التنفيذية', icon: BarChart3, perm: 'reports', group: 'tools' },
  { key: 'settings', label: 'الإعدادات', icon: SettingsIcon, perm: 'settings', group: 'admin' },
];

const GROUP_LABELS: Record<string, string> = {
  main: 'الرئيسية',
  tools: 'الأدوات التحليلية',
  admin: 'الإدارة',
};

interface Props {
  currentPage: PageKey;
  onNavigate: (p: PageKey) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ currentPage, onNavigate, isOpen, onClose }: Props) {
  const { member, hasPermission } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.perm));
  const groups = Array.from(new Set(visibleItems.map((i) => i.group)));

  return (
    <>
      {/* Overlay للموبايل */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 z-50 h-screen w-72 flex flex-col
          bg-white/90 backdrop-blur-xl border-l border-navy-100
          transition-transform duration-300 ease-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* الهيدر */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-navy-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-navy-100 shadow-sm overflow-hidden">
    <img
      src="/Araak-logo.png"
      alt="شعار أراك"
      className="h-10 w-auto object-contain"
    />
  </div>

  <div className="min-w-0">
    <div className="font-bold text-navy-900 text-base leading-tight">
      مجموعة أراك
    </div>
    <div className="text-[11px] text-navy-500 font-medium truncate">
      منصة إدارة المنافسات والمشاريع
    </div>
  </div>
</div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-navy-500 hover:bg-navy-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* التنقل */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 mb-2 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">
                {GROUP_LABELS[group]}
              </p>
              <div className="space-y-1">
                {visibleItems
                  .filter((i) => i.group === group)
                  .map((item) => {
                    const active = currentPage === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => onNavigate(item.key)}
                        className={`nav-link w-full ${active ? 'nav-link-active' : 'nav-link-inactive'} group`}
                      >
                        <item.icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-navy-500 group-hover:text-araak-600'}`} />
                        <span className="flex-1 text-right">{item.label}</span>
                        {active && <ChevronLeft className="w-4 h-4 text-white/80" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        {/* بطاقة المستخدم */}
        {member && (
          <div className="p-4 border-t border-navy-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-l from-araak-50 to-navy-50 border border-araak-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                {initials(member.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy-900 truncate">{member.full_name}</div>
                <div className="text-[11px] text-navy-600 truncate">
                  {ROLE_LABELS[member.role_key] ?? member.title}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

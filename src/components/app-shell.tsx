import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { DashboardPage } from '@/pages/dashboard';
import { OpportunityRadarPage } from '@/pages/opportunity-radar';
import { TenderManagementPage } from '@/pages/tender-management';
import { TaskManagementPage } from '@/pages/tasks';
import { TeamPage } from '@/pages/team';
import { DocumentsPage } from '@/pages/documents';
import { AccountabilityPage } from '@/pages/accountability';
import { LessonsPage } from '@/pages/lessons';
import { ReportsPage } from '@/pages/reports';
import { AiAdvisorPage } from '@/pages/ai-advisor';
import { SettingsPage } from '@/pages/settings';
import { UnauthorizedPage } from '@/pages/unauthorized';
import type { PermissionKey } from '@/lib/types';

type PageKey =
  | 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team'
  | 'documents' | 'accountability' | 'lessons' | 'reports'
  | 'ai-advisor' | 'settings';

const PAGE_PERMISSION: Partial<Record<PageKey, PermissionKey>> = {
  dashboard: 'dashboard',
  opportunities: 'opportunity_radar',
  tenders: 'tender_management',
  tasks: 'tasks',
  team: 'team',
  documents: 'documents',
  accountability: 'accountability',
  lessons: 'lessons',
  reports: 'reports',
  'ai-advisor': 'ai_advisor',
  settings: 'settings',
};

export function AppShell() {
  const { member, hasPermission } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // استرجاع الصفحة من hash
  useEffect(() => {
    const restore = () => {
      const hash = window.location.hash.slice(1) as PageKey;
      if (hash && hash in PAGE_PERMISSION) setPage(hash);
    };
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);

  const navigate = useCallback((p: PageKey) => {
    setPage(p);
    window.location.hash = p;
    setSidebarOpen(false);
  }, []);

  const requiredPerm = PAGE_PERMISSION[page];
  const hasAccess = requiredPerm ? hasPermission(requiredPerm) : true;

  if (!member) {
    return <UnauthorizedPage reason="no_member" />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <Sidebar
          currentPage={page}
          onNavigate={navigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <Topbar onMenuClick={() => setSidebarOpen(true)} onNavigate={navigate} />
          <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
            {!hasAccess ? (
              <UnauthorizedPage reason="denied" page={page} onBack={() => navigate('dashboard')} />
            ) : (
              <div key={page} className="animate-fade-in">
                {page === 'dashboard' && <DashboardPage onNavigate={navigate} />}
                {page === 'opportunities' && <OpportunityRadarPage onNavigate={navigate} />}
                {page === 'tenders' && <TenderManagementPage onNavigate={navigate} />}
                {page === 'tasks' && <TaskManagementPage />}
                {page === 'team' && <TeamPage />}
                {page === 'documents' && <DocumentsPage />}
                {page === 'accountability' && <AccountabilityPage />}
                {page === 'lessons' && <LessonsPage />}
                {page === 'reports' && <ReportsPage />}
                {page === 'ai-advisor' && <AiAdvisorPage />}
                {page === 'settings' && <SettingsPage />}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { DashboardPage } from '@/pages/dashboard';
import { OpportunityTenderHubPage } from '@/pages/opportunity-tender-hub';
import { TaskManagementPage } from '@/pages/tasks';
import { TeamPage } from '@/pages/team';
import { DocumentsPage } from '@/pages/documents';
import { AccountabilityPage } from '@/pages/accountability';
import { LessonsPage } from '@/pages/lessons';
import { ReportsPage } from '@/pages/reports';
import { AiAdvisorPage } from '@/pages/ai-advisor';
import { ExecutiveControlPage } from '@/pages/executive-control';
import { PricingMatrixPage } from '@/pages/pricing-matrix';
import { SettingsPage } from '@/pages/settings';
import { UnauthorizedPage } from '@/pages/unauthorized';
import type { PermissionKey } from '@/lib/types';

type PageKey =
  | 'dashboard' | 'opportunities' | 'tenders' | 'tasks' | 'team'
  | 'documents' | 'accountability' | 'lessons' | 'reports'
  | 'ai-advisor' | 'executive-control' | 'pricing-matrix' | 'settings';

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
  'executive-control': 'executive_management' as PermissionKey,
  'pricing-matrix': 'pricing_matrix' as PermissionKey,
  settings: 'settings',
};

const EXECUTIVE_PAGES: PageKey[] = ['executive-control', 'pricing-matrix'];

export function AppShell() {
  const { member, hasPermission } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const restore = () => {
      const hash = window.location.hash.slice(1) as PageKey;
      if (hash && hash in PAGE_PERMISSION) setPage(hash);
    };
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);

  const navigate = useCallback((nextPage: PageKey) => {
    setPage(nextPage);
    window.location.hash = nextPage;
    setSidebarOpen(false);
  }, []);

  const requiredPermission = PAGE_PERMISSION[page];
  const hasExecutiveRole = member ? ['ceo', 'vp'].includes(member.role_key) : false;
  const roleAllowsPage = !EXECUTIVE_PAGES.includes(page) || hasExecutiveRole;
  const hasAccess = roleAllowsPage && (requiredPermission ? hasPermission(requiredPermission) : true);

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
                {page === 'opportunities' && <OpportunityTenderHubPage onNavigate={navigate} initialTab="opportunities" />}
                {page === 'tenders' && <OpportunityTenderHubPage onNavigate={navigate} initialTab="tenders" />}
                {page === 'tasks' && <TaskManagementPage />}
                {page === 'team' && <TeamPage />}
                {page === 'documents' && <DocumentsPage />}
                {page === 'accountability' && <AccountabilityPage />}
                {page === 'lessons' && <LessonsPage />}
                {page === 'reports' && <ReportsPage />}
                {page === 'ai-advisor' && <AiAdvisorPage />}
                {page === 'executive-control' && <ExecutiveControlPage />}
                {page === 'pricing-matrix' && <PricingMatrixPage />}
                {page === 'settings' && <SettingsPage />}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

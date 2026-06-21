import { useAuth } from '@/lib/auth-context';
import { LandingPage } from '@/pages/landing';
import { AppShell } from '@/components/app-shell';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-araak-900 to-navy-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-araak-400 to-araak-600 flex items-center justify-center animate-glow-pulse">
              <img
                src="/araak-logo.png"
                alt="شعار أراك"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <div className="text-white/90 text-sm font-medium animate-pulse">
            جارٍ تحميل منصة أراك...
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  return <AppShell />;
}
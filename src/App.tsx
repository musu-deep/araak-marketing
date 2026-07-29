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
            <div className="absolute inset-0 rounded-[22px] bg-araak-400/25 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-[22px] bg-white/95 border border-white/70 shadow-[0_20px_45px_-18px_rgba(34,211,238,.55)] flex items-center justify-center animate-glow-pulse overflow-hidden">
              <img
                src="/favicon.svg"
                alt="شعار اراك"
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <div className="text-white/90 text-sm font-medium animate-pulse">
            جارٍ تحميل منصة اراك...
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

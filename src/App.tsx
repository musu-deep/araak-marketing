import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LandingPage } from '@/pages/landing';
import { AppShell } from '@/components/app-shell';

export default function App() {
  const { session, loading } = useAuth();
  const [showLanding, setShowLanding] = useState(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-araak-900 to-navy-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-araak-400 to-araak-600 flex items-center justify-center animate-glow-pulse">
              <svg viewBox="0 0 48 48" className="w-10 h-10 text-white" fill="none">
                <path d="M24 10 L36 18 V30 L24 38 L12 30 V18 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.9"/>
                <path d="M18 30 L24 19 L30 30 M20 26 H28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="text-white/90 text-sm font-medium animate-pulse">جارٍ تحميل منصة أراك...</div>
        </div>
      </div>
    );
  }

  if (!session || showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} showApp={!!session} />;
  }

  return <AppShell />;
}

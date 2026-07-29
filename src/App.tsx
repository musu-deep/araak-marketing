import { useAuth } from '@/lib/auth-context';
import { LandingPage } from '@/pages/landing';
import { AppShell } from '@/components/app-shell';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="relative min-h-screen overflow-hidden flex items-center justify-center bg-navy-950"
        style={{
          background:
            'radial-gradient(circle at 50% 44%, rgba(20,184,166,.24), transparent 30%), radial-gradient(circle at 18% 20%, rgba(14,165,233,.10), transparent 30%), linear-gradient(135deg, #071827 0%, #0b3440 48%, #08212e 100%)',
        }}
      >
        <style>{`
          @keyframes araak-loader-orbit {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes araak-loader-orbit-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          @keyframes araak-loader-float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-7px) scale(1.025); }
          }
          @keyframes araak-loader-shimmer {
            0% { transform: translateX(110%); }
            100% { transform: translateX(-110%); }
          }
        `}</style>

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage: 'radial-gradient(circle at center, black, transparent 72%)',
          }}
        />

        <div className="absolute top-[18%] right-[18%] w-64 h-64 rounded-full bg-araak-400/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[16%] left-[16%] w-72 h-72 rounded-full bg-sky-400/10 blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <div className="relative w-52 h-52 flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border border-white/8" />
            <div
              className="absolute inset-5 rounded-full border border-dashed border-araak-300/30"
              style={{ animation: 'araak-loader-orbit 11s linear infinite' }}
            />
            <div
              className="absolute inset-10 rounded-full border border-dotted border-sky-300/25"
              style={{ animation: 'araak-loader-orbit-reverse 8s linear infinite' }}
            />
            <div className="absolute inset-12 rounded-full bg-araak-300/15 blur-2xl animate-pulse" />

            <img
              src="/favicon.svg"
              alt="شعار اراك"
              className="relative z-10 h-32 w-32 object-contain drop-shadow-[0_0_34px_rgba(45,212,191,.32)]"
              style={{ animation: 'araak-loader-float 3.4s ease-in-out infinite' }}
            />
          </div>

          <div className="-mt-2 space-y-2">
            <h1 className="text-white text-xl sm:text-2xl font-bold tracking-tight">
              جارٍ تهيئة مساحة العمل
            </h1>
            <p className="text-white/55 text-xs sm:text-sm font-medium">
              نرتّب بيانات المنصة ونجهّز لوحة المتابعة
            </p>
          </div>

          <div className="mt-7 w-52 sm:w-64">
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              <div className="absolute inset-y-0 right-0 w-[72%] rounded-full bg-gradient-to-l from-araak-300 via-cyan-300 to-sky-300 shadow-[0_0_16px_rgba(45,212,191,.45)]" />
              <div
                className="absolute inset-y-0 w-20 bg-gradient-to-l from-transparent via-white/70 to-transparent"
                style={{ animation: 'araak-loader-shimmer 1.7s ease-in-out infinite' }}
              />
            </div>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-araak-300 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-araak-300/70 animate-pulse" style={{ animationDelay: '180ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-araak-300/40 animate-pulse" style={{ animationDelay: '360ms' }} />
            </div>
          </div>

          <div className="mt-8 text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-white/25">
            ARAAK Marketing Platform
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

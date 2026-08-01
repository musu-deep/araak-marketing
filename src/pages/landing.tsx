import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Bell,
  Brain,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Mail,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Workflow,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signIn(email, password);
    if (result.error) setError(result.error);
    setSubmitting(false);
  };

  const features = [
    { icon: Radar, title: 'رادار الفرص', desc: 'استكشاف وإدارة المنافسات والفرص الاستثمارية' },
    { icon: Brain, title: 'مستشار AI', desc: 'تقييم احتمالية الفوز وتحليل المخاطر بالذكاء الاصطناعي' },
    { icon: Workflow, title: 'إدارة المناقصات', desc: 'سير عمل متكامل من الاستقبال إلى النتيجة' },
    { icon: Users, title: 'فريق المنصة', desc: 'إدارة الفريق التشغيلي والمسؤوليات والصلاحيات' },
    { icon: FileText, title: 'مركز الوثائق', desc: 'إدارة المستندات والإصدارات والقوالب' },
    { icon: Bell, title: 'المتابعة التنفيذية', desc: 'تنبيهات ذكية وتصعيد آلي للمسؤوليات' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-araak-950">
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-araak-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <header className="relative z-10 px-6 lg:px-12 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-white/10">
              <img src="/araak-logo.png" alt="شعار مجموعة اراك" className="h-12 lg:h-14 w-auto object-contain" />
            </div>
            <div>
              <div className="text-white font-bold text-2xl leading-tight">مجموعة اراك</div>
              <div className="text-araak-300 text-sm font-medium">Araak Marketing Platform</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-navy-200">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-araak-400" /> دخول مؤسسي آمن</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold-400" /> تشغيل متكامل</span>
          </div>
        </nav>
      </header>

      <main className="relative z-10 px-6 lg:px-12 pb-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 items-start pt-8">
          <div className="lg:col-span-7 space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border border-white/10">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-navy-100 text-sm font-medium">منصة التسويق والمناقصات لمجموعة اراك</span>
            </div>

            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] text-balance">
                منصة إدارة المنافسات
                <br />
                <span className="gradient-text-gold">وتسويق المشاريع</span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-navy-200 leading-relaxed max-w-2xl">
                منظومة رقمية متكاملة لإدارة ومتابعة المنافسات والمشاريع، من استكشاف الفرص ودراسة الكراسة حتى الاعتماد والرفع ونتائج المنافسة.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature.title} className="group glass-dark rounded-xl p-4 border border-white/10 hover:border-araak-400/40 transition-all duration-300 hover:translate-x-1">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-araak-500/20 flex items-center justify-center group-hover:bg-araak-500/30 transition-colors flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-araak-300" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                      <p className="text-navy-300 text-xs leading-relaxed mt-1">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-8 animate-scale-in">
            <div className="glass-card rounded-3xl p-8 shadow-glass-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center mb-4">
                  <div className="bg-white rounded-2xl p-3 shadow-lg border border-navy-100">
                    <img src="/araak-logo.png" alt="شعار مجموعة اراك" className="h-16 w-auto object-contain" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-navy-900">الدخول إلى المنصة</h2>
                <p className="text-navy-600 text-sm mt-1">استخدم بيانات الدخول المؤسسية المعتمدة</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">البريد المؤسسي</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@araak.org"
                      className="glass-input w-full pr-10 pl-4 py-3 rounded-xl text-navy-900 placeholder-navy-400"
                      dir="ltr"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="كلمة المرور"
                      className="glass-input w-full pr-10 pl-12 py-3 rounded-xl text-navy-900 placeholder-navy-400"
                      dir="ltr"
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-araak-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-navy-500">يتم التحقق من الحساب المؤسسي تلقائيًا.</p>
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جارٍ التحقق...</>
                  ) : (
                    <>دخول المنصة <ArrowLeft className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-navy-300 px-2">
              <Shield className="w-3.5 h-3.5 text-araak-400 mt-0.5" />
              <span>تتم معالجة بيانات الدخول عبر قناة مؤسسية آمنة.</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16">
          <div className="glass-dark rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-gold-400" /></div>
              <div>
                <h3 className="text-white font-bold text-lg">لماذا منصة اراك؟</h3>
                <p className="text-navy-300 text-sm">قيمة مضافة على كل مستوى</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'وضوح دورة المنافسة', desc: 'مسار واحد يربط الفرصة والدراسة والتسعير والاعتماد والرفع النهائي.' },
                { title: 'بيانات تشغيلية متكاملة', desc: 'الفريق والمسؤوليات والمشروعات والوثائق في بيئة عمل موحدة.' },
                { title: 'متابعة زمنية ورقابية', desc: 'تزمين المسؤوليات وقياس الإنجاز وتصعيد التعثر مبكرًا.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-araak-500/30 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle2 className="w-4 h-4 text-araak-300" /></div>
                  <div>
                    <h5 className="text-white font-semibold text-sm">{item.title}</h5>
                    <p className="text-navy-300 text-xs leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 lg:px-12 py-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-navy-400">
          <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-araak-400" /><span>منصة اراك لإدارة المنافسات والمشاريع — جميع الحقوق محفوظة</span></div>
          <span>ARAAK Marketing Enterprise v3.0</span>
        </div>
      </footer>
    </div>
  );
}

function Radar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
      <path d="M4 6h.01" />
      <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
      <path d="M16.24 7.76a6 6 0 1 0-8.49 8.49" />
      <path d="M12 18h.01" />
      <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67" />
      <circle cx="12" cy="12" r="2" />
      <path d="M13.41 10.59l5.66-5.66" />
    </svg>
  );
}
import { useState, type FormEvent } from 'react';
import {
  Building2, Layers, Target, TrendingUp, Users, FileText,
  Bell, Shield, Brain, CheckCircle2, ArrowLeft, Eye, EyeOff,
  ChevronRight, Sparkles, Gauge, Workflow, Award, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/constants';

interface Props {
  onEnter: () => void;
  showApp: boolean;
}

export function LandingPage({ onEnter, showApp }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    if (error) {
      setError(error === 'Invalid login credentials'
        ? 'بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.'
        : error);
    }
    setSubmitting(false);
  };

  const features = [
    { icon: Radar, title: 'رادار الفرص', desc: 'استكشاف وإدارة المنافسات والفرص الاستثمارية' },
    { icon: Brain, title: 'مستشار AI', desc: 'تقييم احتمالية الفوز وتحليل المخاطر بالذكاء الاصطناعي' },
    { icon: Workflow, title: 'إدارة المناقصات', desc: 'سير عمل متكامل من الاستقبال إلى النتيجة' },
    { icon: Users, title: 'تعاون الفريق', desc: 'إسناد المهام حسب التخصص ومصفوفة المسؤوليات' },
    { icon: FileText, title: 'مركز الوثائق', desc: 'إدارة المستندات والإصدارات والقوالب' },
    { icon: Bell, title: 'المتابعة والمساءلة', desc: 'تنبيهات ذكية وتصعيد آلي للمسؤوليات' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-araak-950">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 bg-mesh opacity-60" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-araak-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* الخطوط الزخرفية */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* الهيدر */}
      <header className="relative z-10 px-6 lg:px-12 py-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-araak-400 to-araak-700 flex items-center justify-center shadow-glow">
              <svg viewBox="0 0 48 48" className="w-8 h-8 text-white" fill="none">
                <path d="M24 10 L36 18 V30 L24 38 L12 30 V18 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.9"/>
                <path d="M18 30 L24 19 L30 30 M20 26 H28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tight">أراك</span>
              <div className="text-araak-300 text-xs font-medium">منصة إدارة المنافسات والمشاريع</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-navy-200">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-araak-400" /> بيئة آمنة</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold-400" /> معتمدة مؤسسياً</span>
          </div>
        </nav>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="relative z-10 px-6 lg:px-12 pb-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 items-start pt-8">
          {/* القسم الأيمن - الهيرو */}
          <div className="lg:col-span-7 space-y-8 animate-slide-up">
            {/* شارة المؤسسة */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-dark border border-white/10">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-navy-100 text-sm font-medium">منصة قيادية متكاملة لمجموعة أراك</span>
            </div>

            <div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] text-balance">
                منصة إدارة المنافسات
                <br />
                <span className="gradient-text-gold">وتسويق المشاريع</span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-navy-200 leading-relaxed max-w-2xl">
                منظومة رقمية متكاملة لإدارة دورة حياة المنافسات والمشاريع، من استكشاف الفرص
                حتى التسليم، مع لوحات تنفيذية فاخرة ومستشار ذكي وصلاحيات احترافية مرنة.
              </p>
            </div>

            {/* الإحصائيات السريعة */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Layers, label: 'وحدات المنصة', value: '11+' },
                { icon: Gauge, label: 'مؤشرات الأداء', value: '24+' },
                { icon: Users, label: 'أعضاء الفريق', value: '9' },
              ].map((s, i) => (
                <div key={i} className="glass-dark rounded-2xl p-5 border border-white/10">
                  <s.icon className="w-5 h-5 text-araak-400 mb-2" />
                  <div className="text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-navy-300 text-sm">{s.label}</div>
                </div>
              ))}
            </div>

            {/* المميزات */}
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="group glass-dark rounded-xl p-4 border border-white/10 hover:border-araak-400/40 transition-all duration-300 hover:translate-x-1"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-araak-500/20 flex items-center justify-center group-hover:bg-araak-500/30 transition-colors flex-shrink-0">
                      <f.icon className="w-5 h-5 text-araak-300" />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{f.title}</h4>
                      <p className="text-navy-300 text-xs leading-relaxed mt-1">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* القسم الأيسر - لوحة الدخول */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 animate-scale-in">
            <div className="glass-card rounded-3xl p-8 shadow-glass-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-araak-500 to-araak-700 shadow-glow mb-3">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-navy-900">تسجيل الدخول</h2>
                <p className="text-navy-600 text-sm mt-1">الدخول مخصص لأعضاء فريق التسويق</p>
              </div>

              {showApp && (
                <button
                  onClick={onEnter}
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-l from-araak-500 to-araak-600 text-white font-semibold hover:shadow-glow transition-all"
                >
                  دخول المنصة
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@araak.com"
                    className="glass-input w-full px-4 py-3 rounded-xl text-navy-900 placeholder-navy-400"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1.5">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full px-4 py-3 pl-12 rounded-xl text-navy-900 placeholder-navy-400"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-araak-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جارٍ التحقق...
                    </>
                  ) : (
                    <>
                      دخول المنصة
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-navy-100">
                <p className="text-xs text-navy-500 mb-3 font-medium">أعضاء فريق التسويق المعتمدون:</p>
                <div className="space-y-1.5">
                  {[
                    { name: 'د. علي العتيبي', role: 'ceo' as const, title: 'الرئيس التنفيذي' },
                    { name: 'د. لؤي أحمد', role: 'vp' as const, title: 'نائب الرئيس التنفيذي' },
                    { name: 'أ. هاني محمد', role: 'marketing_lead' as const, title: 'نائب الرئيس للاستثمار' },
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-[10px] flex items-center justify-center font-semibold">
                          {m.name.split(' ')[1][0]}
                        </div>
                        <span className="text-navy-700 font-medium">{m.name}</span>
                      </div>
                      <span className="text-navy-500">{ROLE_LABELS[m.role]}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-xs text-navy-400 pt-1.5">
                    <ChevronRight className="w-3 h-3" />
                    <span>+ 6 أعضاء فريق تخصصيين</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ملاحظة أمنية */}
            <div className="mt-4 flex items-center gap-2 text-xs text-navy-300 px-2">
              <Shield className="w-3.5 h-3.5 text-araak-400" />
              <span>اتصال مشفّر، جميع البيانات محمية بنظام صلاحيات RLS</span>
            </div>
          </div>
        </div>

        {/* قسم القيم المضافة */}
        <div className="max-w-7xl mx-auto mt-16">
          <div className="glass-dark rounded-3xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gold-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">لماذا منصة أراك؟</h3>
                <p className="text-navy-300 text-sm">قيمة مضافة على كل مستوى</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'إسناد ذكي حسب التخصص', desc: 'يقوم نظام الإسناد بتوجيه كل فرصة للعضو الأنسب تخصصياً تلقائياً' },
                { title: 'صلاحيات احترافية مرنة', desc: 'منح وحجب الصلاحيات على مستوى المكونات والمراحل لكل مستخدم' },
                { title: 'ربط مستقبلي بالمنصات', desc: 'تكامل مع اعتماد وفرصة ومنافس لمزامنة المنافسات العامة' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-araak-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-araak-300" />
                  </div>
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
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-araak-400" />
            <span>منصة أراك لإدارة المنافسات والمشاريع — جميع الحقوق محفوظة</span>
          </div>
          <span>PMCC Enterprise v2.0</span>
        </div>
      </footer>
    </div>
  );
}

// أيقونة رادار محلية
function Radar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/>
      <path d="M4 6h.01"/>
      <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/>
      <path d="M16.24 7.76a6 6 0 1 0-8.49 8.49"/>
      <path d="M12 18h.01"/>
      <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M13.41 10.59l5.66-5.66"/>
    </svg>
  );
}

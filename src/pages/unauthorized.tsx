import { Lock, ArrowRight } from 'lucide-react';

interface Props {
  reason: 'no_member' | 'denied';
  page?: string;
  onBack?: () => void;
}

export function UnauthorizedPage({ reason, page, onBack }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-araak-50 p-6">
      <div className="glass-card rounded-3xl p-10 max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-5">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-2">
          {reason === 'no_member' ? 'لا يمكن الوصول للمنصة' : 'لا تملك صلاحية الوصول'}
        </h1>
        <p className="text-sm text-navy-500 leading-relaxed mb-6">
          {reason === 'no_member'
            ? 'لم يتم العثور على حسابك ضمن أعضاء فريق أراك. تواصل مع مسؤول النظام لتفعيل حسابك.'
            : page
              ? `هذا القسم «${page}» غير متاح ضمن صلاحياتك الحالية. يمكنك طلب الصلاحية من مدير النظام.`
              : 'لا تملك صلاحية الوصول لهذا القسم.'}
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-medium hover:shadow-glow transition-all"
          >
            العودة للوحة
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

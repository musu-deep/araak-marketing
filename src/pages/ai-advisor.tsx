import { useState } from 'react';
import { Brain, Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { GlassCard, SectionHeader, ProgressRing } from '@/components/ui/primitives';

interface AIAnalysis {
  title: string;
  winProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  risks: string[];
  strengths: string[];
  recommendations: string[];
}

const MOCK_ANALYSES: AIAnalysis[] = [
  {
    title: 'توريد معدات لوجستية',
    winProbability: 72,
    riskLevel: 'medium',
    risks: ['المنافسة من شركات كبرى', 'قصر الوقت المتاح للتقديم'],
    strengths: ['خبرة سابقة في القطاع', 'شراكات استراتيجية', 'سعر تنافسي'],
    recommendations: ['تعزيز الفريق الفني', 'إعداد ملف تشغيلي مفصل', 'اجتماع مبكر مع الجهة المالكة'],
  },
];

export function AiAdvisorPage() {
  const [question, setQuestion] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [history, setHistory] = useState<AIAnalysis[]>(MOCK_ANALYSES);

  const handleAnalyze = () => {
    if (!question.trim()) return;
    setAnalyzing(true);
    // محاكاة تحليل AI
    setTimeout(() => {
      const result: AIAnalysis = {
        title: question.slice(0, 40),
        winProbability: Math.floor(Math.random() * 40) + 40,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        risks: ['تعقيد المتطلبات الفنية', 'وجود منافسين بسعر أقل', 'ضيق الوقت للتقديم'],
        strengths: ['خبرة موثقة في القطاع', 'فريق متكامل التخصصات', 'سمعة متميزة'],
        recommendations: ['بناء علاقة مبكرة مع الجهة المالكة', 'تقديم دراسة جدوى تفصيلية', 'التحالف مع شريك محلي'],
      };
      setAnalysis(result);
      setHistory((prev) => [result, ...prev.slice(0, 4)]);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="مستشار المناقصات الذكي"
        subtitle="تقييم احتمالية الفوز وتحليل المخاطر بالذكاء الاصطناعي"
        icon={Brain}
      />

      {/* حقل التحليل */}
      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-araak-50 border border-araak-100">
            <Sparkles className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-araak-800">
              أدخل وصفاً للمناقصة التي تودّ تقييمها: الجهة، القطاع، القيمة، المنافسين المحتملين، ومتطلباتها الرئيسية.
            </p>
          </div>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="glass-input w-full px-4 py-3 rounded-xl text-navy-900 resize-none text-sm"
            placeholder="مثال: مناقصة لتوريد خدمات لوجستية لوزارة الصحة بقيمة 50 مليون ريال، الجهة تفضل شركات سعودية..."
          />
          <button
            onClick={handleAnalyze}
            disabled={!question.trim() || analyzing}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60 transition-all"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جارٍ التحليل...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                تحليل الفرصة
              </>
            )}
          </button>
        </div>
      </GlassCard>

      {/* نتيجة التحليل */}
      {analysis && (
        <div className="grid lg:grid-cols-3 gap-5 animate-fade-in">
          {/* احتمالية الفوز */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              احتمالية الفوز
            </h3>
            <div className="flex justify-center">
              <ProgressRing
                value={analysis.winProbability}
                size={140}
                color={analysis.winProbability >= 60 ? '#16a34a' : analysis.winProbability >= 40 ? '#0e8494' : '#ef4444'}
                label="فرصة الفوز"
              />
            </div>
            <div className="mt-4 p-3 rounded-xl bg-navy-50 text-center">
              <span className="text-xs text-navy-600">
                {analysis.winProbability >= 70 ? 'فرصة عالية - يُنصح بالتقديم' :
                 analysis.winProbability >= 40 ? 'فرصة متوسطة - يستلزم تعزيز الملف' :
                 'فرصة محدودة - يستلزم دراسة معمّقة'}
              </span>
            </div>
          </GlassCard>

          {/* المخاطر والمزايا */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              تقييم المخاطر والمزايا
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-red-700 mb-1.5">المخاطر</p>
                <ul className="space-y-1.5">
                  {analysis.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                      <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700 mb-1.5">المزايا التنافسية</p>
                <ul className="space-y-1.5">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </GlassCard>

          {/* التوصيات */}
          <GlassCard className="p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-gold-500" />
              توصيات مستشار AI
            </h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-l from-araak-50 to-navy-50 border border-araak-100">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-xs text-navy-800 leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* سجل التحليلات السابقة */}
      {history.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="font-bold text-navy-900 mb-4">تحليلات سابقة</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-navy-100 hover:bg-navy-50/50 cursor-pointer" onClick={() => setAnalysis(h)}>
                <span className="text-sm font-medium text-navy-800">{h.title}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`font-bold ${h.winProbability >= 60 ? 'text-emerald-700' : h.winProbability >= 40 ? 'text-amber-700' : 'text-red-700'}`}>
                    {h.winProbability}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

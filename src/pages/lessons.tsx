import { useEffect, useState } from 'react';
import { Lightbulb, Plus, X, ThumbsUp, ThumbsDown, Minus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, LoadingState, EmptyState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { formatDate, classNames, initials } from '@/lib/constants';
import type { LessonLearned, TeamMember } from '@/lib/types';

export function LessonsPage() {
  const { member } = useAuth();
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('all');

  useEffect(() => {
    loadLessons();
    supabase.from('team_members').select('*').then(({ data }) => {
      if (data) setTeamMembers(data as TeamMember[]);
    });
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    const { data } = await supabase.from('lessons_learned').select('*').order('created_at', { ascending: false });
    if (data) setLessons(data as LessonLearned[]);
    setLoading(false);
  };

  const categories = Array.from(new Set(lessons.map((l) => l.category)));
  const filtered = category === 'all' ? lessons : lessons.filter((l) => l.category === category);

  const author = (id: string | null) => teamMembers.find((m) => m.id === id);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="الدروس المستفادة"
        subtitle="ملخص الخبرات والتوجيهات المستفادة من المنافسات السابقة"
        icon={Lightbulb}
        action={
          member && (
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow">
              <Plus className="w-4 h-4" />
              درس جديد
            </button>
          )
        }
      />

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategory('all')} className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', category === 'all' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}>الكل</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', category === c ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}>{c}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState icon={Lightbulb} title="لا توجد دروس مستفادة" description="شارك التجارب والدروس المستفادة من المنافسات السابقة" />
        </GlassCard>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((lesson) => {
            const authorMember = author(lesson.author_id);
            const outcomeIcon = lesson.outcome === 'positive' ? ThumbsUp : lesson.outcome === 'negative' ? ThumbsDown : Minus;
            const OutcomeIcon = outcomeIcon;
            const outcomeColor =
              lesson.outcome === 'positive' ? 'text-emerald-600 bg-emerald-50' :
              lesson.outcome === 'negative' ? 'text-red-600 bg-red-50' :
              'text-navy-600 bg-navy-50';
            return (
              <GlassCard key={lesson.id} hover className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', outcomeColor)}>
                    <OutcomeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy-900 text-sm leading-snug">{lesson.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-50 text-navy-600 mt-1 inline-block">{lesson.category}</span>
                  </div>
                </div>
                {lesson.context && <p className="text-xs text-navy-600 leading-relaxed mb-2 line-clamp-3">{lesson.context}</p>}
                {lesson.recommendation && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-araak-50 border border-araak-100 mt-2">
                    <Sparkles className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-araak-800 leading-relaxed">{lesson.recommendation}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-50 text-[11px] text-navy-500">
                  <span>{formatDate(lesson.created_at)}</span>
                  {authorMember && (
                    <span className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {initials(authorMember.full_name)}
                      </div>
                      {authorMember.full_name}
                    </span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {showForm && member && (
        <LessonForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadLessons(); }}
          memberId={member.id}
        />
      )}
    </div>
  );
}

function LessonForm({ onClose, onSaved, memberId }: { onClose: () => void; onSaved: () => void; memberId: string }) {
  const [form, setForm] = useState({ title: '', category: 'general', context: '', recommendation: '', outcome: 'neutral' as 'positive' | 'negative' | 'neutral', shared: true });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from('lessons_learned').insert({
      title: form.title,
      category: form.category,
      context: form.context || null,
      recommendation: form.recommendation || null,
      outcome: form.outcome,
      shared_with_all: form.shared,
      author_id: memberId,
    });
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-navy-100">
          <h2 className="text-xl font-bold text-navy-900">درس مستفاد جديد</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">العنوان *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">الفئة</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900">
                <option value="general">عام</option>
                <option value="technical">فني</option>
                <option value="financial">مالي</option>
                <option value="operational">تشغيلي</option>
                <option value="strategic">استراتيجي</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">النتيجة</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value as 'positive' | 'negative' | 'neutral' })}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900">
                <option value="positive">إيجابية</option>
                <option value="negative">سلبية</option>
                <option value="neutral">محايدة</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">السياق</label>
            <textarea value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })}
              rows={3} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900 resize-none" placeholder="في أي ظرف حدث ذلك؟" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">التوصية</label>
            <textarea value={form.recommendation} onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
              rows={2} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900 resize-none" placeholder="ما التوصية المستفادة؟" />
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input type="checkbox" checked={form.shared} onChange={(e) => setForm({ ...form, shared: e.target.checked })} className="w-4 h-4 accent-araak-500" />
            مشاركة مع كل الفريق
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-navy-200 text-navy-600 font-medium hover:bg-navy-50">إلغاء</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow disabled:opacity-60">
              {submitting ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

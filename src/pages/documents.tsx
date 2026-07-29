import { useEffect, useState } from 'react';
import { FolderOpen, Plus, X, FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { GlassCard, SectionHeader, LoadingState, EmptyState } from '@/components/ui/primitives';
import { supabase } from '@/lib/supabase';
import { formatDate, classNames, initials } from '@/lib/constants';
import type { DocumentItem, TeamMember } from '@/lib/types';

export function DocumentsPage() {
  const { member } = useAuth();
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    loadDocs();
    supabase.from('team_members').select('*').eq('is_active', true).then(({ data }) => {
      if (data) setTeamMembers(data as TeamMember[]);
    });
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (data) setDocs(data as DocumentItem[]);
    setLoading(false);
  };

  const openDocument = async (doc: DocumentItem) => {
    setDownloadError('');
    setDownloadingId(doc.id);
    try {
      if (doc.storage_path) {
        const { data, error } = await supabase.storage
          .from('opportunity-documents')
          .createSignedUrl(doc.storage_path, 300, { download: doc.title });
        if (error || !data?.signedUrl) throw error || new Error('تعذر إنشاء رابط الملف.');
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      } else if (doc.file_url) {
        window.open(doc.file_url, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('لا يوجد ملف مرتبط بهذه الوثيقة.');
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'تعذر فتح الملف.');
    } finally {
      setDownloadingId(null);
    }
  };

  const categories = Array.from(new Set(docs.map((d) => d.category).filter(Boolean))) as string[];
  const filtered = filter === 'all' ? docs : docs.filter((d) => d.category === filter);
  const getUploader = (uploadedBy: string | null) => teamMembers.find((m) => m.id === uploadedBy);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="مركز الوثائق"
        subtitle="إدارة مستندات الفرص والمنافسات والمشاريع"
        icon={FolderOpen}
        action={
          member && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-l from-araak-500 to-araak-700 text-white font-semibold hover:shadow-glow transition-all"
            >
              <Plus className="w-4 h-4" />
              إضافة وثيقة
            </button>
          )
        }
      />

      {downloadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {downloadError}
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', filter === 'all' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}>الكل ({docs.length})</button>
          {categories.map((category) => (
            <button key={category} onClick={() => setFilter(category)} className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', filter === category ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}>
              {category} ({docs.filter((doc) => doc.category === category).length})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState icon={FolderOpen} title="لا توجد وثائق" description="عند رفع مستندات الفرص والمنافسات ستظهر هنا" />
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const uploader = getUploader(doc.uploaded_by);
            const hasFile = Boolean(doc.storage_path || doc.file_url);
            return (
              <GlassCard key={doc.id} hover className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-araak-500 to-araak-700 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy-900 text-sm truncate">{doc.title}</h3>
                    {doc.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-50 text-navy-600">{doc.category}</span>}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-navy-500">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(doc.created_at)}</span>
                      <span>v{doc.current_version}</span>
                      {doc.file_size ? <span>{(doc.file_size / 1024 / 1024).toFixed(2)} MB</span> : null}
                    </div>
                    {uploader && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-araak-400 to-araak-600 text-white text-[9px] flex items-center justify-center font-bold">
                          {initials(uploader.full_name)}
                        </div>
                        <span className="text-[11px] text-navy-600">{uploader.full_name}</span>
                      </div>
                    )}
                  </div>
                  {hasFile && (
                    <button
                      type="button"
                      onClick={() => void openDocument(doc)}
                      disabled={downloadingId === doc.id}
                      className="p-2 rounded-lg hover:bg-navy-50 text-navy-500 disabled:opacity-60"
                      title="فتح أو تنزيل الملف"
                    >
                      {downloadingId === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {showForm && member && (
        <DocumentForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadDocs(); }}
          memberId={member.id}
        />
      )}
    </div>
  );
}

function DocumentForm({ onClose, onSaved, memberId }: { onClose: () => void; onSaved: () => void; memberId: string }) {
  const [form, setForm] = useState({ title: '', category: '', description: '', file_url: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    await supabase.from('documents').insert({
      title: form.title,
      category: form.category || null,
      description: form.description || null,
      file_url: form.file_url || null,
      storage_path: null,
      uploaded_by: memberId,
      current_version: 1,
    });
    setSubmitting(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-3xl w-full max-w-lg animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-4 flex items-center justify-between border-b border-navy-100">
          <h2 className="text-xl font-bold text-navy-900">إضافة وثيقة</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">عنوان الوثيقة *</label>
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">التصنيف</label>
            <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="عقد، عرض تقديمي، مالي..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">الوصف</label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={2} className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1.5">رابط الملف (URL)</label>
            <input dir="ltr" value={form.file_url} onChange={(event) => setForm({ ...form, file_url: event.target.value })}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-navy-900" placeholder="https://" />
          </div>
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

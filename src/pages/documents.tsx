import { useEffect, useMemo, useState } from 'react';
import { Calendar, Download, FileCog, FileText, FolderOpen, Loader2, Radar, RefreshCw } from 'lucide-react';
import { GlassCard, SectionHeader, LoadingState, EmptyState } from '@/components/ui/primitives';
import { formatDate, classNames } from '@/lib/constants';
import {
  downloadEnterpriseAttachment,
  listEnterpriseRecords,
  type EnterpriseAttachment,
  type EnterpriseRecord,
} from '@/lib/enterprise-records';

interface CentralDocument {
  key: string;
  attachment: EnterpriseAttachment;
  record: EnterpriseRecord;
  category: 'مرفقات الفرص' | 'مرفقات المنافسات';
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<CentralDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | CentralDocument['category']>('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadDocuments = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [opportunities, tenders] = await Promise.all([
        listEnterpriseRecords('opportunity'),
        listEnterpriseRecords('tender'),
      ]);

      const rows: CentralDocument[] = [...opportunities, ...tenders]
        .flatMap((record) => record.attachments.map((attachment) => ({
          key: `${record.kind}-${record.id}-${attachment.id}`,
          attachment,
          record,
          category: record.kind === 'tender' ? 'مرفقات المنافسات' as const : 'مرفقات الفرص' as const,
        })))
        .sort((left, right) => String(right.attachment.created_at || '').localeCompare(String(left.attachment.created_at || '')));

      setDocuments(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل مركز الوثائق.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const counts = useMemo(() => ({
    all: documents.length,
    opportunities: documents.filter((document) => document.category === 'مرفقات الفرص').length,
    tenders: documents.filter((document) => document.category === 'مرفقات المنافسات').length,
  }), [documents]);

  const filtered = filter === 'all' ? documents : documents.filter((document) => document.category === filter);

  const openDocument = async (document: CentralDocument) => {
    setDownloadingId(document.attachment.id);
    setError('');
    try {
      await downloadEnterpriseAttachment(document.attachment);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'تعذر تنزيل الملف.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <LoadingState label="جارٍ تحميل مركز الوثائق..." />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <SectionHeader
        title="مركز الوثائق"
        subtitle="مستندات الفرص والمنافسات مرتبطة بسجلاتها التشغيلية"
        icon={FolderOpen}
        action={(
          <button
            type="button"
            onClick={() => void loadDocuments(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-navy-200 bg-white text-navy-600 font-semibold hover:bg-navy-50 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث الوثائق
          </button>
        )}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', filter === 'all' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}
        >
          الكل ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setFilter('مرفقات الفرص')}
          className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', filter === 'مرفقات الفرص' ? 'bg-araak-500 text-white' : 'bg-navy-50 text-navy-600')}
        >
          مرفقات الفرص ({counts.opportunities})
        </button>
        <button
          type="button"
          onClick={() => setFilter('مرفقات المنافسات')}
          className={classNames('px-3 py-1.5 rounded-lg text-xs font-medium', filter === 'مرفقات المنافسات' ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-600')}
        >
          مرفقات المنافسات ({counts.tenders})
        </button>
      </div>

      {filtered.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={FolderOpen}
            title="لا توجد وثائق"
            description="تُضاف الوثائق من نموذج الفرصة أو المنافسة وتظهر هنا تلقائيًا."
          />
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((document) => {
            const isTender = document.record.kind === 'tender';
            return (
              <GlassCard key={document.key} hover className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isTender ? 'bg-gradient-to-br from-navy-500 to-navy-700' : 'bg-gradient-to-br from-araak-500 to-araak-700'}`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy-900 text-sm truncate" title={document.attachment.name}>
                      {document.attachment.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full ${isTender ? 'bg-navy-50 text-navy-700' : 'bg-araak-50 text-araak-700'}`}>
                      {isTender ? <FileCog className="w-3 h-3" /> : <Radar className="w-3 h-3" />}
                      {document.category}
                    </span>
                    <div className="mt-2 text-xs font-medium text-navy-700 line-clamp-1" title={document.record.title}>
                      {document.record.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-navy-500">
                      {document.attachment.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(document.attachment.created_at)}
                        </span>
                      )}
                      {document.attachment.file_size > 0 && (
                        <span>{(document.attachment.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openDocument(document)}
                    disabled={downloadingId === document.attachment.id}
                    className="p-2 rounded-lg hover:bg-navy-50 text-navy-500 disabled:opacity-60"
                    title="تنزيل الملف"
                  >
                    {downloadingId === document.attachment.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

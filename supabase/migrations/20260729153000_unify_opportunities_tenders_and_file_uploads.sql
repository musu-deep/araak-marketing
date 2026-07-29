/*
  توحيد إدخال الفرص والمنافسات وإتاحة رفع الملفات المرتبطة بها.

  - حقل storage_path لحفظ مسار الملف الخاص داخل Supabase Storage.
  - حاوية خاصة لمرفقات الفرص والمنافسات.
  - مصادر افتراضية تظهر في القائمة المنسدلة.
*/

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS storage_path text;

CREATE INDEX IF NOT EXISTS idx_documents_opportunity
  ON public.documents(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_documents_storage_path
  ON public.documents(storage_path)
  WHERE storage_path IS NOT NULL;

INSERT INTO public.external_platforms (name, base_url, description, is_active)
SELECT source.name, source.base_url, source.description, true
FROM (
  VALUES
    ('اعتماد', 'https://portal.etimad.sa', 'منصة اعتماد للمنافسات والمشتريات الحكومية'),
    ('فرصة', NULL, 'منصة فرص للأعمال والفرص الاستثمارية'),
    ('منافس', NULL, 'منصة منافس'),
    ('مناقصات', NULL, 'منصة المناقصات'),
    ('إحالة مباشرة', NULL, 'فرصة أو منافسة محالة مباشرة إلى المجموعة'),
    ('مصدر داخلي', NULL, 'فرصة تم رصدها أو إنشاؤها من داخل المجموعة')
) AS source(name, base_url, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.external_platforms existing
  WHERE lower(existing.name) = lower(source.name)
);

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'opportunity-documents',
  'opportunity-documents',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "platform_members_read_opportunity_documents" ON storage.objects;
CREATE POLICY "platform_members_read_opportunity_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'opportunity-documents');

DROP POLICY IF EXISTS "platform_members_upload_opportunity_documents" ON storage.objects;
CREATE POLICY "platform_members_upload_opportunity_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'opportunity-documents');

DROP POLICY IF EXISTS "platform_members_update_opportunity_documents" ON storage.objects;
CREATE POLICY "platform_members_update_opportunity_documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'opportunity-documents')
WITH CHECK (bucket_id = 'opportunity-documents');

DROP POLICY IF EXISTS "platform_members_delete_opportunity_documents" ON storage.objects;
CREATE POLICY "platform_members_delete_opportunity_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'opportunity-documents');

GRANT SELECT ON public.external_platforms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;

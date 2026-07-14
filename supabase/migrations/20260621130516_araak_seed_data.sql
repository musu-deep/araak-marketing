/*
# البيانات الأولية لمنصة أراك

1. الأدوار والصلاحيات
- 8 أعضاء فريق مع أدوارهم وألقابهم
- 8 أقسام/تخصصات
- صلاحيات على أقسام المنصة ومراحل المنافسة
- منصات منافسات خارجية (اعتماد، فرصة، منافس)
*/

-- الأدوار
INSERT INTO public.roles (key, name, name_en, level, is_admin, description) VALUES
  ('ceo', 'الرئيس التنفيذي', 'CEO', 1, true, 'الإشراف الكامل على المنصة والمنظومة'),
  ('vp', 'نائب الرئيس التنفيذي', 'VP', 2, true, 'نائب الرئيس التنفيذي للمجموعة'),
  ('marketing_lead', 'مسؤول فريق تسويق المشاريع', 'Marketing Lead', 2, true, 'مسؤول فريق التسويق وإسناد المهام'),
  ('executive_followup', 'مسؤول المتابعة التنفيذية', 'Executive Follow-up', 3, false, 'متابعة تنفيذ المشاريع والمنافسات'),
  ('national_director', 'مدير المشاريع الوطنية', 'National Projects Director', 3, false, 'إدارة مشاريع أراك الوطنية'),
  ('warehouse_sales', 'مسؤول المستودعات والمبيعات', 'Warehouse & Sales', 3, false, 'إدارة المستودعات والمبيعات التجارية'),
  ('cfo', 'المدير المالي', 'CFO', 2, false, 'الإدارة المالية للمجموعة'),
  ('executive_office', 'مسؤول المكتب التنفيذي', 'Executive Office', 3, false, 'إدارة المكتب التنفيذي'),
  ('logistics', 'مسؤول اللوجستية وسلاسل الإمداد', 'Logistics', 3, false, 'إدارة اللوجستية وسلاسل الإمداد')
ON CONFLICT (key) DO NOTHING;

-- الأقسام/التخصصات
INSERT INTO public.departments (id, name, name_en, icon, color, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'الإدارة التنفيذية', 'Executive', 'crown', '#0e8494', 1),
  ('11111111-0000-0000-0000-000000000002', 'الاستثمار والتسويق', 'Investment & Marketing', 'trending-up', '#c89c2e', 2),
  ('11111111-0000-0000-0000-000000000003', 'المتابعة التنفيذية', 'Executive Follow-up', 'clipboard-check', '#2f5d7d', 3),
  ('11111111-0000-0000-0000-000000000004', 'المشاريع الوطنية', 'National Projects', 'building-2', '#3e7597', 4),
  ('11111111-0000-0000-0000-000000000005', 'المستودعات والمبيعات', 'Warehouse & Sales', 'package', '#bb6e3b', 5),
  ('11111111-0000-0000-0000-000000000006', 'الإدارة المالية', 'Finance', 'wallet', '#284c66', 6),
  ('11111111-0000-0000-0000-000000000007', 'المكتب التنفيذي', 'Executive Office', 'briefcase', '#115462', 7),
  ('11111111-0000-0000-0000-000000000008', 'اللوجستية والإمداد', 'Logistics', 'truck', '#9b5533', 8)
ON CONFLICT (id) DO NOTHING;

-- أعضاء فريق أراك
INSERT INTO public.team_members (id, full_name, email, title, role_key, department_id, bio, specialties, is_active) VALUES
  ('22222222-0000-0000-0000-000000000001', 'د. علي العتيبي', 'ali.alotaibi@araak.com', 'الرئيس التنفيذي', 'ceo', '11111111-0000-0000-0000-000000000001', 'الرئيس التنفيذي لمجموعة أراك، يقود الرؤية الاستراتيجية للمجموعة وكافة شركاتها', ARRAY['الإدارة الاستراتيجية','اتخاذ القرار','القيادة'], true),
  ('22222222-0000-0000-0000-000000000002', 'د. لؤي أحمد', 'luay.ahmed@araak.com', 'نائب الرئيس التنفيذي', 'vp', '11111111-0000-0000-0000-000000000001', 'نائب الرئيس التنفيذي للمجموعة، يشرف على العمليات التشغيلية والاستراتيجية', ARRAY['الإدارة','التخطيط الاستراتيجي','العمليات'], true),
  ('22222222-0000-0000-0000-000000000004', 'م. عبد الله العتيبي', 'abdullah.alotaibi@araak.com', 'مسؤول المتابعة التنفيذية', 'executive_followup', '11111111-0000-0000-0000-000000000003', 'مسؤول المتابعة التنفيذية لجميع المشاريع والمنافسات', ARRAY['المتابعة','التنفيذ','إدارة المخاطر'], true),
  ('22222222-0000-0000-0000-000000000005', 'م. عبد الرحمن الحسام', 'abdulrahman.alhussam@araak.com', 'مدير أراك الوطنية والمشاريع', 'national_director', '11111111-0000-0000-0000-000000000004', 'مدير أراك الوطنية وقائد مشاريع المؤسسة الوطنية', ARRAY['إدارة المشاريع','المشاريع الوطنية','التشغيل'], true),
  ('22222222-0000-0000-0000-000000000006', 'م. محمد شكاك', 'mohammed.shakak@araak.com', 'مسؤول المستودعات والمبيعات التجارية', 'warehouse_sales', '11111111-0000-0000-0000-000000000005', 'مسؤول المستودعات والمبيعات التجارية لكافة المنتجات', ARRAY['المستودعات','المبيعات','إدارة المخزون'], true),
  ('22222222-0000-0000-0000-000000000007', 'أ. محمد السيمت', 'mohammed.alsimet@araak.com', 'المدير المالي للمجموعة', 'cfo', '11111111-0000-0000-0000-000000000006', 'المدير المالي لمجموعة أراك، يشرف على الشؤون المالية والاستثمارية', ARRAY['الإدارة المالية','الميزانيات','التحليل المالي'], true),
  ('22222222-0000-0000-0000-000000000008', 'أ. عباس رمضان', 'abbas.ramadan@araak.com', 'مسؤول المكتب التنفيذي', 'executive_office', '11111111-0000-0000-0000-000000000007', 'مسؤول المكتب التنفيذي وتنسيق الاجتماعيات والمتابعة الإدارية', ARRAY['الإدارة','التنسيق','المتابعة الإدارية'], true),
  ('22222222-0000-0000-0000-000000000009', 'أ. محمود عوض', 'mahmoud.awad@araak.com', 'مسؤول أراك اللوجستية وسلاسل الإمداد', 'logistics', '11111111-0000-0000-0000-000000000008', 'مسؤول أراك اللوجستية وسلاسل الإمداد والنقل', ARRAY['اللوجستية','سلاسل الإمداد','النقل'], true)
ON CONFLICT (email) DO NOTHING;

-- الصلاحيات على أقسام المنصة
INSERT INTO public.permissions (key, label, category, description, is_stage_permission) VALUES
  ('dashboard', 'اللوحة التنفيذية', 'modules', 'عرض اللوحة التنفيذية والمؤشرات', false),
  ('opportunity_radar', 'رادار الفرص', 'modules', 'عرض وإدارة الفرص والمنافسات', false),
  ('tender_management', 'إدارة المناقصات', 'modules', 'إدارة المناقصات وسير العمل', false),
  ('ai_advisor', 'مستشار AI', 'modules', 'استخدام مستشار المناقصات الذكي', false),
  ('tasks', 'إدارة المهام', 'modules', 'إدارة وتتبع المهام', false),
  ('team', 'تعاون الفريق', 'modules', 'عرض الفريق ومصفوفة المسؤوليات', false),
  ('documents', 'مركز الوثائق', 'modules', 'إدارة الوثائق والملفات', false),
  ('accountability', 'المتابعة والمساءلة', 'modules', 'عرض التنبيهات والمتابعة', false),
  ('lessons', 'الدروس المستفادة', 'modules', 'عرض وإدارة الدروس المستفادة', false),
  ('reports', 'التقارير التنفيذية', 'modules', 'عرض التقارير التنفيذية', false),
  ('settings', 'الإعدادات', 'modules', 'إعدادات النظام وإدارة المستخدمين', false),
  -- صلاحيات على مراحل المنافسة
  ('stage_intake', 'مرحلة الاستقبال', 'stages', 'رؤية مرحلة استقبال المنافسة', true),
  ('stage_qualification', 'مرحلة التأهيل', 'stages', 'رؤية مرحلة التأهيل المبدئي', true),
  ('stage_technical', 'مرحلة الدراسة الفنية', 'stages', 'رؤية المرحلة الفنية للمنافسة', true),
  ('stage_financial', 'مرحلة الدراسة المالية', 'stages', 'رؤية المرحلة المالية للمنافسة', true),
  ('stage_submission', 'مرحلة التقديم', 'stages', 'رؤية مرحلة التقديم النهائي', true),
  ('stage_presentation', 'مرحلة العرض', 'stages', 'رؤية مرحلة العرض والتقديم', true),
  ('stage_result', 'مرحلة النتيجة', 'stages', 'رؤية مرحلة النتيجة والإعلان', true),
  -- صلاحيات إدارية
  ('manage_users', 'إدارة المستخدمين', 'admin', 'إضافة وتعديل وحذف المستخدمين', false),
  ('manage_permissions', 'إدارة الصلاحيات', 'admin', 'منح وحجب الصلاحيات على المستخدمين', false),
  ('manage_opportunities', 'إدارة الفرص', 'admin', 'إضافة وحذف وتعديل الفرص', false),
  ('assign_tasks', 'إسناد المهام', 'admin', 'إسناد المهام لأعضاء الفريق', false),
  ('propose_external', 'اقتراح فرص خارجية', 'admin', 'اقتراح فرص من منصات خارجية', false)
ON CONFLICT (key) DO NOTHING;

-- الصلاحيات الافتراضية للأدوار
-- الرئيس ونائبه ومسؤول التسويق: كل الصلاحيات
INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'ceo', key FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'vp', key FROM public.permissions
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'marketing_lead', key FROM public.permissions
WHERE key NOT IN ('manage_users','manage_permissions')
ON CONFLICT DO NOTHING;

-- باقي الأدوار: الوصول للوحة والمهام والفرص المُسنَدة والوثائق والدروس
INSERT INTO public.role_permissions (role_key, permission_key) VALUES
  ('executive_followup', 'dashboard'),
  ('executive_followup', 'opportunity_radar'),
  ('executive_followup', 'tender_management'),
  ('executive_followup', 'tasks'),
  ('executive_followup', 'documents'),
  ('executive_followup', 'accountability'),
  ('executive_followup', 'lessons'),
  ('executive_followup', 'reports'),
  ('executive_followup', 'propose_external'),
  ('executive_followup', 'stage_intake'),
  ('executive_followup', 'stage_qualification'),
  ('executive_followup', 'stage_technical'),
  ('executive_followup', 'stage_financial'),
  ('executive_followup', 'stage_submission'),
  ('executive_followup', 'stage_presentation'),
  ('executive_followup', 'stage_result'),
  ('national_director', 'dashboard'),
  ('national_director', 'opportunity_radar'),
  ('national_director', 'tender_management'),
  ('national_director', 'tasks'),
  ('national_director', 'documents'),
  ('national_director', 'team'),
  ('national_director', 'lessons'),
  ('national_director', 'reports'),
  ('national_director', 'propose_external'),
  ('national_director', 'stage_intake'),
  ('national_director', 'stage_qualification'),
  ('national_director', 'stage_technical'),
  ('national_director', 'stage_submission'),
  ('national_director', 'stage_presentation'),
  ('national_director', 'stage_result'),
  ('warehouse_sales', 'dashboard'),
  ('warehouse_sales', 'opportunity_radar'),
  ('warehouse_sales', 'tasks'),
  ('warehouse_sales', 'documents'),
  ('warehouse_sales', 'propose_external'),
  ('warehouse_sales', 'stage_qualification'),
  ('warehouse_sales', 'stage_technical'),
  ('cfo', 'dashboard'),
  ('cfo', 'opportunity_radar'),
  ('cfo', 'tender_management'),
  ('cfo', 'tasks'),
  ('cfo', 'documents'),
  ('cfo', 'reports'),
  ('cfo', 'propose_external'),
  ('cfo', 'stage_financial'),
  ('cfo', 'stage_submission'),
  ('cfo', 'stage_result'),
  ('executive_office', 'dashboard'),
  ('executive_office', 'opportunity_radar'),
  ('executive_office', 'tender_management'),
  ('executive_office', 'tasks'),
  ('executive_office', 'team'),
  ('executive_office', 'documents'),
  ('executive_office', 'accountability'),
  ('executive_office', 'lessons'),
  ('executive_office', 'reports'),
  ('executive_office', 'propose_external'),
  ('executive_office', 'stage_intake'),
  ('executive_office', 'stage_qualification'),
  ('executive_office', 'stage_submission'),
  ('executive_office', 'stage_presentation'),
  ('logistics', 'dashboard'),
  ('logistics', 'opportunity_radar'),
  ('logistics', 'tender_management'),
  ('logistics', 'tasks'),
  ('logistics', 'documents'),
  ('logistics', 'propose_external'),
  ('logistics', 'stage_technical'),
  ('logistics', 'stage_qualification'),
  ('logistics', 'stage_result')
ON CONFLICT DO NOTHING;

-- منصات المنافسات الخارجية
INSERT INTO public.external_platforms (name, base_url, logo_url, description, is_active) VALUES
  ('اعتماد', 'https://tenders.etimad.sa', NULL, 'منصة اعتماد الحكومية للمنافسات والمشتريات', true),
  ('فرصة', 'https://forasah.com', NULL, 'منصة فرصة للفرص الاستثمارية والمنافسات', true),
  ('منافس', 'https://munafsa.com', NULL, 'منصة منافس للمناقصات والمزادات', true),
  ('المونقات السعودية', 'https://monaqasat.com', NULL, 'منصة مناقصات للمنافسات الإلكترونية', true)
ON CONFLICT DO NOTHING;

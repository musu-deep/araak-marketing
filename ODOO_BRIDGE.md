# ربط منصة اراك للتسويق مع ARAAK CEO وOdoo

## المعمارية الحالية

```text
المستخدم
   │ بيانات ARAAK CEO نفسها
   ▼
/api/auth-login
   ├── يتحقق من الهوية عبر ARAAK CEO
   ├── يستدعي السجل الوظيفي من Odoo hr.employee
   └── ينشئ جلسة تقنية صامتة في Supabase لحماية البيانات الحالية

صفحة فريق المنصة
   ▼
/api/odoo-employees
   ▼
Odoo hr.employee
```

لا يختار المستخدم رقم جوال أو رمزًا شخصيًا جديدًا، ولا يُدخل مدير المنصة الأعضاء مرة أخرى. البريد والمسمى والإدارة والجوال والحالة الوظيفية تأتي من المنظومة المؤسسية.

## لماذا ما زال Supabase موجودًا؟

يُستخدم Supabase مؤقتًا فقط لحماية وتشغيل الجداول التخصصية الحالية مثل الفرص والمنافسات ومصفوفة التسعير. الهوية البشرية ودليل الفريق أصبحا من ARAAK CEO وOdoo.

عند إنشاء نماذج Odoo المعتمدة للفرص والمنافسات والتسعير والوثائق، يمكن نقل هذه الجداول ثم حذف جسر Supabase نهائيًا دون تغيير تجربة المستخدم.

## متغيرات Vercel المطلوبة

انسخ القيم غير السرية كما هي، وانسخ أسرار Odoo من مشروع ARAAK CEO داخل Vercel دون إرسالها أو كتابتها في GitHub.

```env
ARAAK_CEO_API_URL=https://musu-deep-nexgen-executives-ar.vercel.app

ODOO_ENABLED=true
ODOO_URL=https://araakceo.odoo.com
ODOO_DATABASE=<optional>
ODOO_API_KEY=<copy from ARAAK CEO Vercel environment>
ODOO_LANGUAGE=en_US
ODOO_TIMEOUT_MS=20000

SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ARAAK_IDENTITY_BRIDGE_SECRET=<random secret, at least 24 characters>

VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

`SUPABASE_SERVICE_ROLE_KEY` و`ODOO_API_KEY` و`ARAAK_IDENTITY_BRIDGE_SECRET` متغيرات خادمية سرية، ولا يجوز أن تبدأ أسماؤها بـ`VITE_`.

## إنشاء سر جسر الهوية في PowerShell

```powershell
$Bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Fill($Bytes)
[Convert]::ToBase64String($Bytes)
```

انسخ الناتج إلى `ARAAK_IDENTITY_BRIDGE_SECRET` في Vercel.

## الاختبار بعد النشر

1. نفّذ Redeploy في Vercel بعد إضافة المتغيرات.
2. افتح المنصة وسجّل الدخول بحساب يعمل في ARAAK CEO.
3. افتح صفحة **فريق المنصة** واضغط **تحديث من Odoo**.
4. تأكد أن الاسم والمسمى والإدارة والجوال تظهر من Odoo.
5. تأكد أن بقية وحدات المنصة ما زالت تقرأ الجداول الحالية بصورة طبيعية.

## الملفات الرئيسية

- `api/auth-login.js`: توحيد الدخول وإنشاء الجلسة التقنية.
- `api/odoo-employees.js`: دليل الموظفين المحمي.
- `api/odoo-status.js`: فحص الاتصال.
- `server/ceo.js`: موصل هوية ARAAK CEO.
- `server/odoo.js`: موصل Odoo 19 JSON-2.
- `server/supabase-bridge.js`: جسر انتقالي داخلي؛ لا يتعامل معه المستخدم.
- `src/lib/institutional-api.ts`: عميل الواجهة.

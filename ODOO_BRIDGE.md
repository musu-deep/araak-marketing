# ربط منصة اراك للتسويق مع ARAAK CEO وOdoo

## المعمارية المصححة

```text
المستخدم
   │ بيانات ARAAK CEO نفسها
   ▼
Supabase Edge Function: institutional-access
   ├── يتحقق من الهوية عبر ARAAK CEO
   ├── يستدعي دليل الموظفين من بوابة ARAAK CEO المرتبطة بـ Odoo
   └── ينشئ جلسة تقنية صامتة لحماية جداول المنصة الحالية

صفحة فريق المنصة
   ▼
institutional-access (directory)
   ▼
ARAAK CEO /api/employees
   ▼
Odoo hr.employee
```

لا يختار المستخدم رقم جوال أو رمزًا شخصيًا جديدًا، ولا يُدخل مدير المنصة الأعضاء مرة أخرى. كما لا تحتاج منصة التسويق إلى نسخة أخرى من `ODOO_API_KEY` أو `SUPABASE_SERVICE_ROLE_KEY` داخل Vercel.

## سبب إزالة مسار Vercel القديم

كان المسار `/api/auth-login` يعتمد على أسرار خادمية داخل مشروع Vercel الخاص بمنصة التسويق. عند غياب أي متغير كان يعيد `503 Service Unavailable`.

أصبحت عملية الدخول الآن داخل Supabase Edge Function، حيث تتوفر مفاتيح Supabase الداخلية تلقائيًا، بينما تبقى أسرار Odoo في مكانها الأصلي داخل منصة ARAAK CEO.

## متغيرات Vercel المطلوبة

يحتاج مشروع `araak-marketing` إلى متغيرين فقط:

```env
VITE_SUPABASE_URL=https://svmjtmjcuetrfmpqqbpe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

لا تضف إلى مشروع التسويق:

```text
ODOO_API_KEY
SUPABASE_SERVICE_ROLE_KEY
ARAAK_IDENTITY_BRIDGE_SECRET
```

## نشر الوظيفة المصححة

من جذر المشروع:

```powershell
npx --yes supabase@latest functions deploy institutional-access `
  --no-verify-jwt `
  --project-ref svmjtmjcuetrfmpqqbpe `
  --use-api
```

أو شغّل سكربت التفعيل، وقد تم تحديثه لينشر الوظيفتين تلقائيًا:

```powershell
powershell -ExecutionPolicy Bypass `
  -File ".\scripts\activate-supabase.ps1" `
  -ProjectRef "svmjtmjcuetrfmpqqbpe"
```

لا توجد migrations جديدة مطلوبة لهذا التصحيح.

## الاختبار بعد النشر

1. اسحب آخر تحديث للفرع.
2. انشر وظيفة `institutional-access`.
3. تأكد من وجود متغيري `VITE_SUPABASE_*` في Preview وProduction.
4. نفّذ Redeploy في Vercel.
5. امسح الجلسة القديمة أو افتح نافذة خاصة.
6. سجّل الدخول بحساب يعمل في ARAAK CEO.
7. افتح **فريق المنصة** واضغط **تحديث من Odoo**.

## الحساب التجريبي

```text
ceo@company.demo
ExecAgent2026!
```

هذا الحساب للاختبار فقط، وليس حساب إنتاج دائمًا.

## الملفات الرئيسية

- `supabase/functions/institutional-access/index.ts`: الدخول المؤسسي ودليل الموظفين.
- `src/lib/institutional-api.ts`: استدعاء Edge Function من الواجهة.
- `src/lib/auth-context.tsx`: إدارة جلسة المنصة.
- `scripts/activate-supabase.ps1`: نشر الوظيفتين.

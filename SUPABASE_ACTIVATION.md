# تفعيل Supabase لمنصة اراك للتسويق والمناقصات

تعتمد المنصة على Supabase في قاعدة البيانات، تسجيل الدخول، الصلاحيات، سياسات RLS، والوظائف الطرفية. لذلك المسار المعتمد هو إنشاء مشروع Supabase وربطه بالمستودع بدل استبدال البنية الخلفية.

## الخيار الأسرع: سكربت PowerShell

من المجلد الرئيسي للمشروع:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\activate-supabase.ps1
```

أو مع تمرير Project Ref مباشرة:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\activate-supabase.ps1 -ProjectRef "YOUR_PROJECT_REF"
```

السكربت ينفذ:

1. تسجيل الدخول إلى Supabase CLI.
2. إنشاء `supabase/config.toml` عند عدم وجوده.
3. ربط المشروع.
4. مراجعة migrations عبر `db push --dry-run`.
5. تطبيق migrations بعد التأكيد.
6. نشر Edge Function باسم `member-access`.

## إنشاء مشروع جديد

1. أنشئ مشروعًا جديدًا من لوحة Supabase.
2. احتفظ بهذه القيم:
   - Project Ref.
   - Database Password.
   - Project URL.
   - Publishable Key، أو anon key للمشروعات القديمة.
3. شغّل سكربت PowerShell السابق.

## إعداد Vercel

أضف في Vercel > Project Settings > Environment Variables:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

يمكن استخدام المفتاح القديم عند الحاجة:

```env
VITE_SUPABASE_ANON_KEY=YOUR_LEGACY_ANON_KEY
```

أضف القيم إلى Production وPreview وDevelopment، ثم نفّذ Redeploy.

## إعداد النشر الآلي من GitHub

أضف الأسرار التالية في GitHub > Repository Settings > Secrets and variables > Actions:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`

بعد دمج الفرع، سيعمل الملف `.github/workflows/deploy-supabase.yml` عند أي تعديل داخل مجلد `supabase` على فرع `main`. ويمكن تشغيله يدويًا من Actions > Deploy Supabase > Run workflow.

## تهيئة أرقام أعضاء المنصة

بعد تطبيق migrations، ادخل بحساب إداري إلى صفحة «فريق المنصة» وسجل رقم الجوال الصحيح لكل عضو. بعدها يستطيع العضو الدخول بالاسم والجوال، واختيار رمز شخصي من 6 أرقام في أول دخول.

## اختبار التشغيل

1. افتح نشر Vercel.
2. أدخل اسم عضو ورقم جواله المسجل ورمزًا من 6 أرقام.
3. تحقق من إنشاء الجلسة وظهور بيانات العضو وصلاحياته.
4. سجل الخروج ثم أعد الدخول بالرمز نفسه.
5. اختبر عدم قبول اسم أو جوال أو رمز غير مطابق.

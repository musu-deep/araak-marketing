param(
  [Parameter(Mandatory = $false)]
  [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'

function Invoke-Supabase {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)

  & npx --yes supabase@latest @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "فشل أمر Supabase: npx supabase $($Arguments -join ' ')"
  }
}

Write-Host "`n=== تفعيل Supabase لمنصة اراك للتسويق والمناقصات ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw 'Node.js غير مثبت أو غير موجود في PATH.'
}

if (-not (Test-Path 'package.json')) {
  throw 'شغّل السكربت من المجلد الرئيسي للمشروع الذي يحتوي package.json.'
}

Write-Host "`n[1/6] تسجيل الدخول إلى Supabase..." -ForegroundColor Yellow
Invoke-Supabase login

if (-not (Test-Path 'supabase/config.toml')) {
  Write-Host "`n[2/6] إنشاء ملف إعداد Supabase المحلي..." -ForegroundColor Yellow
  Invoke-Supabase init
} else {
  Write-Host "`n[2/6] إعداد Supabase المحلي موجود." -ForegroundColor Green
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  Write-Host "`nمشروعات Supabase المتاحة في حسابك:" -ForegroundColor Yellow
  Invoke-Supabase projects list
  $ProjectRef = Read-Host 'أدخل Project Ref للمشروع المطلوب'
}

if ([string]::IsNullOrWhiteSpace($ProjectRef)) {
  throw 'Project Ref مطلوب لإكمال الربط.'
}

Write-Host "`n[3/6] ربط المستودع بالمشروع $ProjectRef ..." -ForegroundColor Yellow
Write-Host 'سيطلب Supabase كلمة مرور قاعدة البيانات عند الحاجة.' -ForegroundColor DarkGray
Invoke-Supabase link --project-ref $ProjectRef

Write-Host "`n[4/6] مراجعة migrations قبل التطبيق..." -ForegroundColor Yellow
Invoke-Supabase db push --dry-run

$confirmation = Read-Host 'هل تريد تطبيق migrations الآن؟ اكتب YES للمتابعة'
if ($confirmation -cne 'YES') {
  throw 'تم إيقاف العملية قبل تعديل قاعدة البيانات.'
}

Write-Host "`n[5/6] تطبيق migrations على قاعدة البيانات..." -ForegroundColor Yellow
Invoke-Supabase db push

Write-Host "`n[6/6] نشر وظيفة دخول أعضاء المنصة..." -ForegroundColor Yellow
Invoke-Supabase functions deploy member-access --no-verify-jwt --project-ref $ProjectRef --use-api

$projectUrl = "https://$ProjectRef.supabase.co"

Write-Host "`nتم تفعيل البنية الخلفية بنجاح." -ForegroundColor Green
Write-Host "`nأضف القيم التالية في Vercel:" -ForegroundColor Cyan
Write-Host "VITE_SUPABASE_URL=$projectUrl"
Write-Host 'VITE_SUPABASE_PUBLISHABLE_KEY=<انسخه من Supabase Dashboard > Project Settings > API Keys>'
Write-Host "`nيمكن عرض مفاتيح المشروع أيضًا بهذا الأمر:" -ForegroundColor Cyan
Write-Host "npx supabase projects api-keys --project-ref $ProjectRef"
Write-Host "`nبعد إضافة متغيرات Vercel نفّذ Redeploy للمشروع." -ForegroundColor Yellow

/*
# تسجيل سحب صلاحية تنفيذ الدوال الأمنية

تم سحب صلاحية EXECUTE على PUBLIC/anon/authenticated للدالتين
is_platform_admin() و current_member_id() لحمايتهما من الاستدعاء
المباشر عبر REST/PostgREST. تستخدمهما سياسات RLS داخلياً عبر
SECURITY DEFINER فقط.
*/

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM PUBLIC;
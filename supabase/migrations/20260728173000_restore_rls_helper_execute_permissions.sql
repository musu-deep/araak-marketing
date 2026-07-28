/*
# Restore execution permissions for RLS helper functions

PostgreSQL evaluates functions referenced by RLS policies as the calling role.
SECURITY DEFINER controls the privileges used inside the function body, but the
caller must still have EXECUTE permission on the function itself.

These helpers only return the current authenticated member id and whether that
same member has an administrative platform role, so exposing them to the
`authenticated` role is safe and required for the existing RLS policies.
*/

-- Keep the helpers unavailable to unauthenticated/public callers.
REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;

-- RLS policies call these functions for signed-in users.
GRANT EXECUTE ON FUNCTION public.current_member_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- Service-role operations may also evaluate policies in administrative tooling.
GRANT EXECUTE ON FUNCTION public.current_member_id() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO service_role;

COMMENT ON FUNCTION public.current_member_id() IS
  'Returns the platform member linked to auth.uid(); executable by authenticated users for RLS evaluation.';

COMMENT ON FUNCTION public.is_platform_admin() IS
  'Returns whether the current authenticated platform member has an administrative role; executable for RLS evaluation.';

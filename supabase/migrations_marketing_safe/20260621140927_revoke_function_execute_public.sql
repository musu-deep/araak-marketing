/*
# ØªØ³Ø¬ÙŠÙ„ Ø³Ø­Ø¨ ØµÙ„Ø§Ø­ÙŠØ© ØªÙ†ÙÙŠØ° Ø§Ù„Ø¯ÙˆØ§Ù„ Ø§Ù„Ø£Ù…Ù†ÙŠØ©

ØªÙ… Ø³Ø­Ø¨ ØµÙ„Ø§Ø­ÙŠØ© EXECUTE Ø¹Ù„Ù‰ PUBLIC/anon/authenticated Ù„Ù„Ø¯Ø§Ù„ØªÙŠÙ†
is_platform_admin() Ùˆ current_member_id() Ù„Ø­Ù…Ø§ÙŠØªÙ‡Ù…Ø§ Ù…Ù† Ø§Ù„Ø§Ø³ØªØ¯Ø¹Ø§Ø¡
Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¹Ø¨Ø± REST/PostgREST. ØªØ³ØªØ®Ø¯Ù…Ù‡Ù…Ø§ Ø³ÙŠØ§Ø³Ø§Øª RLS Ø¯Ø§Ø®Ù„ÙŠØ§Ù‹ Ø¹Ø¨Ø±
SECURITY DEFINER ÙÙ‚Ø·.
*/

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_member_id() FROM PUBLIC;


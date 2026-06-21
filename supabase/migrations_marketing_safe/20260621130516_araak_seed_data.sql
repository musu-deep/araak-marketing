/*
# Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£ÙˆÙ„ÙŠØ© Ù„Ù…Ù†ØµØ© Ø£Ø±Ø§Ùƒ

1. Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª
- 9 Ø£Ø¹Ø¶Ø§Ø¡ ÙØ±ÙŠÙ‚ Ù…Ø¹ Ø£Ø¯ÙˆØ§Ø±Ù‡Ù… ÙˆØ£Ù„Ù‚Ø§Ø¨Ù‡Ù…
- 8 Ø£Ù‚Ø³Ø§Ù…/ØªØ®ØµØµØ§Øª
- ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¹Ù„Ù‰ Ø£Ù‚Ø³Ø§Ù… Ø§Ù„Ù…Ù†ØµØ© ÙˆÙ…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…Ù†Ø§ÙØ³Ø©
- Ù…Ù†ØµØ§Øª Ù…Ù†Ø§ÙØ³Ø§Øª Ø®Ø§Ø±Ø¬ÙŠØ© (Ø§Ø¹ØªÙ…Ø§Ø¯ØŒ ÙØ±ØµØ©ØŒ Ù…Ù†Ø§ÙØ³)
*/

-- Ø§Ù„Ø£Ø¯ÙˆØ§Ø±
INSERT INTO public.roles (key, name, name_en, level, is_admin, description) VALUES
  ('ceo', 'Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'CEO', 1, true, 'Ø§Ù„Ø¥Ø´Ø±Ø§Ù Ø§Ù„ÙƒØ§Ù…Ù„ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù†ØµØ© ÙˆØ§Ù„Ù…Ù†Ø¸ÙˆÙ…Ø©'),
  ('vp', 'Ù†Ø§Ø¦Ø¨ Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'VP', 2, true, 'Ù†Ø§Ø¦Ø¨ Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ù„Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©'),
  ('marketing_lead', 'Ù…Ø³Ø¤ÙˆÙ„ ÙØ±ÙŠÙ‚ ØªØ³ÙˆÙŠÙ‚ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹', 'Marketing Lead', 2, true, 'Ù…Ø³Ø¤ÙˆÙ„ ÙØ±ÙŠÙ‚ Ø§Ù„ØªØ³ÙˆÙŠÙ‚ ÙˆØ¥Ø³Ù†Ø§Ø¯ Ø§Ù„Ù…Ù‡Ø§Ù…'),
  ('executive_followup', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'Executive Follow-up', 3, false, 'Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ° Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª'),
  ('national_director', 'Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„ÙˆØ·Ù†ÙŠØ©', 'National Projects Director', 3, false, 'Ø¥Ø¯Ø§Ø±Ø© Ù…Ø´Ø§Ø±ÙŠØ¹ Ø£Ø±Ø§Ùƒ Ø§Ù„ÙˆØ·Ù†ÙŠØ©'),
  ('warehouse_sales', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª', 'Warehouse & Sales', 3, false, 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ©'),
  ('cfo', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠ', 'CFO', 2, false, 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ© Ù„Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©'),
  ('executive_office', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ÙƒØªØ¨ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'Executive Office', 3, false, 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙƒØªØ¨ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ'),
  ('logistics', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ© ÙˆØ³Ù„Ø§Ø³Ù„ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯', 'Logistics', 3, false, 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ© ÙˆØ³Ù„Ø§Ø³Ù„ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯')
ON CONFLICT (key) DO NOTHING;

-- Ø§Ù„Ø£Ù‚Ø³Ø§Ù…/Ø§Ù„ØªØ®ØµØµØ§Øª
INSERT INTO public.departments (id, name, name_en, icon, color, sort_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'Executive', 'crown', '#0e8494', 1),
  ('11111111-0000-0000-0000-000000000002', 'Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø± ÙˆØ§Ù„ØªØ³ÙˆÙŠÙ‚', 'Investment & Marketing', 'trending-up', '#c89c2e', 2),
  ('11111111-0000-0000-0000-000000000003', 'Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'Executive Follow-up', 'clipboard-check', '#2f5d7d', 3),
  ('11111111-0000-0000-0000-000000000004', 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„ÙˆØ·Ù†ÙŠØ©', 'National Projects', 'building-2', '#3e7597', 4),
  ('11111111-0000-0000-0000-000000000005', 'Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª', 'Warehouse & Sales', 'package', '#bb6e3b', 5),
  ('11111111-0000-0000-0000-000000000006', 'Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©', 'Finance', 'wallet', '#284c66', 6),
  ('11111111-0000-0000-0000-000000000007', 'Ø§Ù„Ù…ÙƒØªØ¨ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'Executive Office', 'briefcase', '#115462', 7),
  ('11111111-0000-0000-0000-000000000008', 'Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ© ÙˆØ§Ù„Ø¥Ù…Ø¯Ø§Ø¯', 'Logistics', 'truck', '#9b5533', 8)
ON CONFLICT (id) DO NOTHING;

-- Ø£Ø¹Ø¶Ø§Ø¡ ÙØ±ÙŠÙ‚ Ø£Ø±Ø§Ùƒ
INSERT INTO public.team_members (id, full_name, email, title, role_key, department_id, bio, specialties, is_active) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Ø¯. Ø¹Ù„ÙŠ Ø§Ù„Ø¹ØªÙŠØ¨ÙŠ', 'ali.alotaibi@araak.com', 'Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'ceo', '11111111-0000-0000-0000-000000000001', 'Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø£Ø±Ø§ÙƒØŒ ÙŠÙ‚ÙˆØ¯ Ø§Ù„Ø±Ø¤ÙŠØ© Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ© Ù„Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© ÙˆÙƒØ§ÙØ© Ø´Ø±ÙƒØ§ØªÙ‡Ø§', ARRAY['Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ©','Ø§ØªØ®Ø§Ø° Ø§Ù„Ù‚Ø±Ø§Ø±','Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©'], true),
  ('22222222-0000-0000-0000-000000000002', 'Ø¯. Ù„Ø¤ÙŠ Ø£Ø­Ù…Ø¯', 'luay.ahmed@araak.com', 'Ù†Ø§Ø¦Ø¨ Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'vp', '11111111-0000-0000-0000-000000000001', 'Ù†Ø§Ø¦Ø¨ Ø§Ù„Ø±Ø¦ÙŠØ³ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ù„Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©ØŒ ÙŠØ´Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ© ÙˆØ§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ©', ARRAY['Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©','Ø§Ù„ØªØ®Ø·ÙŠØ· Ø§Ù„Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠ','Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª'], true),
  ('22222222-0000-0000-0000-000000000003', 'Ø£. Ù‡Ø§Ù†ÙŠ Ù…Ø­Ù…Ø¯', 'hani.mohammed@araak.com', 'Ù†Ø§Ø¦Ø¨ Ø§Ù„Ø±Ø¦ÙŠØ³ Ù„Ù„Ø§Ø³ØªØ«Ù…Ø§Ø± ÙˆÙ…Ø³Ø¤ÙˆÙ„ ÙØ±ÙŠÙ‚ Ø§Ù„ØªØ³ÙˆÙŠÙ‚', 'marketing_lead', '11111111-0000-0000-0000-000000000002', 'Ù†Ø§Ø¦Ø¨ Ø§Ù„Ø±Ø¦ÙŠØ³ Ù„Ù„Ø§Ø³ØªØ«Ù…Ø§Ø± ÙˆÙ…Ø³Ø¤ÙˆÙ„ ÙØ±ÙŠÙ‚ ØªØ³ÙˆÙŠÙ‚ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ØŒ ÙŠØªÙˆÙ„Ù‰ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ù†ØµØ© ÙˆØ§Ø³ØªÙ‚Ø·Ø§Ø¨ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ¥Ø³Ù†Ø§Ø¯ Ø§Ù„Ù…Ù‡Ø§Ù…', ARRAY['Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±','Ø§Ù„ØªØ³ÙˆÙŠÙ‚','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª','Ø¥Ø³Ù†Ø§Ø¯ Ø§Ù„Ù…Ù‡Ø§Ù…'], true),
  ('22222222-0000-0000-0000-000000000004', 'Ù…. Ø¹Ø¨Ø¯ Ø§Ù„Ù„Ù‡ Ø§Ù„Ø¹ØªÙŠØ¨ÙŠ', 'abdullah.alotaibi@araak.com', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'executive_followup', '11111111-0000-0000-0000-000000000003', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª', ARRAY['Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©','Ø§Ù„ØªÙ†ÙÙŠØ°','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø®Ø§Ø·Ø±'], true),
  ('22222222-0000-0000-0000-000000000005', 'Ù…. Ø¹Ø¨Ø¯ Ø§Ù„Ø±Ø­Ù…Ù† Ø§Ù„Ø­Ø³Ø§Ù…', 'abdulrahman.alhussam@araak.com', 'Ù…Ø¯ÙŠØ± Ø£Ø±Ø§Ùƒ Ø§Ù„ÙˆØ·Ù†ÙŠØ© ÙˆØ§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹', 'national_director', '11111111-0000-0000-0000-000000000004', 'Ù…Ø¯ÙŠØ± Ø£Ø±Ø§Ùƒ Ø§Ù„ÙˆØ·Ù†ÙŠØ© ÙˆÙ‚Ø§Ø¦Ø¯ Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…Ø¤Ø³Ø³Ø© Ø§Ù„ÙˆØ·Ù†ÙŠØ©', ARRAY['Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹','Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„ÙˆØ·Ù†ÙŠØ©','Ø§Ù„ØªØ´ØºÙŠÙ„'], true),
  ('22222222-0000-0000-0000-000000000006', 'Ù…. Ù…Ø­Ù…Ø¯ Ø´ÙƒØ§Ùƒ', 'mohammed.shakak@araak.com', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ©', 'warehouse_sales', '11111111-0000-0000-0000-000000000005', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ© Ù„ÙƒØ§ÙØ© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª', ARRAY['Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª','Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª','Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ†'], true),
  ('22222222-0000-0000-0000-000000000007', 'Ø£. Ù…Ø­Ù…Ø¯ Ø§Ù„Ø³ÙŠÙ…Øª', 'mohammed.alsimet@araak.com', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠ Ù„Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©', 'cfo', '11111111-0000-0000-0000-000000000006', 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠ Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø£Ø±Ø§ÙƒØŒ ÙŠØ´Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø´Ø¤ÙˆÙ† Ø§Ù„Ù…Ø§Ù„ÙŠØ© ÙˆØ§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±ÙŠØ©', ARRAY['Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©','Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ§Øª','Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…Ø§Ù„ÙŠ'], true),
  ('22222222-0000-0000-0000-000000000008', 'Ø£. Ø¹Ø¨Ø§Ø³ Ø±Ù…Ø¶Ø§Ù†', 'abbas.ramadan@araak.com', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ÙƒØªØ¨ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ', 'executive_office', '11111111-0000-0000-0000-000000000007', 'Ù…Ø³Ø¤ÙˆÙ„ Ø§Ù„Ù…ÙƒØªØ¨ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙˆØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ÙŠØ§Øª ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©', ARRAY['Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©','Ø§Ù„ØªÙ†Ø³ÙŠÙ‚','Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©'], true),
  ('22222222-0000-0000-0000-000000000009', 'Ø£. Ù…Ø­Ù…ÙˆØ¯ Ø¹ÙˆØ¶', 'mahmoud.awad@araak.com', 'Ù…Ø³Ø¤ÙˆÙ„ Ø£Ø±Ø§Ùƒ Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ© ÙˆØ³Ù„Ø§Ø³Ù„ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯', 'logistics', '11111111-0000-0000-0000-000000000008', 'Ù…Ø³Ø¤ÙˆÙ„ Ø£Ø±Ø§Ùƒ Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ© ÙˆØ³Ù„Ø§Ø³Ù„ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯ ÙˆØ§Ù„Ù†Ù‚Ù„', ARRAY['Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ©','Ø³Ù„Ø§Ø³Ù„ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯','Ø§Ù„Ù†Ù‚Ù„'], true)
ON CONFLICT (email) DO NOTHING;

-- Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¹Ù„Ù‰ Ø£Ù‚Ø³Ø§Ù… Ø§Ù„Ù…Ù†ØµØ©
INSERT INTO public.permissions (key, label, category, description, is_stage_permission) VALUES
  ('dashboard', 'Ø§Ù„Ù„ÙˆØ­Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'modules', 'Ø¹Ø±Ø¶ Ø§Ù„Ù„ÙˆØ­Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© ÙˆØ§Ù„Ù…Ø¤Ø´Ø±Ø§Øª', false),
  ('opportunity_radar', 'Ø±Ø§Ø¯Ø§Ø± Ø§Ù„ÙØ±Øµ', 'modules', 'Ø¹Ø±Ø¶ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙØ±Øµ ÙˆØ§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª', false),
  ('tender_management', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª', 'modules', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª ÙˆØ³ÙŠØ± Ø§Ù„Ø¹Ù…Ù„', false),
  ('ai_advisor', 'Ù…Ø³ØªØ´Ø§Ø± AI', 'modules', 'Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù…Ø³ØªØ´Ø§Ø± Ø§Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª Ø§Ù„Ø°ÙƒÙŠ', false),
  ('tasks', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ù‡Ø§Ù…', 'modules', 'Ø¥Ø¯Ø§Ø±Ø© ÙˆØªØªØ¨Ø¹ Ø§Ù„Ù…Ù‡Ø§Ù…', false),
  ('team', 'ØªØ¹Ø§ÙˆÙ† Ø§Ù„ÙØ±ÙŠÙ‚', 'modules', 'Ø¹Ø±Ø¶ Ø§Ù„ÙØ±ÙŠÙ‚ ÙˆÙ…ØµÙÙˆÙØ© Ø§Ù„Ù…Ø³Ø¤ÙˆÙ„ÙŠØ§Øª', false),
  ('documents', 'Ù…Ø±ÙƒØ² Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚', 'modules', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚ ÙˆØ§Ù„Ù…Ù„ÙØ§Øª', false),
  ('accountability', 'Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© ÙˆØ§Ù„Ù…Ø³Ø§Ø¡Ù„Ø©', 'modules', 'Ø¹Ø±Ø¶ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø©', false),
  ('lessons', 'Ø§Ù„Ø¯Ø±ÙˆØ³ Ø§Ù„Ù…Ø³ØªÙØ§Ø¯Ø©', 'modules', 'Ø¹Ø±Ø¶ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¯Ø±ÙˆØ³ Ø§Ù„Ù…Ø³ØªÙØ§Ø¯Ø©', false),
  ('reports', 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', 'modules', 'Ø¹Ø±Ø¶ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©', false),
  ('settings', 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª', 'modules', 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†', false),
  -- ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¹Ù„Ù‰ Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…Ù†Ø§ÙØ³Ø©
  ('stage_intake', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„', 'stages', 'Ø±Ø¤ÙŠØ© Ù…Ø±Ø­Ù„Ø© Ø§Ø³ØªÙ‚Ø¨Ø§Ù„ Ø§Ù„Ù…Ù†Ø§ÙØ³Ø©', true),
  ('stage_qualification', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØ£Ù‡ÙŠÙ„', 'stages', 'Ø±Ø¤ÙŠØ© Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªØ£Ù‡ÙŠÙ„ Ø§Ù„Ù…Ø¨Ø¯Ø¦ÙŠ', true),
  ('stage_technical', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„ÙÙ†ÙŠØ©', 'stages', 'Ø±Ø¤ÙŠØ© Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„ÙÙ†ÙŠØ© Ù„Ù„Ù…Ù†Ø§ÙØ³Ø©', true),
  ('stage_financial', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©', 'stages', 'Ø±Ø¤ÙŠØ© Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ© Ù„Ù„Ù…Ù†Ø§ÙØ³Ø©', true),
  ('stage_submission', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ…', 'stages', 'Ø±Ø¤ÙŠØ© Ù…Ø±Ø­Ù„Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ', true),
  ('stage_presentation', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø¹Ø±Ø¶', 'stages', 'Ø±Ø¤ÙŠØ© Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø¹Ø±Ø¶ ÙˆØ§Ù„ØªÙ‚Ø¯ÙŠÙ…', true),
  ('stage_result', 'Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ù†ØªÙŠØ¬Ø©', 'stages', 'Ø±Ø¤ÙŠØ© Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ù†ØªÙŠØ¬Ø© ÙˆØ§Ù„Ø¥Ø¹Ù„Ø§Ù†', true),
  -- ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¥Ø¯Ø§Ø±ÙŠØ©
  ('manage_users', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†', 'admin', 'Ø¥Ø¶Ø§ÙØ© ÙˆØªØ¹Ø¯ÙŠÙ„ ÙˆØ­Ø°Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†', false),
  ('manage_permissions', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª', 'admin', 'Ù…Ù†Ø­ ÙˆØ­Ø¬Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†', false),
  ('manage_opportunities', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙØ±Øµ', 'admin', 'Ø¥Ø¶Ø§ÙØ© ÙˆØ­Ø°Ù ÙˆØªØ¹Ø¯ÙŠÙ„ Ø§Ù„ÙØ±Øµ', false),
  ('assign_tasks', 'Ø¥Ø³Ù†Ø§Ø¯ Ø§Ù„Ù…Ù‡Ø§Ù…', 'admin', 'Ø¥Ø³Ù†Ø§Ø¯ Ø§Ù„Ù…Ù‡Ø§Ù… Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„ÙØ±ÙŠÙ‚', false),
  ('propose_external', 'Ø§Ù‚ØªØ±Ø§Ø­ ÙØ±Øµ Ø®Ø§Ø±Ø¬ÙŠØ©', 'admin', 'Ø§Ù‚ØªØ±Ø§Ø­ ÙØ±Øµ Ù…Ù† Ù…Ù†ØµØ§Øª Ø®Ø§Ø±Ø¬ÙŠØ©', false)
ON CONFLICT (key) DO NOTHING;

-- Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù„Ù„Ø£Ø¯ÙˆØ§Ø±
-- Ø§Ù„Ø±Ø¦ÙŠØ³ ÙˆÙ†Ø§Ø¦Ø¨Ù‡ ÙˆÙ…Ø³Ø¤ÙˆÙ„ Ø§Ù„ØªØ³ÙˆÙŠÙ‚: ÙƒÙ„ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª
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

-- Ø¨Ø§Ù‚ÙŠ Ø§Ù„Ø£Ø¯ÙˆØ§Ø±: Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„ÙˆØ­Ø© ÙˆØ§Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ù„ÙØ±Øµ Ø§Ù„Ù…ÙØ³Ù†ÙŽØ¯Ø© ÙˆØ§Ù„ÙˆØ«Ø§Ø¦Ù‚ ÙˆØ§Ù„Ø¯Ø±ÙˆØ³
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

-- Ù…Ù†ØµØ§Øª Ø§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ©
INSERT INTO marketing.external_platforms (name, base_url, logo_url, description, is_active) VALUES
  ('Ø§Ø¹ØªÙ…Ø§Ø¯', 'https://tenders.etimad.sa', NULL, 'Ù…Ù†ØµØ© Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ© Ù„Ù„Ù…Ù†Ø§ÙØ³Ø§Øª ÙˆØ§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª', true),
  ('ÙØ±ØµØ©', 'https://forasah.com', NULL, 'Ù…Ù†ØµØ© ÙØ±ØµØ© Ù„Ù„ÙØ±Øµ Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±ÙŠØ© ÙˆØ§Ù„Ù…Ù†Ø§ÙØ³Ø§Øª', true),
  ('Ù…Ù†Ø§ÙØ³', 'https://munafsa.com', NULL, 'Ù…Ù†ØµØ© Ù…Ù†Ø§ÙØ³ Ù„Ù„Ù…Ù†Ø§Ù‚ØµØ§Øª ÙˆØ§Ù„Ù…Ø²Ø§Ø¯Ø§Øª', true),
  ('Ø§Ù„Ù…ÙˆÙ†Ù‚Ø§Øª Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©', 'https://monaqasat.com', NULL, 'Ù…Ù†ØµØ© Ù…Ù†Ø§Ù‚ØµØ§Øª Ù„Ù„Ù…Ù†Ø§ÙØ³Ø§Øª Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©', true)
ON CONFLICT DO NOTHING;


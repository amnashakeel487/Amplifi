-- ==============================================================================
-- AMPLIFI SEED DATA & ADMIN BOOTSTRAP
-- ==============================================================================

-- Initial System Settings
INSERT INTO public.system_settings (
  id,
  google_connected,
  google_account_email,
  google_drive_root_folder_id,
  google_drive_root_folder_name,
  backup_schedule_cron,
  last_backup_at,
  auto_publish_enabled,
  notification_email_enabled
) VALUES (
  'primary_settings',
  true,
  'cloud-integrations@amplifi.io',
  'drive_root_amplifi_marketing',
  'Amplifi Master Assets Directory',
  '0 2 * * *',
  now() - interval '6 hours',
  false,
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Clients
INSERT INTO public.clients (id, name, code, industry, timezone, status, primary_contact_name, primary_contact_email, notes) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme FinTech Global', 'ACME', 'Fintech & Banking', 'America/New_York', 'active', 'Elena Rostova', 'elena@acmefintech.io', 'Enterprise Tier. Requires 48-hour compliance review window.'),
('22222222-2222-2222-2222-222222222222', 'Pulse Energy Labs', 'PULSE', 'Renewable Energy', 'America/Los_Angeles', 'active', 'Marcus Vance', 'marcus@pulseenergy.com', 'Focus on CleanTech Reels, LinkedIn carousels, and climate summits.'),
('33333333-3333-3333-3333-333333333333', 'Kroma Lifestyle & Apparel', 'KROMA', 'E-Commerce / Fashion', 'Europe/London', 'active', 'Sophie Laurent', 'sophie@kromafashion.co.uk', 'Weekly TikTok and Instagram visual drops.')
ON CONFLICT (code) DO NOTHING;

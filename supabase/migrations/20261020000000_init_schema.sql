-- ==============================================================================
-- AMPLIFI SOCIAL MEDIA CONTENT MANAGEMENT & APPROVAL SYSTEM
-- Database Migration 001: Initial Schema, Enums, RLS Policies & Triggers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'student', 'client');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE post_workflow_status AS ENUM (
  'draft',
  'assigned',
  'in_progress',
  'submitted',
  'under_review',
  'revision_required',
  'manager_approved',
  'pending_admin_approval',
  'approved',
  'ready_to_publish',
  'scheduled',
  'published',
  'rejected',
  'cancelled',
  'failed_publishing'
);

CREATE TYPE post_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'action_required', 'error');

CREATE TYPE backup_status AS ENUM ('in_progress', 'completed', 'failed');

-- ------------------------------------------------------------------------------
-- 2. USER PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'student',
  status user_status NOT NULL DEFAULT 'active',
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  title TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. CLIENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  industry TEXT,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. PROJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'active',
  priority project_priority NOT NULL DEFAULT 'medium',
  start_date DATE,
  deadline DATE,
  google_drive_folder_id TEXT,
  google_drive_folder_url TEXT,
  google_drive_folder_status TEXT DEFAULT 'pending' CHECK (google_drive_folder_status IN ('pending', 'connected', 'invalid_permissions', 'error')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 5. PROJECT MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_project TEXT NOT NULL DEFAULT 'member' CHECK (role_in_project IN ('manager', 'student', 'reviewer', 'client_observer')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(project_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 6. POSTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{"instagram"}',
  status post_workflow_status NOT NULL DEFAULT 'draft',
  priority post_priority NOT NULL DEFAULT 'medium',
  target_publish_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  assigned_student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creative_specs TEXT,
  reference_links TEXT[] DEFAULT '{}',
  google_drive_assets_folder_id TEXT,
  google_drive_assets_url TEXT,
  google_docs_brief_id TEXT,
  google_docs_brief_url TEXT,
  published_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  revision_instructions TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. POST SUBMISSIONS & ASSETS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  drive_file_id TEXT,
  drive_file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  submission_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 8. POST COMMENTS & PROOFREADING SUGGESTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment_type TEXT NOT NULL DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'revision_request', 'approval_note')),
  content TEXT NOT NULL,
  highlighted_text TEXT,
  suggested_replacement TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 9. POST WORKFLOW AUDIT / APPROVAL HISTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  from_status post_workflow_status NOT NULL,
  to_status post_workflow_status NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_at_time user_role NOT NULL,
  decision_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 10. SYSTEM SETTINGS & INTEGRATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary_settings',
  google_connected BOOLEAN NOT NULL DEFAULT false,
  google_account_email TEXT,
  google_drive_root_folder_id TEXT,
  google_drive_root_folder_name TEXT,
  google_token_expiry TIMESTAMPTZ,
  backup_schedule_cron TEXT DEFAULT '0 2 * * *',
  last_backup_at TIMESTAMPTZ,
  backup_retention_days INT DEFAULT 30,
  auto_publish_enabled BOOLEAN DEFAULT false,
  notification_email_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 11. BACKUP RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backup_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_name TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  size_bytes BIGINT DEFAULT 0,
  checksum TEXT,
  record_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  status backup_status NOT NULL DEFAULT 'in_progress',
  error_message TEXT,
  initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 12. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 13. NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'info',
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 14. HELPER FUNCTIONS FOR SECURITY & RLS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager') AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 15. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 16. RLS POLICIES
-- ------------------------------------------------------------------------------

-- PROFILES
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins have full profile control"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- CLIENTS
CREATE POLICY "Admins and managers can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.is_manager());

-- PROJECTS
CREATE POLICY "Projects viewable by members and managers"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.project_id = projects.id AND p.assigned_student_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can create/update projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (public.is_manager());

-- POSTS
CREATE POLICY "Posts viewable by project participants and managers"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    public.is_manager() OR
    assigned_student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = posts.project_id AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and Admins can create and manage posts"
  ON public.posts FOR ALL
  TO authenticated
  USING (public.is_manager());

CREATE POLICY "Assigned students can update specific fields when post is assigned or in revision"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (
    assigned_student_id = auth.uid() AND
    status IN ('assigned', 'in_progress', 'revision_required')
  );

-- POST ASSETS
CREATE POLICY "Assets viewable if post is viewable"
  ON public.post_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_assets.post_id AND (
        public.is_manager() OR
        p.assigned_student_id = auth.uid()
      )
    )
  );

CREATE POLICY "Students and managers can submit assets"
  ON public.post_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_manager() OR
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_assets.post_id AND p.assigned_student_id = auth.uid()
    )
  );

-- POST COMMENTS
CREATE POLICY "Comments viewable by participants"
  ON public.post_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_comments.post_id AND (
        public.is_manager() OR
        p.assigned_student_id = auth.uid()
      )
    )
  );

CREATE POLICY "Comments insertable by participants"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND (
      public.is_manager() OR
      EXISTS (
        SELECT 1 FROM public.posts p
        WHERE p.id = post_comments.post_id AND p.assigned_student_id = auth.uid()
      )
    )
  );

-- AUDIT LOGS & BACKUPS (ADMIN ONLY)
CREATE POLICY "Audit logs admin access only"
  ON public.audit_logs FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Backups admin access only"
  ON public.backup_records FOR ALL
  TO authenticated
  USING (public.is_admin());

-- SYSTEM SETTINGS
CREATE POLICY "System settings readable by managers and admins"
  ON public.system_settings FOR SELECT
  TO authenticated
  USING (public.is_manager());

CREATE POLICY "System settings writable by admin only"
  ON public.system_settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- NOTIFICATIONS
CREATE POLICY "Users can only access their own notifications"
  ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

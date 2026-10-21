-- ==============================================================================
-- AMPLIFI SOCIAL MEDIA CONTENT MANAGEMENT & APPROVAL SYSTEM
-- Database Migration 004: Target Workflow v2 - Rich Text, Two-Phase Review,
-- Per-Creator Drive Folders, Publisher Assignment & Scoped RLS
-- ==============================================================================

-- 1. ADD NEW ENUM VALUES TO post_workflow_status
ALTER TYPE post_workflow_status ADD VALUE IF NOT EXISTS 'text_submitted';
ALTER TYPE post_workflow_status ADD VALUE IF NOT EXISTS 'text_revision_required';
ALTER TYPE post_workflow_status ADD VALUE IF NOT EXISTS 'text_approved';
ALTER TYPE post_workflow_status ADD VALUE IF NOT EXISTS 'media_in_progress';
ALTER TYPE post_workflow_status ADD VALUE IF NOT EXISTS 'media_submitted';
ALTER TYPE post_workflow_status ADD VALUE IF NOT EXISTS 'media_revision_required';

-- 2. SCHEMA ADDITIONS TO POSTS TABLE
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS description_html TEXT,
  ADD COLUMN IF NOT EXISTS description_json JSONB,
  ADD COLUMN IF NOT EXISTS assigned_publisher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS publisher_role user_role;

-- 3. PER-CREATOR DRIVE FOLDER STORAGE
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS assigned_drive_folder_url TEXT;

ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS assigned_drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS assigned_drive_folder_url TEXT;

-- 4. POST TEXT VERSION HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.post_text_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description_html TEXT,
  caption_plain TEXT,
  hashtags TEXT[] DEFAULT '{}',
  submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  submission_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_post_text_versions_post ON public.post_text_versions(post_id, version_number DESC);

-- Enable RLS on post_text_versions
ALTER TABLE public.post_text_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Text versions viewable if post is viewable"
  ON public.post_text_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_text_versions.post_id AND (
        public.is_admin() OR
        p.assigned_student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p.project_id AND pm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Text versions insertable by post creator or manager"
  ON public.post_text_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_text_versions.post_id AND (
        public.is_admin() OR
        p.assigned_student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = p.project_id AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- 5. REFINED STATE TRANSITION VALIDATOR (TARGET WORKFLOW)
CREATE OR REPLACE FUNCTION public.validate_post_transition(
  p_current_status post_workflow_status,
  p_target_status post_workflow_status,
  p_user_role user_role
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Draft -> Text Submitted (Creator, Manager, Admin)
  IF p_current_status = 'draft' THEN
    IF p_target_status = 'text_submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'cancelled' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Text Submitted -> Text Approved / Text Revision Required (Manager, Admin)
  ELSIF p_current_status = 'text_submitted' THEN
    IF p_target_status IN ('text_approved', 'text_revision_required') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Text Revision Required -> Text Submitted (Creator, Manager, Admin)
  ELSIF p_current_status = 'text_revision_required' THEN
    IF p_target_status = 'text_submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    END IF;

  -- Text Approved -> Media In Progress (Creator starts media, or Manager/Admin advances)
  -- GATED: Media stage ONLY unlocks after text_approved
  ELSIF p_current_status = 'text_approved' THEN
    IF p_target_status = 'media_in_progress' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    -- In fast-track case, Creator directly submits media
    ELSIF p_target_status = 'media_submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    END IF;

  -- Media In Progress -> Media Submitted (Creator delivers visual asset)
  ELSIF p_current_status = 'media_in_progress' THEN
    IF p_target_status = 'media_submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'cancelled' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Media Submitted -> Media Revision Required (Manager, Admin) OR Manager Approved (Manager sign-off)
  ELSIF p_current_status = 'media_submitted' THEN
    IF p_target_status = 'media_revision_required' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'manager_approved' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    -- Manager directly escalates to Admin approval
    ELSIF p_target_status = 'pending_admin_approval' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Media Revision Required -> Media Submitted (Creator resubmits asset)
  ELSIF p_current_status = 'media_revision_required' THEN
    IF p_target_status = 'media_submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'media_in_progress' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    END IF;

  -- Manager Approved -> Pending Admin Approval
  ELSIF p_current_status = 'manager_approved' THEN
    IF p_target_status = 'pending_admin_approval' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'media_revision_required' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Pending Admin Approval -> Approved, Ready to Publish, Rejected, or Revision (ADMIN ONLY! Manager CANNOT approve)
  ELSIF p_current_status = 'pending_admin_approval' THEN
    IF p_target_status IN ('approved', 'ready_to_publish', 'rejected', 'text_revision_required', 'media_revision_required') AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  -- Approved -> Ready to Publish (Admin assigns self or manager)
  ELSIF p_current_status = 'approved' THEN
    IF p_target_status = 'ready_to_publish' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  -- Ready to Publish -> Published or Failed Publishing (Admin, or Assigned Manager)
  ELSIF p_current_status = 'ready_to_publish' THEN
    IF p_target_status IN ('published', 'failed_publishing') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Failed Publishing -> Ready to Publish (Retry)
  ELSIF p_current_status = 'failed_publishing' THEN
    IF p_target_status = 'ready_to_publish' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Published -> Cancelled (Admin takedown)
  ELSIF p_current_status = 'published' THEN
    IF p_target_status = 'cancelled' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  -- Rejected -> Draft (Admin, Manager reopen)
  ELSIF p_current_status = 'rejected' THEN
    IF p_target_status = 'draft' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Cancelled -> Draft (Admin only)
  ELSIF p_current_status = 'cancelled' THEN
    IF p_target_status = 'draft' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. STRICT PROJECT MEMBERSHIP POLICIES (ONLY ADMIN CAN ASSIGN/REMOVE MEMBERS)
DROP POLICY IF EXISTS "Managers and Admins can assign project members" ON public.project_members;
DROP POLICY IF EXISTS "Managers and Admins can update/delete project members" ON public.project_members;

CREATE POLICY "Admin only can assign project members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin only can update or delete project members"
  ON public.project_members FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 7. SCOPED PROJECT & POST ACCESS (MANAGERS ONLY SEE THEIR ASSIGNED PROJECTS)
DROP POLICY IF EXISTS "Projects viewable by members and managers" ON public.projects;
CREATE POLICY "Projects viewable by assigned participants and admin"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Posts viewable by project participants and managers" ON public.posts;
CREATE POLICY "Posts viewable by assigned participants and admin"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    public.is_admin() OR
    assigned_student_id = auth.uid() OR
    assigned_publisher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = posts.project_id AND pm.user_id = auth.uid()
    )
  );

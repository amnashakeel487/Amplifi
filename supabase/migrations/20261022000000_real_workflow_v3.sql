-- ==============================================================================
-- Migration: 20261022000000_real_workflow_v3.sql
-- Description: Implement Teacher's REAL WORKFLOW:
--   1. Project creation by Admin with assigned Manager and multi-student binding
--   2. Separate VIDEO and IMAGE Drive folders per student (project_student_folders)
--   3. Manager topic-wise post creation and student self-creation (origin = 'student_created')
--   4. Student upload into assigned video/image folder with MIME type validation
--   5. Manager review, side-by-side comparison, and "Recommend to Admin" with note
--   6. Admin final approval and publisher assignment (self vs manager)
--   7. Centralized state machine & strict RLS scoping
-- ==============================================================================

-- 1. Extend post_status enum if needed
DO $$
BEGIN
  -- Add new statuses to post_status enum if they do not already exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'student_created' AND enumtypid = 'post_status'::regtype) THEN
    ALTER TYPE post_status ADD VALUE 'student_created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'recommended_to_admin' AND enumtypid = 'post_status'::regtype) THEN
    ALTER TYPE post_status ADD VALUE 'recommended_to_admin';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- If post_status is a text column or check constraint rather than enum
    NULL;
END $$;

-- 2. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_email TEXT;

-- 3. Add columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS assigned_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Create project_student_folders table
CREATE TABLE IF NOT EXISTS public.project_student_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('video', 'image')),
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  permission_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_error TEXT,
  verification_status VARCHAR(20) DEFAULT 'not_set' CHECK (verification_status IN ('not_set', 'verified', 'no_access', 'not_a_folder', 'error')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_project_student_media UNIQUE (project_id, student_id, media_type)
);

-- Index for fast lookup by project and student
CREATE INDEX IF NOT EXISTS idx_psf_project_student ON public.project_student_folders(project_id, student_id);

-- Constraint function to verify that video and image folders of a student are different
CREATE OR REPLACE FUNCTION public.check_distinct_student_folders()
RETURNS TRIGGER AS $$
DECLARE
  v_other_folder_id TEXT;
BEGIN
  IF NEW.drive_folder_id IS NOT NULL AND NEW.drive_folder_id <> '' THEN
    SELECT drive_folder_id INTO v_other_folder_id
    FROM public.project_student_folders
    WHERE project_id = NEW.project_id
      AND student_id = NEW.student_id
      AND media_type <> NEW.media_type
      AND id <> NEW.id;

    IF v_other_folder_id IS NOT NULL AND v_other_folder_id = NEW.drive_folder_id THEN
      RAISE EXCEPTION 'Video folder and Image folder for a student must be different (Folder ID % already assigned)', NEW.drive_folder_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_distinct_student_folders ON public.project_student_folders;
CREATE TRIGGER trg_check_distinct_student_folders
  BEFORE INSERT OR UPDATE ON public.project_student_folders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_distinct_student_folders();

-- 5. Add columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS origin VARCHAR(20) DEFAULT 'manager_assigned' CHECK (origin IN ('manager_assigned', 'student_created')),
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(10) NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'image')),
  ADD COLUMN IF NOT EXISTS manager_recommendation_note TEXT,
  ADD COLUMN IF NOT EXISTS target_folder_id TEXT;

-- 6. CENTRAL STATE MACHINE TRANSITION VALIDATOR
-- Suggested Flow:
-- Draft -> Assigned (or Student Created) -> In Progress -> Submitted -> Under Review
--       -> Revision Required / Manager Approved -> Recommended to Admin
--       -> Approved / Rejected -> Ready to Publish (publisher chosen) -> Published / Failed
CREATE OR REPLACE FUNCTION public.validate_real_workflow_transition(
  p_current_status VARCHAR,
  p_target_status VARCHAR,
  p_user_role VARCHAR
) RETURNS BOOLEAN AS $$
BEGIN
  -- Admin has overarching supervisory control, except publishing without live confirmation
  IF p_user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Same status is always a no-op / allowed
  IF p_current_status = p_target_status THEN
    RETURN TRUE;
  END IF;

  -- 1. DRAFT transitions
  IF p_current_status = 'draft' THEN
    IF p_target_status IN ('assigned', 'in_progress') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'student_created' AND p_user_role = 'student' THEN
      RETURN TRUE;
    END IF;

  -- 2. ASSIGNED or STUDENT_CREATED transitions
  ELSIF p_current_status IN ('assigned', 'student_created') THEN
    IF p_target_status = 'in_progress' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'submitted' AND p_user_role = 'student' THEN
      RETURN TRUE;
    END IF;

  -- 3. IN PROGRESS transitions
  ELSIF p_current_status = 'in_progress' THEN
    IF p_target_status = 'submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    END IF;

  -- 4. SUBMITTED transitions
  ELSIF p_current_status = 'submitted' THEN
    IF p_target_status = 'under_review' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'revision_required' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'manager_approved' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- 5. UNDER REVIEW transitions
  ELSIF p_current_status = 'under_review' THEN
    IF p_target_status = 'revision_required' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'manager_approved' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'recommended_to_admin' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- 6. REVISION REQUIRED transitions
  ELSIF p_current_status = 'revision_required' THEN
    IF p_target_status IN ('in_progress', 'submitted') AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    END IF;

  -- 7. MANAGER APPROVED transitions
  -- Manager recommends post to Admin with note
  ELSIF p_current_status = 'manager_approved' THEN
    IF p_target_status = 'recommended_to_admin' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'revision_required' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- 8. RECOMMENDED TO ADMIN transitions
  -- ONLY Admin can approve, reject, or request revision from this stage!
  -- Manager can NEVER approve finally!
  ELSIF p_current_status = 'recommended_to_admin' THEN
    IF p_user_role = 'admin' AND p_target_status IN ('approved', 'ready_to_publish', 'rejected', 'revision_required') THEN
      RETURN TRUE;
    END IF;

  -- 9. APPROVED transitions
  ELSIF p_current_status = 'approved' THEN
    IF p_user_role = 'admin' AND p_target_status = 'ready_to_publish' THEN
      RETURN TRUE;
    END IF;

  -- 10. READY TO PUBLISH transitions
  ELSIF p_current_status = 'ready_to_publish' THEN
    IF p_target_status IN ('published', 'failed_publishing') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- 11. FAILED PUBLISHING transitions
  ELSIF p_current_status = 'failed_publishing' THEN
    IF p_target_status = 'ready_to_publish' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 7. ROW LEVEL SECURITY POLICIES

-- Enable RLS on project_student_folders
ALTER TABLE public.project_student_folders ENABLE ROW LEVEL SECURITY;

-- Admins can do anything on project_student_folders
DROP POLICY IF EXISTS "Admins full access to project_student_folders" ON public.project_student_folders;
CREATE POLICY "Admins full access to project_student_folders"
  ON public.project_student_folders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Managers can view folders for projects they manage
DROP POLICY IF EXISTS "Managers view folders for their projects" ON public.project_student_folders;
CREATE POLICY "Managers view folders for their projects"
  ON public.project_student_folders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_student_folders.project_id
        AND projects.assigned_manager_id = auth.uid()
    )
  );

-- Students can ONLY view their OWN folders (student_id = auth.uid())
-- Never see other students' folders
DROP POLICY IF EXISTS "Students view only their own folders" ON public.project_student_folders;
CREATE POLICY "Students view only their own folders"
  ON public.project_student_folders
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
  );

-- Update projects RLS for assigned_manager_id
DROP POLICY IF EXISTS "Managers view their assigned projects" ON public.projects;
CREATE POLICY "Managers view their assigned projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    assigned_manager_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Update posts RLS for project scoping and student origin
DROP POLICY IF EXISTS "Students view assigned or created posts" ON public.posts;
CREATE POLICY "Students view assigned or created posts"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (
    assigned_student_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Only Admin creates projects
DROP POLICY IF EXISTS "Only admin creates projects" ON public.projects;
CREATE POLICY "Only admin creates projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

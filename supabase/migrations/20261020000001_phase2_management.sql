-- ==============================================================================
-- AMPLIFI SOCIAL MEDIA CONTENT MANAGEMENT & APPROVAL SYSTEM
-- Database Migration 002: Phase 2 User Management, Clients, Projects & Memberships
-- ==============================================================================

-- 1. Helper function: Add or update project membership with role validation
CREATE OR REPLACE FUNCTION public.assign_project_member(
  p_project_id UUID,
  p_user_id UUID,
  p_role TEXT
)
RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Verify project exists
  IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id) THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Verify user exists and is active
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'User not found or inactive';
  END IF;

  -- Validate role in project
  IF p_role NOT IN ('manager', 'student', 'reviewer', 'client_observer') THEN
    RAISE EXCEPTION 'Invalid project role: %', p_role;
  END IF;

  -- Insert or update
  INSERT INTO public.project_members (project_id, user_id, role_in_project, assigned_at)
  VALUES (p_project_id, p_user_id, p_role, timezone('utc'::text, now()))
  ON CONFLICT (project_id, user_id)
  DO UPDATE SET
    role_in_project = EXCLUDED.role_in_project,
    assigned_at = timezone('utc'::text, now())
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper function: Deactivate user with safety checks (prevent deactivating last active admin)
CREATE OR REPLACE FUNCTION public.deactivate_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
  v_admin_count INT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;

  IF v_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin' AND status = 'active';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot deactivate the sole active System Administrator.';
    END IF;
  END IF;

  UPDATE public.profiles
  SET status = 'inactive', updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Additional RLS policy refinements for project members
CREATE POLICY "Project members can be viewed by project participants"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (
    public.is_manager() OR
    project_id IN (
      SELECT id FROM public.projects WHERE created_by = auth.uid()
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "Managers and Admins can assign project members"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_manager());

CREATE POLICY "Managers and Admins can update/delete project members"
  ON public.project_members FOR ALL
  TO authenticated
  USING (public.is_manager());

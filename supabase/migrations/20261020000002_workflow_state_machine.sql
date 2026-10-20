-- ==============================================================================
-- AMPLIFI SOCIAL MEDIA CONTENT MANAGEMENT & APPROVAL SYSTEM
-- Database Migration 003: Phase 3 Workflow State Machine & Server-Enforced Transitions
-- ==============================================================================

-- 1. Helper function: Server-enforced transition validation
CREATE OR REPLACE FUNCTION public.validate_post_transition(
  p_current_status post_workflow_status,
  p_target_status post_workflow_status,
  p_user_role user_role
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Draft
  IF p_current_status = 'draft' THEN
    IF p_target_status IN ('assigned', 'cancelled') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Assigned
  ELSIF p_current_status = 'assigned' THEN
    IF p_target_status = 'in_progress' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    ELSIF p_target_status IN ('draft', 'cancelled') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- In Progress
  ELSIF p_current_status = 'in_progress' THEN
    IF p_target_status = 'submitted' AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    ELSIF p_target_status IN ('assigned', 'cancelled') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Submitted
  ELSIF p_current_status = 'submitted' THEN
    IF p_target_status IN ('under_review', 'revision_required', 'manager_approved', 'pending_admin_approval')
       AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Under Review
  ELSIF p_current_status = 'under_review' THEN
    IF p_target_status IN ('revision_required', 'manager_approved', 'pending_admin_approval')
       AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'approved' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  -- Revision Required
  ELSIF p_current_status = 'revision_required' THEN
    IF p_target_status IN ('in_progress', 'submitted') AND p_user_role IN ('admin', 'manager', 'student') THEN
      RETURN TRUE;
    END IF;

  -- Manager Approved
  ELSIF p_current_status = 'manager_approved' THEN
    IF p_target_status = 'pending_admin_approval' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    ELSIF p_target_status = 'approved' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    ELSIF p_target_status = 'revision_required' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Pending Admin Approval
  ELSIF p_current_status = 'pending_admin_approval' THEN
    IF p_target_status IN ('approved', 'revision_required', 'rejected') AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  -- Approved
  ELSIF p_current_status = 'approved' THEN
    IF p_target_status IN ('ready_to_publish', 'scheduled', 'published') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Ready to Publish
  ELSIF p_current_status = 'ready_to_publish' THEN
    IF p_target_status IN ('scheduled', 'published', 'failed_publishing') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Scheduled
  ELSIF p_current_status = 'scheduled' THEN
    IF p_target_status IN ('published', 'ready_to_publish', 'failed_publishing') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Failed Publishing
  ELSIF p_current_status = 'failed_publishing' THEN
    IF p_target_status IN ('ready_to_publish', 'scheduled') AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Published
  ELSIF p_current_status = 'published' THEN
    IF p_target_status = 'cancelled' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  -- Rejected
  ELSIF p_current_status = 'rejected' THEN
    IF p_target_status = 'draft' AND p_user_role IN ('admin', 'manager') THEN
      RETURN TRUE;
    END IF;

  -- Cancelled
  ELSIF p_current_status = 'cancelled' THEN
    IF p_target_status = 'draft' AND p_user_role = 'admin' THEN
      RETURN TRUE;
    END IF;

  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Stored Procedure: Execute Post Transition with Audit & History
CREATE OR REPLACE FUNCTION public.execute_post_transition(
  p_post_id UUID,
  p_target_status post_workflow_status,
  p_note TEXT DEFAULT NULL
)
RETURNS post_workflow_status AS $$
DECLARE
  v_post RECORD;
  v_actor_role user_role;
  v_actor_email TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Fetch post
  SELECT * INTO v_post FROM public.posts WHERE id = p_post_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post with ID % does not exist.', p_post_id;
  END IF;

  -- Fetch actor profile
  SELECT role, email INTO v_actor_role, v_actor_email
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Authenticated user profile not found.';
  END IF;

  -- Validate transition rules
  v_is_valid := public.validate_post_transition(v_post.status, p_target_status, v_actor_role);
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Unauthorized state transition from % to % for role %.',
      v_post.status, p_target_status, v_actor_role;
  END IF;

  -- Enforce note for specific actions
  IF p_target_status IN ('revision_required', 'rejected') AND (p_note IS NULL OR length(trim(p_note)) < 5) THEN
    RAISE EXCEPTION 'A detailed note or reason (minimum 5 characters) is mandatory when requesting revisions or rejecting a post.';
  END IF;

  -- Update post record
  UPDATE public.posts
  SET
    status = p_target_status,
    updated_at = timezone('utc'::text, now()),
    rejection_reason = CASE WHEN p_target_status = 'rejected' THEN p_note ELSE rejection_reason END,
    revision_instructions = CASE WHEN p_target_status = 'revision_required' THEN p_note ELSE revision_instructions END,
    published_at = CASE WHEN p_target_status = 'published' AND published_at IS NULL THEN timezone('utc'::text, now()) ELSE published_at END
  WHERE id = p_post_id;

  -- Log to post_approvals table
  INSERT INTO public.post_approvals (
    post_id,
    from_status,
    to_status,
    actor_id,
    role_at_time,
    decision_notes
  ) VALUES (
    p_post_id,
    v_post.status,
    p_target_status,
    auth.uid(),
    v_actor_role,
    p_note
  );

  -- Log to immutable audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    v_actor_email,
    v_actor_role::text,
    'POST_WORKFLOW_TRANSITION',
    'post',
    p_post_id::text,
    jsonb_build_object(
      'from_status', v_post.status,
      'to_status', p_target_status,
      'decision_note', p_note
    )
  );

  RETURN p_target_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

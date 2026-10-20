-- ==============================================================================
-- Migration: 20261020000003_phase6_publishing_and_audit.sql
-- Description: Production publishing dispatch queue, scheduler triggers, and RLS
-- ==============================================================================

-- 1. Publishing Dispatch Queue
CREATE TABLE IF NOT EXISTS public.publishing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    target_account TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,
    published_url TEXT,
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cron scheduler polling
CREATE INDEX IF NOT EXISTS idx_publishing_jobs_schedule 
    ON public.publishing_jobs (status, scheduled_for) 
    WHERE status = 'queued';

-- Enable RLS
ALTER TABLE public.publishing_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to publishing jobs"
    ON public.publishing_jobs
    FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Managers can view publishing jobs for their projects"
    ON public.publishing_jobs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            JOIN public.projects proj ON proj.id = p.project_id
            WHERE p.id = publishing_jobs.post_id
            AND (public.is_manager() OR public.is_admin())
        )
    );

-- 2. Stored Procedure: Execute Post Publishing
CREATE OR REPLACE FUNCTION public.execute_publish_post(
    p_post_id UUID,
    p_published_url TEXT,
    p_target_account TEXT,
    p_published_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post RECORD;
    v_user_id UUID := auth.uid();
BEGIN
    SELECT * INTO v_post FROM public.posts WHERE id = p_post_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Post deliverable not found.');
    END IF;

    -- Only approved or ready_to_publish or scheduled posts can be marked published
    IF v_post.status NOT IN ('approved', 'ready_to_publish', 'scheduled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Post must be approved or ready to publish before marking as published.');
    END IF;

    -- Update post
    UPDATE public.posts
    SET 
        status = 'published',
        published_url = p_published_url,
        updated_at = NOW()
    WHERE id = p_post_id;

    -- Record in audit logs
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        v_user_id,
        'POST_PUBLISHED',
        'post',
        p_post_id::text,
        jsonb_build_object(
            'published_url', p_published_url,
            'target_account', p_target_account,
            'published_at', p_published_at
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'post_id', p_post_id,
        'new_status', 'published',
        'published_url', p_published_url
    );
END;
$$;

-- 3. Stored Procedure: Process Scheduled Dispatches (Invoked by pg_cron or Edge Function)
CREATE OR REPLACE FUNCTION public.process_scheduled_posts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT := 0;
    v_rec RECORD;
BEGIN
    FOR v_rec IN 
        SELECT id, title, target_publish_date 
        FROM public.posts 
        WHERE status = 'scheduled' 
        AND target_publish_date <= NOW()
    LOOP
        -- Transition to ready_to_publish or trigger webhook
        UPDATE public.posts 
        SET status = 'ready_to_publish', updated_at = NOW() 
        WHERE id = v_rec.id;

        -- Create system notification for admins & managers
        INSERT INTO public.notifications (user_id, title, message, type, link)
        SELECT 
            p.id,
            'Scheduled Post Dispatch Triggered',
            'Deliverable "' || v_rec.title || '" is scheduled for live distribution now.',
            'action_required',
            '/posts/' || v_rec.id
        FROM public.profiles p
        WHERE p.role IN ('admin', 'manager');

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

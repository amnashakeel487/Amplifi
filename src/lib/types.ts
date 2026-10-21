export type UserRole = 'admin' | 'manager' | 'student' | 'client';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  must_change_password?: boolean;
  phone?: string;
  title?: string;
  bio?: string;
  assigned_drive_folder_id?: string;
  assigned_drive_folder_url?: string;
  created_at: string;
  updated_at?: string;
}

export type PostWorkflowStatus =
  | 'draft'
  | 'text_submitted'
  | 'text_revision_required'
  | 'text_approved'
  | 'media_in_progress'
  | 'media_submitted'
  | 'media_revision_required'
  | 'manager_approved'
  | 'pending_admin_approval'
  | 'approved'
  | 'ready_to_publish'
  | 'scheduled'
  | 'published'
  | 'rejected'
  | 'cancelled'
  | 'failed_publishing'
  // Legacy compatibility aliases
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'revision_required';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube';

export interface Client {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  industry?: string;
  timezone: string;
  status: 'active' | 'inactive' | 'onboarding';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  client_id: string;
  client?: Client;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  priority: PriorityLevel;
  start_date?: string;
  deadline?: string;
  google_drive_folder_id?: string;
  google_drive_folder_url?: string;
  google_drive_folder_status?: 'pending' | 'connected' | 'invalid_permissions' | 'error';
  created_by?: string;
  created_at: string;
  updated_at?: string;
  members_count?: number;
  posts_count?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  user?: UserProfile;
  role_in_project: 'manager' | 'student' | 'reviewer' | 'client_observer';
  assigned_drive_folder_id?: string;
  assigned_drive_folder_url?: string;
  assigned_at: string;
}

export interface PostTextVersion {
  id: string;
  post_id: string;
  version_number: number;
  title: string;
  description_html: string;
  caption_plain: string;
  hashtags: string[];
  submitted_by?: string;
  submitter?: UserProfile;
  submission_notes?: string;
  created_at: string;
}

export interface Post {
  id: string;
  project_id: string;
  project?: Project;
  title: string;
  caption?: string;
  description_html?: string;
  description_json?: any;
  hashtags: string[];
  platforms: SocialPlatform[];
  status: PostWorkflowStatus;
  priority: PriorityLevel;
  target_publish_date?: string;
  deadline?: string;
  assigned_student_id?: string;
  assigned_student?: UserProfile;
  assigned_manager_id?: string;
  assigned_manager?: UserProfile;
  assigned_publisher_id?: string;
  assigned_publisher?: UserProfile;
  publisher_role?: UserRole;
  creative_specs?: string;
  reference_links?: string[];
  google_drive_assets_folder_id?: string;
  google_drive_assets_url?: string;
  google_docs_brief_id?: string;
  google_docs_brief_url?: string;
  published_url?: string;
  scheduled_at?: string;
  published_at?: string;
  rejection_reason?: string;
  revision_instructions?: string;
  assets?: PostAsset[];
  text_versions?: PostTextVersion[];
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface PostAsset {
  id: string;
  post_id: string;
  version_number: number;
  submitted_by?: string;
  submitter?: UserProfile;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  drive_file_id?: string;
  drive_file_url: string;
  thumbnail_url?: string;
  submission_notes?: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user?: UserProfile;
  comment_type: 'general' | 'suggestion' | 'revision_request' | 'approval_note';
  content: string;
  highlighted_text?: string;
  suggested_replacement?: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface PostApproval {
  id: string;
  post_id: string;
  from_status: PostWorkflowStatus;
  to_status: PostWorkflowStatus;
  actor_id: string;
  actor?: UserProfile;
  role_at_time: UserRole;
  decision_notes?: string;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  google_connected: boolean;
  google_account_email?: string;
  google_drive_root_folder_id?: string;
  google_drive_root_folder_name?: string;
  google_token_expiry?: string;
  backup_schedule_cron: string;
  last_backup_at?: string;
  backup_retention_days: number;
  auto_publish_enabled: boolean;
  notification_email_enabled: boolean;
  updated_at: string;
}

export interface BackupRecord {
  id: string;
  backup_name: string;
  file_url?: string;
  storage_path?: string;
  size_bytes: number;
  checksum?: string;
  record_counts: Record<string, number>;
  status: 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  initiated_by?: string;
  initiator?: UserProfile;
  created_at: string;
  completed_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'action_required' | 'error';
  link?: string;
  read: boolean;
  created_at: string;
}

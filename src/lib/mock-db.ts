import {
  UserProfile,
  Client,
  Project,
  ProjectMember,
  ProjectStudentFolder,
  FolderMediaType,
  FolderVerificationStatus,
  Post,
  PostAsset,
  PostTextVersion,
  PostComment,
  PostApproval,
  SystemSettings,
  BackupRecord,
  AuditLog,
  NotificationItem,
  PostWorkflowStatus,
  UserRole,
} from './types';

// Storage key bumped to v3 to guarantee all old mock/seed data is completely eliminated
const STORAGE_KEY = 'amplifi_db_v3_clean';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-01',
    email: 'admin@amplifi.io',
    full_name: 'Administrator',
    role: 'admin',
    status: 'active',
    title: 'Lead Operations Administrator',
    created_at: '2026-01-01T00:00:00Z',
    must_change_password: false,
  },
];

export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_PROJECT_STUDENT_FOLDERS: ProjectStudentFolder[] = [];
export const INITIAL_PROJECT_MEMBERS: ProjectMember[] = [];
export const INITIAL_COMMENTS: PostComment[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_BACKUPS: BackupRecord[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
  id: 'primary_settings',
  google_connected: false,
  google_account_email: '',
  google_drive_root_folder_id: '',
  google_drive_root_folder_name: '',
  google_token_expiry: '',
  backup_schedule_cron: '0 2 * * *',
  backup_retention_days: 30,
  auto_publish_enabled: false,
  notification_email_enabled: true,
  updated_at: new Date().toISOString(),
};

interface DatabaseSchema {
  users: UserProfile[];
  clients: Client[];
  projects: Project[];
  projectMembers: ProjectMember[];
  studentFolders: ProjectStudentFolder[];
  posts: Post[];
  comments: PostComment[];
  approvals: PostApproval[];
  settings: SystemSettings;
  backups: BackupRecord[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
}

class MockDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    if (typeof window === 'undefined') {
      return this.getCleanDefaultData();
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    const initial = this.getCleanDefaultData();
    this.saveData(initial);
    return initial;
  }

  private getCleanDefaultData(): DatabaseSchema {
    return {
      users: [...INITIAL_USERS],
      clients: [...INITIAL_CLIENTS],
      projects: [...INITIAL_PROJECTS],
      projectMembers: [...INITIAL_PROJECT_MEMBERS],
      studentFolders: [...INITIAL_PROJECT_STUDENT_FOLDERS],
      posts: [...INITIAL_POSTS],
      comments: [...INITIAL_COMMENTS],
      approvals: [],
      settings: { ...INITIAL_SETTINGS },
      backups: [...INITIAL_BACKUPS],
      auditLogs: [...INITIAL_AUDIT_LOGS],
      notifications: [...INITIAL_NOTIFICATIONS],
    };
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch {
        // quota exceeded or storage disabled
      }
    }
  }

  private saveData(d: DatabaseSchema): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      } catch {
        // storage disabled
      }
    }
  }

  // Users
  getUsers(): UserProfile[] {
    return [...this.data.users];
  }

  getUser(id: string): UserProfile | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): UserProfile | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.data.users[idx];
  }

  createUser(user: Omit<UserProfile, 'id' | 'created_at'>): UserProfile {
    const newUser: UserProfile = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  deleteUser(id: string): void {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.projectMembers = (this.data.projectMembers || []).filter(pm => pm.user_id !== id);
    this.data.studentFolders = (this.data.studentFolders || []).filter(sf => sf.student_id !== id);
    this.saveToStorage();
  }

  // Clients
  getClients(): Client[] {
    return [...this.data.clients];
  }

  getClient(id: string): Client | undefined {
    return this.data.clients.find(c => c.id === id);
  }

  createClient(client: Omit<Client, 'id' | 'created_at'>): Client {
    const newClient: Client = {
      ...client,
      id: `client-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.data.clients.push(newClient);
    this.saveToStorage();
    return newClient;
  }

  updateClient(id: string, updates: Partial<Client>): Client {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    this.data.clients[idx] = { ...this.data.clients[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.data.clients[idx];
  }

  deleteClient(id: string): void {
    const projIds = this.data.projects.filter(p => p.client_id === id).map(p => p.id);
    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.data.projects = this.data.projects.filter(p => p.client_id !== id);
    this.data.posts = this.data.posts.filter(p => !projIds.includes(p.project_id));
    this.saveToStorage();
  }

  // Projects
  getProjects(): Project[] {
    return this.data.projects.map(p => {
      const assignedManager = p.assigned_manager_id ? this.getUser(p.assigned_manager_id) : undefined;
      const members = this.getProjectMembers(p.id);
      const studentMembers = members
        .filter(m => m.role_in_project === 'student' && m.user)
        .map(m => m.user as UserProfile);

      return {
        ...p,
        client: p.client_id ? this.getClient(p.client_id) : undefined,
        assigned_manager: assignedManager,
        assigned_students: studentMembers,
        members_count: members.length,
        posts_count: this.data.posts.filter(post => post.project_id === p.id).length,
      };
    });
  }

  getProject(id: string): Project | undefined {
    const p = this.data.projects.find(proj => proj.id === id);
    if (!p) return undefined;
    const assignedManager = p.assigned_manager_id ? this.getUser(p.assigned_manager_id) : undefined;
    const members = this.getProjectMembers(p.id);
    const studentMembers = members
      .filter(m => m.role_in_project === 'student' && m.user)
      .map(m => m.user as UserProfile);

    return {
      ...p,
      client: p.client_id ? this.getClient(p.client_id) : undefined,
      assigned_manager: assignedManager,
      assigned_students: studentMembers,
      members_count: members.length,
      posts_count: this.data.posts.filter(post => post.project_id === p.id).length,
    };
  }

  getProjectsForUser(userOrId?: string | UserProfile): Project[] {
    const all = this.getProjects();
    const user = typeof userOrId === 'string' ? this.getUser(userOrId) : userOrId;
    if (!user || user.role === 'admin') {
      return all;
    }
    if (user.role === 'manager') {
      return all.filter(p => {
        const isAssigned = p.assigned_manager_id === user.id;
        const isMember = (this.data.projectMembers || []).some(
          pm => pm.project_id === p.id && pm.user_id === user.id
        );
        return isAssigned || isMember;
      });
    }
    // Student: projects where student has assigned folders, is assigned directly, or is a member
    const studentProjectIds = new Set<string>();
    all.forEach(p => {
      if (p.assigned_student_ids && p.assigned_student_ids.includes(user.id)) {
        studentProjectIds.add(p.id);
      }
    });
    (this.data.studentFolders || [])
      .filter(sf => sf.student_id === user.id)
      .forEach(sf => studentProjectIds.add(sf.project_id));
    (this.data.projectMembers || [])
      .filter(pm => pm.user_id === user.id)
      .forEach(pm => studentProjectIds.add(pm.project_id));

    return all.filter(p => studentProjectIds.has(p.id));
  }

  createProject(proj: Omit<Project, 'id' | 'created_at'>): Project {
    const newProj: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
      members_count: 0,
      posts_count: 0,
    };
    this.data.projects.push(newProj);
    this.saveToStorage();
    return this.getProject(newProj.id)!;
  }

  updateProject(id: string, updates: Partial<Project>): Project {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Project not found');
    this.data.projects[idx] = { ...this.data.projects[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.getProject(id)!;
  }

  deleteProject(id: string): void {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.data.posts = this.data.posts.filter(p => p.project_id !== id);
    this.data.projectMembers = (this.data.projectMembers || []).filter(pm => pm.project_id !== id);
    this.data.studentFolders = (this.data.studentFolders || []).filter(sf => sf.project_id !== id);
    this.saveToStorage();
  }

  // Project Members
  getProjectMembers(projectId: string): ProjectMember[] {
    const members = (this.data.projectMembers || []).filter(pm => pm.project_id === projectId);
    return members.map(m => ({
      ...m,
      user: this.getUser(m.user_id),
    }));
  }

  addProjectMember(
    projectId: string,
    userId: string,
    roleInProject: ProjectMember['role_in_project']
  ): ProjectMember {
    if (!this.data.projectMembers) this.data.projectMembers = [];
    const existing = this.data.projectMembers.find(
      pm => pm.project_id === projectId && pm.user_id === userId
    );

    const targetUser = this.getUser(userId);

    if (existing) {
      existing.role_in_project = roleInProject;
      this.saveToStorage();
      return { ...existing, user: targetUser };
    }
    const newMember: ProjectMember = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      project_id: projectId,
      user_id: userId,
      role_in_project: roleInProject,
      assigned_at: new Date().toISOString(),
    };
    this.data.projectMembers.push(newMember);
    this.saveToStorage();
    return { ...newMember, user: targetUser };
  }

  removeProjectMember(projectId: string, userId: string): void {
    this.data.projectMembers = (this.data.projectMembers || []).filter(
      pm => !(pm.project_id === projectId && pm.user_id === userId)
    );
    this.saveToStorage();
  }

  // Project Student Folders (Requirement 2)
  getStudentFolders(projectId?: string, studentId?: string): ProjectStudentFolder[] {
    let list = this.data.studentFolders || [];
    if (projectId) list = list.filter(f => f.project_id === projectId);
    if (studentId) list = list.filter(f => f.student_id === studentId);
    return list.map(f => ({
      ...f,
      student: this.getUser(f.student_id),
    }));
  }

  setStudentFolder(
    projectIdOrParams:
      | string
      | {
          project_id: string;
          student_id: string;
          media_type: FolderMediaType;
          drive_folder_id: string;
          drive_folder_url?: string;
          permission_verified?: boolean;
          verification_status?: FolderVerificationStatus;
        },
    studentIdArg?: string,
    mediaTypeArg?: FolderMediaType,
    driveFolderIdArg?: string,
    driveFolderUrlArg?: string
  ): ProjectStudentFolder {
    if (!this.data.studentFolders) this.data.studentFolders = [];

    const isObj = typeof projectIdOrParams === 'object';
    const projectId = isObj ? projectIdOrParams.project_id : projectIdOrParams;
    const studentId = isObj ? projectIdOrParams.student_id : (studentIdArg as string);
    const mediaType = isObj ? projectIdOrParams.media_type : (mediaTypeArg as FolderMediaType);
    const driveFolderId = isObj ? projectIdOrParams.drive_folder_id : (driveFolderIdArg as string);
    const driveFolderUrl = isObj ? projectIdOrParams.drive_folder_url : driveFolderUrlArg;
    const initialVerified = isObj ? (projectIdOrParams.permission_verified ?? false) : false;
    const initialStatus = isObj ? (projectIdOrParams.verification_status ?? 'not_set') : 'not_set';

    // Distinct check: video and image folders must be different
    const otherMediaType: FolderMediaType = mediaType === 'video' ? 'image' : 'video';
    const existingOther = this.data.studentFolders.find(
      f => f.project_id === projectId && f.student_id === studentId && f.media_type === otherMediaType
    );
    if (
      existingOther &&
      existingOther.drive_folder_id &&
      driveFolderId &&
      existingOther.drive_folder_id.trim() === driveFolderId.trim()
    ) {
      throw new Error(`Video and Image folders for a student must be different.`);
    }

    const idx = this.data.studentFolders.findIndex(
      f => f.project_id === projectId && f.student_id === studentId && f.media_type === mediaType
    );

    const folderUrl = driveFolderUrl || (driveFolderId ? `https://drive.google.com/drive/folders/${driveFolderId}` : '');

    if (idx >= 0) {
      this.data.studentFolders[idx] = {
        ...this.data.studentFolders[idx],
        drive_folder_id: driveFolderId,
        drive_folder_url: folderUrl,
        verification_status: initialStatus,
        permission_verified: initialVerified,
        verified_error: undefined,
        updated_at: new Date().toISOString(),
      };
      this.saveToStorage();
      return this.data.studentFolders[idx];
    } else {
      const newFolder: ProjectStudentFolder = {
        id: `psf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        project_id: projectId,
        student_id: studentId,
        media_type: mediaType,
        drive_folder_id: driveFolderId,
        drive_folder_url: folderUrl,
        permission_verified: initialVerified,
        verification_status: initialStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.studentFolders.push(newFolder);
      this.saveToStorage();
      return newFolder;
    }
  }

  updateFolderVerification(
    id: string,
    verification: {
      status: FolderVerificationStatus;
      verified: boolean;
      error?: string;
    }
  ): ProjectStudentFolder {
    const folder = (this.data.studentFolders || []).find(f => f.id === id);
    if (!folder) throw new Error('Student folder not found');
    folder.verification_status = verification.status;
    folder.permission_verified = verification.verified;
    folder.verified_at = new Date().toISOString();
    folder.verified_error = verification.error;
    this.saveToStorage();
    return folder;
  }

  // Posts
  getPosts(): Post[] {
    return this.data.posts.map(p => ({
      ...p,
      project: this.getProject(p.project_id),
      assigned_student: p.assigned_student_id ? this.getUser(p.assigned_student_id) : undefined,
      assigned_manager: p.assigned_manager_id ? this.getUser(p.assigned_manager_id) : undefined,
      assigned_publisher: p.assigned_publisher_id ? this.getUser(p.assigned_publisher_id) : undefined,
    }));
  }

  getPost(id: string): Post | undefined {
    const post = this.data.posts.find(p => p.id === id);
    if (!post) return undefined;
    return {
      ...post,
      project: this.getProject(post.project_id),
      assigned_student: post.assigned_student_id ? this.getUser(post.assigned_student_id) : undefined,
      assigned_manager: post.assigned_manager_id ? this.getUser(post.assigned_manager_id) : undefined,
      assigned_publisher: post.assigned_publisher_id ? this.getUser(post.assigned_publisher_id) : undefined,
    };
  }

  getPostsForUser(userOrId?: string | UserProfile): Post[] {
    const all = this.getPosts();
    const user = typeof userOrId === 'string' ? this.getUser(userOrId) : userOrId;
    if (!user || user.role === 'admin') {
      return all;
    }
    if (user.role === 'manager') {
      const managerProjectIds = this.getProjectsForUser(user).map(p => p.id);
      return all.filter(
        p =>
          managerProjectIds.includes(p.project_id) ||
          p.assigned_manager_id === user.id ||
          p.assigned_publisher_id === user.id
      );
    }
    // Student sees only assigned posts or self-created posts
    return all.filter(
      p =>
        p.assigned_student_id === user.id ||
        (p as any).assigned_creator_id === user.id ||
        p.created_by === user.id
    );
  }

  getPostsForProject(projectId: string): Post[] {
    return this.getPosts().filter(p => p.project_id === projectId);
  }

  getPostsForStatus(status: PostWorkflowStatus): Post[] {
    return this.getPosts().filter(p => p.status === status);
  }

  createPost(post: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Post {
    const newId = `post-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const studentId = post.assigned_student_id || (post as any).assigned_creator_id;
    const initialTextVersions: PostTextVersion[] = [];

    if (post.status !== 'assigned' && post.origin !== 'manager_assigned' && (post.description_html || post.caption)) {
      initialTextVersions.push({
        id: `tv-${Date.now()}-1`,
        post_id: newId,
        version_number: 1,
        title: post.title,
        description_html: post.description_html || `<p>${post.caption || ''}</p>`,
        caption_plain: post.caption || post.title,
        hashtags: post.hashtags || [],
        submitted_by: post.created_by,
        submission_notes: 'Initial drafted copy',
        created_at: new Date().toISOString(),
      });
    }

    const newPost: Post = {
      ...post,
      assigned_student_id: studentId,
      assigned_creator_id: studentId,
      id: newId,
      status: post.status || 'draft',
      content_type: post.content_type || 'video',
      origin: post.origin || 'manager_assigned',
      text_versions: initialTextVersions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.posts.unshift(newPost);
    this.saveToStorage();
    return this.getPost(newPost.id)!;
  }

  updatePost(id: string, updates: Partial<Post>): Post {
    const idx = this.data.posts.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Post not found');
    this.data.posts[idx] = { ...this.data.posts[idx], ...updates, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.getPost(id)!;
  }

  addTextVersion(
    postId: string,
    versionData: {
      title: string;
      description_html: string;
      caption_plain: string;
      hashtags: string[];
      submitted_by?: string;
      submission_notes?: string;
    }
  ): PostTextVersion {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (!post.text_versions) post.text_versions = [];
    const nextVer = post.text_versions.length + 1;

    const newVer: PostTextVersion = {
      id: `tv-${Date.now()}-${nextVer}`,
      post_id: postId,
      version_number: nextVer,
      title: versionData.title,
      description_html: versionData.description_html,
      caption_plain: versionData.caption_plain,
      hashtags: versionData.hashtags,
      submitted_by: versionData.submitted_by,
      submission_notes: versionData.submission_notes,
      created_at: new Date().toISOString(),
    };

    post.text_versions.unshift(newVer);
    post.title = versionData.title;
    post.description_html = versionData.description_html;
    post.caption = versionData.caption_plain;
    post.hashtags = versionData.hashtags;
    post.status = 'submitted';
    post.updated_at = new Date().toISOString();

    this.saveToStorage();
    return newVer;
  }

  assignPublisher(postId: string, publisherId: string, role: UserRole): Post {
    return this.updatePost(postId, {
      assigned_publisher_id: publisherId,
      publisher_role: role,
      status: 'ready_to_publish',
    });
  }

  recommendToAdmin(postId: string, note: string): Post {
    return this.updatePost(postId, {
      status: 'recommended_to_admin',
      manager_recommendation_note: note,
    });
  }

  submitPost(
    postId: string,
    data: {
      title: string;
      content: string;
      content_plain?: string;
      hashtags?: string[];
      drive_file_id?: string;
      drive_file_url?: string;
      drive_file_name?: string;
      drive_mime_type?: string;
    },
    submitterId: string
  ): Post {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (!post.text_versions) post.text_versions = [];
    const nextVer = post.text_versions.length + 1;

    const newVer: PostTextVersion = {
      id: `tv-${Date.now()}-${nextVer}`,
      post_id: postId,
      version_number: nextVer,
      title: data.title,
      description_html: data.content,
      caption_plain: data.content_plain || data.title,
      hashtags: data.hashtags || [],
      submitted_by: submitterId,
      submission_notes: `Submission v${nextVer}`,
      created_at: new Date().toISOString(),
    };
    post.text_versions.unshift(newVer);

    if (data.drive_file_id || data.drive_file_url) {
      if (!post.assets) post.assets = [];
      const assetVer = post.assets.length + 1;
      const newAsset: PostAsset = {
        id: `asset-${Date.now()}-${assetVer}`,
        post_id: postId,
        version_number: assetVer,
        submitted_by: submitterId,
        file_name: data.drive_file_name || 'deliverable',
        file_type: data.drive_mime_type || (post.content_type === 'video' ? 'video/mp4' : 'image/png'),
        file_size_bytes: 1024 * 1024 * 5,
        drive_file_id: data.drive_file_id,
        drive_file_url: data.drive_file_url || (data.drive_file_id ? `https://drive.google.com/file/d/${data.drive_file_id}/view` : ''),
        created_at: new Date().toISOString(),
      };
      post.assets.unshift(newAsset);
    }

    post.title = data.title;
    post.content = data.content;
    post.description_html = data.content;
    post.caption = data.content_plain || data.title;
    if (data.hashtags) post.hashtags = data.hashtags;
    post.status = 'submitted';
    post.version_count = nextVer;
    post.updated_at = new Date().toISOString();

    this.saveToStorage();
    return this.getPost(postId)!;
  }

  getComments(postId?: string): PostComment[] {
    if (!this.data.comments) this.data.comments = [];
    if (postId) {
      return this.data.comments.filter(c => c.post_id === postId);
    }
    return [...this.data.comments];
  }

  addComment(comment: {
    post_id: string;
    author_id?: string;
    user_id?: string;
    content: string;
    type?: string;
    comment_type?: PostComment['comment_type'];
    resolved?: boolean;
  }): PostComment {
    if (!this.data.comments) this.data.comments = [];
    const userId = comment.user_id || comment.author_id || 'system';
    const cType: PostComment['comment_type'] = (comment.comment_type ||
      (comment.type === 'revision_request' ? 'revision_request' : 'general')) as PostComment['comment_type'];

    const newComment: PostComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      post_id: comment.post_id,
      user_id: userId,
      comment_type: cType,
      content: comment.content,
      resolved: comment.resolved ?? false,
      created_at: new Date().toISOString(),
    };
    this.data.comments.push(newComment);
    this.saveToStorage();
    return newComment;
  }

  updatePostStatus(
    postId: string,
    status: PostWorkflowStatus,
    userId?: string,
    comment?: string
  ): Post {
    const post = this.data.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');

    post.status = status;
    post.updated_at = new Date().toISOString();

    if (comment && userId) {
      this.addComment({
        post_id: postId,
        user_id: userId,
        content: comment,
        comment_type: status === 'revision_required' ? 'revision_request' : 'general',
      });
    }

    this.saveToStorage();
    return this.getPost(postId)!;
  }

  markPublished(postId: string, publishedUrl: string, publisherId?: string): Post {
    return this.updatePost(postId, {
      status: 'published',
      published_url: publishedUrl,
      published_at: new Date().toISOString(),
      assigned_publisher_id: publisherId,
    });
  }

  // System Settings
  getSettings(): SystemSettings {
    return { ...this.data.settings };
  }

  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return { ...this.data.settings };
  }

  // Backups
  getBackups(): BackupRecord[] {
    return [...this.data.backups];
  }

  addBackup(backup: Omit<BackupRecord, 'id' | 'created_at'>): BackupRecord {
    const newBackup: BackupRecord = {
      ...backup,
      id: `backup-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.data.backups.unshift(newBackup);
    this.saveToStorage();
    return newBackup;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs];
  }

  logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    this.saveToStorage();
    return newLog;
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return [...this.data.notifications];
  }

  markNotificationRead(id: string): void {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToStorage();
    }
  }

  markAllNotificationsRead(userId?: string): void {
    this.data.notifications.forEach(n => {
      if (!userId || n.user_id === userId) {
        n.read = true;
      }
    });
    this.saveToStorage();
  }

  // Reset entire database to clean state
  resetToClean(): void {
    this.data = this.getCleanDefaultData();
    this.saveToStorage();
  }
}

export const mockDb = new MockDatabase();

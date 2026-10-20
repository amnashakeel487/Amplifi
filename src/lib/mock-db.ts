import {
  UserProfile,
  Client,
  Project,
  ProjectMember,
  Post,
  PostAsset,
  PostComment,
  PostApproval,
  SystemSettings,
  BackupRecord,
  AuditLog,
  NotificationItem,
  PostWorkflowStatus,
} from './types';

const STORAGE_KEY = 'amplifi_db_v1';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-01',
    email: 'admin@amplifi.io',
    full_name: 'Victoria Vance',
    role: 'admin',
    status: 'active',
    title: 'Head of Content Operations',
    bio: 'Oversees high-level brand strategy, security compliance, and admin approvals across all client accounts.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-01-15T08:00:00Z',
    must_change_password: false,
  },
  {
    id: 'user-manager-01',
    email: 'sarah.manager@amplifi.io',
    full_name: 'Sarah Jenkins',
    role: 'manager',
    status: 'active',
    title: 'Senior Campaign Manager',
    bio: 'Leads creative briefs, proofreading queues, and student mentorship.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-02-01T09:30:00Z',
    must_change_password: false,
  },
  {
    id: 'user-student-01',
    email: 'alex.creator@amplifi.io',
    full_name: 'Alex Rivera',
    role: 'student',
    status: 'active',
    title: 'Student Content Specialist',
    bio: 'Focuses on short-form TikTok/Reels video editing, caption writing, and visual assets.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-03-10T11:00:00Z',
    must_change_password: false,
  },
  {
    id: 'user-student-02',
    email: 'maya.design@amplifi.io',
    full_name: 'Maya Patel',
    role: 'student',
    status: 'active',
    title: 'Graphic & Motion Designer',
    bio: 'Designs carousel infographics, brand kits, and animated typography.',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-03-12T14:20:00Z',
    must_change_password: false,
  },
  {
    id: 'user-client-01',
    email: 'elena@acmefintech.io',
    full_name: 'Elena Rostova',
    role: 'client',
    status: 'active',
    title: 'VP of Marketing @ Acme FinTech',
    bio: 'Client stakeholder for corporate FinTech social campaigns.',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-04-01T10:00:00Z',
    must_change_password: false,
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-01',
    name: 'Acme FinTech Global',
    code: 'ACME',
    industry: 'FinTech & Wealth Management',
    timezone: 'America/New_York',
    status: 'active',
    primary_contact_name: 'Elena Rostova',
    primary_contact_email: 'elena@acmefintech.io',
    notes: 'Requires 48-hour compliance review window. Strict brand guidelines on disclaimers.',
    created_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 'client-02',
    name: 'Pulse Energy Labs',
    code: 'PULSE',
    industry: 'Renewable CleanTech',
    timezone: 'America/Los_Angeles',
    status: 'active',
    primary_contact_name: 'Marcus Vance',
    primary_contact_email: 'marcus@pulseenergy.com',
    notes: 'Focus on high-energy carousel breakdowns, climate impact metrics, and founder interviews.',
    created_at: '2026-02-14T11:30:00Z',
  },
  {
    id: 'client-03',
    name: 'Kroma Lifestyle & Apparel',
    code: 'KROMA',
    industry: 'Fashion & E-Commerce',
    timezone: 'Europe/London',
    status: 'active',
    primary_contact_name: 'Sophie Laurent',
    primary_contact_email: 'sophie@kromafashion.co.uk',
    notes: 'Seasonal visual lookbooks, high-velocity Reels, and TikTok community challenges.',
    created_at: '2026-03-05T09:15:00Z',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-01',
    client_id: 'client-01',
    name: 'Q4 FinTech Compliance & AI Summit',
    description: 'Multi-channel executive campaign highlighting Acme’s autonomous risk platform and keynote highlights.',
    status: 'active',
    priority: 'urgent',
    start_date: '2026-10-01',
    deadline: '2026-11-15',
    google_drive_folder_id: 'drive-folder-acme-summit-2026',
    google_drive_folder_url: 'https://drive.google.com/drive/folders/acme-summit-2026',
    google_drive_folder_status: 'connected',
    created_by: 'user-admin-01',
    created_at: '2026-09-25T10:00:00Z',
    members_count: 4,
    posts_count: 8,
  },
  {
    id: 'proj-02',
    client_id: 'client-02',
    name: 'CleanTech Innovator Spotlight Series',
    description: 'Weekly educational reels dissecting hydrogen fuel cells and industrial decarbonization.',
    status: 'active',
    priority: 'high',
    start_date: '2026-10-10',
    deadline: '2026-12-01',
    google_drive_folder_id: 'drive-folder-pulse-spotlight',
    google_drive_folder_url: 'https://drive.google.com/drive/folders/pulse-spotlight',
    google_drive_folder_status: 'connected',
    created_by: 'user-manager-01',
    created_at: '2026-10-05T12:00:00Z',
    members_count: 3,
    posts_count: 5,
  },
  {
    id: 'proj-03',
    client_id: 'client-03',
    name: 'Winter Capsule Collection 2026',
    description: 'Lifestyle reels, UGC collaborations, and teaser carousels for the winter puffer and knitwear line.',
    status: 'active',
    priority: 'medium',
    start_date: '2026-10-15',
    deadline: '2026-12-10',
    google_drive_folder_id: 'drive-folder-kroma-winter',
    google_drive_folder_url: 'https://drive.google.com/drive/folders/kroma-winter',
    google_drive_folder_status: 'connected',
    created_by: 'user-admin-01',
    created_at: '2026-10-10T15:00:00Z',
    members_count: 4,
    posts_count: 6,
  },
];

export const INITIAL_PROJECT_MEMBERS: ProjectMember[] = [
  { id: 'pm-01', project_id: 'proj-01', user_id: 'user-manager-01', role_in_project: 'manager', assigned_at: '2026-09-25T10:00:00Z' },
  { id: 'pm-02', project_id: 'proj-01', user_id: 'user-student-01', role_in_project: 'student', assigned_at: '2026-09-26T11:00:00Z' },
  { id: 'pm-03', project_id: 'proj-01', user_id: 'user-student-02', role_in_project: 'student', assigned_at: '2026-09-27T14:00:00Z' },
  { id: 'pm-04', project_id: 'proj-01', user_id: 'user-client-01', role_in_project: 'client_observer', assigned_at: '2026-10-01T09:00:00Z' },
  { id: 'pm-05', project_id: 'proj-02', user_id: 'user-manager-01', role_in_project: 'manager', assigned_at: '2026-10-05T12:00:00Z' },
  { id: 'pm-06', project_id: 'proj-02', user_id: 'user-student-02', role_in_project: 'student', assigned_at: '2026-10-06T14:00:00Z' },
  { id: 'pm-07', project_id: 'proj-02', user_id: 'user-admin-01', role_in_project: 'reviewer', assigned_at: '2026-10-06T15:00:00Z' },
  { id: 'pm-08', project_id: 'proj-03', user_id: 'user-manager-01', role_in_project: 'manager', assigned_at: '2026-10-10T15:00:00Z' },
  { id: 'pm-09', project_id: 'proj-03', user_id: 'user-student-01', role_in_project: 'student', assigned_at: '2026-10-11T09:30:00Z' },
  { id: 'pm-10', project_id: 'proj-03', user_id: 'user-student-02', role_in_project: 'student', assigned_at: '2026-10-11T10:00:00Z' },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-01',
    project_id: 'proj-01',
    title: 'Autonomous Risk Modeling in Global Banking',
    caption: 'How are modern tier-1 financial institutions mitigating exposure in volatile markets? 📊\n\nOur VP of Algorithmic Infrastructure breaks down how machine intelligence identifies high-frequency compliance risks before they materialize.\n\nSwipe through the carousel for the full breakdown and link in bio to read our Q4 whitepaper.\n\n#FinTech #RiskManagement #BankingAI #ComplianceTech #AcmeFinTech',
    hashtags: ['FinTech', 'RiskManagement', 'BankingAI', 'ComplianceTech', 'AcmeFinTech'],
    platforms: ['linkedin', 'twitter'],
    status: 'pending_admin_approval',
    priority: 'urgent',
    target_publish_date: '2026-10-24T14:00:00Z',
    deadline: '2026-10-22T17:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    creative_specs: '10-slide carousel in 1:1 format. Brand color palette (Midnight Blue & Electric Lime). High-contrast typography with data visualization graphs on slides 4 and 7.',
    reference_links: [
      'https://www.ft.com/content/banking-ai-overview',
      'https://acmefintech.io/whitepapers/q4-risk-models.pdf'
    ],
    google_drive_assets_folder_id: 'drive-post-01-assets',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/acme-post-01',
    google_docs_brief_id: 'docs-brief-acme-post-01',
    google_docs_brief_url: 'https://docs.google.com/document/d/acme-brief-post-01/edit',
    created_by: 'user-manager-01',
    created_at: '2026-10-14T09:00:00Z',
    updated_at: '2026-10-19T16:30:00Z',
  },
  {
    id: 'post-02',
    project_id: 'proj-02',
    title: 'Green Hydrogen vs Traditional Storage: The Real Numbers',
    caption: 'Is green hydrogen truly scalable for heavy industrial grids? ⚡\n\nWe benchmarked 12 months of energy density data against lithium arrays. The results surprised even our research leads.\n\nWatch as Dr. Aris Thorne walks through our hydrogen generation facility in Reno.\n\nDrop your thoughts in the comments! 👇\n\n#CleanTech #GreenHydrogen #RenewableEnergy #Decarbonization #PulseEnergy',
    hashtags: ['CleanTech', 'GreenHydrogen', 'RenewableEnergy', 'Decarbonization', 'PulseEnergy'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    status: 'under_review',
    priority: 'high',
    target_publish_date: '2026-10-25T18:00:00Z',
    deadline: '2026-10-23T12:00:00Z',
    assigned_student_id: 'user-student-02',
    assigned_manager_id: 'user-manager-01',
    creative_specs: '9:16 Vertical Video (60 seconds). Dynamic captions with bold keywords highlighted in cyan. Fast-paced hook in the first 3 seconds with B-roll of the electrolyzer facility.',
    google_drive_assets_folder_id: 'drive-post-02-assets',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/pulse-post-02',
    google_docs_brief_id: 'docs-brief-pulse-post-02',
    google_docs_brief_url: 'https://docs.google.com/document/d/pulse-brief-post-02/edit',
    created_by: 'user-manager-01',
    created_at: '2026-10-16T11:00:00Z',
    updated_at: '2026-10-19T18:00:00Z',
  },
  {
    id: 'post-03',
    project_id: 'proj-03',
    title: 'Winter Puffer Drop: Behind The Seams',
    caption: 'Zero feathers, 100% recycled insulation. ❄️ The Winter 2026 Capsule drops this Friday at 10 AM EST.\n\nSwipe to see the waterproof thermal test in the lab.\n\nWhich colorway are you picking up: Arctic Mist or Obsidian Black?\n\n#KromaApparel #SustainableFashion #WinterCapsule #StreetwearCulture',
    hashtags: ['KromaApparel', 'SustainableFashion', 'WinterCapsule', 'StreetwearCulture'],
    platforms: ['instagram', 'tiktok'],
    status: 'revision_required',
    priority: 'medium',
    target_publish_date: '2026-10-26T15:00:00Z',
    deadline: '2026-10-21T18:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    creative_specs: 'Color grading needs to be warmer; the white jacket looks slightly blown out on slide 2. Update font to Kroma Display Serif.',
    revision_instructions: 'Please color correct slide 2 and replace the final call-to-action slide with the verified launch countdown sticker.',
    google_drive_assets_folder_id: 'drive-post-03-assets',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/kroma-post-03',
    google_docs_brief_id: 'docs-brief-kroma-post-03',
    google_docs_brief_url: 'https://docs.google.com/document/d/kroma-brief-post-03/edit',
    created_by: 'user-manager-01',
    created_at: '2026-10-17T14:00:00Z',
    updated_at: '2026-10-20T10:15:00Z',
  },
  {
    id: 'post-04',
    project_id: 'proj-01',
    title: 'Meet Our Security & Cryptography Council',
    caption: 'Behind every secure transaction is our dedicated Cryptographic Security Council. 🛡️\n\nJoin us as we spotlight the mathematicians and cybersecurity researchers keeping over $40B in daily enterprise transfers bulletproof.\n\n#FinTechSecurity #Cybersecurity #EnterpriseTech #AcmeGlobal',
    hashtags: ['FinTechSecurity', 'Cybersecurity', 'EnterpriseTech', 'AcmeGlobal'],
    platforms: ['linkedin'],
    status: 'ready_to_publish',
    priority: 'high',
    target_publish_date: '2026-10-21T13:00:00Z',
    deadline: '2026-10-20T16:00:00Z',
    assigned_student_id: 'user-student-02',
    assigned_manager_id: 'user-manager-01',
    google_drive_assets_folder_id: 'drive-post-04-assets',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/acme-post-04',
    google_docs_brief_id: 'docs-brief-acme-post-04',
    google_docs_brief_url: 'https://docs.google.com/document/d/acme-brief-post-04/edit',
    created_by: 'user-manager-01',
    created_at: '2026-10-12T10:00:00Z',
    updated_at: '2026-10-20T08:00:00Z',
  },
  {
    id: 'post-05',
    project_id: 'proj-03',
    title: 'Thermal Rain Test: TikTok UGC Hook',
    caption: 'We poured 5 gallons of ice water on our new puffer coat to test thermal retention. Did it hold? 🥶 Watch till the end! #waterproofcheck #streetwearwinter #clothingtest #kroma',
    hashtags: ['waterproofcheck', 'streetwearwinter', 'clothingtest', 'kroma'],
    platforms: ['tiktok'],
    status: 'published',
    priority: 'medium',
    target_publish_date: '2026-10-18T19:00:00Z',
    deadline: '2026-10-17T18:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    published_url: 'https://tiktok.com/@kroma_apparel/video/7291827491029381',
    published_at: '2026-10-18T19:02:14Z',
    google_drive_assets_folder_id: 'drive-post-05-assets',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/kroma-post-05',
    created_by: 'user-manager-01',
    created_at: '2026-10-10T09:00:00Z',
    updated_at: '2026-10-18T19:05:00Z',
  },
  {
    id: 'post-06',
    project_id: 'proj-02',
    title: 'Clean Energy Microgrid Explainer',
    caption: 'How localized microgrids are saving remote communities from power blackouts during extreme weather events. 💡',
    hashtags: ['Microgrids', 'CleanEnergy', 'Resilience', 'PulseEnergy'],
    platforms: ['linkedin', 'facebook'],
    status: 'assigned',
    priority: 'medium',
    target_publish_date: '2026-10-28T16:00:00Z',
    deadline: '2026-10-24T18:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    google_drive_assets_folder_id: 'drive-post-06-assets',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/pulse-post-06',
    google_docs_brief_id: 'docs-brief-pulse-post-06',
    google_docs_brief_url: 'https://docs.google.com/document/d/pulse-brief-post-06/edit',
    created_by: 'user-manager-01',
    created_at: '2026-10-19T10:00:00Z',
    updated_at: '2026-10-19T10:00:00Z',
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  id: 'primary_settings',
  google_connected: true,
  google_account_email: 'integrations-service@amplifi.io',
  google_drive_root_folder_id: 'amplifi-root-marketing-drive',
  google_drive_root_folder_name: 'Amplifi Global Assets & Workspaces',
  google_token_expiry: '2026-12-31T23:59:59Z',
  backup_schedule_cron: '0 2 * * *',
  last_backup_at: '2026-10-20T02:00:00Z',
  backup_retention_days: 30,
  auto_publish_enabled: false,
  notification_email_enabled: true,
  updated_at: '2026-10-20T02:00:00Z',
};

export const INITIAL_BACKUPS: BackupRecord[] = [
  {
    id: 'backup-001',
    backup_name: 'amplifi-prod-daily-2026-10-20.json.gz',
    file_url: 'https://storage.amplifi.io/backups/amplifi-prod-daily-2026-10-20.json.gz',
    storage_path: 'backups/2026/10/amplifi-prod-daily-2026-10-20.json.gz',
    size_bytes: 4829104,
    checksum: 'sha256:8f4c93a21b38e401d29c4e51f893a7d2b56e9c104',
    record_counts: { users: 5, clients: 3, projects: 3, posts: 6, comments: 14, audit_logs: 184 },
    status: 'completed',
    created_at: '2026-10-20T02:00:00Z',
    completed_at: '2026-10-20T02:01:23Z',
  },
  {
    id: 'backup-002',
    backup_name: 'amplifi-prod-daily-2026-10-19.json.gz',
    file_url: 'https://storage.amplifi.io/backups/amplifi-prod-daily-2026-10-19.json.gz',
    storage_path: 'backups/2026/10/amplifi-prod-daily-2026-10-19.json.gz',
    size_bytes: 4712030,
    checksum: 'sha256:7b2c91a44e58f302b18c3e49e782a6c1a45d8b093',
    record_counts: { users: 5, clients: 3, projects: 3, posts: 5, comments: 11, audit_logs: 162 },
    status: 'completed',
    created_at: '2026-10-19T02:00:00Z',
    completed_at: '2026-10-19T02:01:18Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    user_id: 'user-admin-01',
    title: 'Post Pending Admin Approval',
    message: '"Autonomous Risk Modeling" in Acme FinTech was signed off by Sarah Jenkins and awaits your authorization.',
    type: 'action_required',
    link: '/approval-queue',
    read: false,
    created_at: '2026-10-19T16:30:00Z',
  },
  {
    id: 'notif-02',
    user_id: 'user-manager-01',
    title: 'New Video Asset Submitted',
    message: 'Maya Patel submitted v2 for "Green Hydrogen vs Traditional Storage". Ready for proofreading.',
    type: 'info',
    link: '/posts/post-02',
    read: false,
    created_at: '2026-10-19T18:00:00Z',
  },
  {
    id: 'notif-03',
    user_id: 'user-student-01',
    title: 'Revision Requested on Post',
    message: 'Sarah Jenkins requested color correction adjustments on "Winter Puffer Drop".',
    type: 'warning',
    link: '/posts/post-03',
    read: false,
    created_at: '2026-10-20T10:15:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-01',
    user_id: 'user-admin-01',
    user_email: 'admin@amplifi.io',
    user_role: 'admin',
    action: 'SYSTEM_SETTINGS_UPDATE',
    entity_type: 'system_settings',
    entity_id: 'primary_settings',
    details: { change: 'Google Workspace service account token refreshed' },
    ip_address: '192.168.1.100',
    created_at: '2026-10-20T02:00:00Z',
  },
  {
    id: 'audit-02',
    user_id: 'user-manager-01',
    user_email: 'sarah.manager@amplifi.io',
    user_role: 'manager',
    action: 'POST_STATUS_CHANGED',
    entity_type: 'post',
    entity_id: 'post-01',
    details: { from: 'manager_approved', to: 'pending_admin_approval' },
    ip_address: '192.168.1.104',
    created_at: '2026-10-19T16:30:00Z',
  },
  {
    id: 'audit-03',
    user_id: 'user-manager-01',
    user_email: 'sarah.manager@amplifi.io',
    user_role: 'manager',
    action: 'REVISION_REQUESTED',
    entity_type: 'post',
    entity_id: 'post-03',
    details: { reason: 'Color grading adjustment and final CTA badge' },
    ip_address: '192.168.1.104',
    created_at: '2026-10-20T10:15:00Z',
  },
];

// Persistent Local DB Implementation
class MockDatabase {
  private data = {
    users: INITIAL_USERS,
    clients: INITIAL_CLIENTS,
    projects: INITIAL_PROJECTS,
    projectMembers: INITIAL_PROJECT_MEMBERS,
    posts: INITIAL_POSTS,
    settings: INITIAL_SETTINGS,
    backups: INITIAL_BACKUPS,
    notifications: INITIAL_NOTIFICATIONS,
    auditLogs: INITIAL_AUDIT_LOGS,
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.saveToStorage();
      }
    } catch {
      // Fallback in non-browser or storage restricted environments
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage quota or restriction fallback
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
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveToStorage();
    return newUser;
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

  // Projects
  getProjects(): Project[] {
    return this.data.projects.map(p => ({
      ...p,
      client: this.getClient(p.client_id),
    }));
  }

  getProject(id: string): Project | undefined {
    const proj = this.data.projects.find(p => p.id === id);
    if (!proj) return undefined;
    return {
      ...proj,
      client: this.getClient(proj.client_id),
    };
  }

  createProject(proj: Omit<Project, 'id' | 'created_at'>): Project {
    const newProj: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
      created_at: new Date().toISOString(),
      members_count: 1,
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
    this.saveToStorage();
  }

  deleteClient(id: string): void {
    const projIds = this.data.projects.filter(p => p.client_id === id).map(p => p.id);
    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.data.projects = this.data.projects.filter(p => p.client_id !== id);
    this.data.posts = this.data.posts.filter(p => !projIds.includes(p.project_id));
    this.saveToStorage();
  }

  deleteUser(id: string): void {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.data.projectMembers = (this.data.projectMembers || []).filter(pm => pm.user_id !== id);
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

  addProjectMember(projectId: string, userId: string, roleInProject: ProjectMember['role_in_project']): ProjectMember {
    if (!this.data.projectMembers) this.data.projectMembers = [];
    const existing = this.data.projectMembers.find(
      pm => pm.project_id === projectId && pm.user_id === userId
    );
    if (existing) {
      existing.role_in_project = roleInProject;
      this.saveToStorage();
      return { ...existing, user: this.getUser(userId) };
    }
    const newMember: ProjectMember = {
      id: `pm-${Date.now()}`,
      project_id: projectId,
      user_id: userId,
      role_in_project: roleInProject,
      assigned_at: new Date().toISOString(),
    };
    this.data.projectMembers.push(newMember);

    // Update project members_count
    const proj = this.data.projects.find(p => p.id === projectId);
    if (proj) {
      proj.members_count = this.getProjectMembers(projectId).length;
    }

    this.saveToStorage();
    return { ...newMember, user: this.getUser(userId) };
  }

  removeProjectMember(memberId: string): void {
    const member = (this.data.projectMembers || []).find(m => m.id === memberId);
    this.data.projectMembers = (this.data.projectMembers || []).filter(m => m.id !== memberId);
    if (member) {
      const proj = this.data.projects.find(p => p.id === member.project_id);
      if (proj) {
        proj.members_count = this.getProjectMembers(member.project_id).length;
      }
    }
    this.saveToStorage();
  }

  // Posts
  getPosts(): Post[] {
    return this.data.posts.map(p => ({
      ...p,
      project: this.getProject(p.project_id),
      assigned_student: p.assigned_student_id ? this.getUser(p.assigned_student_id) : undefined,
      assigned_manager: p.assigned_manager_id ? this.getUser(p.assigned_manager_id) : undefined,
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
    };
  }

  createPost(post: Omit<Post, 'id' | 'created_at'>): Post {
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.posts.push(newPost);
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
    return [...this.data.auditLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  logAudit(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    this.saveToStorage();
    return newLog;
  }

  // Notifications
  getNotifications(userId?: string): NotificationItem[] {
    if (!userId) return [...this.data.notifications];
    return this.data.notifications.filter(n => n.user_id === userId);
  }

  markNotificationRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToStorage();
    }
  }

  markAllNotificationsRead(userId: string) {
    this.data.notifications.forEach(n => {
      if (n.user_id === userId) n.read = true;
    });
    this.saveToStorage();
  }

  // Reset to default
  resetToDefaults() {
    this.data = {
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      projects: INITIAL_PROJECTS,
      projectMembers: INITIAL_PROJECT_MEMBERS,
      posts: INITIAL_POSTS,
      settings: INITIAL_SETTINGS,
      backups: INITIAL_BACKUPS,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
    };
    this.saveToStorage();
  }
}

export const mockDb = new MockDatabase();

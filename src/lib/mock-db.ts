import {
  UserProfile,
  Client,
  Project,
  ProjectMember,
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

const STORAGE_KEY = 'amplifi_db_v2';

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
    assigned_drive_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026',
    assigned_drive_folder_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026',
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
    assigned_drive_folder_id: '1XyZ_dRiVe_MayaPatel_Folder2026',
    assigned_drive_folder_url: 'https://drive.google.com/drive/folders/1XyZ_dRiVe_MayaPatel_Folder2026',
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
    primary_contact_email: 'marcus@pulseenergylabs.com',
    notes: 'Technical content verification needed from engineering leads before publication.',
    created_at: '2026-02-15T11:00:00Z',
  },
  {
    id: 'client-03',
    name: 'Kroma Apparel',
    code: 'KROMA',
    industry: 'Sustainable Fashion',
    timezone: 'Europe/London',
    status: 'active',
    primary_contact_name: 'Chloe Laurent',
    primary_contact_email: 'chloe@kromaapparel.com',
    notes: 'Focus on Gen-Z aesthetic, high-contrast imagery, and behind-the-scenes factory footage.',
    created_at: '2026-03-01T14:00:00Z',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-01',
    client_id: 'client-01',
    name: 'Q4 Enterprise AI Banking Campaign',
    description: 'B2B thought-leadership initiative highlighting algorithmic compliance and fraud prevention across LinkedIn and Twitter.',
    status: 'active',
    priority: 'high',
    start_date: '2026-10-01',
    deadline: '2026-11-30',
    google_drive_folder_id: 'drive-folder-acme-q4',
    google_drive_folder_url: 'https://drive.google.com/drive/folders/acme-q4',
    google_drive_folder_status: 'connected',
    created_by: 'user-admin-01',
    created_at: '2026-09-25T10:00:00Z',
    members_count: 3,
    posts_count: 4,
  },
  {
    id: 'proj-02',
    client_id: 'client-02',
    name: 'Hydrogen Grid Transition 2026',
    description: 'Educational video series explaining commercial grid energy storage, industrial electrolysis, and net-zero milestones.',
    status: 'active',
    priority: 'urgent',
    start_date: '2026-10-05',
    deadline: '2026-12-15',
    google_drive_folder_id: 'drive-folder-pulse-hydrogen',
    google_drive_folder_url: 'https://drive.google.com/drive/folders/pulse-hydrogen',
    google_drive_folder_status: 'connected',
    created_by: 'user-manager-01',
    created_at: '2026-10-05T12:00:00Z',
    members_count: 2,
    posts_count: 3,
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
    members_count: 3,
    posts_count: 3,
  },
];

export const INITIAL_PROJECT_MEMBERS: ProjectMember[] = [
  // Project 1 (Acme): Sarah (Manager), Alex (Student), Elena (Client)
  { id: 'pm-01', project_id: 'proj-01', user_id: 'user-manager-01', role_in_project: 'manager', assigned_at: '2026-09-25T10:00:00Z' },
  { id: 'pm-02', project_id: 'proj-01', user_id: 'user-student-01', role_in_project: 'student', assigned_drive_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026', assigned_drive_folder_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026', assigned_at: '2026-09-26T11:00:00Z' },
  { id: 'pm-03', project_id: 'proj-01', user_id: 'user-client-01', role_in_project: 'client_observer', assigned_at: '2026-10-01T09:00:00Z' },

  // Project 2 (Pulse): Sarah (Manager), Maya (Student)
  { id: 'pm-04', project_id: 'proj-02', user_id: 'user-manager-01', role_in_project: 'manager', assigned_at: '2026-10-05T12:00:00Z' },
  { id: 'pm-05', project_id: 'proj-02', user_id: 'user-student-02', role_in_project: 'student', assigned_drive_folder_id: '1XyZ_dRiVe_MayaPatel_Folder2026', assigned_drive_folder_url: 'https://drive.google.com/drive/folders/1XyZ_dRiVe_MayaPatel_Folder2026', assigned_at: '2026-10-06T14:00:00Z' },

  // Project 3 (Kroma): Sarah (Manager), Alex (Student), Maya (Student)
  { id: 'pm-06', project_id: 'proj-03', user_id: 'user-manager-01', role_in_project: 'manager', assigned_at: '2026-10-10T15:00:00Z' },
  { id: 'pm-07', project_id: 'proj-03', user_id: 'user-student-01', role_in_project: 'student', assigned_drive_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026', assigned_drive_folder_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026', assigned_at: '2026-10-11T09:30:00Z' },
  { id: 'pm-08', project_id: 'proj-03', user_id: 'user-student-02', role_in_project: 'student', assigned_drive_folder_id: '1XyZ_dRiVe_MayaPatel_Folder2026', assigned_drive_folder_url: 'https://drive.google.com/drive/folders/1XyZ_dRiVe_MayaPatel_Folder2026', assigned_at: '2026-10-11T10:00:00Z' },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post-01',
    project_id: 'proj-01',
    title: 'Autonomous Risk Modeling in Global Banking',
    caption: 'How are modern tier-1 financial institutions mitigating exposure in volatile markets? 📊\n\nOur VP of Algorithmic Infrastructure breaks down how machine intelligence identifies high-frequency compliance risks before they materialize.\n\nKey takeaways:\n• Real-time capital allocation modeling\n• Continuous liquidity stress tests\n• Automated AML anomaly flags\n\nSwipe through the carousel for the full breakdown and link in bio to read our Q4 whitepaper.\n\n#FinTech #RiskManagement #BankingAI #ComplianceTech #AcmeFinTech',
    description_html: '<h3>How are modern tier-1 financial institutions mitigating exposure in volatile markets? 📊</h3><p>Our VP of Algorithmic Infrastructure breaks down how machine intelligence identifies high-frequency compliance risks before they materialize.</p><p><strong>Key takeaways:</strong></p><ul><li>Real-time capital allocation modeling</li><li>Continuous liquidity stress tests</li><li>Automated AML anomaly flags</li></ul><p><em>Swipe through the carousel for the full breakdown and link in bio to read our Q4 whitepaper.</em> 🚀</p>',
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
    google_drive_assets_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026',
    assets: [
      {
        id: 'asset-01',
        post_id: 'post-01',
        version_number: 1,
        submitted_by: 'user-student-01',
        file_name: 'Acme_Risk_Modeling_Carousel_v1.pdf',
        file_type: 'image/jpeg',
        file_size_bytes: 4820000,
        drive_file_id: '1DriveFile_RiskModel_Carousel_v1',
        drive_file_url: 'https://drive.google.com/file/d/1DriveFile_RiskModel_Carousel_v1/view',
        thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
        submission_notes: 'Uploaded to assigned folder 1AbC_dRiVe_AlexRivera_Folder2026. Verified font licenses.',
        created_at: '2026-10-18T14:00:00Z',
      }
    ],
    text_versions: [
      {
        id: 'tv-01',
        post_id: 'post-01',
        version_number: 1,
        title: 'Autonomous Risk Modeling in Global Banking',
        description_html: '<h3>How are modern tier-1 financial institutions mitigating exposure in volatile markets? 📊</h3><p>Our VP of Algorithmic Infrastructure breaks down how machine intelligence identifies high-frequency compliance risks before they materialize.</p>',
        caption_plain: 'How are modern tier-1 financial institutions mitigating exposure in volatile markets? 📊',
        hashtags: ['FinTech', 'RiskManagement', 'BankingAI', 'ComplianceTech'],
        submitted_by: 'user-student-01',
        created_at: '2026-10-16T11:00:00Z',
      }
    ],
    created_by: 'user-student-01',
    created_at: '2026-10-14T09:00:00Z',
    updated_at: '2026-10-19T16:30:00Z',
  },
  {
    id: 'post-02',
    project_id: 'proj-02',
    title: 'Green Hydrogen vs Traditional Storage: The Real Numbers',
    caption: 'Is green hydrogen truly scalable for heavy industrial grids? ⚡\n\nWe benchmarked 12 months of energy density data against lithium arrays.\n\n• 4.2x higher continuous discharge\n• Zero thermal runaway risk\n• 100% recyclable components\n\nWatch as Dr. Aris Thorne walks through our hydrogen generation facility in Reno.\n\nDrop your thoughts in the comments! 👇\n\n#CleanTech #GreenHydrogen #RenewableEnergy #Decarbonization #PulseEnergy',
    description_html: '<p>Is green hydrogen truly scalable for heavy industrial grids? ⚡</p><p>We benchmarked 12 months of energy density data against lithium arrays.</p><ul><li><strong>4.2x higher continuous discharge</strong></li><li>Zero thermal runaway risk</li><li>100% recyclable components</li></ul><p>Watch as Dr. Aris Thorne walks through our hydrogen generation facility in Reno. Drop your thoughts in the comments! 👇</p>',
    hashtags: ['CleanTech', 'GreenHydrogen', 'RenewableEnergy', 'Decarbonization', 'PulseEnergy'],
    platforms: ['instagram', 'tiktok', 'youtube'],
    status: 'text_submitted',
    priority: 'high',
    target_publish_date: '2026-10-25T18:00:00Z',
    deadline: '2026-10-23T12:00:00Z',
    assigned_student_id: 'user-student-02',
    assigned_manager_id: 'user-manager-01',
    creative_specs: '9:16 Vertical Video (60 seconds). Dynamic captions with bold keywords highlighted in cyan.',
    google_drive_assets_folder_id: '1XyZ_dRiVe_MayaPatel_Folder2026',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/1XyZ_dRiVe_MayaPatel_Folder2026',
    text_versions: [
      {
        id: 'tv-02',
        post_id: 'post-02',
        version_number: 1,
        title: 'Green Hydrogen vs Traditional Storage: The Real Numbers',
        description_html: '<p>Is green hydrogen truly scalable for heavy industrial grids? ⚡</p><p>We benchmarked 12 months of energy density data against lithium arrays.</p>',
        caption_plain: 'Is green hydrogen truly scalable for heavy industrial grids? ⚡',
        hashtags: ['CleanTech', 'GreenHydrogen', 'RenewableEnergy'],
        submitted_by: 'user-student-02',
        created_at: '2026-10-18T10:00:00Z',
      }
    ],
    created_by: 'user-student-02',
    created_at: '2026-10-16T11:00:00Z',
    updated_at: '2026-10-19T18:00:00Z',
  },
  {
    id: 'post-03',
    project_id: 'proj-03',
    title: 'Winter Puffer Drop: Behind The Seams',
    caption: 'Zero feathers, 100% recycled insulation. ❄️ The Winter 2026 Capsule drops this Friday at 10 AM EST.\n\nSwipe to see the waterproof thermal test in the lab.\n\nWhich colorway are you picking up: Arctic Mist or Obsidian Black?\n\n#KromaApparel #SustainableFashion #WinterCapsule #StreetwearCulture',
    description_html: '<p>Zero feathers, 100% recycled insulation. ❄️</p><p>The <strong>Winter 2026 Capsule</strong> drops this Friday at 10 AM EST.</p><p>Swipe to see the waterproof thermal test in the lab. Which colorway are you picking up: <em>Arctic Mist</em> or <em>Obsidian Black</em>?</p>',
    hashtags: ['KromaApparel', 'SustainableFashion', 'WinterCapsule', 'StreetwearCulture'],
    platforms: ['instagram', 'tiktok'],
    status: 'text_revision_required',
    priority: 'medium',
    target_publish_date: '2026-10-26T15:00:00Z',
    deadline: '2026-10-21T18:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    revision_instructions: 'Please emphasize the thermal rating (-25°C) in the bullet points and add legal disclaimer on recycled polyester certification.',
    google_drive_assets_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026',
    text_versions: [
      {
        id: 'tv-03',
        post_id: 'post-03',
        version_number: 1,
        title: 'Winter Puffer Drop: Behind The Seams',
        description_html: '<p>Zero feathers, 100% recycled insulation. ❄️ The Winter 2026 Capsule drops this Friday.</p>',
        caption_plain: 'Zero feathers, 100% recycled insulation. ❄️',
        hashtags: ['KromaApparel', 'SustainableFashion'],
        submitted_by: 'user-student-01',
        created_at: '2026-10-17T09:00:00Z',
      }
    ],
    created_by: 'user-student-01',
    created_at: '2026-10-17T09:00:00Z',
    updated_at: '2026-10-20T10:15:00Z',
  },
  {
    id: 'post-04',
    project_id: 'proj-01',
    title: 'AI Compliance Automation: Solving FinTech Audit Bottlenecks',
    caption: 'Audits used to take 6 weeks. Now they take 60 seconds. ⚡\n\nSee how automated compliance workflows allow engineering teams to ship fintech features without waiting on manual compliance queues.\n\n#FinTech #EngineeringExcellence #ComplianceAutomation',
    description_html: '<h2>Audits used to take 6 weeks. Now they take 60 seconds. ⚡</h2><p>See how automated compliance workflows allow engineering teams to ship fintech features without waiting on manual compliance queues.</p><p><strong>Status:</strong> Text is approved by Sarah. Creator Alex Rivera can now produce the infographic video in Google Drive.</p>',
    hashtags: ['FinTech', 'EngineeringExcellence', 'ComplianceAutomation'],
    platforms: ['linkedin'],
    status: 'text_approved',
    priority: 'high',
    target_publish_date: '2026-10-28T16:00:00Z',
    deadline: '2026-10-24T18:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    google_drive_assets_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026',
    created_by: 'user-student-01',
    created_at: '2026-10-18T10:00:00Z',
    updated_at: '2026-10-20T11:00:00Z',
  },
  {
    id: 'post-05',
    project_id: 'proj-02',
    title: 'Megawatt Electrolyzer Installation Tour',
    caption: 'Behind the scenes at our newest clean energy grid installation. 🔋 100MW of zero-emission green hydrogen online this quarter.\n\n#CleanEnergy #HydrogenPower #Renewables',
    description_html: '<p>Behind the scenes at our newest clean energy grid installation. 🔋</p><p><strong>100MW of zero-emission green hydrogen</strong> online this quarter.</p>',
    hashtags: ['CleanEnergy', 'HydrogenPower', 'Renewables'],
    platforms: ['youtube', 'linkedin'],
    status: 'media_submitted',
    priority: 'medium',
    target_publish_date: '2026-10-29T14:00:00Z',
    deadline: '2026-10-25T18:00:00Z',
    assigned_student_id: 'user-student-02',
    assigned_manager_id: 'user-manager-01',
    google_drive_assets_folder_id: '1XyZ_dRiVe_MayaPatel_Folder2026',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/1XyZ_dRiVe_MayaPatel_Folder2026',
    assets: [
      {
        id: 'asset-05',
        post_id: 'post-05',
        version_number: 1,
        submitted_by: 'user-student-02',
        file_name: 'Electrolyzer_Tour_RoughCut_v1.mp4',
        file_type: 'video/mp4',
        file_size_bytes: 38400000,
        drive_file_id: '1DriveFile_Electrolyzer_v1',
        drive_file_url: 'https://drive.google.com/file/d/1DriveFile_Electrolyzer_v1/view',
        thumbnail_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
        submission_notes: 'Color grading applied, 4K export in assigned Drive folder.',
        created_at: '2026-10-20T16:00:00Z',
      }
    ],
    created_by: 'user-student-02',
    created_at: '2026-10-18T12:00:00Z',
    updated_at: '2026-10-20T16:00:00Z',
  },
  {
    id: 'post-06',
    project_id: 'proj-01',
    title: 'Financial Crime Prevention in Real-Time',
    caption: 'How do you detect synthetic identity theft in sub-10ms transaction windows? 🛡️\n\nRead our technical breakdown of behavioral telemetry models.\n\n#FraudPrevention #FinTechSecurity #CyberDefense',
    description_html: '<h2>How do you detect synthetic identity theft in sub-10ms transaction windows? 🛡️</h2><p>Read our technical breakdown of behavioral telemetry models.</p><p><em>Approved by Administrator Victoria Vance. Assigned to Sarah Jenkins to publish.</em></p>',
    hashtags: ['FraudPrevention', 'FinTechSecurity', 'CyberDefense'],
    platforms: ['linkedin', 'twitter'],
    status: 'ready_to_publish',
    priority: 'urgent',
    target_publish_date: '2026-10-22T15:00:00Z',
    deadline: '2026-10-21T18:00:00Z',
    assigned_student_id: 'user-student-01',
    assigned_manager_id: 'user-manager-01',
    assigned_publisher_id: 'user-manager-01',
    publisher_role: 'manager',
    google_drive_assets_folder_id: '1AbC_dRiVe_AlexRivera_Folder2026',
    google_drive_assets_url: 'https://drive.google.com/drive/folders/1AbC_dRiVe_AlexRivera_Folder2026',
    assets: [
      {
        id: 'asset-06',
        post_id: 'post-06',
        version_number: 1,
        submitted_by: 'user-student-01',
        file_name: 'Synthetic_ID_Defense_Infographic.png',
        file_type: 'image/png',
        file_size_bytes: 2900000,
        drive_file_id: '1DriveFile_SyntheticID_v1',
        drive_file_url: 'https://drive.google.com/file/d/1DriveFile_SyntheticID_v1/view',
        thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
        submission_notes: 'Final approved asset.',
        created_at: '2026-10-19T10:00:00Z',
      }
    ],
    created_by: 'user-student-01',
    created_at: '2026-10-17T14:00:00Z',
    updated_at: '2026-10-21T12:00:00Z',
  },
  {
    id: 'post-07',
    project_id: 'proj-03',
    title: 'Recycled Fiber Technology Showcase',
    caption: 'From plastic bottles to mountain-grade outerwear. ♻️ Watch our closed-loop recycling journey.\n\nLive on Instagram: https://instagram.com/p/DBv99812\n\n#Sustainability #EcoFashion #KromaApparel',
    description_html: '<p>From plastic bottles to mountain-grade outerwear. ♻️</p><p>Watch our closed-loop recycling journey.</p>',
    hashtags: ['Sustainability', 'EcoFashion', 'KromaApparel'],
    platforms: ['instagram'],
    status: 'published',
    priority: 'low',
    target_publish_date: '2026-10-19T15:00:00Z',
    published_at: '2026-10-19T15:10:00Z',
    published_url: 'https://instagram.com/p/DBv99812',
    assigned_student_id: 'user-student-02',
    assigned_manager_id: 'user-manager-01',
    assigned_publisher_id: 'user-admin-01',
    publisher_role: 'admin',
    created_by: 'user-student-02',
    created_at: '2026-10-15T09:00:00Z',
    updated_at: '2026-10-19T15:10:00Z',
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  id: 'primary_settings',
  google_connected: true,
  google_account_email: 'amplifi-workspace@amplifi-enterprise.iam.gserviceaccount.com',
  google_drive_root_folder_id: 'root-drive-amplifi-cloud-2026',
  google_drive_root_folder_name: 'Amplifi Global Client Workspace (Admin Shared)',
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
    id: 'backup-01',
    backup_name: 'amplifi_prod_snapshot_20261020_0200.json.gz',
    file_url: 'https://storage.amplifi.io/backups/amplifi_prod_snapshot_20261020_0200.json.gz',
    storage_path: 'backups/2026/10/snapshot_20261020.json.gz',
    size_bytes: 14857600,
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    record_counts: { users: 5, clients: 3, projects: 3, posts: 7, comments: 12, auditLogs: 3 },
    status: 'completed',
    initiated_by: 'system_cron',
    created_at: '2026-10-20T02:00:00Z',
    completed_at: '2026-10-20T02:03:15Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    user_id: 'user-admin-01',
    title: 'Executive Approval Required',
    message: 'Post "Autonomous Risk Modeling" is ready for final authorization and publisher assignment.',
    type: 'action_required',
    link: '/approvals',
    read: false,
    created_at: '2026-10-21T08:00:00Z',
  },
  {
    id: 'notif-02',
    user_id: 'user-manager-01',
    title: 'New Text Submitted by Alex Rivera',
    message: 'Post "Green Hydrogen vs Traditional Storage" submitted text for review.',
    type: 'info',
    link: '/review/post-02',
    read: false,
    created_at: '2026-10-21T09:30:00Z',
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
    details: { change: 'Google Workspace service account token verified' },
    ip_address: '192.168.1.100',
    created_at: '2026-10-20T02:00:00Z',
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
      // Fallback
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Fallback
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

  updateCreatorDriveFolder(userId: string, folderId: string, folderUrl: string): UserProfile {
    const user = this.updateUser(userId, {
      assigned_drive_folder_id: folderId,
      assigned_drive_folder_url: folderUrl,
    });
    // Also update any project_members records for this user
    if (this.data.projectMembers) {
      this.data.projectMembers.forEach(pm => {
        if (pm.user_id === userId) {
          pm.assigned_drive_folder_id = folderId;
          pm.assigned_drive_folder_url = folderUrl;
        }
      });
      this.saveToStorage();
    }
    return user;
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

  /**
   * Scoped project retrieval by user role (Requirement 7)
   */
  getProjectsForUser(user?: UserProfile): Project[] {
    const all = this.getProjects();
    if (!user || user.role === 'admin') {
      return all;
    }
    const userMemberProjectIds = (this.data.projectMembers || [])
      .filter(pm => pm.user_id === user.id)
      .map(pm => pm.project_id);

    return all.filter(p => userMemberProjectIds.includes(p.id));
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

  addProjectMember(
    projectId: string,
    userId: string,
    roleInProject: ProjectMember['role_in_project'],
    assignedDriveFolderId?: string,
    assignedDriveFolderUrl?: string
  ): ProjectMember {
    if (!this.data.projectMembers) this.data.projectMembers = [];
    const existing = this.data.projectMembers.find(
      pm => pm.project_id === projectId && pm.user_id === userId
    );

    const targetUser = this.getUser(userId);
    const resolvedFolderId = assignedDriveFolderId || targetUser?.assigned_drive_folder_id;
    const resolvedFolderUrl = assignedDriveFolderUrl || targetUser?.assigned_drive_folder_url;

    if (existing) {
      existing.role_in_project = roleInProject;
      if (resolvedFolderId) existing.assigned_drive_folder_id = resolvedFolderId;
      if (resolvedFolderUrl) existing.assigned_drive_folder_url = resolvedFolderUrl;
      this.saveToStorage();
      return { ...existing, user: targetUser };
    }
    const newMember: ProjectMember = {
      id: `pm-${Date.now()}`,
      project_id: projectId,
      user_id: userId,
      role_in_project: roleInProject,
      assigned_drive_folder_id: resolvedFolderId,
      assigned_drive_folder_url: resolvedFolderUrl,
      assigned_at: new Date().toISOString(),
    };
    this.data.projectMembers.push(newMember);

    const proj = this.data.projects.find(p => p.id === projectId);
    if (proj) {
      proj.members_count = this.getProjectMembers(projectId).length;
    }

    this.saveToStorage();
    return { ...newMember, user: targetUser };
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

  /**
   * Scoped posts retrieval by user role (Requirement 7)
   */
  getPostsForUser(user?: UserProfile): Post[] {
    const all = this.getPosts();
    if (!user || user.role === 'admin') {
      return all;
    }
    if (user.role === 'manager') {
      const managerProjectIds = (this.data.projectMembers || [])
        .filter(pm => pm.user_id === user.id)
        .map(pm => pm.project_id);

      return all.filter(
        p =>
          managerProjectIds.includes(p.project_id) ||
          p.assigned_manager_id === user.id ||
          p.assigned_publisher_id === user.id
      );
    }
    // Student / Creator sees only assigned posts
    return all.filter(
      p => p.assigned_student_id === user.id || p.assigned_student?.email === user.email
    );
  }

  createPost(post: Omit<Post, 'id' | 'created_at'>): Post {
    const newId = `post-${Date.now()}`;
    const initialTextVersions: PostTextVersion[] = [];

    if (post.title || post.caption || post.description_html) {
      initialTextVersions.push({
        id: `tv-${Date.now()}`,
        post_id: newId,
        version_number: 1,
        title: post.title,
        description_html: post.description_html || `<p>${post.caption || ''}</p>`,
        caption_plain: post.caption || '',
        hashtags: post.hashtags || [],
        submitted_by: post.created_by,
        created_at: new Date().toISOString(),
      });
    }

    const newPost: Post = {
      ...post,
      id: newId,
      status: post.status || 'text_submitted',
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
      id: `tv-${Date.now()}`,
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

    post.text_versions.push(newVer);
    post.title = versionData.title;
    post.description_html = versionData.description_html;
    post.caption = versionData.caption_plain;
    post.hashtags = versionData.hashtags;
    post.status = 'text_submitted';
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

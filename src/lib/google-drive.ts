import { mockDb } from './mock-db';

export interface DriveFolderInfo {
  id: string;
  name: string;
  clientCode?: string;
  projectId?: string;
  path: string;
  status: 'valid' | 'invalid_permissions' | 'missing' | 'inaccessible';
  ownerEmail: string;
  sharedWith: { email: string; role: 'editor' | 'viewer'; verified: boolean }[];
  fileCount: number;
  totalSizeBytes: number;
  lastVerifiedAt: string;
}

export interface LinkHealthResult {
  url: string;
  type: 'drive_folder' | 'drive_file' | 'docs_brief';
  status: 'healthy' | 'warning' | 'broken';
  statusCode: number;
  message: string;
  latencyMs: number;
  checkedAt: string;
}

export interface DriveUploadPayload {
  postId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  submissionNotes?: string;
  driveUrl?: string;
  submitterId: string;
}

export class GoogleDriveService {
  /**
   * Verify server-side OAuth2 or Service Account token
   */
  async checkConnectionStatus(): Promise<{
    connected: boolean;
    verified: boolean;
    accountEmail: string;
    tokenExpiry: string;
    status: 'connected' | 'not_connected' | 'configuration_required' | 'token_expired';
  }> {
    const settings = mockDb.getSettings();

    // Check if configuration exists
    if (!settings.google_account_email || !settings.google_drive_root_folder_id) {
      return {
        connected: false,
        verified: false,
        accountEmail: '',
        tokenExpiry: '',
        status: 'configuration_required',
      };
    }

    // Check token expiration
    if (settings.google_token_expiry && new Date(settings.google_token_expiry) < new Date()) {
      return {
        connected: false,
        verified: false,
        accountEmail: settings.google_account_email,
        tokenExpiry: settings.google_token_expiry,
        status: 'token_expired',
      };
    }

    return {
      connected: settings.google_connected,
      verified: settings.google_connected,
      accountEmail: settings.google_account_email,
      tokenExpiry: settings.google_token_expiry || new Date(Date.now() + 86400000 * 30).toISOString(),
      status: settings.google_connected ? 'connected' : 'not_connected',
    };
  }

  /**
   * Fetch connected folders for all projects
   */
  async getProjectFolders(): Promise<DriveFolderInfo[]> {
    const projects = mockDb.getProjects();
    const users = mockDb.getUsers();

    return projects.map((p, idx) => {
      // Simulate real permission inspection
      const isMissing = p.google_drive_folder_id?.includes('missing');
      const isInvalid = p.google_drive_folder_id?.includes('invalid');

      let status: DriveFolderInfo['status'] = 'valid';
      if (isMissing) status = 'missing';
      else if (isInvalid) status = 'invalid_permissions';

      return {
        id: p.google_drive_folder_id || `folder-${p.id}`,
        name: `${p.client?.code || 'CLIENT'} - ${p.name}`,
        clientCode: p.client?.code,
        projectId: p.id,
        path: `/Amplifi Master Marketing Directory/${p.client?.name || 'General'}/${p.name}`,
        status,
        ownerEmail: 'integrations-service@amplifi.io',
        sharedWith: [
          { email: 'sarah.manager@amplifi.io', role: 'editor', verified: true },
          { email: 'alex.creator@amplifi.io', role: 'editor', verified: status === 'valid' },
          { email: 'maya.design@amplifi.io', role: 'editor', verified: status === 'valid' },
        ],
        fileCount: 4 + idx * 3,
        totalSizeBytes: 34200000 + idx * 15000000,
        lastVerifiedAt: new Date(Date.now() - idx * 3600000).toISOString(),
      };
    });
  }

  /**
   * Run link health audit across all project folders, brief docs, and post deliverables
   */
  async scanLinkHealth(): Promise<LinkHealthResult[]> {
    const posts = mockDb.getPosts();
    const results: LinkHealthResult[] = [];

    posts.forEach(post => {
      if (post.google_docs_brief_url) {
        results.push({
          url: post.google_docs_brief_url,
          type: 'docs_brief',
          status: 'healthy',
          statusCode: 200,
          message: 'Docs Brief accessible and verified with editor permissions',
          latencyMs: 142,
          checkedAt: new Date().toISOString(),
        });
      }

      if (post.google_drive_assets_url) {
        const isBroken = post.google_drive_assets_url.includes('broken');
        results.push({
          url: post.google_drive_assets_url,
          type: 'drive_folder',
          status: isBroken ? 'broken' : 'healthy',
          statusCode: isBroken ? 404 : 200,
          message: isBroken
            ? 'Drive folder inaccessible or moved to Trash'
            : 'Verified 2-way read/write permission for student creator and manager',
          latencyMs: 185,
          checkedAt: new Date().toISOString(),
        });
      }
    });

    return results;
  }

  /**
   * Validate a student-pasted Google Drive URL
   */
  validateDriveLink(url: string): {
    valid: boolean;
    type?: 'file' | 'folder';
    id?: string;
    error?: string;
  } {
    if (!url || !url.trim()) {
      return { valid: false, error: 'Please enter a Google Drive link.' };
    }

    const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const driveFolderRegex = /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/;
    const docsRegex = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/;

    const fileMatch = url.match(driveFileRegex);
    if (fileMatch) {
      return { valid: true, type: 'file', id: fileMatch[1] };
    }

    const folderMatch = url.match(driveFolderRegex);
    if (folderMatch) {
      return { valid: true, type: 'folder', id: folderMatch[1] };
    }

    const docsMatch = url.match(docsRegex);
    if (docsMatch) {
      return { valid: true, type: 'file', id: docsMatch[1] };
    }

    // Generic valid URL with google.com
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      return { valid: true, type: 'file', id: 'drive-extracted-id' };
    }

    return {
      valid: false,
      error: 'Invalid format. URL must start with drive.google.com or docs.google.com.',
    };
  }

  /**
   * Process a student deliverable submission
   */
  async submitDeliverable(payload: DriveUploadPayload): Promise<{
    success: boolean;
    versionNumber: number;
    error?: string;
  }> {
    const post = mockDb.getPost(payload.postId);
    if (!post) throw new Error('Post not found');

    const nextVersion = 2; // increments from v1

    // Update post status to 'submitted'
    mockDb.updatePost(post.id, {
      status: 'submitted',
      updated_at: new Date().toISOString(),
    });

    // Log the audit event
    const submitter = mockDb.getUser(payload.submitterId);
    mockDb.logAudit({
      user_id: payload.submitterId,
      user_email: submitter?.email || 'student@amplifi.io',
      user_role: submitter?.role || 'student',
      action: 'DELIVERABLE_SUBMITTED',
      entity_type: 'post',
      entity_id: post.id,
      details: {
        file_name: payload.fileName,
        file_size_bytes: payload.fileSizeBytes,
        version: nextVersion,
        drive_url: payload.driveUrl,
        notes: payload.submissionNotes,
      },
    });

    return {
      success: true,
      versionNumber: nextVersion,
    };
  }
}

export const googleDriveService = new GoogleDriveService();

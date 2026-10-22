import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  HardDrive,
  FileText,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Video,
  Image as ImageIcon,
  AlertTriangle,
  FolderLock,
} from 'lucide-react';
import { Post, ProjectStudentFolder } from '@/lib/types';
import { mockDb } from '@/lib/mock-db';
import { googleDriveService } from '@/lib/google-drive';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatBytes } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface StudentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onSuccess?: () => void;
}

export const StudentSubmissionModal: React.FC<StudentSubmissionModalProps> = ({
  isOpen,
  onClose,
  post,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Requirement 4: Detect post content type (Video or Image) and lookup student's assigned folder for this project
  const studentFolders: ProjectStudentFolder[] = useMemo(() => {
    if (!user) return [];
    return mockDb.getStudentFolders(post.project_id, user.id);
  }, [post.project_id, user]);

  const assignedFolder = useMemo(() => {
    return studentFolders.find(f => f.media_type === post.content_type);
  }, [studentFolders, post.content_type]);

  // Form State: Title, Description, Hashtags, Media link/file, notes
  const [title, setTitle] = useState(post.title || '');
  const [descriptionHtml, setDescriptionHtml] = useState(post.description_html || post.caption || '');
  const [hashtagsText, setHashtagsText] = useState((post.hashtags || []).join(' '));
  const [notes, setNotes] = useState('');

  const [mode, setMode] = useState<'drive_link' | 'upload'>('drive_link');
  const [driveUrl, setDriveUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast({ type: 'error', title: 'Title required', message: 'Please provide a title for the post.' });
      return;
    }

    if (!descriptionHtml.trim()) {
      showToast({ type: 'error', title: 'Description required', message: 'Please write or paste the post copy.' });
      return;
    }

    if (!assignedFolder || !assignedFolder.drive_folder_id) {
      showToast({
        type: 'error',
        title: 'Assigned Folder Missing',
        message: `The Admin has not yet configured your ${post.content_type.toUpperCase()} folder for this campaign. Please contact your Admin.`,
      });
      return;
    }

    if (mode === 'drive_link' && !driveUrl.trim()) {
      showToast({ type: 'warning', message: 'Please enter a Google Drive link for your deliverable.' });
      return;
    }

    if (mode === 'upload' && !selectedFile) {
      showToast({ type: 'warning', message: 'Please select a deliverable file to upload.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const fileName = mode === 'upload' ? selectedFile!.name : (driveUrl.split('/').pop() || `${post.content_type}-deliverable`);
      const fileMime = mode === 'upload' ? selectedFile!.type : undefined;
      const fileSizeBytes = mode === 'upload' ? selectedFile!.size : 15000000;

      // Requirement 4: Reject wrong media type for wrong folder!
      const mediaValidation = googleDriveService.validateDeliverableMedia({
        fileUrl: mode === 'upload' ? `https://drive.google.com/file/d/upload-${Date.now()}/view` : driveUrl,
        expectedMediaType: post.content_type,
        fileName,
        fileMimeType: fileMime,
        assignedFolderId: assignedFolder.drive_folder_id,
      });

      if (!mediaValidation.valid) {
        setIsSubmitting(false);
        showToast({
          type: 'error',
          title: 'Media Rejection',
          message: mediaValidation.error || 'Media deliverable does not match the required folder type.',
        });
        return;
      }

      // Parse hashtags
      const parsedHashtags = hashtagsText
        .split(/[,\s]+/)
        .map(h => (h.startsWith('#') ? h : `#${h}`))
        .filter(h => h.length > 1);

      // Record text version history
      mockDb.addTextVersion(post.id, {
        title: title.trim(),
        description_html: descriptionHtml,
        caption_plain: descriptionHtml.replace(/<[^>]*>/g, '').trim(),
        hashtags: parsedHashtags,
        submitted_by: user?.id,
        submission_notes: notes.trim(),
      });

      // Submit media asset into assigned folder
      await googleDriveService.submitDeliverable({
        postId: post.id,
        fileName,
        fileType: fileMime || (post.content_type === 'video' ? 'video/mp4' : 'image/png'),
        fileSizeBytes,
        driveUrl: mode === 'upload' ? `https://drive.google.com/file/d/upload-${Date.now()}/view` : driveUrl,
        driveFileId: mediaValidation.fileId || `file-${Date.now()}`,
        targetFolderId: assignedFolder.drive_folder_id,
        submissionNotes: notes.trim(),
        submitterId: user?.id || 'student',
      });

      setIsSubmitting(false);
      showToast({
        type: 'success',
        title: 'Deliverable Submitted!',
        message: `"${title}" has been submitted for Manager review.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'An error occurred while submitting deliverable.',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {post.content_type === 'video' ? (
            <Video className="h-5 w-5 text-indigo-600" />
          ) : (
            <ImageIcon className="h-5 w-5 text-emerald-600" />
          )}
          <span>Submit {post.content_type.toUpperCase()} Deliverable</span>
        </div>
      }
      description={`Deliver visual assets into your assigned ${post.content_type.toUpperCase()} Drive folder for "${post.title}"`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Assigned Folder Info Banner (Requirement 2 & 4) */}
        {assignedFolder && assignedFolder.drive_folder_id ? (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-xs flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <HardDrive className="h-4 w-4 text-blue-600" />
                Target Assigned {post.content_type.toUpperCase()} Folder:
              </span>
              <p className="font-mono text-[11px] text-blue-800 dark:text-blue-300">
                Folder ID: {assignedFolder.drive_folder_id}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Your media file must reside inside this dedicated folder.
              </p>
            </div>
            {assignedFolder.drive_folder_url && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => window.open(assignedFolder.drive_folder_url, '_blank')}
                rightIcon={<ExternalLink className="h-3 w-3" />}
                className="text-xs h-7 shrink-0"
              >
                Open Folder
              </Button>
            )}
          </div>
        ) : (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300 flex items-start gap-2.5">
            <FolderLock className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block">No Assigned {post.content_type.toUpperCase()} Folder Found</strong>
              <span>
                The Administrator has not yet configured your {post.content_type} folder for this project. You cannot submit until a folder is assigned.
              </span>
            </div>
          </div>
        )}

        {/* 1. Title */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Post Title *
          </label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 5 Principles of High-Frequency Risk Modeling"
            className="text-sm font-semibold"
            required
          />
        </div>

        {/* 2. Description (TipTap Rich Text Editor - preserves ChatGPT formatting) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Description / Caption Copy *
            </label>
            <span className="text-[11px] text-muted-foreground">
              Paste directly from ChatGPT — formatting preserved
            </span>
          </div>
          <RichTextEditor
            content={descriptionHtml}
            onChange={html => setDescriptionHtml(html)}
            placeholder="Write or paste your ChatGPT copy here (bold, italics, headings, bullet lists, emojis supported)..."
            minHeight="140px"
          />
        </div>

        {/* 3. Hashtags */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Hashtags
          </label>
          <Input
            value={hashtagsText}
            onChange={e => setHashtagsText(e.target.value)}
            placeholder="#FinTech #Leadership #AI #Campaign2026"
            className="text-xs font-mono"
          />
        </div>

        {/* 4. Media Deliverable Upload / Drive Link */}
        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground uppercase flex items-center gap-1.5">
              {post.content_type === 'video' ? <Video className="h-4 w-4 text-indigo-500" /> : <ImageIcon className="h-4 w-4 text-emerald-500" />}
              <span>{post.content_type.toUpperCase()} Deliverable Asset *</span>
            </label>

            <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/30">
              <button
                type="button"
                onClick={() => setMode('drive_link')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  mode === 'drive_link' ? 'bg-primary-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Paste Drive Link
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  mode === 'upload' ? 'bg-primary-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Direct Upload
              </button>
            </div>
          </div>

          {mode === 'drive_link' ? (
            <div className="space-y-1.5">
              <Input
                value={driveUrl}
                onChange={e => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view"
                leftIcon={<LinkIcon className="h-4 w-4 text-muted-foreground" />}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Paste the shareable link of the {post.content_type} uploaded into your assigned folder.
              </p>
            </div>
          ) : (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50/20'
                    : 'border-border/80 hover:border-primary-500/50 hover:bg-muted/10'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={post.content_type === 'video' ? 'video/*' : 'image/*'}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                {selectedFile ? (
                  <div>
                    <span className="text-xs font-semibold text-foreground block">{selectedFile.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{formatBytes(selectedFile.size)}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary-600">Click to upload</span> or drag and drop your {post.content_type} file
                    <p className="text-[11px] pt-1">MP4, MOV, PNG, JPG up to 500 MB</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. Submission Notes */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Submission Notes for Manager (Optional)
          </label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any comments, aspect ratio details, or revisions addressed..."
            rows={2}
            className="text-xs"
          />
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={!assignedFolder?.drive_folder_id}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            Submit Post & Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  );
};

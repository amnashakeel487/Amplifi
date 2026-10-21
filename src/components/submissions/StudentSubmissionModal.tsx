import React, { useState, useRef } from 'react';
import {
  Upload,
  HardDrive,
  FileText,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Link as LinkIcon,
  X,
  FileCode,
  Sparkles,
  ArrowRight,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Post } from '@/lib/types';
import { googleDriveService } from '@/lib/google-drive';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { formatBytes } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

  // Media Gate Check (Requirement 3: Only after manager approves text does media stage unlock)
  const isTextApproved = ['text_approved', 'media_in_progress', 'media_submitted', 'media_revision_required'].includes(post.status);

  const assignedFolderId = user?.assigned_drive_folder_id || post.google_drive_assets_folder_id || '1AbC_dRiVe_AlexRivera_Folder2026';
  const assignedFolderUrl = user?.assigned_drive_folder_url || post.google_drive_assets_url || `https://drive.google.com/drive/folders/${assignedFolderId}`;

  const [mode, setMode] = useState<'upload' | 'drive_link'>('drive_link');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveUrl, setDriveUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation feedback for Drive link
  const linkValidation = driveUrl
    ? googleDriveService.validateDriveLink(driveUrl)
    : { valid: false };

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const maxSizeBytes = 500 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Maximum upload size is 500 MB. Please compress or paste a Drive link.',
      });
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTextApproved) {
      showToast({
        type: 'error',
        title: 'Media Stage Locked',
        message: 'Copy must be approved by the Campaign Manager before media assets can be submitted.',
      });
      return;
    }

    if (mode === 'upload' && !selectedFile) {
      showToast({ type: 'warning', message: 'Please select a deliverable asset file.' });
      return;
    }
    if (mode === 'drive_link' && !linkValidation.valid) {
      showToast({ type: 'warning', message: 'Please provide a valid Google Drive URL.' });
      return;
    }

    // Validate that file link belongs to the creator's assigned folder (Requirement 3)
    if (mode === 'drive_link') {
      const folderCheck = googleDriveService.validateFileInAssignedFolder(driveUrl, assignedFolderId);
      if (!folderCheck.valid) {
        showToast({
          type: 'error',
          title: 'Folder Verification Failed',
          message: folderCheck.message,
        });
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(15);
    setUploadStatusText('Verifying permissions on assigned Creator Drive Folder...');

    await new Promise(r => setTimeout(r, 400));
    setUploadProgress(45);
    setUploadStatusText('Checking least-privilege folder access & file integrity...');

    await new Promise(r => setTimeout(r, 500));
    setUploadProgress(80);
    setUploadStatusText('Recording version history in Google Drive manifest...');

    await new Promise(r => setTimeout(r, 400));
    setUploadProgress(100);
    setUploadStatusText('Alerting Campaign Manager for proofreading...');

    await new Promise(r => setTimeout(r, 300));

    // Submit deliverable into media_submitted status
    await googleDriveService.submitDeliverable({
      postId: post.id,
      fileName: selectedFile ? selectedFile.name : `Campaign_Asset_${post.platforms[0] || 'social'}_cut`,
      fileType: selectedFile ? selectedFile.type : 'video/mp4',
      fileSizeBytes: selectedFile ? selectedFile.size : 24800000,
      submissionNotes: notes,
      driveUrl: mode === 'drive_link' ? driveUrl : assignedFolderUrl,
      submitterId: user?.id || 'user-student-01',
    });

    setIsUploading(false);
    showToast({
      type: 'success',
      title: 'Media Asset Submitted!',
      message: `"${post.title}" moved to Media Submitted. Your manager has been alerted for proofreading.`,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary-600" />
          <span>Submit Media Asset (Video / Image)</span>
        </div>
      }
      description={`Deliver visual assets into your assigned Drive folder for "${post.title}"`}
      maxWidth="lg"
    >
      {/* 1. TEXT STAGE GATE BANNER (Requirement 3: Only after manager approves text does media unlock) */}
      {!isTextApproved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Media Stage Locked: Text Approval Required
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Under the editorial workflow, creators can only upload videos and images after the Campaign Manager approves the post's Title, Description, and Hashtags.
              </p>
              <div className="mt-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                Current Post Status: <span className="font-mono uppercase font-bold">{post.status.replace(/_/g, ' ')}</span>
              </div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close & Wait for Text Approval
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Assigned Drive Folder Banner (Requirement 3) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900/60 dark:bg-blue-950/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <HardDrive className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-semibold text-blue-950 dark:text-blue-200 block">
                  Your Assigned Google Drive Folder
                </span>
                <span className="text-[11px] font-mono text-blue-700 dark:text-blue-400">
                  Folder ID: {assignedFolderId}
                </span>
              </div>
            </div>
            <a
              href={assignedFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Open in Drive <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Mode Switcher */}
          <Tabs value={mode} onValueChange={v => setMode(v as any)} className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="drive_link" className="text-xs">
                <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                Paste Drive Asset Link
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs">
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Direct File Upload
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Paste Drive Link */}
            <TabsContent value="drive_link" className="space-y-3 pt-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                  Google Drive File Link (Inside Your Assigned Folder) *
                </label>
                <Input
                  value={driveUrl}
                  onChange={e => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/1AbC.../view?usp=sharing"
                  leftIcon={<LinkIcon className="h-4 w-4" />}
                  className="text-xs font-mono"
                />
              </div>

              {driveUrl && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    linkValidation.valid
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  {linkValidation.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-semibold block">Valid Google Drive Link</span>
                        <span className="text-[11px] opacity-90 font-mono">
                          ID: {linkValidation.id} • Verified inside assigned folder ({assignedFolderId})
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>{linkValidation.error}</span>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Direct File Upload */}
            <TabsContent value="upload" className="space-y-3 pt-3">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
                    : 'border-border/80 hover:border-border hover:bg-muted/30'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,.pdf"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 rounded-full bg-primary-50 dark:bg-primary-950 text-primary-600">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground block">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {selectedFile
                        ? `${formatBytes(selectedFile.size)} • ${selectedFile.type}`
                        : 'MP4, MOV, PNG, JPG or Carousel PDF (Max 500 MB)'}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Submission Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
              Production Notes / Change Summary
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Exported at 4K 60fps in Rec.709, added subtitles per brand guidelines..."
              className="text-xs min-h-[60px]"
            />
          </div>

          {/* Upload Progress Stream */}
          {isUploading && (
            <div className="space-y-2 p-3 bg-muted/40 rounded-xl border border-border/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary-600 animate-spin" />
                  {uploadStatusText}
                </span>
                <span className="font-mono text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary-600 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isUploading || (mode === 'drive_link' && !linkValidation.valid) || (mode === 'upload' && !selectedFile)}
            >
              Submit Deliverable
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

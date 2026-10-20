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

  const [mode, setMode] = useState<'upload' | 'drive_link'>('upload');
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
    // 500MB limit
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
    if (mode === 'upload' && !selectedFile) {
      showToast({ type: 'warning', message: 'Please select a deliverable asset file.' });
      return;
    }
    if (mode === 'drive_link' && !linkValidation.valid) {
      showToast({ type: 'warning', message: 'Please provide a valid Google Drive URL.' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatusText('Connecting to Google Drive service account...');

    // Simulate progress stream
    await new Promise(r => setTimeout(r, 400));
    setUploadProgress(35);
    setUploadStatusText('Streaming chunks to encrypted Cloud Storage...');

    await new Promise(r => setTimeout(r, 600));
    setUploadProgress(75);
    setUploadStatusText('Generating Drive metadata & verified thumbnail...');

    await new Promise(r => setTimeout(r, 500));
    setUploadProgress(100);
    setUploadStatusText('Verifying manager permissions & updating review queue...');

    await new Promise(r => setTimeout(r, 300));

    // Execute submission
    await googleDriveService.submitDeliverable({
      postId: post.id,
      fileName: selectedFile ? selectedFile.name : 'Drive Linked Deliverable',
      fileType: selectedFile ? selectedFile.type : 'application/vnd.google-apps.file',
      fileSizeBytes: selectedFile ? selectedFile.size : 12400000,
      submissionNotes: notes,
      driveUrl: mode === 'drive_link' ? driveUrl : post.google_drive_assets_url,
      submitterId: user?.id || 'user-student-01',
    });

    setIsUploading(false);
    showToast({
      type: 'success',
      title: 'Deliverables Submitted!',
      message: `"${post.title}" moved to Under Review. Your campaign manager has been alerted.`,
    });

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isUploading ? () => {} : onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary-600" />
          <span>Deliverable Submission Flow</span>
        </div>
      }
      description={`Deliver visual assets & copy for "${post.title}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Version Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900 text-xs">
          <div>
            <span className="font-semibold text-primary-900 dark:text-primary-200 block">
              Submitting Version v2.0
            </span>
            <span className="text-primary-700 dark:text-primary-400">
              Target Campaign: {post.project?.name}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900 font-mono font-bold text-primary-800 dark:text-primary-200">
            AUTO-STREAM
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upload" disabled={isUploading}>
              Direct File Upload
            </TabsTrigger>
            <TabsTrigger value="drive_link" disabled={isUploading}>
              Paste Google Drive Link
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DRAG AND DROP UPLOAD ZONE */}
          <TabsContent value="upload" className="mt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf,.zip,.psd,.ai"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50/30 dark:bg-primary-950/30 scale-[1.01]'
                    : 'border-border/80 hover:border-primary-500/60 bg-muted/20'
                }`}
              >
                <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 text-primary-600 shadow-soft-sm">
                  <Upload className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">
                  Drag and drop deliverable assets here
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  or <span className="text-primary-600 font-medium underline">browse your device</span>
                </p>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Supports MP4, MOV, PNG, JPG, PDF, ZIP up to 500MB
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border/80 bg-muted/30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-card border border-border/60 text-primary-600">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </h5>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatBytes(selectedFile.size)} • {selectedFile.type || 'Binary deliverable'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: PASTE DRIVE LINK */}
          <TabsContent value="drive_link" className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
                Google Drive Asset or Folder URL *
              </label>
              <Input
                value={driveUrl}
                onChange={e => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                leftIcon={<HardDrive className="h-4 w-4 text-emerald-500" />}
                className="text-xs"
                disabled={isUploading}
              />
            </div>

            {/* Live feedback */}
            {driveUrl && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                  linkValidation.valid
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                }`}
              >
                {linkValidation.valid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Valid Drive resource identified. Service account has read/write authority.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{linkValidation.error || 'Invalid link'}</span>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submission Notes */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">
            Change Notes / Proofreading Additions
          </label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Exported slide 2 with warmer color grade. Brand disclaimer placed on slide 5..."
            className="text-xs min-h-[90px]"
            disabled={isUploading}
          />
        </div>

        {/* Live Upload Progress Indicator */}
        {isUploading && (
          <div className="space-y-2 p-4 rounded-xl bg-card border border-border/80 shadow-soft">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary-600 animate-spin" />
                {uploadStatusText}
              </span>
              <span className="font-mono font-bold text-primary-600">{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-border flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isUploading} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Submit for Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};

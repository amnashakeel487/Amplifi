import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText,
  Plus,
  Calendar,
  Clock,
  Sparkles,
  Link as LinkIcon,
  HardDrive,
  Users,
  Hash,
} from 'lucide-react';
import { mockDb } from '@/lib/mock-db';
import { SocialPlatform, PriorityLevel } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Drawer } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { PlatformCounters } from './PlatformCounters';

const postCreateSchema = z.object({
  project_id: z.string().min(1, 'Project selection is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  caption: z.string().optional(),
  hashtags_raw: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  deadline: z.string().min(1, 'Deadline is required'),
  target_publish_date: z.string().optional(),
  assigned_student_id: z.string().optional(),
  creative_specs: z.string().optional(),
  google_docs_brief_url: z.string().optional(),
  google_drive_assets_url: z.string().optional(),
  reference_links_raw: z.string().optional(),
});

type PostCreateFormData = z.infer<typeof postCreateSchema>;

interface CreatePostDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  defaultProjectId?: string;
}

export const CreatePostDrawer: React.FC<CreatePostDrawerProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  defaultProjectId,
}) => {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const projects = mockDb.getProjects();
  const students = mockDb.getUsers().filter(u => u.role === 'student');
  const isStudentUser = user?.role === 'student';

  const [descriptionHtml, setDescriptionHtml] = useState('<p></p>');
  const [plainDescription, setPlainDescription] = useState('');

  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    'instagram',
    'linkedin',
  ]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: {
      project_id: defaultProjectId || projects[0]?.id || '',
      title: '',
      caption: '',
      hashtags_raw: 'FinTech, BankingAI, ComplianceTech',
      priority: 'medium',
      deadline: '2026-11-15T18:00',
      assigned_student_id: isStudentUser ? user.id : (students[0]?.id || ''),
      creative_specs: '1:1 Square carousel (5 slides) + 9:16 vertical video cut.',
      google_docs_brief_url: 'https://docs.google.com/document/d/brief-new/edit',
      google_drive_assets_url: 'https://drive.google.com/drive/folders/new-assets',
    },
  });

  const watchedCaption = plainDescription || watch('caption') || '';
  const watchedHashtags = (watch('hashtags_raw') || '')
    .split(',')
    .map(t => t.trim().replace(/^#/, ''))
    .filter(Boolean);

  const togglePlatform = (p: SocialPlatform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const onSubmit = (data: PostCreateFormData) => {
    const assignedCreator = isStudentUser ? user.id : data.assigned_student_id;
    const finalCaption = plainDescription || data.caption || '';
    const finalHtml = descriptionHtml && descriptionHtml !== '<p></p>' ? descriptionHtml : `<p>${finalCaption}</p>`;

    const created = mockDb.createPost({
      project_id: data.project_id,
      title: data.title,
      caption: finalCaption,
      description_html: finalHtml,
      hashtags: watchedHashtags,
      platforms: selectedPlatforms,
      status: 'text_submitted',
      priority: data.priority as PriorityLevel,
      deadline: data.deadline,
      target_publish_date: data.target_publish_date || data.deadline,
      assigned_student_id: assignedCreator,
      assigned_manager_id: isStudentUser ? undefined : user?.id,
      creative_specs: data.creative_specs,
      google_docs_brief_url: data.google_docs_brief_url,
      google_drive_assets_url: data.google_drive_assets_url,
      reference_links: (data.reference_links_raw || '').split('\n').filter(Boolean),
      created_by: user?.id,
    });

    showToast({
      type: 'success',
      title: 'Text Submitted for Review',
      message: `"${created.title}" submitted to Campaign Manager with preserved rich-text formatting.`,
    });

    reset();
    setDescriptionHtml('<p></p>');
    setPlainDescription('');
    onClose();
    if (onPostCreated) onPostCreated();
  };

  const allPlatforms: { id: SocialPlatform; label: string }[] = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'twitter', label: 'Twitter / X' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'youtube', label: 'YouTube' },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Create Content Deliverable"
      description="Draft requirements, assign creators, and validate character limits."
      width="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Project Selector & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Campaign Project *
            </label>
            <Select {...register('project_id')} className="mt-1 text-xs">
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client?.code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Priority Level *
            </label>
            <Select {...register('priority')} className="mt-1 text-xs">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Deliverable Title *
          </label>
          <Input
            {...register('title')}
            placeholder="e.g. Autonomous Risk Modeling in Global Banking"
            error={errors.title?.message}
            className="mt-1"
          />
        </div>

        {/* Target Platforms selection */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
            Target Distribution Channels *
          </label>
          <div className="flex flex-wrap gap-2">
            {allPlatforms.map(p => {
              const isSelected = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-soft-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadlines & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Assigned Creator *
            </label>
            <Select {...register('assigned_student_id')} className="mt-1 text-xs">
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.title || 'Creator'})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Submission Deadline *
            </label>
            <Input
              type="datetime-local"
              {...register('deadline')}
              error={errors.deadline?.message}
              className="mt-1 text-xs"
            />
          </div>
        </div>

        {/* Caption Editor & Platform Counters */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Post Description & Body Copy (Preserves ChatGPT Formatting)
              </label>
              <span className="text-[10px] text-primary-600 bg-primary-50 dark:bg-primary-950/50 px-1.5 py-0.5 rounded font-medium">
                Supports Bold, Italics, Lists & Emojis
              </span>
            </div>
            <RichTextEditor
              value={descriptionHtml}
              onChange={(html, plain) => {
                setDescriptionHtml(html);
                setPlainDescription(plain);
                setValue('caption', plain);
              }}
              placeholder="Paste ChatGPT formatted text directly (bold, headings, bullets, line breaks, emojis)..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Hashtags (Comma Separated)
            </label>
            <Input
              {...register('hashtags_raw')}
              placeholder="FinTech, RiskManagement, CleanTech"
              leftIcon={<Hash className="h-4 w-4" />}
              className="mt-1 text-xs"
            />
          </div>

          {/* Real-time platform limit indicator */}
          <PlatformCounters
            caption={watchedCaption}
            hashtags={watchedHashtags}
            platforms={selectedPlatforms}
          />
        </div>

        {/* Creative Specifications */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase">
            Creative Specs & Formats
          </label>
          <Textarea
            {...register('creative_specs')}
            placeholder="e.g. 1:1 format, midnight blue palette, bold subtitle typography..."
            className="mt-1 text-xs"
          />
        </div>

        {/* Cloud Links Binding */}
        <div className="p-3.5 bg-muted/20 rounded-xl border border-border/60 space-y-3">
          <span className="text-xs font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-emerald-500" />
            Google Cloud Asset & Brief Links
          </span>
          <div>
            <label className="text-xs text-muted-foreground">Google Docs Brief URL</label>
            <Input
              {...register('google_docs_brief_url')}
              placeholder="https://docs.google.com/document/d/..."
              className="mt-1 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Drive Assets Folder URL</label>
            <Input
              {...register('google_drive_assets_url')}
              placeholder="https://drive.google.com/drive/folders/..."
              className="mt-1 text-xs"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Assign Deliverable
          </Button>
        </div>
      </form>
    </Drawer>
  );
};

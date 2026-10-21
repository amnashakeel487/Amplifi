import React, { useState } from 'react';
import { Copy, FileText, Check } from 'lucide-react';
import { Button } from './button';
import { useNotifications } from '@/context/NotificationContext';

interface CopyTextActionsProps {
  htmlContent?: string;
  plainText?: string;
  size?: 'sm' | 'default' | 'xs';
  className?: string;
}

export const CopyTextActions: React.FC<CopyTextActionsProps> = ({
  htmlContent = '',
  plainText = '',
  size = 'sm',
  className = '',
}) => {
  const { showToast } = useNotifications();
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [copiedPlain, setCopiedPlain] = useState(false);

  // Compute text to copy
  const resolvedPlain = plainText || htmlContent.replace(/<[^>]*>/g, '').trim();
  const resolvedHtml = htmlContent || `<p>${resolvedPlain.replace(/\n/g, '<br/>')}</p>`;

  const handleCopyFormatted = async () => {
    try {
      if (typeof window !== 'undefined' && 'ClipboardItem' in window && navigator.clipboard?.write) {
        const textBlob = new Blob([resolvedPlain], { type: 'text/plain' });
        const htmlBlob = new Blob([resolvedHtml], { type: 'text/html' });
        const data = [new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })];
        await navigator.clipboard.write(data);
      } else {
        await navigator.clipboard.writeText(resolvedPlain);
      }

      setCopiedFormatted(true);
      showToast({
        type: 'success',
        title: 'Formatted Text Copied',
        message: 'Rich formatting, bold, italics & emojis copied to clipboard.',
      });
      setTimeout(() => setCopiedFormatted(false), 2000);
    } catch {
      // Fallback
      await navigator.clipboard.writeText(resolvedPlain);
      setCopiedFormatted(true);
      showToast({
        type: 'info',
        title: 'Text Copied',
        message: 'Content copied to clipboard as plain text.',
      });
      setTimeout(() => setCopiedFormatted(false), 2000);
    }
  };

  const handleCopyPlain = async () => {
    try {
      await navigator.clipboard.writeText(resolvedPlain);
      setCopiedPlain(true);
      showToast({
        type: 'success',
        title: 'Plain Text Copied',
        message: 'Unformatted plain text copied to clipboard.',
      });
      setTimeout(() => setCopiedPlain(false), 2000);
    } catch {
      showToast({
        type: 'error',
        title: 'Clipboard Error',
        message: 'Unable to access clipboard.',
      });
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Button
        variant="outline"
        size={size === 'xs' ? 'sm' : size}
        onClick={handleCopyFormatted}
        leftIcon={copiedFormatted ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        className="text-xs h-7 px-2.5 font-medium"
        title="Copy rich formatted text (retains bold, bullet lists, emojis)"
      >
        {copiedFormatted ? 'Copied Rich Text!' : 'Copy formatted text'}
      </Button>

      <Button
        variant="ghost"
        size={size === 'xs' ? 'sm' : size}
        onClick={handleCopyPlain}
        leftIcon={copiedPlain ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <FileText className="h-3.5 w-3.5" />}
        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
        title="Copy unformatted plain text"
      >
        {copiedPlain ? 'Copied Plain!' : 'Copy plain text'}
      </Button>
    </div>
  );
};

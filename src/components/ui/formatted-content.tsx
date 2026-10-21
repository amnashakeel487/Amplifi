import React from 'react';
import DOMPurify from 'dompurify';

interface FormattedContentProps {
  html?: string;
  fallbackText?: string;
  className?: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({
  html,
  fallbackText,
  className = '',
}) => {
  if (html && html.trim() && html !== '<p></p>') {
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'br', 'span'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    });

    return (
      <div
        className={`text-sm leading-relaxed text-foreground [&_p]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:mb-2 ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  return (
    <div className={`text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 font-sans ${className}`}>
      {fallbackText || 'No description entered.'}
    </div>
  );
};

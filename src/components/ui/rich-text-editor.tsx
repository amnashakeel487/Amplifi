import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import DOMPurify from 'dompurify';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Sparkles,
  Smile,
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Write or paste ChatGPT-formatted content (headings, bullets, bold, emojis)...',
  className = '',
  readOnly = false,
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline hover:text-primary-700',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3',
          'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'br', 'span'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      });
      const plainText = editor.getText();
      onChange(sanitizedHtml, plainText);
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const addEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  return (
    <div
      className={`rounded-xl border border-border bg-card shadow-sm transition-all focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 ${className}`}
    >
      {/* Editor Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${editor.isActive('bold') ? 'bg-primary-50 text-primary-600 font-bold dark:bg-primary-950/50' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${editor.isActive('italic') ? 'bg-primary-50 text-primary-600 italic dark:bg-primary-950/50' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-1.5 py-1 rounded font-bold hover:bg-muted ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50' : ''}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-1.5 py-1 rounded font-bold hover:bg-muted ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50' : ''}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-1.5 py-1 rounded font-bold hover:bg-muted ${editor.isActive('heading', { level: 3 }) ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50' : ''}`}
            title="Heading 3"
          >
            H3
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${editor.isActive('bulletList') ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50' : ''}`}
            title="Bullet List"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${editor.isActive('orderedList') ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50' : ''}`}
            title="Numbered List"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-muted transition-colors ${editor.isActive('blockquote') ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/50' : ''}`}
            title="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-border/80 mx-1" />

          {/* Quick Emojis */}
          <div className="flex items-center gap-1">
            {['🔥', '✨', '🚀', '💡', '📌', '👇'].map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => addEmoji(emoji)}
                className="hover:scale-125 transition-transform text-sm px-1"
                title={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
              title="Undo"
            >
              <Undo className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-30"
              title="Redo"
            >
              <Redo className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent
        editor={editor}
        className="p-3 min-h-[140px] text-sm leading-relaxed text-foreground focus:outline-none [&_.tiptap]:focus:outline-none [&_.tiptap_p]:mb-2 [&_.tiptap_h1]:text-xl [&_.tiptap_h1]:font-bold [&_.tiptap_h1]:mb-2 [&_.tiptap_h2]:text-lg [&_.tiptap_h2]:font-semibold [&_.tiptap_h2]:mb-2 [&_.tiptap_h3]:text-base [&_.tiptap_h3]:font-medium [&_.tiptap_h3]:mb-1 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-5 [&_.tiptap_ul]:mb-2 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-5 [&_.tiptap_ol]:mb-2 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-primary-500 [&_.tiptap_blockquote]:pl-3 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:mb-2"
      />
    </div>
  );
};

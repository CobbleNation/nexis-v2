'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Quote, Redo, Undo, Strikethrough } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...', className }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: content, // Initial content
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[150px] max-w-none text-slate-700 dark:text-foreground leading-relaxed',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
    });

    // Sync content if it changes externally (controlled component behavior)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if content is meaningfully different to avoid cursor jumps
            // Simple check: if empty, clear. If not, only set content if editor is empty?
            // Actually, for a simple controlled input, let's just respect the initial prop mostly, 
            // but if we want to reset the form we need this.
            if (content === '') {
                editor.commands.clearContent();
            }
        }
    }, [content, editor]);

    if (!editor) {
        return <div className="min-h-[150px] bg-slate-50/50 dark:bg-secondary/10 animate-pulse rounded-xl" />;
    }

    const ToolbarButton = ({
        isActive,
        onClick,
        icon: Icon,
        label
    }: {
        isActive?: boolean;
        onClick: () => void;
        icon: any;
        label?: string;
    }) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                "h-8 w-8 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-secondary/50 hover:text-slate-900 dark:hover:text-foreground transition-all",
                isActive ? "bg-white dark:bg-secondary shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-muted-foreground"
            )}
            title={label}
            type="button" // Prevent form submission
        >
            <Icon className="h-4 w-4" />
        </Button>
    );

    return (
        <div className={cn("flex flex-col border border-slate-200 dark:border-border rounded-2xl overflow-hidden bg-white/50 dark:bg-secondary/5 focus-within:ring-2 focus-within:ring-slate-400/20 dark:focus-within:ring-primary/20 transition-all", className)}>
            <div className="flex items-center gap-1 p-1 border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-secondary/20 backdrop-blur-sm overflow-x-auto no-scrollbar">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                    label="Bold"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                    label="Italic"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    icon={Strikethrough}
                    label="Strikethrough"
                />
                <div className="w-px h-4 bg-slate-200 dark:bg-border mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon={Heading1}
                    label="Heading 1"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={Heading2}
                    label="Heading 2"
                />
                <div className="w-px h-4 bg-slate-200 dark:bg-border mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={List}
                    label="Bullet List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={ListOrdered}
                    label="Ordered List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={Quote}
                    label="Quote"
                />
                <div className="w-px h-4 bg-slate-200 dark:bg-border mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon={Undo}
                    label="Undo"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon={Redo}
                    label="Redo"
                />
            </div>
            <EditorContent editor={editor} className="p-4 min-h-[150px] outline-none" />
        </div>
    );
}

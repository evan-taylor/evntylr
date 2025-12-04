"use client";

import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/convex/_generated/api";
import {
  getImageFromClipboard,
  insertImageMarkdown,
  uploadNoteImage,
} from "@/lib/image-upload";
import type { Note } from "@/lib/types";
import { Textarea } from "./ui/textarea";

// Top-level regex for URL validation
const EXTERNAL_URL_REGEX = /^https?:\/\//i;

type ReactMarkdownChild = {
  type?: string;
  props?: {
    checked?: boolean;
    children?: React.ReactNode;
    href?: string;
  };
};

// Remove leading whitespace (up to 2 spaces or 1 tab)
function outdentLine(line: string): string {
  if (line.startsWith("  ")) {
    return line.substring(2);
  }
  if (line.startsWith("\t") || line.startsWith(" ")) {
    return line.substring(1);
  }
  return line;
}

// Tab handling types
type TabResult = {
  newContent: string;
  newStart: number;
  newEnd: number;
};

type TabContext = {
  content: string;
  lineStart: number;
  start: number;
  end: number;
};

// Handle outdent (Shift+Tab)
function computeOutdent(ctx: TabContext, lineEnd: number): TabResult {
  const line = ctx.content.substring(ctx.lineStart, lineEnd);
  const outdented = outdentLine(line);
  const charsDiff = line.length - outdented.length;
  const newContent =
    ctx.content.substring(0, ctx.lineStart) +
    outdented +
    ctx.content.substring(lineEnd);
  return {
    newContent,
    newStart: ctx.start - charsDiff,
    newEnd: ctx.end - charsDiff,
  };
}

// Handle indent (Tab)
function computeIndent(ctx: TabContext): TabResult {
  const indent = "  ";
  const newContent =
    ctx.content.substring(0, ctx.lineStart) +
    indent +
    ctx.content.substring(ctx.lineStart);
  return {
    newContent,
    newStart: ctx.start + indent.length,
    newEnd: ctx.end + indent.length,
  };
}

export default function NoteContent({
  note,
  saveNote,
  canEdit,
}: {
  note: Note;
  saveNote: (updates: Partial<Note>) => void;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(!note.content && canEdit);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      saveNote({ content: e.target.value });
    },
    [saveNote]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!canEdit) {
        return;
      }

      const clipboardEvent = e.nativeEvent as ClipboardEvent;
      const imageFile = getImageFromClipboard(clipboardEvent);

      if (!imageFile) {
        return;
      }

      // Prevent default paste behavior for images
      e.preventDefault();

      const { dismiss } = toast({ description: "Uploading image..." });

      try {
        const result = await uploadNoteImage(imageFile, generateUploadUrl);

        dismiss();

        if (result.success && result.url && textareaRef.current) {
          insertImageMarkdown(textareaRef.current, result.url);
          // Save the updated content since the synthetic event doesn't trigger React's onChange
          // Use setTimeout to defer the state update and avoid "Cannot update a component while rendering" warning
          const newContent = textareaRef.current.value;
          setTimeout(() => saveNote({ content: newContent }), 0);
        } else if (result.error) {
          console.error("Image upload failed:", result.error);
          toast({
            description: `Failed to upload image: ${result.error}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Unexpected error during image upload:", error);
        dismiss();
        toast({
          description:
            "An unexpected error occurred while uploading the image.",
          variant: "destructive",
        });
      }
    },
    [canEdit, generateUploadUrl, saveNote]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Tab") {
        return;
      }

      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = textarea.value;

      // Find line boundaries
      const lineStart = content.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = content.indexOf("\n", end);
      const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;

      // Create context object for tab operations
      const ctx: TabContext = { content, lineStart, start, end };

      // Compute the new content and cursor positions
      const result = e.shiftKey
        ? computeOutdent(ctx, actualLineEnd)
        : computeIndent(ctx);

      saveNote({ content: result.newContent });

      setTimeout(() => {
        textarea.setSelectionRange(result.newStart, result.newEnd);
      }, 0);
    },
    [saveNote]
  );

  const handleMarkdownCheckboxChange = useCallback(
    (taskText: string, isChecked: boolean) => {
      const updatedContent = (note.content ?? "").replace(
        new RegExp(
          `\\[[ x]\\] ${taskText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "g"
        ),
        `[${isChecked ? "x" : " "}] ${taskText}`
      );
      saveNote({ content: updatedContent });
    },
    [note.content, saveNote]
  );

  const renderListItem = useCallback(
    ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      className?: string;
      index?: number;
    }) => {
      if (!props.className?.includes("task-list-item")) {
        return <li {...props}>{children}</li>;
      }

      const childArray = Array.isArray(children) ? children : [children];
      const checkbox = childArray.find(
        (child): child is ReactMarkdownChild =>
          typeof child === "object" &&
          child !== null &&
          (child as ReactMarkdownChild).type === "input"
      );

      if (!checkbox) {
        return <li {...props}>{children}</li>;
      }

      const isChecked = checkbox.props?.checked;
      const taskContent = childArray.filter((child) => child !== checkbox);
      const taskText = taskContent
        .map((child) => {
          if (typeof child === "string") {
            return child;
          }
          const typedChild = child as ReactMarkdownChild;
          if (typedChild.type === "a") {
            return `[${typedChild.props?.children}](${typedChild.props?.href})`;
          }
          return typedChild.props?.children;
        })
        .join("")
        .trim();

      const taskId = `task-${taskText.substring(0, 20).replace(/\s+/g, "-").toLowerCase()}-${props.index}`;

      const handleCheckboxClick = () => {
        if (canEdit) {
          handleMarkdownCheckboxChange(taskText, !isChecked);
        }
      };

      const handleCheckboxKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCheckboxClick();
        }
      };

      return (
        <li {...props}>
          <span className="flex items-start">
            <label
              className={`${canEdit ? "cursor-pointer" : "cursor-default"} mr-1`}
              htmlFor={taskId}
            >
              <input
                checked={isChecked}
                className="pointer-events-none"
                id={taskId}
                onChange={handleCheckboxClick}
                onKeyDown={handleCheckboxKeyDown}
                readOnly
                tabIndex={canEdit ? 0 : -1}
                type="checkbox"
              />
            </label>
            <span>{taskContent}</span>
          </span>
        </li>
      );
    },
    [canEdit, handleMarkdownCheckboxChange]
  );

  const renderLink = useCallback(
    (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      const href = props.href ?? "";
      const isExternal = EXTERNAL_URL_REGEX.test(href);
      const relValue = isExternal ? "noopener noreferrer" : undefined;
      const targetValue = isExternal ? "_blank" : undefined;
      return (
        <a
          {...props}
          href={href || "#"}
          onClick={(e) => e.stopPropagation()}
          rel={relValue}
          target={targetValue}
        >
          {props.children}
        </a>
      );
    },
    []
  );

  const renderImage = useCallback(
    (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
      // biome-ignore lint/performance/noImgElement: Required for markdown content rendering
      <img
        {...props}
        alt={props.alt ?? "image"}
        className="h-auto w-full max-w-xl object-contain"
        height={props.height ?? "auto"}
        width={props.width ?? "100%"}
      />
    ),
    []
  );

  const handleContentClick = useCallback(() => {
    if (canEdit === true && note.public === false) {
      setIsEditing(true);
    }
  }, [canEdit, note.public]);

  const handleContentKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        handleContentClick();
      }
    },
    [handleContentClick]
  );

  // Pre-compute values to avoid ternary expressions in JSX
  const showTextarea = (isEditing && canEdit) || (!note.content && canEdit);
  const isMarkdownEditable = canEdit && !note.public;
  const markdownRole = isMarkdownEditable ? "button" : undefined;
  const markdownTabIndex = isMarkdownEditable ? 0 : undefined;

  return (
    <div className="px-2">
      {showTextarea ? (
        <Textarea
          className="min-h-dvh leading-normal focus:outline-none"
          id="note-content"
          onBlur={() => setIsEditing(false)}
          onChange={handleChange}
          onFocus={() => setIsEditing(true)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Start writing..."
          ref={textareaRef}
          value={note.content ?? ""}
        />
      ) : (
        // biome-ignore lint/a11y/noStaticElementInteractions: Intentional for edit trigger
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Intentional for edit trigger
        <div
          className="markdown-body h-full min-h-dvh text-base md:text-sm"
          onClick={handleContentClick}
          onKeyDown={handleContentKeyDown}
          role={markdownRole}
          tabIndex={markdownTabIndex}
        >
          <ReactMarkdown
            components={{
              li: renderListItem,
              a: renderLink,
              img: renderImage,
            }}
            remarkPlugins={[remarkGfm]}
          >
            {note.content ?? "Start writing..."}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

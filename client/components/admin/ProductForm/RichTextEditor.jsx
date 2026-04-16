"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Fragment } from "@tiptap/pm/model";
import styles from "./RichTextEditor.module.css";

export default function RichTextEditor({
  label,
  value = "",
  onChange,
  placeholder,
  rows = 8,
  helperText
}) {
  const [linkUrl, setLinkUrl] = useState("");
  const [openNewTab, setOpenNewTab] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const minHeight = Math.max(rows * 24, 180);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Link.configure({
        openOnClick: false
      }),
      Placeholder.configure({
        placeholder: placeholder || ""
      })
    ],
    content: value || "",
    onUpdate: ({ editor: currentEditor }) => {
      onChange?.(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.editorSurface
      }
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = value || "";
    const currentValue = editor.getHTML();

    if (currentValue !== nextValue) {
      editor.commands.setContent(nextValue, false);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div>
        {label ? <label className="mb-2 block text-sm font-semibold text-gray-900">{label}</label> : null}
        <div className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-500">
          Loading editor...
        </div>
        {helperText ? <p className="mt-2 text-xs text-gray-500">{helperText}</p> : null}
      </div>
    );
  }

  const buttonClass = (isActive) =>
    `flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${
      isActive
        ? "border-gray-900 bg-gray-900 text-white"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
    }`;

  const applyLink = () => {
    if (!linkUrl.trim()) {
      return;
    }

    editor
      .chain()
      .focus()
      .setLink({ href: linkUrl.trim(), target: openNewTab ? "_blank" : null })
      .run();

    setLinkUrl("");
    setOpenNewTab(false);
    setShowLinkInput(false);
  };

  const applyHeading = (level) => {
    const { state } = editor;
    const { selection, schema } = state;
    const { from, to, empty, $from, $to } = selection;

    if (empty || !$from.sameParent($to) || !$from.parent.isTextblock) {
      editor.chain().focus().toggleHeading({ level }).run();
      return;
    }

    const parent = $from.parent;
    const selectedText = parent.textBetween($from.parentOffset, $to.parentOffset, " ", " ").trim();

    if (!selectedText) {
      editor.chain().focus().toggleHeading({ level }).run();
      return;
    }

    const fullText = parent.textBetween(0, parent.content.size, " ", " ");
    const beforeText = fullText.slice(0, $from.parentOffset).trim();
    const afterText = fullText.slice($to.parentOffset).trim();
    const isWholeBlockSelected = !beforeText && !afterText;

    if (isWholeBlockSelected) {
      editor.chain().focus().toggleHeading({ level }).run();
      return;
    }

    const headingNode = schema.nodes.heading.create({ level }, schema.text(selectedText));
    const nodes = [];

    if (beforeText) {
      nodes.push(schema.nodes.paragraph.create(null, schema.text(beforeText)));
    }

    nodes.push(headingNode);

    if (afterText) {
      nodes.push(schema.nodes.paragraph.create(null, schema.text(afterText)));
    }

    const blockDepth = $from.depth;
    const blockStart = $from.before(blockDepth);
    const blockEnd = $from.after(blockDepth);
    const fragment = Fragment.fromArray(nodes);
    const transaction = state.tr.replaceRange(blockStart, blockEnd, fragment);

    editor.view.dispatch(transaction);
    editor.commands.focus();
  };

  return (
    <div>
      {label ? <label className="mb-2 block text-sm font-semibold text-gray-900">{label}</label> : null}

      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 bg-gray-50 p-3">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={buttonClass(editor.isActive("bold"))}
            title="Bold"
          >
            <i className="fas fa-bold" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={buttonClass(editor.isActive("italic"))}
            title="Italic"
          >
            <i className="fas fa-italic" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={buttonClass(editor.isActive("paragraph"))}
            title="Paragraph"
          >
            <span className="text-xs font-bold">P</span>
          </button>

          <button
            type="button"
            onClick={() => applyHeading(1)}
            className={buttonClass(editor.isActive("heading", { level: 1 }))}
            title="Heading 1"
          >
            <span className="text-xs font-bold">H1</span>
          </button>

          <button
            type="button"
            onClick={() => applyHeading(2)}
            className={buttonClass(editor.isActive("heading", { level: 2 }))}
            title="Heading 2"
          >
            <span className="text-xs font-bold">H2</span>
          </button>

          <button
            type="button"
            onClick={() => applyHeading(3)}
            className={buttonClass(editor.isActive("heading", { level: 3 }))}
            title="Heading 3"
          >
            <span className="text-xs font-bold">H3</span>
          </button>

          <button
            type="button"
            onClick={() => applyHeading(4)}
            className={buttonClass(editor.isActive("heading", { level: 4 }))}
            title="Heading 4"
          >
            <span className="text-xs font-bold">H4</span>
          </button>

          <button
            type="button"
            onClick={() => applyHeading(5)}
            className={buttonClass(editor.isActive("heading", { level: 5 }))}
            title="Heading 5"
          >
            <span className="text-xs font-bold">H5</span>
          </button>

          <button
            type="button"
            onClick={() => applyHeading(6)}
            className={buttonClass(editor.isActive("heading", { level: 6 }))}
            title="Heading 6"
          >
            <span className="text-xs font-bold">H6</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={buttonClass(editor.isActive("bulletList"))}
            title="Bullet List"
          >
            <i className="fas fa-list" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={buttonClass(editor.isActive("orderedList"))}
            title="Ordered List"
          >
            <i className="fas fa-list-ol" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={buttonClass(editor.isActive("codeBlock"))}
            title="Code Block"
          >
            <i className="fas fa-code" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={buttonClass(editor.isActive({ textAlign: "left" }))}
            title="Align Left"
          >
            <i className="fas fa-align-left" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={buttonClass(editor.isActive({ textAlign: "center" }))}
            title="Align Center"
          >
            <i className="fas fa-align-center" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={buttonClass(editor.isActive({ textAlign: "right" }))}
            title="Align Right"
          >
            <i className="fas fa-align-right" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={buttonClass(editor.isActive({ textAlign: "justify" }))}
            title="Justify"
          >
            <i className="fas fa-align-justify" />
          </button>

          {showLinkInput ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2">
              <input
                type="text"
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  }

                  if (event.key === "Escape") {
                    setShowLinkInput(false);
                    setLinkUrl("");
                    setOpenNewTab(false);
                  }
                }}
                placeholder="Enter URL"
                className="min-w-52 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                autoFocus
              />

              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={openNewTab}
                  onChange={(event) => setOpenNewTab(event.target.checked)}
                />
                <span>New tab</span>
              </label>

              <button
                type="button"
                onClick={applyLink}
                className="rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-black"
              >
                Add
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl("");
                  setOpenNewTab(false);
                }}
                className="rounded-md bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(true);
                  setLinkUrl("");
                  setOpenNewTab(false);
                }}
                className={buttonClass(editor.isActive("link"))}
                title="Add Link"
              >
                <i className="fas fa-link" />
              </button>

              <button
                type="button"
                onClick={() => editor.chain().focus().unsetLink().run()}
                disabled={!editor.isActive("link")}
                className={buttonClass(false)}
                title="Remove Link"
              >
                <i className="fas fa-link-slash" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className={buttonClass(false)}
            title="Undo"
          >
            <i className="fas fa-arrow-rotate-left" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className={buttonClass(false)}
            title="Redo"
          >
            <i className="fas fa-arrow-rotate-right" />
          </button>
        </div>

        <div style={{ minHeight }}>
          <EditorContent editor={editor} className={styles.editorWrapper} />
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {helperText || "Select only the text you want as a heading, or place the cursor in a single block before using H1-H6."}
      </p>
    </div>
  );
}

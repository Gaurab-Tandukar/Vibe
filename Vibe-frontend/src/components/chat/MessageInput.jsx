import { useEffect } from "react";
import { resolveMediaUrl } from "../../utils/MediaURL";

const formatFileSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_TEXTAREA_HEIGHT = 120;

export default function MessageInput({
  inputRef,
  fileInputRef,
  inputText,
  name,
  sending,
  uploading,
  uploadError,
  pendingAttachment,
  isBlocked,
  isBlockedByOther,
  isConversationBlocked,
  editingMessageId,
  editText,
  onInputChange,
  onFileChange,
  onPasteImage,
  onSend,
  onClearAttachment,
  onEditTextChange,
  onConfirmEdit,
  onCancelEdit,
}) {
  // Auto-grow the textarea as the user types, capped at MAX_TEXTAREA_HEIGHT.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [inputText, inputRef]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  };

  const handlePaste = (e) => {
    if (isConversationBlocked || uploading || Boolean(pendingAttachment)) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type && item.type.startsWith("image/")) {
        const blob = item.getAsFile();
        if (blob) {
          e.preventDefault();
          const ext = blob.type.split("/")[1] || "png";
          const file = new File(
            [blob],
            blob.name && blob.name !== "image.png"
              ? blob.name
              : `clipboard_image_${Date.now()}.${ext}`,
            { type: blob.type },
          );
          if (onPasteImage) {
            onPasteImage(file);
          }
          return;
        }
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (isConversationBlocked || uploading || Boolean(pendingAttachment)) return;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type && file.type.startsWith("image/")) {
        if (onPasteImage) {
          onPasteImage(file);
        }
      } else if (onFileChange) {
        onFileChange({ target: { files: [file] } });
      }
    }
  };

  return (
    <>
      {/* Edit Message Banner */}
      {editingMessageId && (
        <div className="px-3 py-2 border-top bg-light d-flex align-items-center gap-2 chat-edit-bar">
          <div className="flex-grow-1 d-flex flex-column overflow-hidden">
            <div className="small fw-semibold text-success mb-1 d-flex align-items-center gap-1">
              <i className="bi bi-pencil-fill" />
              Editing message
            </div>
            <input
              autoFocus
              type="text"
              className="form-control form-control-sm border-0 bg-white rounded-pill px-3"
              style={{ fontSize: "0.92rem" }}
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onConfirmEdit();
                }
                if (e.key === "Escape") onCancelEdit();
              }}
            />
          </div>
          <div className="d-flex gap-1 flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
              style={{ width: 30, height: 30 }}
              title="Cancel edit (Esc)"
              onClick={onCancelEdit}
            >
              <i className="bi bi-x" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-success rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: 30, height: 30 }}
              title="Save edit (Enter)"
              disabled={!editText.trim()}
              onClick={onConfirmEdit}
            >
              <i className="bi bi-check" />
            </button>
          </div>
        </div>
      )}

      {/* Pending Attachment / Upload State */}
      {(pendingAttachment || uploading || uploadError) && (
        <div className="px-3 py-2 border-top bg-light d-flex align-items-center justify-content-between">
          <div className="overflow-hidden small d-flex align-items-center gap-2">
            {uploading && (
              <span className="text-muted d-flex align-items-center gap-1">
                <span
                  className="spinner-border spinner-border-sm text-success"
                  role="status"
                  aria-hidden="true"
                />
                Uploading image...
              </span>
            )}
            {uploadError && <span className="text-danger">{uploadError}</span>}
            {pendingAttachment && !uploading && (
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                {pendingAttachment.fileType?.startsWith("image/") &&
                pendingAttachment.fileUrl ? (
                  <img
                    src={resolveMediaUrl(pendingAttachment.fileUrl)}
                    alt={pendingAttachment.fileName}
                    className="rounded border flex-shrink-0"
                    style={{ width: 34, height: 34, objectFit: "cover" }}
                  />
                ) : (
                  <i className="bi bi-image text-success fs-5 flex-shrink-0" />
                )}
                <span className="text-success fw-semibold text-truncate">
                  {pendingAttachment.fileName} (
                  {formatFileSize(pendingAttachment.fileSize)})
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle"
            style={{ width: 26, height: 26 }}
            onClick={onClearAttachment}
            title="Remove attachment"
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={onSend}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="p-2 border-top bg-white d-flex align-items-end gap-2 flex-shrink-0"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          onChange={onFileChange}
          accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
        />

        <button
          type="button"
          className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-secondary border flex-shrink-0"
          style={{ width: 38, height: 38 }}
          title="Attach file or paste image"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            uploading || Boolean(pendingAttachment) || isConversationBlocked
          }
        >
          <i className="bi bi-plus-lg" />
        </button>

        <div className="input-group flex-grow-1">
          <textarea
            ref={inputRef}
            rows={1}
            className="form-control border-0 bg-light rounded-4 px-3 py-2"
            style={{
              fontSize: "0.95rem",
              resize: "none",
              maxHeight: MAX_TEXTAREA_HEIGHT,
              overflowY: "auto",
            }}
            placeholder={
              isBlocked
                ? "You blocked this user"
                : isBlockedByOther
                  ? "This user blocked you"
                  : `Message ${name || ""}`
            }
            value={inputText}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={sending || isConversationBlocked}
          />
        </div>

        <button
          type="submit"
          className="btn btn-success btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
          style={{ width: 38, height: 38 }}
          disabled={
            (!inputText.trim() && !pendingAttachment) ||
            sending ||
            uploading ||
            isConversationBlocked
          }
          title="Send message"
        >
          {sending ? (
            <span
              className="spinner-border spinner-border-sm text-white"
              role="status"
              aria-hidden="true"
              style={{ width: "0.85rem", height: "0.85rem" }}
            />
          ) : (
            <i
              className="bi bi-send-fill text-white"
              style={{ fontSize: "0.9rem" }}
            />
          )}
        </button>
      </form>
    </>
  );
}

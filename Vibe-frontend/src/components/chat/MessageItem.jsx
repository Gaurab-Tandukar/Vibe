import Avatar from "./Avatar";
import { resolveMediaUrl } from "../../utils/MediaURL";

const QUICK_EMOJIS = ["👍🏿", "🤣", "😮", "😢", "💀", "🤬"];

const formatFileSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MessageItem({
  msg,
  isMe,
  isLatest,
  isTopMessage,
  showAvatar,
  editingMessageId,
  openPickerFor,
  isConversationBlocked,
  isRecipientOnline,
  currentUserId,
  onDoubleClick,
  onStartEdit,
  onDeletePrompt,
  onStartReply,
  onReact,
  onTogglePicker,
  onScrollToMessage,
  onRetrySend,
  onImageClick,
}) {
  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const isSending = msg.sendStatus === "sending";
  const isFailed = msg.sendStatus === "failed";

  const isSeen =
    Array.isArray(msg.readBy) &&
    msg.readBy.some((id) => {
      const uid = typeof id === "object" ? id?._id || id?.id : id;
      return uid && String(uid) !== String(currentUserId);
    });

  const reactionSummary = (() => {
    if (!msg.reactions?.length) return [];
    const map = new Map();
    msg.reactions.forEach((r) => {
      const entry = map.get(r.emoji) || { emoji: r.emoji, count: 0 };
      entry.count += 1;
      map.set(r.emoji, entry);
    });
    return Array.from(map.values());
  })();

  // System and call messages rendered as centered badges
  const isSystemOrCall =
    msg.type === "system" ||
    (typeof msg.content === "string" &&
      (msg.content.includes("📞") ||
        msg.content.includes("📹") ||
        msg.content.toLowerCase().includes("call")));

  if (isSystemOrCall && !msg.isDeleted) {
    const isVideo =
      msg.content?.includes("📹") ||
      msg.content?.toLowerCase().includes("video");
    const isMissed =
      msg.content?.toLowerCase().includes("missed") ||
      msg.content?.toLowerCase().includes("declined");

    let cleanContent = msg.content
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
      .trim();

    if (!cleanContent) {
      cleanContent = isVideo
        ? isMissed
          ? "Missed Video Call"
          : "Video Call"
        : isMissed
          ? "Missed Voice Call"
          : "Voice Call";
    }

    return (
      <div id={`msg-${msg._id}`} className="d-flex justify-content-center my-2">
        <div
          className="d-inline-flex align-items-center gap-3 px-3 py-2 rounded-pill shadow-sm border"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(6px)",
            fontSize: "0.82rem",
            borderColor: "rgba(0, 0, 0, 0.08) !important",
          }}
        >
          <span
            className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
              isMissed
                ? "bg-danger bg-opacity-10 text-danger"
                : "bg-success bg-opacity-10 text-success"
            }`}
            style={{ width: "20px", height: "20px" }}
          >
            <i
              className={`bi ${
                isVideo
                  ? isMissed
                    ? "bi-camera-video-off"
                    : "bi-camera-video-fill"
                  : isMissed
                    ? "bi-telephone-x-fill"
                    : "bi-telephone-fill"
              }`}
              style={{ fontSize: "0.68rem" }}
            />
          </span>
          <span
            className="fw-semibold text-secondary"
            style={{ letterSpacing: "-0.01em" }}
          >
            {cleanContent}
          </span>
          <span
            className="text-muted ms-1"
            style={{ fontSize: "0.68rem", opacity: 0.75 }}
          >
            {time}
          </span>
        </div>
      </div>
    );
  }

  const renderAttachment = (att) => {
    const isImage = att.fileType?.startsWith("image/");
    const isVideo = att.fileType?.startsWith("video/");
    const fullUrl = resolveMediaUrl(att.fileUrl);

    if (isImage) {
      return (
        <button
          type="button"
          className="d-block mb-1 p-0 border-0 bg-transparent"
          onClick={() => onImageClick && onImageClick(fullUrl, att.fileName || "Image")}
          title="Click to view full image"
        >
          <img
            src={fullUrl}
            alt={att.fileName || "attachment"}
            className="rounded-3 shadow-sm chat-image-thumb"
            style={{ maxWidth: 220, maxHeight: 180, objectFit: "cover", display: "block" }}
          />
        </button>
      );
    }

    if (isVideo) {
      return (
        <video
          src={fullUrl}
          controls
          className="rounded-3 mb-1"
          style={{ maxWidth: 240, maxHeight: 180 }}
        />
      );
    }

    return (
      <a
        href={fullUrl}
        download={att.fileName}
        className={`d-flex align-items-center gap-2 p-2 rounded-3 text-decoration-none mb-1 ${
          isMe ? "bg-white bg-opacity-25 text-white" : "bg-light text-dark"
        }`}
        style={{ maxWidth: 240 }}
      >
        <i className="bi bi-file-earmark-arrow-down fs-5" />
        <div className="overflow-hidden">
          <div
            className="text-truncate small fw-semibold"
            style={{ maxWidth: 180 }}
          >
            {att.fileName}
          </div>
          <div className="small opacity-75">{formatFileSize(att.fileSize)}</div>
        </div>
      </a>
    );
  };

  return (
    <div
      id={`msg-${msg._id}`}
      className={`d-flex flex-column chat-bubble-row ${
        isMe ? "align-items-end" : "align-items-start"
      }`}
    >
      <div
        className="d-flex align-items-end gap-2 position-relative"
        style={{ maxWidth: "70%" }}
      >
        {/* Sender Actions (left side of bubble) */}
        {isMe && !msg.isDeleted && !isSending && !isFailed && (
          <div className="chat-bubble-actions d-flex gap-1 order-0 mb-2">
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
              style={{ width: 28, height: 28, fontSize: "0.75rem" }}
              title="Edit"
              onClick={() => onStartEdit(msg)}
            >
              <i className="bi bi-pencil" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
              style={{ width: 28, height: 28, fontSize: "0.75rem" }}
              title="Delete"
              onClick={() => onDeletePrompt(msg._id)}
            >
              <i className="bi bi-trash" />
            </button>
          </div>
        )}

        {!isMe && (
          <div className="order-first mb-0">
            <Avatar sender={msg.sender} show={showAvatar} />
          </div>
        )}

        <div
          onDoubleClick={() => !isSending && !isFailed && onDoubleClick(msg)}
          className={`position-relative px-3 py-2 rounded-4 shadow-sm chat-bubble-animated ${
            isLatest ? "chat-bubble-latest" : ""
          } ${editingMessageId === msg._id ? "chat-bubble-editing" : ""} ${
            msg.isDeleted
              ? "bg-light text-secondary border border-dashed"
              : isMe
                ? "bg-success text-white chat-bubble-me"
                : "bg-white text-dark chat-bubble-other"
          }`}
          style={{
            wordBreak: "break-word",
            borderBottomRightRadius: isMe ? 4 : undefined,
            borderBottomLeftRadius: !isMe ? 4 : undefined,
            marginBottom: reactionSummary.length > 0 ? 10 : 0,
            cursor: msg.isDeleted ? "default" : "pointer",
            opacity: isSending ? 0.6 : isFailed ? 0.75 : 1,
          }}
        >
          {openPickerFor === msg._id && (
            <div
              className={`reaction-picker ${
                isTopMessage ? "reaction-picker-bottom" : "reaction-picker-top"
              }`}
              style={isMe ? { right: 0 } : { left: 0 }}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="btn btn-sm p-0 border-0"
                  style={{ fontSize: "1.2rem", lineHeight: 1 }}
                  onClick={() => onReact(msg._id, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {!msg.isDeleted && msg.replyTo && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onScrollToMessage(msg.replyTo._id);
              }}
              className={`mb-2 px-2 py-1 rounded-2 small reply-preview-clickable ${
                isMe ? "--sage-bg bg-opacity-15" : "bg-light"
              }`}
              style={{
                opacity: 0.9,
                borderLeft: "3px solid currentColor",
              }}
            >
              <div className="fw-bold" style={{ fontSize: "0.72rem" }}>
                {msg.replyTo.sender?.username || "Unknown"}
              </div>
              <div className="text-truncate" style={{ fontSize: "0.78rem" }}>
                {msg.replyTo.isDeleted
                  ? "This message was deleted"
                  : msg.replyTo.content}
              </div>
            </div>
          )}

          {!msg.isDeleted &&
            msg.attachments?.map((att) => (
              <div key={att._id || att.fileUrl}>{renderAttachment(att)}</div>
            ))}

          <p
            className="mb-0"
            style={{
              fontSize: "0.95rem",
              lineHeight: "1.4",
              fontStyle: msg.isDeleted ? "italic" : "normal",
              whiteSpace: msg.isDeleted ? "normal" : "pre-wrap",
            }}
          >
            {msg.isDeleted ? (
              <span className="d-flex align-items-center gap-1 opacity-75">
                <i className="bi bi-slash-circle" /> Message deleted
              </span>
            ) : (
              msg.content
            )}
          </p>

          {reactionSummary.length > 0 && !msg.isDeleted && (
            <div
              className="instagram-reaction-badge reaction-picker-btn"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePicker(msg._id);
              }}
            >
              {reactionSummary.map(({ emoji }) => (
                <span key={emoji}>{emoji}</span>
              ))}
              {reactionSummary.reduce((acc, r) => acc + r.count, 0) > 1 && (
                <span
                  className="text-muted fw-semibold ms-1"
                  style={{ fontSize: "0.7rem" }}
                >
                  {reactionSummary.reduce((acc, r) => acc + r.count, 0)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Recipient Actions (right side of bubble) */}
        {!msg.isDeleted && !isMe && (
          <div className="chat-bubble-actions d-flex gap-1 mb-2 order-1">
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary reaction-picker-btn"
              style={{ width: 28, height: 28, fontSize: "0.75rem" }}
              title="React"
              disabled={isConversationBlocked}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePicker(msg._id);
              }}
            >
              <i className="bi bi-emoji-smile" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
              style={{ width: 28, height: 28, fontSize: "0.75rem" }}
              title="Reply"
              disabled={isConversationBlocked}
              onClick={() => onStartReply(msg)}
            >
              <i className="bi bi-reply" />
            </button>
          </div>
        )}
      </div>

      <div
        className="mt-1 d-flex align-items-center gap-1 text-muted"
        style={{
          fontSize: "0.68rem",
          paddingLeft: !isMe ? "40px" : undefined,
          paddingRight: !isMe ? undefined : "4px",
          alignSelf: isMe ? "flex-end" : "flex-start",
        }}
      >
        {isFailed ? (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 text-danger d-inline-flex align-items-center gap-1"
            style={{ fontSize: "0.68rem", textDecoration: "none" }}
            onClick={() => onRetrySend?.(msg)}
          >
            <i className="bi bi-exclamation-circle-fill" />
            Failed to send · Tap to retry
          </button>
        ) : (
          <>
            <span>{time}</span>
            {msg.isEdited && !msg.isDeleted && <span>· edited</span>}

            {isMe && !msg.isDeleted && (
              <span
                className="d-inline-flex align-items-center ms-0.5"
                title={
                  isSending
                    ? "Sending..."
                    : isSeen
                      ? "Seen"
                      : isRecipientOnline
                        ? "Delivered"
                        : "Sent"
                }
              >
                {isSending ? (
                  <i
                    className="bi bi-clock text-secondary"
                    style={{ fontSize: "0.82rem", lineHeight: 1, opacity: 0.7 }}
                  />
                ) : isSeen ? (
                  <i
                    className="bi bi-check2-all"
                    style={{
                      color: "#38d39f",
                      fontSize: "0.92rem",
                      lineHeight: 1,
                      fontWeight: "bold",
                    }}
                  />
                ) : isRecipientOnline ? (
                  <i
                    className="bi bi-check2-all text-secondary"
                    style={{
                      fontSize: "0.92rem",
                      lineHeight: 1,
                      opacity: 0.85,
                    }}
                  />
                ) : (
                  <i
                    className="bi bi-check2 text-secondary"
                    style={{
                      fontSize: "0.88rem",
                      lineHeight: 1,
                      opacity: 0.75,
                    }}
                  />
                )}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

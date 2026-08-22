import { resolveMediaUrl } from "../../utils/MediaURL";
import { getDMRecipient } from "./Sidebarhelpers";
import StatusDot from "../../pages/profile/component/StatusDot";

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

export default function ConversationItem({
  chat,
  currentUserId,
  activeChatId,
  getUserStatus,
  onSelectChat,
  onToggleReadStatus,
  onTogglePin,
  onToggleMute,
  onHideChat,
  onDragStart,
}) {
  const isGroup = chat.isGroup;
  const isSelected = String(chat._id) === String(activeChatId);

  const isPinned = chat.pinnedBy?.includes(currentUserId);
  const isMuted = chat.mutedBy?.includes(currentUserId);
  const isUnread = chat.unreadBy?.includes(currentUserId);

  let name = "";
  let avatar = null;
  let recipient = null;
  let status = "offline";

  if (isGroup) {
    name = chat.name || "Group Chat";
    avatar = chat.avatarUrl ? resolveMediaUrl(chat.avatarUrl) : null;
  } else {
    recipient = getDMRecipient(chat, currentUserId);
    name =
      recipient?.firstName && recipient?.lastName
        ? `${recipient.firstName} ${recipient.lastName}`
        : recipient?.username || "Unknown";
    avatar = recipient?.avatarUrl ? resolveMediaUrl(recipient.avatarUrl) : null;
    status = getUserStatus(recipient?._id);
  }

  // Shared payload for both click and drag
  const buildChatPayload = () => ({
    id: chat._id,
    _id: chat._id,
    name,
    avatarUrl: isGroup ? chat.avatarUrl : recipient?.avatarUrl,
    recipientId: isGroup ? undefined : recipient?._id,
    recipientUsername: isGroup ? undefined : recipient?.username,
    isGroup,
    isPinned,
    isMuted,
    isBlocked: chat.blockedBy?.includes(currentUserId),
    isBlockedByOther:
      Array.isArray(chat.blockedBy) &&
      recipient?._id &&
      chat.blockedBy.some((id) => String(id) === String(recipient._id)),
  });

  const handleClick = () => {
    if (isUnread) onToggleReadStatus(null, chat._id, true);
    if (onSelectChat) {
      onSelectChat(buildChatPayload());
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        // Pass the enriched object (same as click)
        onDragStart(e, name, avatar, buildChatPayload());
      }}
      className={`sidebar-chat-item d-flex align-items-center gap-2 p-2 rounded-3 text-start position-relative w-100 ${
        isSelected ? "active" : ""
      } ${isUnread ? "sidebar-chat-item-unread" : ""}`}
      style={{ cursor: "pointer" }}
      onClick={handleClick}
    >
      {/* Avatar Container */}
      <span
        className="position-relative flex-shrink-0 me-2"
        style={{ width: "44px", height: "44px" }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-100 h-100 rounded-circle"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <span
            className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{
              backgroundColor: isGroup
                ? "var(--sbd-surface, #35373c)"
                : "var(--sbd-accent, #52c98a)",
            }}
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        {!isGroup && <StatusDot status={status} />}
      </span>

      {/* Name & Preview */}
      <div className="d-flex flex-column overflow-hidden flex-grow-1 me-1">
        <div className="d-flex align-items-center gap-1">
          <span
            className={`text-truncate ${isUnread ? "fw-bold" : ""}`}
            style={{ color: "var(--sbd-text)", fontSize: "0.95rem" }}
          >
            {name}
          </span>
          {isPinned && (
            <i
              className="bi bi-pin-angle-fill sidebar-status-badge ms-1"
              title="Pinned"
            />
          )}
        </div>
        <span
          className="text-truncate small"
          style={{ color: "var(--sbd-muted)", fontSize: "0.78rem" }}
        >
          {isGroup
            ? `${chat.participants?.length || 0} members`
            : statusLabels[status] || "Offline"}
        </span>
      </div>

      {/* Right Muted / Unread Badges */}
      <div className="d-flex align-items-center gap-1 me-1 flex-shrink-0">
        {isMuted && (
          <i
            className="bi bi-bell-slash-fill sidebar-status-badge"
            title="Muted"
          />
        )}
        {isUnread && <span className="unread-dot" title="Unread" />}
      </div>

      {/* Options Dropdown Menu */}
      <div className="dropdown flex-shrink-0 ms-auto">
        <button
          className="btn btn-sm p-0 border-0 chat-options-btn"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          onClick={(e) => e.stopPropagation()}
          style={{ fontSize: "1.1rem" }}
        >
          <i className="bi bi-three-dots" />
        </button>

        <ul className="dropdown-menu dropdown-menu-end sidebar-context-menu shadow">
          <li>
            <button
              className="dropdown-item"
              onClick={(e) => onToggleReadStatus(e, chat._id, isUnread)}
            >
              <span>{isUnread ? "Mark as read" : "Mark as unread"}</span>
              <i
                className={`bi ${
                  isUnread ? "bi-envelope-open" : "bi-envelope-plus"
                }`}
              />
            </button>
          </li>
          <li>
            <button
              className="dropdown-item"
              onClick={(e) => onTogglePin(e, chat._id)}
            >
              <span>{isPinned ? "Unpin" : "Pin"}</span>
              <i
                className={`bi ${
                  isPinned ? "bi-pin-angle" : "bi-pin-angle-fill"
                }`}
              />
            </button>
          </li>
          <li>
            <button
              className="dropdown-item"
              onClick={(e) => onToggleMute(e, chat._id)}
            >
              <span>{isMuted ? "Unmute" : "Mute"}</span>
              <i className={`bi ${isMuted ? "bi-bell" : "bi-bell-slash"}`} />
            </button>
          </li>
          <li>
            <button
              className="dropdown-item text-danger"
              onClick={(e) => onHideChat(e, chat._id)}
            >
              <span>Delete</span>
              <i className="bi bi-trash" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

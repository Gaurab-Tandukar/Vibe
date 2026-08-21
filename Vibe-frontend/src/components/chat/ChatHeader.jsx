import Avatar from "./Avatar";

export default function ChatHeader({
  name,
  avatarUrl,
  isGroup,
  recipientId,
  isRecipientOnline,
  statusText,
  typingUsers,
  call,
  isConversationBlocked,
  showInfoDropdown,
  setShowInfoDropdown,
  isBlocked,
  onStartCall,
  onOpenGroupInfo,
  onViewProfile,
  onToggleBlock,
}) {
  const typingEntries = Array.from(typingUsers.values());

  return (
    <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0 bg-white">
      <div className="d-flex align-items-center gap-2 overflow-hidden">
        {/* Mobile-only back button — returns to the conversation list */}
        <button
          type="button"
          className="btn btn-sm btn-light border rounded-circle p-0 d-flex d-lg-none align-items-center justify-content-center text-secondary shadow-sm flex-shrink-0"
          style={{ width: 34, height: 34 }}
          title="Back to conversations"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new Event("vibe:open-sidebar"));
          }}
        >
          <i
            className="bi bi-arrow-left d-flex align-items-center justify-content-center"
            style={{ fontSize: "0.95rem", lineHeight: 1 }}
          />
        </button>

        <div
          className="d-flex align-items-center gap-2 overflow-hidden"
          style={{ cursor: isGroup ? "default" : "pointer" }}
          onClick={onViewProfile}
          title={isGroup ? undefined : "View profile"}
        >
          <Avatar
            sender={{ username: name, avatarUrl }}
            size={40}
            fallbackBg={isGroup ? "bg-primary" : "bg-success"}
          />
          <div className="d-flex flex-column overflow-hidden">
            <span
              className="fw-semibold text-truncate mb-0"
              style={{ fontSize: "0.95rem" }}
            >
              {name}
            </span>
            <span
              className="text-muted small d-flex align-items-center gap-1"
              style={{ fontSize: "0.72rem" }}
            >
              {typingUsers.size > 0 ? (
                `${typingEntries.map((t) => t.username).join(", ")} typing...`
              ) : statusText ? (
                <>
                  <span
                    className="rounded-circle d-inline-block flex-shrink-0"
                    style={{
                      width: 7,
                      height: 7,
                      backgroundColor: isRecipientOnline ? "#2ecc71" : "#adb5bd",
                    }}
                  />
                  {statusText}
                </>
              ) : null}
            </span>
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        {!isGroup && recipientId && (
          <div className="chat-header-actions d-flex align-items-center gap-1">
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary shadow-sm"
              style={{ width: 34, height: 34 }}
              title={isRecipientOnline ? "Audio call" : "User is offline"}
              disabled={call.status !== "idle" || isConversationBlocked}
              onClick={() => onStartCall("audio")}
            >
              <i
                className="bi bi-telephone-fill d-flex align-items-center justify-content-center"
                style={{ fontSize: "0.85rem", lineHeight: 1 }}
              />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary shadow-sm"
              style={{ width: 34, height: 34 }}
              title={isRecipientOnline ? "Video call" : "User is offline"}
              disabled={call.status !== "idle" || isConversationBlocked}
              onClick={() => onStartCall("video")}
            >
              <i
                className="bi bi-camera-video-fill d-flex align-items-center justify-content-center"
                style={{ fontSize: "0.85rem", lineHeight: 1 }}
              />
            </button>
          </div>
        )}

        {isGroup ? (
          <button
            type="button"
            className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary shadow-sm"
            style={{ width: 34, height: 34 }}
            title="Group members & info"
            onClick={onOpenGroupInfo}
          >
            <i className="bi bi-people-fill" style={{ fontSize: "0.95rem" }} />
          </button>
        ) : (
          <div className="position-relative">
            <button
              type="button"
              className={`btn btn-sm ${
                showInfoDropdown ? "btn-secondary text-white" : "btn-light text-secondary"
              } border rounded-circle p-0 d-flex align-items-center justify-content-center shadow-sm custom-chat-dropdown-btn`}
              style={{ width: 34, height: 34 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoDropdown((prev) => !prev);
              }}
              title="Conversation options"
            >
              <i className="bi bi-three-dots-vertical" style={{ fontSize: "0.95rem" }} />
            </button>

            {showInfoDropdown && (
              <div
                className="custom-chat-dropdown shadow-lg rounded-4 p-1 position-absolute end-0 mt-2 bg-white border"
                style={{ minWidth: 180, zIndex: 1000 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="dropdown-item d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-dark small"
                  onClick={() => {
                    setShowInfoDropdown(false);
                    onViewProfile();
                  }}
                >
                  <span>View profile</span>
                  <i className="bi bi-person text-muted ms-2" />
                </button>
                <div className="dropdown-divider my-1" />
                <button
                  type="button"
                  className={`dropdown-item d-flex align-items-center justify-content-between px-3 py-2 rounded-3 small ${
                    isBlocked ? "text-success" : "text-danger"
                  }`}
                  onClick={() => {
                    setShowInfoDropdown(false);
                    onToggleBlock();
                  }}
                >
                  <span>{isBlocked ? "Unblock user" : "Block user"}</span>
                  <i className="bi bi-slash-circle ms-2" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
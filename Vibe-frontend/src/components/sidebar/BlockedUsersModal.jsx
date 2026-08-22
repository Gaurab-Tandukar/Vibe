import { resolveMediaUrl } from "../../utils/MediaURL";
import { getUserDisplayName } from "./Sidebarhelpers";

export default function BlockedUsersModal({
  show,
  onClose,
  blockedUsers,
  loading,
  error,
  onUnblock,
}) {
  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content text-white"
          style={{
            backgroundColor: "var(--sbd-panel)",
            border: "1px solid var(--sbd-border)",
            borderRadius: "16px",
          }}
        >
          <div
            className="modal-header px-4 py-3"
            style={{ borderBottom: "1px solid var(--sbd-border)" }}
          >
            <h5 className="modal-title fs-6 fw-bold">Blocked Users</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Close"
              onClick={onClose}
            />
          </div>

          <div className="modal-body p-4" style={{ maxHeight: "360px", overflowY: "auto" }}>
            {loading ? (
              <div className="text-center py-4">
                <span className="spinner-border spinner-border-sm text-secondary" />
              </div>
            ) : error ? (
              <div className="alert alert-danger py-2 px-3 small">{error}</div>
            ) : blockedUsers.length === 0 ? (
              <p className="text-center text-muted small my-3">No blocked users</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {blockedUsers.map((entry) => {
                  const targetUser = entry?.user;
                  const name = targetUser ? getUserDisplayName(targetUser) : "User";
                  const avatar = targetUser?.avatarUrl ? resolveMediaUrl(targetUser.avatarUrl) : null;

                  return (
                    <div
                      key={entry.conversationId || targetUser?._id}
                      className="d-flex align-items-center justify-content-between p-2 rounded-3"
                      style={{ backgroundColor: "var(--sbd-rail)" }}
                    >
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <span
                          className="rounded-circle overflow-hidden flex-shrink-0 d-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: 36,
                            height: 36,
                            backgroundColor: "var(--sbd-accent)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={name}
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <div className="d-flex flex-column overflow-hidden">
                          <span className="fw-semibold text-truncate small text-white">
                            {name}
                          </span>
                          <span className="text-muted extra-small">
                            @{targetUser?.username || "user"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-light rounded-pill px-3"
                        style={{ fontSize: "0.78rem" }}
                        onClick={() => onUnblock(entry.conversationId, targetUser)}
                      >
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

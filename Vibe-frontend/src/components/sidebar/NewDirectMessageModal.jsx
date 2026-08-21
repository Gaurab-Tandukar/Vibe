import { useMemo, useState } from "react";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { createConversation } from "../../api/conversationService";
import { getUserDisplayName } from "./Sidebarhelpers";

const NewDirectMessageModal = ({ show, onClose, allUsers, onCreated }) => {
  const [query, setQuery] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return allUsers;

    return allUsers.filter((u) => {
      const username = (u.username || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const fullName = getUserDisplayName(u).toLowerCase();
      return (
        username.includes(trimmed) ||
        email.includes(trimmed) ||
        fullName.includes(trimmed)
      );
    });
  }, [allUsers, query]);

  if (!show) return null;

  const handleClose = () => {
    setQuery("");
    setError("");
    onClose();
  };

  const handlePick = async (targetUser) => {
    setError("");
    setSubmittingId(targetUser._id);
    try {
      const conv = await createConversation({
        isGroup: false,
        members: [targetUser._id],
      });
      onCreated(conv, targetUser);
      handleClose();
    } catch (err) {
      console.error("Failed to start DM:", err);
      setError("Couldn't start that conversation. Try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 rounded-4 shadow-lg overflow-hidden"
          style={{
            backgroundColor: "var(--sbd-panel, #1e1f22)",
            border: "1px solid var(--sbd-border, #333)",
          }}
        >
          <div
            className="modal-header px-4 pt-4 pb-2"
            style={{ borderBottom: "1px solid var(--sbd-border, #2b2d31)" }}
          >
            <div className="d-flex align-items-center gap-2">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: "rgba(82, 201, 138, 0.15)",
                  color: "var(--sbd-accent, #52c98a)",
                }}
              >
                <i className="bi bi-chat-dots-fill" style={{ fontSize: "0.9rem" }} />
              </div>
              <h6 className="modal-title fw-semibold mb-0" style={{ color: "var(--sbd-text, #f1f5f9)" }}>
                Start a New Direct Message
              </h6>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="input-group input-group-sm sidebar-search mb-3 rounded-pill overflow-hidden border">
              <span className="input-group-text border-0 bg-transparent text-muted ps-3">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 bg-transparent ps-2 py-2"
                style={{ color: "var(--sbd-text, #f1f5f9)", fontSize: "0.9rem" }}
                placeholder="Search by name, @username, or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  className="btn btn-sm text-muted pe-3 border-0 bg-transparent"
                  onClick={() => setQuery("")}
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                {error}
              </div>
            )}

            <style>{`
              .sidebar-modal-scroll {
                scrollbar-width: thin;
                scrollbar-color: var(--sbd-border, #333) transparent;
              }
              .sidebar-modal-scroll::-webkit-scrollbar {
                width: 5px;
              }
              .sidebar-modal-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .sidebar-modal-scroll::-webkit-scrollbar-thumb {
                background-color: var(--sbd-border, #333);
                border-radius: 3px;
              }
              .sidebar-modal-scroll::-webkit-scrollbar-thumb:hover {
                background-color: var(--sbd-muted, #777);
              }
            `}</style>

            <div
              className="sidebar-modal-scroll d-flex flex-column gap-1"
              style={{ maxHeight: "320px", overflowY: "auto" }}
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-people fs-3 d-block mb-2 opacity-50" />
                  No users found matching &quot;{query}&quot;
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const name = getUserDisplayName(u);
                  const avatar = resolveMediaUrl(u.avatarUrl);
                  const isSubmitting = submittingId === u._id;

                  return (
                    <button
                      key={u._id}
                      type="button"
                      className="sidebar-chat-item btn text-start d-flex align-items-center gap-3 rounded-3 px-3 py-2.5 w-100 border-0"
                      onClick={() => handlePick(u)}
                      disabled={submittingId !== null}
                      style={{ transition: "all 0.15s ease" }}
                    >
                      <span
                        className="position-relative flex-shrink-0 rounded-circle overflow-hidden d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "40px", height: "40px" }}
                      >
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={name}
                            className="w-100 h-100"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <span
                            className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white"
                            style={{
                              backgroundColor: "var(--sbd-accent, #52c98a)",
                              fontSize: "1rem",
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span
                          className="position-absolute rounded-circle"
                          style={{
                            width: "10px",
                            height: "10px",
                            bottom: "0px",
                            right: "0px",
                            border: "2px solid var(--sbd-panel, #1e1f22)",
                            backgroundColor:
                              u.status === "online"
                                ? "#22c55e"
                                : u.status === "away"
                                  ? "#eab308"
                                  : "#94a3b8",
                          }}
                        />
                      </span>

                      <div className="d-flex flex-column overflow-hidden flex-grow-1">
                        <span
                          className="text-truncate fw-semibold"
                          style={{ color: "var(--sbd-text, #f1f5f9)", fontSize: "0.92rem" }}
                        >
                          {name}
                        </span>
                        <span className="text-truncate extra-small text-muted">
                          {u.username ? `@${u.username}` : u.email}
                        </span>
                      </div>

                      {isSubmitting ? (
                        <span
                          className="spinner-border spinner-border-sm text-success flex-shrink-0"
                          role="status"
                        />
                      ) : (
                        <i className="bi bi-chat-plus text-muted flex-shrink-0 fs-5 opacity-50" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDirectMessageModal;

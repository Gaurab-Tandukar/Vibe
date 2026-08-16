import { useMemo, useState } from "react";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { createConversation } from "../api/conversationService";
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
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={handleClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content"
          style={{
            backgroundColor: "var(--sbd-panel)",
            border: "1px solid var(--sbd-border)",
          }}
        >
          <div
            className="modal-header"
            style={{ borderBottom: "1px solid var(--sbd-border)" }}
          >
            <h6 className="modal-title" style={{ color: "var(--sbd-text)" }}>
              New message
            </h6>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            <div className="input-group input-group-sm sidebar-search mb-2">
              <span className="input-group-text border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search people"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {error && <div className="text-danger small mb-2">{error}</div>}

            <style>{`
              .sidebar-modal-scroll {
                scrollbar-width: thin;
                scrollbar-color: var(--sbd-border) transparent;
              }
              .sidebar-modal-scroll::-webkit-scrollbar {
                width: 5px;
              }
              .sidebar-modal-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .sidebar-modal-scroll::-webkit-scrollbar-thumb {
                background-color: var(--sbd-border);
                border-radius: 3px;
              }
              .sidebar-modal-scroll::-webkit-scrollbar-thumb:hover {
                background-color: var(--sbd-muted);
              }
            `}</style>

            <div
              className="sidebar-modal-scroll"
              style={{ maxHeight: "320px", overflowY: "auto" }}
            >
              {filteredUsers.length === 0 ? (
                <div className="px-2 small text-muted py-2">No users found</div>
              ) : (
                filteredUsers.map((u) => {
                  const name = getUserDisplayName(u);
                  const avatar = resolveMediaUrl(u.avatarUrl);
                  const isSubmitting = submittingId === u._id;

                  return (
                    <button
                      key={u._id}
                      className="sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 w-100 mb-1"
                      onClick={() => handlePick(u)}
                      disabled={submittingId !== null}
                    >
                      <span
                        className="position-relative flex-shrink-0 rounded-circle overflow-hidden"
                        style={{ width: "36px", height: "36px" }}
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
                            style={{ backgroundColor: "var(--sbd-accent)" }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <div className="d-flex flex-column overflow-hidden flex-grow-1">
                        <span
                          className="text-truncate small"
                          style={{ color: "var(--sbd-text)" }}
                        >
                          {name}
                        </span>
                        <span className="text-truncate extra-small text-muted">
                          {u.username ? `@${u.username}` : u.email}
                        </span>
                      </div>
                      {isSubmitting && (
                        <span
                          className="spinner-border spinner-border-sm flex-shrink-0"
                          role="status"
                        ></span>
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

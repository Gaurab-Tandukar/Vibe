import { useMemo, useState } from "react";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { createConversation } from "../api/conversationService";
import { getUserDisplayName } from "./Sidebarhelpers";

const NewGroupModal = ({ show, onClose, allUsers, onCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
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

  const toggleUser = (userId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const resetAndClose = () => {
    setGroupName("");
    setQuery("");
    setSelectedIds(new Set());
    setError("");
    onClose();
  };

  const handleCreate = async () => {
    setError("");

    if (!groupName.trim()) {
      setError("Give the group a name.");
      return;
    }
    if (selectedIds.size === 0) {
      setError("Pick at least one person to add.");
      return;
    }

    setSubmitting(true);
    try {
      const conv = await createConversation({
        isGroup: true,
        name: groupName.trim(),
        members: Array.from(selectedIds),
      });
      onCreated(conv);
      resetAndClose();
    } catch (err) {
      console.error("Failed to create group:", err);
      setError("Couldn't create the group. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={resetAndClose}
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
              New group
            </h6>
            <button
              type="button"
              className="btn-close"
              onClick={resetAndClose}
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body">
            <input
              type="text"
              className="form-control form-control-sm mb-2"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />

            <div className="input-group input-group-sm sidebar-search mb-2">
              <span className="input-group-text border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search people to add"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {selectedIds.size > 0 && (
              <div className="small text-muted mb-2">
                {selectedIds.size} selected
              </div>
            )}

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
              style={{ maxHeight: "280px", overflowY: "auto" }}
            >
              {filteredUsers.length === 0 ? (
                <div className="px-2 small text-muted py-2">No users found</div>
              ) : (
                filteredUsers.map((u) => {
                  const name = getUserDisplayName(u);
                  const avatar = resolveMediaUrl(u.avatarUrl);
                  const isSelected = selectedIds.has(u._id);

                  return (
                    <button
                      key={u._id}
                      type="button"
                      className={`sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 w-100 mb-1 ${
                        isSelected ? "active" : ""
                      }`}
                      onClick={() => toggleUser(u._id)}
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
                      <i
                        className={`bi ${
                          isSelected ? "bi-check-circle-fill" : "bi-circle"
                        } flex-shrink-0`}
                        style={{
                          color: isSelected
                            ? "var(--sbd-accent)"
                            : "var(--sbd-muted)",
                        }}
                      ></i>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div
            className="modal-footer"
            style={{ borderTop: "1px solid var(--sbd-border)" }}
          >
            <button
              type="button"
              className="btn btn-sm sidebar-ghost-btn"
              onClick={resetAndClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;

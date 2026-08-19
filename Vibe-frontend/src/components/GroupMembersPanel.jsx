import { useEffect, useMemo, useState } from "react";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  getGroupMembers,
  removeGroupMember,
  leaveGroup,
  renameGroup,
} from "../api/conversationService";
import { getUserDisplayName } from "./Sidebarhelpers";
import AddMemberModal from "./AddMemberModel";
import "./css/Sidebar.css";

const GroupMembersPanel = ({
  group,
  currentUserId,
  getUserStatus,
  allUsers,
  onGroupUpdated,
  onGroupLeft,
}) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [kickMode, setKickMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(group?.name || "");
  const [savingName, setSavingName] = useState(false);
  const [actionError, setActionError] = useState("");

  const groupId = group?._id;

  const loadMembers = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await getGroupMembers(groupId);
      setMembers(res?.members || []);
    } catch (err) {
      console.error(
        "Failed to load group members:",
        err?.response?.data || err,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMembers = async () => {
      if (!groupId) return;
      try {
        const res = await getGroupMembers(groupId);
        if (isMounted) {
          setMembers(res?.members || []);
        }
      } catch (err) {
        console.error(
          "Failed to load group members:",
          err?.response?.data || err,
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const myMembership = members.find(
    (m) => String(m.user?._id) === String(currentUserId),
  );
  const isAdmin = myMembership?.role === "admin";

  const memberIds = useMemo(
    () => new Set(members.map((m) => String(m.user?._id))),
    [members],
  );
  const addableUsers = useMemo(
    () => (allUsers || []).filter((u) => !memberIds.has(String(u._id))),
    [allUsers, memberIds],
  );

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = getUserDisplayName(m.user).toLowerCase();
      const username = (m.user?.username || "").toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [members, searchQuery]);

  const activeMembers = filteredMembers.filter(
    (m) => getUserStatus(m.user?._id) !== "offline",
  );
  const offlineMembers = filteredMembers.filter(
    (m) => getUserStatus(m.user?._id) === "offline",
  );

  const handleKick = async (userId) => {
    setActionError("");
    try {
      await removeGroupMember(groupId, userId);
      setMembers((prev) =>
        prev.filter((m) => String(m.user?._id) !== String(userId)),
      );
      if (onGroupUpdated) {
        onGroupUpdated({
          ...group,
          participants: (group.participants || []).filter(
            (p) => String(p._id || p) !== String(userId),
          ),
        });
      }
    } catch (err) {
      console.error("Failed to remove member:", err?.response?.data || err);
      setActionError(err?.response?.data?.message || "Couldn't remove member.");
    }
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${group?.name}"?`)) return;
    setActionError("");
    try {
      await leaveGroup(groupId);
      if (onGroupLeft) onGroupLeft(groupId);
    } catch (err) {
      console.error("Failed to leave group:", err?.response?.data || err);
      setActionError(err?.response?.data?.message || "Couldn't leave group.");
    }
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === group?.name) {
      setEditingName(false);
      setNameDraft(group?.name || "");
      return;
    }
    setSavingName(true);
    setActionError("");
    try {
      const updated = await renameGroup(groupId, trimmed);
      if (onGroupUpdated) onGroupUpdated({ ...group, name: updated.name });
      setEditingName(false);
    } catch (err) {
      console.error("Failed to rename group:", err?.response?.data || err);
      setActionError(err?.response?.data?.message || "Couldn't rename group.");
    } finally {
      setSavingName(false);
    }
  };

  const handleMembersAdded = async () => {
    setShowAddModal(false);
    await loadMembers();
  };

  const renderMemberRow = (m) => {
    const u = m.user;
    const name = getUserDisplayName(u);
    const avatar = resolveMediaUrl(u?.avatarUrl);
    const status = getUserStatus(u?._id);
    const rowIsAdmin = m.role === "admin";
    const isSelf = String(u?._id) === String(currentUserId);

    return (
      <div
        key={m._id || u?._id}
        className="d-flex align-items-center px-2 py-2 mb-1 group-member-row"
      >
        <span
          className="position-relative flex-shrink-0 me-2"
          style={{ width: "38px", height: "38px" }}
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
              style={{ backgroundColor: "var(--sbd-accent)" }}
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <span
            className="position-absolute rounded-circle"
            style={{
              width: "10px",
              height: "10px",
              bottom: "-1px",
              right: "-1px",
              border: "2px solid var(--sbd-panel)",
              backgroundColor:
                status === "online"
                  ? "#22c55e"
                  : status === "away"
                    ? "#eab308"
                    : "#94a3b8",
            }}
          ></span>
        </span>

        <div className="d-flex flex-column overflow-hidden flex-grow-1">
          <span
            className="text-truncate small fw-semibold"
            style={{
              color: rowIsAdmin ? "var(--sbd-accent)" : "var(--sbd-text)",
            }}
          >
            {name}
            {isSelf && <span className="text-muted fw-normal"> (you)</span>}
          </span>
          {rowIsAdmin && (
            <span
              className="text-truncate"
              style={{ fontSize: "0.7rem", color: "var(--sbd-accent)" }}
            >
              Admin
            </span>
          )}
        </div>

        {kickMode && isAdmin && !isSelf && (
          <button
            type="button"
            className="btn btn-sm p-0 border-0 flex-shrink-0"
            title={`Remove ${name}`}
            onClick={() => handleKick(u._id)}
            style={{ color: "#ff4d4f", fontSize: "1rem" }}
          >
            <i className="bi bi-person-dash-fill"></i>
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="px-3 pt-3 pb-2">
        <div className="d-flex align-items-center justify-content-between mb-1">
          {editingName ? (
            <div className="d-flex align-items-center gap-1 flex-grow-1 me-1">
              <input
                type="text"
                className="form-control form-control-sm"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                disabled={savingName}
              />
              <button
                type="button"
                className="btn btn-sm sidebar-ghost-btn p-1"
                onClick={handleSaveName}
                disabled={savingName}
                title="Save"
              >
                <i className="bi bi-check-lg"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm sidebar-ghost-btn p-1"
                onClick={() => {
                  setEditingName(false);
                  setNameDraft(group?.name || "");
                }}
                disabled={savingName}
                title="Cancel"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ) : (
            <h6
              className="mb-0 text-truncate"
              style={{ color: "var(--sbd-text)" }}
            >
              {group?.name}
            </h6>
          )}

          {isAdmin && !editingName && (
            <button
              type="button"
              className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: "26px", height: "26px" }}
              title="Edit group"
              onClick={() => setEditingName(true)}
            >
              <i className="bi bi-pencil" style={{ fontSize: "0.85rem" }}></i>
            </button>
          )}
        </div>

        <div className="input-group input-group-sm sidebar-search mb-2">
          <span className="input-group-text border-end-0">
            <i className="bi bi-search"></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0 ps-0"
            placeholder="Search members"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
            style={{ width: "28px", height: "28px" }}
            title="Add member"
            onClick={() => setShowAddModal(true)}
          >
            <i
              className="bi bi-person-plus"
              style={{ fontSize: "0.95rem" }}
            ></i>
          </button>

          {isAdmin && (
            <button
              type="button"
              className={`sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center ${
                kickMode ? "active" : ""
              }`}
              style={{
                width: "28px",
                height: "28px",
                color: kickMode ? "#ff4d4f" : undefined,
              }}
              title={kickMode ? "Done removing" : "Remove members"}
              onClick={() => setKickMode((k) => !k)}
            >
              <i
                className="bi bi-person-dash"
                style={{ fontSize: "0.95rem" }}
              ></i>
            </button>
          )}

          <button
            type="button"
            className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center ms-auto"
            style={{ width: "28px", height: "28px", color: "#ff4d4f" }}
            title="Leave group"
            onClick={handleLeave}
          >
            <i
              className="bi bi-box-arrow-right"
              style={{ fontSize: "0.95rem" }}
            ></i>
          </button>
        </div>

        {actionError && (
          <div className="text-danger small mt-2">{actionError}</div>
        )}
      </div>

      <div className="sidebar-chat-list flex-grow-1 overflow-auto px-2">
        {loading ? (
          <div className="text-center py-3 text-muted small">Loading...</div>
        ) : (
          <>
            <div
              className="small text-uppercase px-1 mb-1 mt-1"
              style={{
                color: "var(--sbd-muted)",
                fontSize: "0.7rem",
                letterSpacing: "0.05em",
              }}
            >
              Active — {activeMembers.length}
            </div>
            {activeMembers.length === 0 ? (
              <div className="small text-muted px-1 mb-2">No one active</div>
            ) : (
              activeMembers.map(renderMemberRow)
            )}

            <div
              className="small text-uppercase px-1 mb-1 mt-3"
              style={{
                color: "var(--sbd-muted)",
                fontSize: "0.7rem",
                letterSpacing: "0.05em",
              }}
            >
              Offline — {offlineMembers.length}
            </div>
            {offlineMembers.length === 0 ? (
              <div className="small text-muted px-1 mb-2">
                No offline members
              </div>
            ) : (
              offlineMembers.map(renderMemberRow)
            )}
          </>
        )}
      </div>

      <AddMemberModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        conversationId={groupId}
        candidateUsers={addableUsers}
        onAdded={handleMembersAdded}
      />
    </>
  );
};

export default GroupMembersPanel;

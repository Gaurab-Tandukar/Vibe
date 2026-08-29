import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/MediaURL";
import {
  getGroupMembers,
  removeGroupMember,
  leaveGroup,
} from "../../api/conversationService";
import { getUserDisplayName } from "./Sidebarhelpers";
import AddMemberModal from "../chat/AddMemberModal";
import EditGroupModal from "../chat/EditGroupModal";
import ConfirmModal from "../ui/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import "../css/Sidebar.css";

const GroupMembersPanel = ({
  group,
  currentUserId,
  getUserStatus,
  allUsers,
  onGroupUpdated,
  onGroupLeft,
}) => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // { type, title, message, payload }

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

  const [prevGroupId, setPrevGroupId] = useState(groupId);
  if (groupId !== prevGroupId) {
    setPrevGroupId(groupId);
    setSearchQuery("");
    setActionError("");
    setLoading(true);
    setMembers([]);
  }

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await getGroupMembers(groupId);
        if (!cancelled) {
          setMembers(res?.members || []);
        }
      } catch (err) {
        console.error(
          "Failed to load group members:",
          err?.response?.data || err,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
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

  const displayNameFor = (m) => m.nickname || getUserDisplayName(m.user);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = displayNameFor(m).toLowerCase();
      const realName = getUserDisplayName(m.user).toLowerCase();
      const username = (m.user?.username || "").toLowerCase();
      return name.includes(q) || realName.includes(q) || username.includes(q);
    });
  }, [members, searchQuery]);

  const activeMembers = filteredMembers.filter(
    (m) => getUserStatus(m.user?._id) !== "offline",
  );
  const offlineMembers = filteredMembers.filter(
    (m) => getUserStatus(m.user?._id) === "offline",
  );

  const handleKick = async (userId, memberName) => {
    setConfirmAction({
      type: "kick",
      title: "Remove Member?",
      message: `Remove ${memberName} from this group?`,
      payload: { userId },
    });
  };

  const handleLeave = async () => {
    setConfirmAction({
      type: "leave",
      title: "Leave Group?",
      message: `Are you sure you want to leave "${group?.name}"?`,
    });
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    setActionError("");

    if (confirmAction.type === "kick") {
      const { userId } = confirmAction.payload;
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
        showToast("Member removed from group", { type: "success" });
      } catch (err) {
        console.error("Failed to remove member:", err?.response?.data || err);
        const msg = err?.response?.data?.message || "Couldn't remove member.";
        setActionError(msg);
        showToast("Failed to remove member", {
          description: msg,
          type: "error",
        });
      }
    } else if (confirmAction.type === "leave") {
      try {
        await leaveGroup(groupId);
        showToast(`Left group "${group?.name || ""}"`, { type: "info" });
        if (onGroupLeft) onGroupLeft(groupId);
      } catch (err) {
        console.error("Failed to leave group:", err?.response?.data || err);
        const msg = err?.response?.data?.message || "Couldn't leave group.";
        setActionError(msg);
        showToast("Failed to leave group", { description: msg, type: "error" });
      }
    }

    setConfirmAction(null);
  };

  const handleMembersAdded = async () => {
    setShowAddModal(false);
    await loadMembers();
  };

  const handleGroupProfileUpdated = (updated) => {
    if (onGroupUpdated) onGroupUpdated({ ...group, ...updated });
  };

  const renderMemberRow = (m) => {
    const u = m.user;
    const name = displayNameFor(m);
    const realName = getUserDisplayName(u);
    const hasNickname = Boolean(m.nickname);
    const avatar = resolveMediaUrl(u?.avatarUrl);
    const status = getUserStatus(u?._id);
    const rowIsAdmin = m.role === "admin";
    const isSelf = String(u?._id) === String(currentUserId);

    return (
      <div
        key={m._id || u?._id}
        className="d-flex align-items-center mb-1 group-member-row p-1 rounded-3"
        style={{ cursor: u?.username ? "pointer" : "default" }}
        onClick={() => {
          if (u?.username) navigate(`/profile/${u.username}`);
        }}
        title={u?.username ? `View @${u.username}'s profile` : undefined}
      >
        <span
          className="position-relative flex-shrink-0 me-2 d-inline-block"
          style={{ width: "36px", height: "36px" }}
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
                backgroundColor: "var(--sbd-accent)",
                fontSize: "0.85rem",
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

        <div className="d-flex flex-column overflow-hidden flex-grow-1 min-w-0 me-2">
          <span
            className="text-truncate small fw-semibold"
            style={{
              color: rowIsAdmin ? "var(--sbd-accent)" : "var(--sbd-text)",
              lineHeight: "1.2",
            }}
          >
            {name}
            {isSelf && <span className="text-muted fw-normal"> (you)</span>}
          </span>
          <span
            className="text-truncate"
            style={{ fontSize: "0.725rem", color: "var(--sbd-muted)" }}
          >
            {rowIsAdmin && (
              <span style={{ color: "var(--sbd-accent)", fontWeight: 500 }}>
                Admin
              </span>
            )}
            {rowIsAdmin && hasNickname && " · "}
            {hasNickname && `@${realName}`}
          </span>
        </div>

        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          {u?.username && (
            <button
              type="button"
              className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: "26px", height: "26px" }}
              title={`View ${name}'s profile`}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${u.username}`);
              }}
            >
              <i
                className="bi bi-person text-secondary"
                style={{ fontSize: "0.85rem" }}
              ></i>
            </button>
          )}

          {isAdmin && !isSelf && (
            <button
              type="button"
              className="group-member-remove-btn flex-shrink-0"
              title={`Remove ${realName}`}
              onClick={(e) => {
                e.stopPropagation();
                handleKick(u?._id, realName);
              }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: "0.75rem" }}></i>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        {/* Header Title & Edit */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6
            className="mb-0 text-truncate fw-semibold"
            style={{ color: "var(--sbd-text)", fontSize: "1rem" }}
          >
            {group?.name}
          </h6>

          <div className="d-flex align-items-center gap-1 flex-shrink-0">
            {isAdmin && (
              <button
                type="button"
                className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: "28px", height: "28px" }}
                title="Edit group"
                onClick={() => setShowEditModal(true)}
              >
                <i className="bi bi-pencil" style={{ fontSize: "0.85rem" }}></i>
              </button>
            )}
            <button
              type="button"
              className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: "28px", height: "28px" }}
              title="Close sidebar"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("vibe:close-sidebar"))
              }
            >
              <i
                className="bi bi-layout-sidebar-inset"
                style={{ fontSize: "0.85rem" }}
              ></i>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="input-group input-group-sm sidebar-search mb-3">
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

        {/* Primary Actions */}
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          {isAdmin && (
            <button
              type="button"
              className="group-action-btn group-action-btn--primary flex-grow-1"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>Add Member</span>
            </button>
          )}

          <button
            type="button"
            className="group-action-btn group-action-btn--leave"
            title="Leave group"
            onClick={handleLeave}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Leave</span>
          </button>
        </div>

        {actionError && (
          <div className="text-danger small mt-2 px-1">{actionError}</div>
        )}
      </div>

      {/* Member List Container */}
      <div className="sidebar-chat-list flex-grow-1 overflow-auto px-2">
        {loading ? (
          <div className="text-center py-4 text-muted small">
            Loading members...
          </div>
        ) : (
          <>
            {activeMembers.length > 0 && (
              <div className="mb-3">
                <div className="group-section-title px-2 mb-1">
                  Online — {activeMembers.length}
                </div>
                {activeMembers.map(renderMemberRow)}
              </div>
            )}

            {offlineMembers.length > 0 && (
              <div className="mb-3">
                <div className="group-section-title px-2 mb-1">
                  Offline — {offlineMembers.length}
                </div>
                {offlineMembers.map(renderMemberRow)}
              </div>
            )}

            {filteredMembers.length === 0 && (
              <div className="text-center py-4 text-muted small">
                No members found
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        conversationId={groupId}
        candidateUsers={addableUsers}
        onAdded={handleMembersAdded}
      />

      <EditGroupModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        group={group}
        members={members}
        isAdmin={isAdmin}
        currentUserId={currentUserId}
        onGroupUpdated={handleGroupProfileUpdated}
        onMembersRefresh={loadMembers}
        onAdminTransferred={loadMembers}
      />

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title || "Are you sure?"}
        message={confirmAction?.message || ""}
        confirmLabel={confirmAction?.type === "kick" ? "Remove" : "Leave"}
        confirmVariant="danger"
        onConfirm={executeConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default GroupMembersPanel;

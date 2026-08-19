import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  getMyConversations,
  getAllUsers,
  hideConversation,
  togglePinConversation,
  toggleMuteConversation,
  markAsRead,
  markAsUnread,
} from "../api/conversationService";
import { getUserDisplayName, getDMRecipient } from "./Sidebarhelpers";
import ConversationSearch from "./ConversationSearch";
import NewDirectMessageModal from "./NewDirectMessageModal";
import NewGroupModal from "./NewGroupModal";
import StatusDot from "../pages/profile/component/StatusDot";
import Logo from "../assets/vibe-logo.png";
import "./css/Sidebar.css";

// Builds a small, themed "chip" element used as the native drag-image when
// a chat is dragged out of the sidebar — replaces the browser's default
// translucent screenshot of the row with something purpose-built.
// Must be appended to the DOM (off-screen is fine) for setDragImage to
// capture it; caller is responsible for removing it shortly after.
const buildChatDragPreview = (name, avatarUrl) => {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    top: -1000px;
    left: -1000px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 6px 6px;
    border-radius: 999px;
    background: var(--sbd-panel, #1e1f22);
    border: 1px solid var(--sbd-border, #333);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
    font-family: inherit;
    max-width: 220px;
  `;

  const avatarWrap = document.createElement("div");
  avatarWrap.style.cssText = `
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--sbd-accent, #52c98a);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
  `;

  if (avatarUrl) {
    const img = document.createElement("img");
    img.src = avatarUrl;
    img.style.cssText = "width:100%; height:100%; object-fit:cover;";
    avatarWrap.appendChild(img);
  } else {
    avatarWrap.textContent = (name || "?").charAt(0).toUpperCase();
  }

  // Small badge hinting this will open as a new tab
  const badge = document.createElement("div");
  badge.style.cssText = `
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: var(--sbd-accent, #52c98a);
    border: 2px solid var(--sbd-panel, #1e1f22);
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  badge.innerHTML =
    '<i class="bi bi-plus-lg" style="font-size:8px; color:#fff; line-height:1;"></i>';
  avatarWrap.appendChild(badge);

  const label = document.createElement("span");
  label.textContent = name;
  label.style.cssText = `
    color: var(--sbd-text, #e6e6e6);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;

  el.appendChild(avatarWrap);
  el.appendChild(label);
  document.body.appendChild(el);

  return el;
};

const Sidebar = ({ onSelectChat, onChatDragStart }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserStatus, myStatus } = useSocket();
  const currentUserId = user?._id || user?.id;

  // Component States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load conversations & users on mount
  useEffect(() => {
    let isMounted = true;

    const loadSidebarData = async () => {
      try {
        const [userConvs, usersResponse] = await Promise.all([
          getMyConversations(),
          getAllUsers(),
        ]);

        if (!isMounted) return;

        setConversations(userConvs || []);

        const rawUsers = Array.isArray(usersResponse)
          ? usersResponse
          : usersResponse?.data || usersResponse?.users || [];

        const filteredUsers = currentUserId
          ? rawUsers.filter((u) => String(u._id) !== String(currentUserId))
          : rawUsers;

        setAllUsers(filteredUsers);
      } catch (err) {
        console.error(
          "Failed to load sidebar data:",
          err?.response?.data || err,
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSidebarData();

    return () => {
      isMounted = false;
    };
  }, [currentUserId]);

  // Jump to an existing conversation surfaced by the search bar
  const handleSelectExistingConversation = (conv) => {
    if (conv.isGroup) {
      setActiveGroupId(conv._id);
      setActiveChatId(conv._id);
    } else {
      setActiveGroupId(null);
      setActiveChatId(conv._id);
    }

    if (onSelectChat) {
      const recipient = conv.isGroup
        ? null
        : getDMRecipient(conv, currentUserId);
      const name = conv.isGroup ? conv.name : getUserDisplayName(recipient);
      onSelectChat({
        id: conv._id,
        name,
        avatarUrl: conv.isGroup ? undefined : recipient?.avatarUrl,
        recipientId: conv.isGroup ? undefined : recipient?._id,
        isGroup: Boolean(conv.isGroup),
      });
    }
  };

  // Called by both NewDirectMessageModal and NewGroupModal on success
  const handleConversationCreated = (conv, targetUser) => {
    setConversations((prev) =>
      prev.some((c) => c._id === conv._id)
        ? prev.map((c) => (c._id === conv._id ? conv : c))
        : [conv, ...prev],
    );

    setActiveChatId(conv._id);
    setActiveGroupId(conv.isGroup ? conv._id : null);

    if (onSelectChat) {
      const recipient = targetUser || getDMRecipient(conv, currentUserId);
      const name = conv.isGroup ? conv.name : getUserDisplayName(recipient);
      onSelectChat({
        id: conv._id,
        name,
        avatarUrl: conv.isGroup ? undefined : recipient?.avatarUrl,
        recipientId: conv.isGroup ? undefined : recipient?._id,
        isGroup: Boolean(conv.isGroup),
      });
    }

    setShowNewDMModal(false);
    setShowNewGroupModal(false);
  };

  // Context Menu Actions
  const handleHideChat = async (e, convId) => {
    closeDropdown(e);
    try {
      // Backend clears the pin atomically as part of hiding — see
      // conversationController.hideConversation
      await hideConversation(convId);
      setConversations((prev) => prev.filter((c) => c._id !== convId));
      if (activeChatId === convId) {
        setActiveChatId(null);
        if (onSelectChat) onSelectChat(null);
      }
    } catch (err) {
      console.error("Failed to hide conversation:", err);
    }
  };

  const handleTogglePin = async (e, convId) => {
    closeDropdown(e);
    try {
      const res = await togglePinConversation(convId);
      const updated = res.conversation || res;
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? updated : c)),
      );
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
    }
  };
  const handleToggleMute = async (e, convId) => {
    closeDropdown(e);
    try {
      const res = await toggleMuteConversation(convId);
      const updated = res.conversation || res;
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? updated : c)),
      );
    } catch (err) {
      console.error("Failed to toggle mute state:", err);
    }
  };

  const handleToggleReadStatus = async (e, convId, isCurrentlyUnread) => {
    closeDropdown(e);
    try {
      const res = isCurrentlyUnread
        ? await markAsRead(convId)
        : await markAsUnread(convId);
      const updated = res.conversation || res;

      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? updated : c)),
      );
    } catch (err) {
      console.error("Failed to update read status:", err);
    }
  };
  const toggleCollapse = () => setIsCollapsed((c) => !c);

  // Dismisses any open Bootstrap dropdown popup programmatically
  const closeDropdown = (e) => {
    if (e) e.stopPropagation();
    const openDropdowns = document.querySelectorAll(".chat-options-btn.show");
    openDropdowns.forEach((btn) => {
      if (window.bootstrap?.Dropdown) {
        const instance = window.bootstrap.Dropdown.getInstance(btn);
        if (instance) instance.hide();
      } else {
        btn.click(); // Fallback trigger
      }
    });
  };
  // Grouping & Sorting: Pinned chats move to top
  const groupChats = conversations.filter((c) => c.isGroup);
  const directMessages = conversations
    .filter((c) => !c.isGroup)
    .sort((a, b) => {
      const aPinned = a.pinnedBy?.includes(currentUserId) ? 1 : 0;
      const bPinned = b.pinnedBy?.includes(currentUserId) ? 1 : 0;
      return bPinned - aPinned;
    });

  const activeGroup = groupChats.find((g) => g._id === activeGroupId) || null;
  const currentUserAvatar = resolveMediaUrl(user?.avatarUrl);
  const currentUserDisplayName = getUserDisplayName(user);
  // Live presence for the current user (idle-timer driven), falling back
  // to whatever was on the user object at login if the socket hasn't
  // connected yet.
  const status = myStatus || user?.status || "offline";
  const statusColors = {
    online: "success",
    away: "warning",
    offline: "secondary",
  };
  const statusLabels = {
    online: "Online",
    away: "Away",
    offline: "Offline",
  };

  const sidebarWidth = isCollapsed ? 72 : 320;

  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.style.marginLeft = `${sidebarWidth}px`;
    }
  }, [sidebarWidth]);

  return (
    <div
      className="sidebar-dark d-flex flex-shrink-0"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: `${sidebarWidth}px`,
        zIndex: 1000,
        transition: "width 0.2s ease",
      }}
    >
      {/* ===== SERVER RAIL ===== */}
      <div
        className="d-flex flex-column align-items-center"
        style={{
          width: "72px",
          flexShrink: 0,
          height: "100%",
          backgroundColor: "var(--sbd-rail)",
          borderRight: "1px solid var(--sbd-border)",
        }}
      >
        <div className="d-flex flex-column align-items-center pt-3 pb-2 flex-shrink-0">
          <button
            className={`sidebar-rail-icon sidebar-home-icon btn rounded-circle p-0 d-flex align-items-center justify-content-center overflow-hidden ${
              !activeGroupId ? "active" : ""
            }`}
            onClick={() => {
              setActiveGroupId(null);
              setActiveChatId(null);
            }}
            title="Direct Messages"
          >
            <img
              src={Logo}
              alt="Vibe"
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />
          </button>
          <hr
            className="w-75 my-2"
            style={{ borderColor: "var(--sbd-border)", opacity: 1 }}
          />
        </div>

        <div
          className="sidebar-rail-list flex-grow-1 w-100 d-flex flex-column align-items-center gap-2"
          style={{ overflowY: "auto", overflowX: "hidden", minHeight: 0 }}
        >
          {groupChats.map((group) => (
            <button
              key={group._id}
              className={`sidebar-rail-icon btn rounded-circle p-0 fw-bold d-flex align-items-center justify-content-center flex-shrink-0 ${
                activeGroupId === group._id ? "active" : ""
              }`}
              onClick={() => {
                setActiveGroupId(group._id);
                setActiveChatId(group._id);
                if (onSelectChat) {
                  onSelectChat({
                    id: group._id,
                    name: group.name,
                    isGroup: true,
                  });
                }
              }}
              title={group.name}
            >
              {group.name ? group.name.charAt(0).toUpperCase() : "#"}
            </button>
          ))}
        </div>

        <div className="flex-shrink-0 py-3">
          <button
            className="sidebar-ghost-btn btn btn-sm rounded-circle"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <i
              className={`bi ${
                isCollapsed ? "bi-chevron-right" : "bi-chevron-left"
              }`}
            ></i>
          </button>
        </div>
      </div>

      {/* ===== CHAT PANEL ===== */}
      {!isCollapsed && (
        <div
          className="d-flex flex-column"
          style={{
            width: "248px",
            flexShrink: 0,
            backgroundColor: "var(--sbd-panel)",
            borderRight: "1px solid var(--sbd-border)",
          }}
        >
          <div className="px-3 pt-3 pb-2 d-flex align-items-center justify-content-between">
            <h6 className="mb-0" style={{ color: "var(--sbd-text)" }}>
              {activeGroup ? activeGroup.name : "Direct Messages"}
            </h6>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
                style={{ width: "28px", height: "28px" }}
                title="New message"
                onClick={() => setShowNewDMModal(true)}
              >
                <i
                  className="bi bi-person-plus"
                  style={{ fontSize: "0.95rem" }}
                ></i>
              </button>
              <button
                type="button"
                className="sidebar-ghost-btn btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
                style={{ width: "28px", height: "28px" }}
                title="New group"
                onClick={() => setShowNewGroupModal(true)}
              >
                <i className="bi bi-people" style={{ fontSize: "0.95rem" }}></i>
              </button>
            </div>
          </div>

          {/* Search — scoped to conversations already loaded in the sidebar
              (the backend never returns hidden conversations), so this only
              jumps to existing chats and never creates anything new. */}
          <ConversationSearch
            conversations={conversations}
            currentUserId={currentUserId}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSelect={handleSelectExistingConversation}
          />

          {/* Conversation List */}
          <div className="sidebar-chat-list flex-grow-1 overflow-auto px-2 d-flex flex-column gap-1">
            {loading ? (
              <div className="text-center py-3 text-muted small">
                Loading...
              </div>
            ) : searchQuery.trim() !== "" ? null : (
              directMessages.map((chat) => {
                const recipient = getDMRecipient(chat, currentUserId);
                const name = recipient
                  ? getUserDisplayName(recipient)
                  : "Direct Message";
                const recipientAvatar = resolveMediaUrl(recipient?.avatarUrl);
                const recipientStatus = getUserStatus(recipient?._id);

                const isPinned = chat.pinnedBy?.includes(currentUserId);
                const isMuted = chat.mutedBy?.includes(currentUserId);
                const isUnread = chat.unreadBy?.includes(currentUserId);
                const isActive = activeChatId === chat._id;

                return (
                  <div
                    key={chat._id}
                    className={`sidebar-chat-item d-flex align-items-center px-2 py-2 mb-1 ${
                      isActive ? "active" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                    draggable={Boolean(onChatDragStart)}
                    onDragStart={(e) => {
                      if (onChatDragStart) {
                        const preview = buildChatDragPreview(
                          name,
                          recipientAvatar,
                        );
                        e.dataTransfer.setDragImage(preview, 18, 22);
                        e.dataTransfer.effectAllowed = "move";
                        // The browser snapshots the image synchronously
                        // during dragstart — safe to remove right after.
                        setTimeout(() => preview.remove(), 0);

                        onChatDragStart(e, {
                          id: chat._id,
                          name,
                          avatarUrl: recipient?.avatarUrl,
                          recipientId: recipient?._id,
                          isGroup: false,
                        });
                      }
                    }}
                    onClick={() => {
                      setActiveChatId(chat._id);
                      if (isUnread)
                        handleToggleReadStatus(null, chat._id, true);
                      if (onSelectChat)
                        onSelectChat({
                          id: chat._id,
                          name,
                          avatarUrl: recipient?.avatarUrl,
                          recipientId: recipient?._id,
                          recipientUsername: recipient?.username,
                          isGroup: false,
                          isPinned: chat.pinnedBy?.includes(currentUserId),
                          isMuted: chat.mutedBy?.includes(currentUserId),
                          isBlocked: chat.blockedBy?.includes(currentUserId), // ← add this
                        });
                    }}
                  >
                    {/* Recipient Avatar Container */}
                    <span
                      className="position-relative flex-shrink-0 me-2"
                      style={{ width: "44px", height: "44px" }}
                    >
                      {recipientAvatar ? (
                        <img
                          src={recipientAvatar}
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

                      {/* Status Dot can now freely pop outside without getting clipped! */}
                      <StatusDot status={recipientStatus} />
                    </span>

                    {/* Chat Name & Info */}
                    <div className="d-flex flex-column overflow-hidden flex-grow-1 me-1">
                      <div className="d-flex align-items-center gap-1">
                        <span
                          className={`text-truncate ${isUnread ? "fw-bold" : ""}`}
                          style={{
                            color: "var(--sbd-text)",
                            fontSize: "0.95rem",
                          }}
                        >
                          {name}
                        </span>
                        {isPinned && (
                          <i
                            className="bi bi-pin-angle-fill sidebar-status-badge ms-1"
                            title="Pinned"
                          ></i>
                        )}
                      </div>
                      <span
                        className="text-truncate small"
                        style={{
                          color: "var(--sbd-muted)",
                          fontSize: "0.78rem",
                        }}
                      >
                        {statusLabels[recipientStatus] || "Offline"}
                      </span>
                    </div>

                    {/* Right Muted / Unread Badges */}
                    <div className="d-flex align-items-center gap-1 me-1 flex-shrink-0">
                      {isMuted && (
                        <i
                          className="bi bi-bell-slash-fill sidebar-status-badge"
                          title="Muted"
                        ></i>
                      )}
                      {isUnread && (
                        <span className="unread-dot" title="Unread"></span>
                      )}
                    </div>

                    {/* Options Popup Dropdown */}
                    <div className="dropdown flex-shrink-0 ms-auto">
                      <button
                        className="btn btn-sm p-0 border-0 chat-options-btn"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        onClick={(e) => e.stopPropagation()}
                        style={{ fontSize: "1.1rem" }}
                      >
                        <i className="bi bi-three-dots"></i>
                      </button>

                      <ul className="dropdown-menu dropdown-menu-end sidebar-context-menu shadow">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={(e) =>
                              handleToggleReadStatus(e, chat._id, isUnread)
                            }
                          >
                            <span>
                              {isUnread ? "Mark as read" : "Mark as unread"}
                            </span>
                            <i
                              className={`bi ${
                                isUnread
                                  ? "bi-envelope-open"
                                  : "bi-envelope-plus"
                              }`}
                            ></i>
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={(e) => handleTogglePin(e, chat._id)}
                          >
                            <span>{isPinned ? "Unpin" : "Pin"}</span>
                            <i
                              className={`bi ${
                                isPinned ? "bi-pin-angle" : "bi-pin-angle-fill"
                              }`}
                            ></i>
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={(e) => handleToggleMute(e, chat._id)}
                          >
                            <span>{isMuted ? "Unmute" : "Mute"}</span>
                            <i
                              className={`bi ${
                                isMuted ? "bi-bell" : "bi-bell-slash"
                              }`}
                            ></i>
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item text-danger"
                            onClick={(e) => handleHideChat(e, chat._id)}
                          >
                            <span>Delete</span>
                            <i className="bi bi-trash"></i>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* User Profile Footer */}
          <div
            className="d-flex align-items-center gap-2 p-2"
            style={{
              backgroundColor: "var(--sbd-rail)",
              borderTop: "1px solid var(--sbd-border)",
            }}
          >
            <button
              className="sidebar-ghost-btn btn flex-grow-1 d-flex align-items-center gap-2 text-start rounded-3 overflow-hidden"
              onClick={() => navigate("/profile")}
              title="View profile"
            >
              <span
                className="position-relative flex-shrink-0"
                style={{ width: "36px", height: "36px" }}
              >
                {currentUserAvatar ? (
                  <img
                    src={currentUserAvatar}
                    alt={currentUserDisplayName}
                    className="rounded-circle w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span
                    className="rounded-circle w-100 h-100 d-flex align-items-center justify-content-center fw-bold small"
                    style={{
                      backgroundColor: "var(--sbd-accent)",
                      color: "#fff",
                    }}
                  >
                    {currentUserDisplayName.charAt(0).toUpperCase()}
                  </span>
                )}
                {/* Updated Status Dot Position */}
                <span
                  className={`position-absolute rounded-circle bg-${statusColors[status]}`}
                  style={{
                    width: "12px",
                    height: "12px",
                    bottom: "-2px",
                    right: "-2px",
                    border: "2px solid var(--sbd-rail)",
                    zIndex: 1,
                  }}
                ></span>
              </span>
              <span className="d-flex flex-column overflow-hidden">
                <span
                  className="text-truncate small"
                  style={{ color: "var(--sbd-text)" }}
                >
                  {currentUserDisplayName}
                </span>
                <span
                  className="text-truncate"
                  style={{ fontSize: "0.72rem", color: "var(--sbd-muted)" }}
                >
                  {statusLabels[status] || status}
                </span>
              </span>
            </button>

            <button
              className="sidebar-ghost-btn btn btn-sm rounded-circle flex-shrink-0"
              onClick={() => navigate("/profile/edit")}
              title="Settings"
            >
              <i className="bi bi-gear-fill"></i>
            </button>
          </div>
        </div>
      )}

      <NewDirectMessageModal
        show={showNewDMModal}
        onClose={() => setShowNewDMModal(false)}
        allUsers={allUsers}
        onCreated={handleConversationCreated}
      />

      <NewGroupModal
        show={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        allUsers={allUsers}
        onCreated={handleConversationCreated}
      />
    </div>
  );
};

export default Sidebar;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  getMyConversations,
  createConversation,
  getAllUsers,
  hideConversation,
  togglePinConversation,
  toggleMuteConversation,
  markAsRead,
  markAsUnread,
} from "../api/conversationService";
import Logo from "../assets/vibe-logo.png";
import "./css/Sidebar.css";

const Sidebar = ({ onSelectChat }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;

  // Component States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);

  // Data States
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to extract full display name
  const getUserDisplayName = (u) => {
    if (!u) return "User";
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.username || u.name || "User";
  };

  // Safe helper to extract recipient user object from DM participants
  const getDMRecipient = (conv) => {
    if (!conv || !Array.isArray(conv.participants)) return null;
    return (
      conv.participants.find((p) => {
        const pId = typeof p === "object" ? p._id || p.id : p;
        return String(pId) !== String(currentUserId);
      }) || null
    );
  };

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

  // Handle Search Input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const trimmedQuery = query.trim().toLowerCase();

    if (trimmedQuery.length > 0 && Array.isArray(allUsers)) {
      const filtered = allUsers.filter((u) => {
        const username = (u.username || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const firstName = (u.firstName || "").toLowerCase();
        const lastName = (u.lastName || "").toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          username.includes(trimmedQuery) ||
          email.includes(trimmedQuery) ||
          firstName.includes(trimmedQuery) ||
          lastName.includes(trimmedQuery) ||
          fullName.includes(trimmedQuery)
        );
      });
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectUserFromSearch = async (targetUser) => {
    try {
      // Backend un-hides (and clears the pin) atomically if this DM
      // already existed and was previously hidden — see
      // conversationController.createConversation
      const conv = await createConversation({
        isGroup: false,
        members: [targetUser._id],
      });

      setConversations((prev) =>
        prev.some((c) => c._id === conv._id)
          ? prev.map((c) => (c._id === conv._id ? conv : c))
          : [conv, ...prev],
      );

      setActiveChatId(conv._id);
      setActiveGroupId(null);

      if (onSelectChat) {
        onSelectChat({ id: conv._id, name: getUserDisplayName(targetUser) });
      }

      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("Failed to start DM:", err);
    }
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
  const status = user?.status || "offline";
  const statusColors = {
    online: "success",
    away: "warning",
    offline: "secondary",
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
                  onSelectChat({ id: group._id, name: group.name });
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
          <div className="px-3 pt-3 pb-2">
            <h6 className="mb-0" style={{ color: "var(--sbd-text)" }}>
              {activeGroup ? activeGroup.name : "Direct Messages"}
            </h6>
          </div>

          {/* Search Bar */}
          <div className="px-3 mb-2">
            <div className="input-group input-group-sm sidebar-search">
              <span className="input-group-text border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Find or start a conversation"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="sidebar-chat-list flex-grow-1 overflow-auto px-2 d-flex flex-column gap-1">
            {loading ? (
              <div className="text-center py-3 text-muted small">
                Loading...
              </div>
            ) : searchQuery.trim() !== "" ? (
              <div>
                <span className="text-muted extra-small fw-bold px-2 d-block mb-1">
                  USERS FOUND ({searchResults.length})
                </span>
                {searchResults.length === 0 ? (
                  <div className="px-2 small text-muted py-2">
                    No users found
                  </div>
                ) : (
                  searchResults.map((u) => {
                    const uDisplayName = getUserDisplayName(u);
                    const userAvatar = resolveMediaUrl(u.avatarUrl);

                    return (
                      <button
                        key={u._id}
                        className="sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 w-100 mb-1"
                        onClick={() => handleSelectUserFromSearch(u)}
                      >
                        <span
                          className="position-relative flex-shrink-0 rounded-circle overflow-hidden"
                          style={{ width: "36px", height: "36px" }}
                        >
                          {userAvatar ? (
                            <img
                              src={userAvatar}
                              alt={uDisplayName}
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <span
                              className="w-100 h-100 d-flex align-items-center justify-content-center fw-bold text-white"
                              style={{ backgroundColor: "var(--sbd-accent)" }}
                            >
                              {uDisplayName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <div className="d-flex flex-column overflow-hidden">
                          <span
                            className="text-truncate small"
                            style={{ color: "var(--sbd-text)" }}
                          >
                            {uDisplayName}
                          </span>
                          <span className="text-truncate extra-small text-muted">
                            {u.username ? `@${u.username}` : u.email}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              directMessages.map((chat) => {
                const recipient = getDMRecipient(chat);
                const name = recipient
                  ? getUserDisplayName(recipient)
                  : "Direct Message";
                const recipientAvatar = resolveMediaUrl(recipient?.avatarUrl);

                const isPinned = chat.pinnedBy?.includes(currentUserId);
                const isMuted = chat.mutedBy?.includes(currentUserId);
                const isUnread = chat.unreadBy?.includes(currentUserId);

                return (
                  <div
                    key={chat._id}
                    className="sidebar-chat-item d-flex align-items-center px-2 py-2 mb-1"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setActiveChatId(chat._id);
                      if (isUnread)
                        handleToggleReadStatus(null, chat._id, true);
                      if (onSelectChat) onSelectChat({ id: chat._id, name });
                    }}
                  >
                    {/* Recipient Avatar */}
                    <span
                      className="position-relative flex-shrink-0 me-2 rounded-circle overflow-hidden"
                      style={{ width: "44px", height: "44px" }}
                    >
                      {recipientAvatar ? (
                        <img
                          src={recipientAvatar}
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
                        Active 20m ago
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
                <span
                  className={`position-absolute bottom-0 end-0 rounded-circle bg-${statusColors[status]}`}
                  style={{
                    width: "11px",
                    height: "11px",
                    border: "2px solid var(--sbd-rail)",
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
                  {status}
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
    </div>
  );
};

export default Sidebar;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { resolveMediaUrl } from "../utils/mediaUrl";
import {
  getMyConversations,
  createConversation,
  getAllUsers,
} from "../api/conversationService";
import Logo from "../assets/vibe-logo.png";
import "./css/Sidebar.css";

const Sidebar = ({ onSelectChat }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Component States
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null); // null = Direct Messages
  const [activeChatId, setActiveChatId] = useState(null);

  // Data States
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to extract full display name from database fields
  const getUserDisplayName = (u) => {
    if (!u) return "User";
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.username || u.name || "User";
  };

  // 1. Fetch conversations & users on mount
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

        // Unsurpass array wrappers if backend returns data in a sub-field
        const rawUsers = Array.isArray(usersResponse)
          ? usersResponse
          : usersResponse?.data || usersResponse?.users || [];

        const currentUserId = user?._id || user?.id;

        // Filter out the currently logged-in user
        const filteredUsers = currentUserId
          ? rawUsers.filter((u) => u._id !== currentUserId)
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
  }, [user?._id, user?.id]);

  // 2. Dynamic Search Handler matching username, email, firstName, and lastName
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

  // 3. Select user from search results (creates or retrieves DM)
  const handleSelectUserFromSearch = async (targetUser) => {
    try {
      const conv = await createConversation({
        isGroup: false,
        members: [targetUser._id],
      });

      if (!conversations.some((c) => c._id === conv._id)) {
        setConversations((prev) => [conv, ...prev]);
      }

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

  // UI Helpers
  const toggleCollapse = () => setIsCollapsed((c) => !c);

  const getDMRecipientName = (conv) => {
    const recipient = conv.participants?.find(
      (p) => p._id !== (user?._id || user?.id),
    );
    return recipient ? getUserDisplayName(recipient) : "Direct Message";
  };

  // Filter conversations for DMs vs Groups
  const groupChats = conversations.filter((c) => c.isGroup);
  const directMessages = conversations.filter((c) => !c.isGroup);
  const activeGroup = groupChats.find((g) => g._id === activeGroupId) || null;

  const avatarUrl = resolveMediaUrl(user?.avatarUrl);
  const displayName = getUserDisplayName(user);
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
      {/* ===== SERVER RAIL (Groups / Navigation) ===== */}
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
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0,
          }}
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

      {/* ===== CHAT & SEARCH PANEL ===== */}
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

          {/* Search Input */}
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

          {/* Chat / Search Result List */}
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
                    return (
                      <button
                        key={u._id}
                        className="sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 w-100 mb-1"
                        onClick={() => handleSelectUserFromSearch(u)}
                      >
                        <span
                          className="d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 rounded-circle"
                          style={{
                            width: "36px",
                            height: "36px",
                            backgroundColor: "var(--sbd-accent)",
                          }}
                        >
                          {uDisplayName.charAt(0).toUpperCase()}
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
            ) : activeGroup ? (
              <button className="sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 active">
                <span
                  className="d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 rounded-3"
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "var(--sbd-accent)",
                  }}
                >
                  {activeGroup.name
                    ? activeGroup.name.charAt(0).toUpperCase()
                    : "#"}
                </span>
                <div className="d-flex flex-column overflow-hidden">
                  <span
                    className="text-truncate"
                    style={{ color: "var(--sbd-text)" }}
                  >
                    {activeGroup.name}
                  </span>
                  <span
                    className="text-truncate small"
                    style={{ color: "var(--sbd-muted)" }}
                  >
                    Group Channel
                  </span>
                </div>
              </button>
            ) : (
              directMessages.map((chat) => {
                const name = getDMRecipientName(chat);
                return (
                  <button
                    key={chat._id}
                    className={`sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 ${
                      activeChatId === chat._id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveChatId(chat._id);
                      if (onSelectChat) {
                        onSelectChat({ id: chat._id, name });
                      }
                    }}
                  >
                    <span
                      className="d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 rounded-circle"
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: "var(--sbd-accent)",
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <div className="d-flex flex-column overflow-hidden">
                      <span
                        className="text-truncate"
                        style={{ color: "var(--sbd-text)" }}
                      >
                        {name}
                      </span>
                      <span
                        className="text-truncate small"
                        style={{ color: "var(--sbd-muted)" }}
                      >
                        Direct Message
                      </span>
                    </div>
                  </button>
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
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
                    {displayName.charAt(0).toUpperCase()}
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
                  {displayName}
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

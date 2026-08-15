import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { resolveMediaUrl } from "../utils/mediaUrl";
import Logo from "../assets/vibe-logo.png";
import "./css/Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState(null); // null = Direct Messages
  const [activeChatId, setActiveChatId] = useState(null);

  // Sample data – replace with real data later
  const individualChats = [
    { id: 1, name: "Alice Johnson", lastMsg: "Hey, are we meeting?" },
    { id: 2, name: "Bob Smith", lastMsg: "Sent the files" },
    { id: 3, name: "Charlie", lastMsg: "Thanks!" },
    { id: 1, name: "Alice Johnson", lastMsg: "Hey, are we meeting?" },
    { id: 2, name: "Bob Smith", lastMsg: "Sent the files" },
    { id: 3, name: "Charlie", lastMsg: "Thanks!" },
    { id: 1, name: "Alice Johnson", lastMsg: "Hey, are we meeting?" },
    { id: 2, name: "Bob Smith", lastMsg: "Sent the files" },
    { id: 3, name: "Charlie", lastMsg: "Thanks!" },
    { id: 1, name: "Alice Johnson", lastMsg: "Hey, are we meeting?" },
    { id: 2, name: "Bob Smith", lastMsg: "Sent the files" },
    { id: 3, name: "Charlie", lastMsg: "Thanks!" },
    { id: 1, name: "Alice Johnson", lastMsg: "Hey, are we meeting?" },
    { id: 2, name: "Bob Smith", lastMsg: "Sent the files" },
    { id: 3, name: "Charlie", lastMsg: "Thanks!" },
  ];

  const groupChats = [
{ id: 101, name: "Project Alpha", lastMsg: "3 new messages" },
    { id: 102, name: "Design Team", lastMsg: "Updated mockups" },
    // Add more groups to test scrolling
    { id: 103, name: "Marketing", lastMsg: "Campaign ready" },
    { id: 104, name: "Dev Team", lastMsg: "PR #42 merged" },
    { id: 105, name: "Support", lastMsg: "2 tickets open" },
    { id: 106, name: "Random", lastMsg: "😂" },
    { id: 107, name: "Marketing", lastMsg: "Campaign ready" },
    { id: 108, name: "Dev Team", lastMsg: "PR #42 merged" },
    { id: 109, name: "Support", lastMsg: "2 tickets open" },
    { id: 110, name: "Random", lastMsg: "😂" },
    { id: 111, name: "Marketing", lastMsg: "Campaign ready" },
    { id: 112, name: "Dev Team", lastMsg: "PR #42 merged" },
    { id: 113, name: "Support", lastMsg: "2 tickets open" },
    { id: 114, name: "Random", lastMsg: "😂" },
  ];

  const toggleCollapse = () => setIsCollapsed((c) => !c);

  const activeGroup = groupChats.find((g) => g.id === activeGroupId) || null;
  const panelItems = activeGroup ? [activeGroup] : individualChats;

  const avatarUrl = resolveMediaUrl(user?.avatarUrl);
  const displayName = user?.username || "Guest";
  const status = user?.status || "offline";
  const statusColors = {
    online: "success",
    away: "warning",
    offline: "secondary",
  };

  // Wider sidebar
  const sidebarWidth = isCollapsed ? 72 : 320;

  // Keep main content in sync when collapsing/expanding
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
      {/* ===== SERVER RAIL (groups) ===== */}
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
        {/* Top: Logo */}
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

        {/* Middle: Scrollable Groups */}
        <div
          className="sidebar-rail-list flex-grow-1 w-100 d-flex flex-column align-items-center gap-2"
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            minHeight: 0, // critical for scrolling
          }}
        >
          {groupChats.map((group) => (
            <button
              key={group.id}
              className={`sidebar-rail-icon btn rounded-circle p-0 fw-bold d-flex align-items-center justify-content-center flex-shrink-0 ${
                activeGroupId === group.id ? "active" : ""
              }`}
              onClick={() => {
                setActiveGroupId(group.id);
                setActiveChatId(group.id);
              }}
              title={group.name}
            >
              {group.name.charAt(0)}
            </button>
          ))}
        </div>

        {/* Bottom: Collapse button */}
        <div className="flex-shrink-0 py-3">
          <button
            className="sidebar-ghost-btn btn btn-sm rounded-circle"
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            <i
              className={`bi ${isCollapsed ? "bi-chevron-right" : "bi-chevron-left"}`}
            ></i>
          </button>
        </div>
      </div>

      {/* ===== CHAT PANEL ===== */}
      {!isCollapsed && (
        <div
          className="d-flex flex-column"
          style={{
            width: "248px", // 320 - 72
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

          <div className="px-3 mb-2">
            <div className="input-group input-group-sm sidebar-search">
              <span className="input-group-text border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Find or start a conversation"
              />
            </div>
          </div>

          {/* Scrollable chat list */}
          <div className="sidebar-chat-list flex-grow-1 overflow-auto px-2 d-flex flex-column gap-1">
            {panelItems.map((chat) => (
              <button
                key={chat.id}
                className={`sidebar-chat-item btn text-start d-flex align-items-center gap-2 rounded-4 px-2 py-2 ${
                  activeChatId === chat.id ? "active" : ""
                }`}
                onClick={() => setActiveChatId(chat.id)}
              >
                <span
                  className={`d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0 ${
                    activeGroup ? "rounded-3" : "rounded-circle"
                  }`}
                  style={{
                    width: "40px",
                    height: "40px",
                    backgroundColor: "var(--sbd-accent)",
                  }}
                >
                  {chat.name.charAt(0)}
                </span>
                <div className="d-flex flex-column overflow-hidden">
                  <span
                    className="text-truncate"
                    style={{ color: "var(--sbd-text)" }}
                  >
                    {chat.name}
                  </span>
                  <span
                    className="text-truncate small"
                    style={{ color: "var(--sbd-muted)" }}
                  >
                    {chat.lastMsg}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* ===== USER BAR ===== */}
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
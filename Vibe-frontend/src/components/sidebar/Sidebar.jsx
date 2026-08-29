/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../context/SocketContext";
import { resolveMediaUrl } from "../../utils/MediaURL";
import {
  getMyConversations,
  getAllUsers,
  hideConversation,
  togglePinConversation,
  toggleMuteConversation,
  markAsRead,
  markAsUnread,
  getBlockedUsers,
  unblockUser,
} from "../../api/conversationService";
import { getUserDisplayName, getDMRecipient } from "./Sidebarhelpers";

import GroupMembersPanel from "./GroupMembersPanel";
import ConversationSearch from "./ConversationSearch";
import NewDirectMessageModal from "./NewDirectMessageModal";
import NewGroupModal from "./NewGroupModal";
import StatusDot from "../../pages/profile/component/StatusDot";
import ConversationItem from "./ConversationItem";
import BlockedUsersModal from "./BlockedUsersModal";
import NotificationDropdown from "../notification/NotificationDropdown";

import Logo from "../../assets/vibe-logo.png";
import "../css/Sidebar.css";

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

const Sidebar = ({ onSelectChat, onChatDragStart, onChatUpdated }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, getUserStatus, myStatus } = useSocket();
  const currentUserId = user?._id || user?.id;
  const joinedConversationIdsRef = useRef(new Set());

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 991;
    }
    return false;
  });

  // Listen for global open/close sidebar events (e.g. from back button in ChatHeader)
  useEffect(() => {
    const handleOpenSidebar = () => setIsCollapsed(false);
    const handleCloseSidebar = () => setIsCollapsed(true);
    const handleToggleSidebar = () => setIsCollapsed((prev) => !prev);

    window.addEventListener("vibe:open-sidebar", handleOpenSidebar);
    window.addEventListener("vibe:close-sidebar", handleCloseSidebar);
    window.addEventListener("vibe:toggle-sidebar", handleToggleSidebar);

    return () => {
      window.removeEventListener("vibe:open-sidebar", handleOpenSidebar);
      window.removeEventListener("vibe:close-sidebar", handleCloseSidebar);
      window.removeEventListener("vibe:toggle-sidebar", handleToggleSidebar);
    };
  }, []);

  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showNewDMModal, setShowNewDMModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBlockedUsers, setLoadingBlockedUsers] = useState(false);
  const [blockedUsersError, setBlockedUsersError] = useState("");

  const removeBlockedUsersFromAllUsers = useCallback(
    (users, blockedEntries) => {
      const blockedIds = new Set(
        (blockedEntries || [])
          .map((entry) => entry?.user?._id || entry?.user?.id || entry?._id)
          .filter(Boolean)
          .map((id) => String(id)),
      );
      return (users || []).filter((u) => !blockedIds.has(String(u?._id || u?.id)));
    },
    [],
  );

  // Load conversations & users on mount
  useEffect(() => {
    let isMounted = true;

    const loadSidebarData = async () => {
      try {
        const [userConvs, usersResponse, blockedResponse] = await Promise.all([
          getMyConversations(),
          getAllUsers(),
          getBlockedUsers(),
        ]);

        if (!isMounted) return;

        setConversations(userConvs || []);

        const rawUsers = Array.isArray(usersResponse)
          ? usersResponse
          : usersResponse?.data || usersResponse?.users || [];

        const filteredUsers = currentUserId
          ? rawUsers.filter((u) => String(u._id) !== String(currentUserId))
          : rawUsers;

        const blockedEntries =
          blockedResponse?.data ||
          blockedResponse?.users ||
          (Array.isArray(blockedResponse) ? blockedResponse : []);
        setBlockedUsers(blockedEntries);
        setAllUsers(
          removeBlockedUsersFromAllUsers(filteredUsers, blockedEntries),
        );
      } catch (err) {
        console.error("Failed to load sidebar data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSidebarData();
    return () => {
      isMounted = false;
    };
  }, [currentUserId, removeBlockedUsersFromAllUsers]);

  // Listen for block status changes from chat window
  useEffect(() => {
    const handleBlockChanged = async () => {
      try {
        const [userConvs, usersResponse, blockedResponse] = await Promise.all([
          getMyConversations(),
          getAllUsers(),
          getBlockedUsers(),
        ]);
        setConversations(userConvs || []);
        const rawUsers = Array.isArray(usersResponse)
          ? usersResponse
          : usersResponse?.data || usersResponse?.users || [];
        const filteredUsers = currentUserId
          ? rawUsers.filter((u) => String(u._id) !== String(currentUserId))
          : rawUsers;
        const blockedEntries =
          blockedResponse?.data ||
          blockedResponse?.users ||
          (Array.isArray(blockedResponse) ? blockedResponse : []);
        setBlockedUsers(blockedEntries);
        setAllUsers(
          removeBlockedUsersFromAllUsers(filteredUsers, blockedEntries),
        );
      } catch (err) {
        console.error("Failed to sync block status in sidebar:", err);
      }
    };

    window.addEventListener(
      "vibe:conversation-block-changed",
      handleBlockChanged,
    );
    return () => {
      window.removeEventListener(
        "vibe:conversation-block-changed",
        handleBlockChanged,
      );
    };
  }, [currentUserId, removeBlockedUsersFromAllUsers]);

  // Join rooms for all conversations
  useEffect(() => {
    if (!socket || conversations.length === 0) return;

    conversations.forEach((c) => {
      const id = String(c._id);
      if (!joinedConversationIdsRef.current.has(id)) {
        socket.emit("joinConversation", id);
        joinedConversationIdsRef.current.add(id);
      }
    });
  }, [socket, conversations]);

  // Listen for global event to open the new direct message modal
  useEffect(() => {
    const handleOpenNewDM = () => setShowNewDMModal(true);
    window.addEventListener("vibe:open-new-dm", handleOpenNewDM);
    return () => {
      window.removeEventListener("vibe:open-new-dm", handleOpenNewDM);
    };
  }, []);

  // Real-time socket listeners for incoming messages and notifications in sidebar
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const convId =
        typeof msg.conversation === "object"
          ? msg.conversation?._id || msg.conversation?.id
          : msg.conversation;
      if (!convId) return;

      const senderId =
        typeof msg.sender === "object"
          ? msg.sender?._id || msg.sender?.id
          : msg.sender;
      const isFromMe = String(senderId) === String(currentUserId);

      // Join socket room for new conversation if not already joined
      if (!joinedConversationIdsRef.current.has(String(convId))) {
        socket.emit("joinConversation", String(convId));
        joinedConversationIdsRef.current.add(String(convId));
      }

      setConversations((prev) => {
        const index = prev.findIndex((c) => String(c._id) === String(convId));
        if (index === -1) {
          // New conversation not in local list, fetch fresh list
          getMyConversations()
            .then((refreshed) => {
              if (refreshed) setConversations(refreshed);
            })
            .catch(console.error);
          return prev;
        }

        const existing = prev[index];
        const unreadBy = Array.isArray(existing.unreadBy)
          ? [...existing.unreadBy]
          : [];
        if (
          !isFromMe &&
          !unreadBy.some((id) => String(id) === String(currentUserId))
        ) {
          unreadBy.push(currentUserId);
        }

        const updated = {
          ...existing,
          lastMessageAt: msg.createdAt || new Date().toISOString(),
          updatedAt: msg.createdAt || new Date().toISOString(),
          unreadBy,
        };

        const next = [...prev];
        next.splice(index, 1);
        return [updated, ...next];
      });
    };

    const handleMessagesRead = ({ conversationId, userId }) => {
      if (String(userId) !== String(currentUserId)) return;
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) === String(conversationId)) {
            return {
              ...c,
              unreadBy: (c.unreadBy || []).filter(
                (id) => String(id) !== String(currentUserId),
              ),
            };
          }
          return c;
        }),
      );
    };

    const handleNewNotification = ({ conversationId }) => {
      if (!conversationId) return;
      setConversations((prev) => {
        const found = prev.some(
          (c) => String(c._id) === String(conversationId),
        );
        if (!found) {
          getMyConversations()
            .then((refreshed) => {
              if (refreshed) setConversations(refreshed);
            })
            .catch(console.error);
          return prev;
        }
        return prev.map((c) => {
          if (String(c._id) === String(conversationId)) {
            const unreadBy = Array.isArray(c.unreadBy) ? [...c.unreadBy] : [];
            if (!unreadBy.some((id) => String(id) === String(currentUserId))) {
              unreadBy.push(currentUserId);
            }
            return {
              ...c,
              lastMessageAt: new Date().toISOString(),
              unreadBy,
            };
          }
          return c;
        });
      });
    };

    const handleMessageDeleted = ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(conversationId) ? { ...c } : c,
        ),
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("newNotification", handleNewNotification);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("newNotification", handleNewNotification);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, currentUserId]);

  const handleSelectExistingConversation = (conv) => {
    if (conv.isGroup) {
      setActiveGroupId(conv._id);
      setActiveChatId(conv._id);
    } else {
      setActiveGroupId(null);
      setActiveChatId(conv._id);
    }

    if (window.innerWidth <= 991) {
      setIsCollapsed(true);
    }

    if (onSelectChat) {
      const recipient = conv.isGroup
        ? null
        : getDMRecipient(conv, currentUserId);
      const name = conv.isGroup ? conv.name : getUserDisplayName(recipient);
      const isBlockedByOther =
        !conv.isGroup &&
        Array.isArray(conv.blockedBy) &&
        recipient?._id &&
        conv.blockedBy.some((id) => String(id) === String(recipient._id));

      onSelectChat({
        id: conv._id,
        name,
        avatarUrl: conv.isGroup ? conv.avatarUrl : recipient?.avatarUrl,
        recipientId: conv.isGroup ? undefined : recipient?._id,
        isGroup: Boolean(conv.isGroup),
        isBlockedByOther: Boolean(isBlockedByOther),
      });
    }
  };

  const handleChatSelect = (payload) => {
    if (window.innerWidth <= 991) {
      setIsCollapsed(true);
    }
    if (onSelectChat) {
      onSelectChat(payload);
    }
  };

  const handleConversationCreated = (conv, targetUser) => {
    setConversations((prev) =>
      prev.some((c) => c._id === conv._id)
        ? prev.map((c) => (c._id === conv._id ? conv : c))
        : [conv, ...prev],
    );

    setActiveChatId(conv._id);
    setActiveGroupId(conv.isGroup ? conv._id : null);

    if (window.innerWidth <= 991) {
      setIsCollapsed(true);
    }

    if (onSelectChat) {
      const recipient = targetUser || getDMRecipient(conv, currentUserId);
      const name = conv.isGroup ? conv.name : getUserDisplayName(recipient);
      onSelectChat({
        id: conv._id,
        name,
        avatarUrl: conv.isGroup ? conv.avatarUrl : recipient?.avatarUrl,
        recipientId: conv.isGroup ? undefined : recipient?._id,
        isGroup: Boolean(conv.isGroup),
      });
    }

    setShowNewDMModal(false);
    setShowNewGroupModal(false);
  };

  const closeDropdown = (e) => {
    if (e) e.stopPropagation();
    const openDropdowns = document.querySelectorAll(".chat-options-btn.show");
    openDropdowns.forEach((btn) => {
      if (window.bootstrap?.Dropdown) {
        const instance = window.bootstrap.Dropdown.getInstance(btn);
        if (instance) instance.hide();
      } else {
        btn.click();
      }
    });
  };

  const handleHideChat = async (e, convId) => {
    closeDropdown(e);
    try {
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
      console.error("Failed to toggle pin:", err);
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
      console.error("Failed to toggle mute:", err);
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

  const openBlockedUsersModal = async () => {
    setShowBlockedUsersModal(true);
    setBlockedUsersError("");
    setLoadingBlockedUsers(true);

    try {
      const res = await getBlockedUsers();
      const blockedEntries =
        res?.data || res?.users || (Array.isArray(res) ? res : []);
      setBlockedUsers(blockedEntries);
      setAllUsers((prev) =>
        removeBlockedUsersFromAllUsers(prev, blockedEntries),
      );
    } catch (err) {
      setBlockedUsers([]);
      setBlockedUsersError("Failed to load blocked users.");
    } finally {
      setLoadingBlockedUsers(false);
    }
  };

  const handleUnblockFromModal = async (conversationId) => {
    try {
      await unblockUser(conversationId);
      const nextBlockedUsers = blockedUsers.filter(
        (entry) => String(entry.conversationId) !== String(conversationId),
      );
      setBlockedUsers(nextBlockedUsers);

      window.dispatchEvent(
        new CustomEvent("vibe:conversation-block-changed", {
          detail: { conversationId, blocked: false },
        }),
      );

      const [refreshed, usersResponse] = await Promise.all([
        getMyConversations(),
        getAllUsers(),
      ]);

      setConversations(refreshed || []);
      const rawUsers = Array.isArray(usersResponse)
        ? usersResponse
        : usersResponse?.data || usersResponse?.users || [];

      const filteredUsers = currentUserId
        ? rawUsers.filter((u) => String(u._id) !== String(currentUserId))
        : rawUsers;

      setAllUsers(
        removeBlockedUsersFromAllUsers(filteredUsers, nextBlockedUsers),
      );
    } catch (err) {
      setBlockedUsersError("Failed to unblock user.");
    }
  };

  const handleGroupUpdated = (updatedGroup) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === updatedGroup._id ? { ...c, ...updatedGroup } : c,
      ),
    );
    if (onChatUpdated) {
      onChatUpdated(updatedGroup._id, {
        name: updatedGroup.name,
        avatarUrl: updatedGroup.avatarUrl,
      });
    }
  };

  const handleGroupLeft = (groupId) => {
    setConversations((prev) => prev.filter((c) => c._id !== groupId));
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
      setActiveChatId(null);
      if (onSelectChat) onSelectChat(null);
    }
  };

  const handleChatDragStart = (e, name, avatarUrl, chat) => {
    e.dataTransfer.setData("text/plain", chat._id || chat.id);
    e.dataTransfer.effectAllowed = "copyMove";

    const previewEl = buildChatDragPreview(name, avatarUrl);
    e.dataTransfer.setDragImage(previewEl, 20, 20);
    setTimeout(() => previewEl.remove(), 0);

    if (onChatDragStart) {
      onChatDragStart(e, chat); // chat is already enriched from ConversationItem
    }
  };

  // Memoized categorization of group chats vs direct messages
  const { groupChats, directMessages } = useMemo(() => {
    const groups = conversations.filter((c) => c.isGroup);
    const dms = conversations
      .filter((c) => {
        if (c.isGroup) return false;
        const isBlockedByMe =
          Array.isArray(c.blockedBy) &&
          c.blockedBy.some((id) => String(id) === String(currentUserId));
        return !isBlockedByMe;
      })
      .sort((a, b) => {
        const aPinned = a.pinnedBy?.includes(currentUserId) ? 1 : 0;
        const bPinned = b.pinnedBy?.includes(currentUserId) ? 1 : 0;
        if (bPinned !== aPinned) return bPinned - aPinned;

        const aTime = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
        return bTime - aTime;
      });

    return { groupChats: groups, directMessages: dms };
  }, [conversations, currentUserId]);

  const activeGroup = groupChats.find((g) => g._id === activeGroupId) || null;
  const currentUserAvatar = resolveMediaUrl(user?.avatarUrl);
  const currentUserDisplayName = getUserDisplayName(user);
  const status = myStatus || user?.status || "offline";

  return (
    <div
      className={`sidebar-dark sidebar-root d-flex ${isCollapsed ? "sidebar-collapsed" : ""}`}
      style={{
        width: isCollapsed ? "var(--sbd-rail-w)" : "var(--sbd-total-w)",
        backgroundColor: "var(--sbd-bg)",
        borderRight: "1px solid var(--sbd-border)",
      }}
    >
      {/* Mini Icon Rail */}
      <div
        className="sidebar-rail d-flex flex-column align-items-center py-3 flex-shrink-0"
        style={{
          width: "var(--sbd-rail-w)",
          backgroundColor: "var(--sbd-rail)",
          borderRight: "1px solid var(--sbd-border)",
          zIndex: 2,
        }}
      >
        <button
          className="sidebar-rail-btn btn p-0 mb-3 rounded-3 overflow-hidden d-flex align-items-center justify-content-center"
          title="Vibe Home"
          onClick={() => {
            setActiveGroupId(null);
            navigate("/");
          }}
          style={{ width: "42px", height: "42px" }}
        >
          <img
            src={Logo}
            alt="Vibe"
            style={{ width: "26px", height: "26px", objectFit: "contain" }}
          />
        </button>

        <div className="sidebar-rail-divider mb-3" />

        {/* Direct Messages Icon */}
        <button
          className={`sidebar-rail-btn btn p-0 mb-2 rounded-circle d-flex align-items-center justify-content-center ${
            activeGroupId === null && !isCollapsed ? "active" : ""
          }`}
          title="Direct Messages"
          onClick={() => {
            if (activeGroupId === null) {
              setIsCollapsed((prev) => !prev);
            } else {
              setActiveGroupId(null);
              setIsCollapsed(false);
            }
          }}
          style={{ width: "42px", height: "42px" }}
        >
          <i className="bi bi-chat-dots-fill fs-5" />
        </button>

        {/* Group Chat Icons */}
        <div className="d-flex flex-column align-items-center gap-2 overflow-auto w-100 flex-grow-1 sidebar-groups-scroll">
          {groupChats.map((group) => {
            const isActive = activeGroupId === group._id;
            const groupAvatar = group.avatarUrl
              ? resolveMediaUrl(group.avatarUrl)
              : null;
            const initial = (group.name || "G").charAt(0).toUpperCase();

            return (
              <button
                key={group._id}
                className={`sidebar-rail-btn btn p-0 rounded-circle d-flex align-items-center justify-content-center overflow-hidden position-relative ${
                  isActive ? "active" : ""
                }`}
                title={group.name}
                onClick={() => {
                  setActiveGroupId(group._id);
                  setActiveChatId(group._id);
                  if (window.innerWidth <= 991) {
                    setIsCollapsed(true);
                  }
                  if (onSelectChat) {
                    onSelectChat({
                      id: group._id,
                      name: group.name,
                      avatarUrl: group.avatarUrl,
                      isGroup: true,
                    });
                  }
                }}
                style={{ width: "42px", height: "42px" }}
              >
                {groupAvatar ? (
                  <img
                    src={groupAvatar}
                    alt={group.name}
                    className="w-100 h-100"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="fw-bold small">{initial}</span>
                )}
              </button>
            );
          })}

          <button
            className="sidebar-rail-btn btn p-0 mt-1 rounded-circle d-flex align-items-center justify-content-center"
            title="Create New Group"
            onClick={() => setShowNewGroupModal(true)}
            style={{
              width: "42px",
              height: "42px",
              color: "var(--sbd-accent)",
            }}
          >
            <i className="bi bi-plus-lg fs-5" />
          </button>
        </div>

        {/* Rail Collapse / Expand Toggle Button */}
        <button
          className="sidebar-rail-btn btn p-0 mt-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setIsCollapsed((prev) => !prev)}
          style={{
            width: "42px",
            height: "42px",
          }}
        >
          <i
            className={`bi ${isCollapsed ? "bi-chevron-double-right" : "bi-chevron-double-left"} fs-6`}
          />
        </button>
      </div>

      {/* Main Sidebar Content */}
      <div
        className="sidebar-content flex-grow-1 d-flex flex-column"
        style={{
          backgroundColor: "var(--sbd-panel)",
          minWidth: 0,
        }}
      >
        {activeGroup ? (
          <GroupMembersPanel
            group={activeGroup}
            currentUserId={currentUserId}
            getUserStatus={getUserStatus}
            allUsers={allUsers}
            onGroupUpdated={handleGroupUpdated}
            onGroupLeft={handleGroupLeft}
          />
        ) : (
          <>
            {/* Sidebar Top Search & Header */}
            <div
              className="p-3 pb-2 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--sbd-border)" }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span
                  className="fw-bold fs-6"
                  style={{ color: "var(--sbd-text)" }}
                >
                  Messages
                </span>
                <div className="d-flex align-items-center gap-1">
                  <button
                    className="btn btn-sm sidebar-ghost-btn p-1 rounded-2"
                    title="Collapse sidebar"
                    onClick={() => setIsCollapsed(true)}
                    style={{ width: "30px", height: "30px" }}
                  >
                    <i className="bi bi-layout-sidebar-inset" />
                  </button>
                  <button
                    className="btn btn-sm sidebar-ghost-btn p-1 rounded-2"
                    title="Blocked Contacts"
                    onClick={openBlockedUsersModal}
                    style={{ width: "30px", height: "30px" }}
                  >
                    <i className="bi bi-slash-circle" />
                  </button>
                  <button
                    className="btn btn-sm sidebar-ghost-btn p-1 rounded-2"
                    title="New Direct Message"
                    onClick={() => setShowNewDMModal(true)}
                    style={{ width: "30px", height: "30px" }}
                  >
                    <i className="bi bi-pencil-square" />
                  </button>
                </div>
              </div>

              <ConversationSearch
                conversations={conversations}
                allUsers={allUsers}
                currentUserId={currentUserId}
                getUserStatus={getUserStatus}
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onSelectConversation={handleSelectExistingConversation}
                onSelectNewUser={() => {
                  setShowNewDMModal(true);
                }}
              />
            </div>

            {/* Conversation List */}
            <div className="flex-grow-1 overflow-auto p-2 d-flex flex-column gap-1 sidebar-list-scroll">
              {loading ? (
                <div className="d-flex justify-content-center py-4">
                  <span className="spinner-border spinner-border-sm text-secondary" />
                </div>
              ) : directMessages.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <i className="bi bi-chat-square-dots display-6 text-muted mb-2 d-block" />
                  <p className="small text-muted mb-0">
                    No direct messages yet.
                  </p>
                </div>
              ) : (
                directMessages.map((chat) => (
                  <ConversationItem
                    key={chat._id}
                    chat={chat}
                    currentUserId={currentUserId}
                    activeChatId={activeChatId}
                    getUserStatus={getUserStatus}
                    onSelectChat={handleChatSelect}
                    onToggleReadStatus={handleToggleReadStatus}
                    onTogglePin={handleTogglePin}
                    onToggleMute={handleToggleMute}
                    onHideChat={handleHideChat}
                    onDragStart={handleChatDragStart}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* User Profile Footer */}
        <div
          className="d-flex align-items-center gap-2 p-2 mt-auto flex-shrink-0"
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
              <StatusDot status={status} />
            </span>

            <div className="d-flex flex-column overflow-hidden flex-grow-1">
              <span
                className="fw-semibold text-truncate small"
                style={{ color: "var(--sbd-text)" }}
              >
                {currentUserDisplayName}
              </span>
              <span className="text-muted extra-small">
                @{user?.username || "me"}
              </span>
            </div>
          </button>

          <NotificationDropdown
            onSelectChat={(chat) => {
              const fullChat = conversations.find(
                (c) => String(c._id) === String(chat.id || chat._id),
              );
              if (fullChat) {
                handleSelectExistingConversation(fullChat);
              } else {
                handleChatSelect(chat);
              }
            }}
            variant="dark"
          />

          <button
            className="btn btn-sm sidebar-ghost-btn rounded-2 p-1"
            title="Settings"
            onClick={() => navigate("/profile/edit")}
            style={{ width: "32px", height: "32px" }}
          >
            <i className="bi bi-gear" />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop when sidebar is expanded */}
      {!isCollapsed && (
        <div
          className="sidebar-mobile-backdrop d-lg-none"
          onClick={() => setIsCollapsed(true)}
          title="Close sidebar"
        />
      )}

      {/* Modals */}
      <NewDirectMessageModal
        show={showNewDMModal}
        onClose={() => setShowNewDMModal(false)}
        allUsers={allUsers}
        getUserStatus={getUserStatus}
        onCreated={handleConversationCreated}
      />

      <NewGroupModal
        show={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        allUsers={allUsers}
        onCreated={(conv) => handleConversationCreated(conv, null)}
      />

      <BlockedUsersModal
        show={showBlockedUsersModal}
        onClose={() => setShowBlockedUsersModal(false)}
        blockedUsers={blockedUsers}
        loading={loadingBlockedUsers}
        error={blockedUsersError}
        onUnblock={handleUnblockFromModal}
      />
    </div>
  );
};

export default Sidebar;

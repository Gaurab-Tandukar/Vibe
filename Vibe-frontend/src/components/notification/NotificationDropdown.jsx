import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markBatchNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notificationService";
import "../css/Notification.css";

const formatRelativeTime = (isoString) => {
  if (!isoString) return "";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

const getNotifKey = (notif) =>
  notif._id ||
  `group-${notif.conversationId}-${notif.notificationIds?.join(",")}`;

export default function NotificationDropdown({
  onSelectChat,
  variant = "dark",
}) {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const fetchNotificationData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [listRes, countRes] = await Promise.all([
        getNotifications(30),
        getUnreadNotificationCount(),
      ]);
      setNotifications(listRes?.notifications || []);
      setUnreadCount(countRes?.count || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotificationData(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      const incomingId = data.messageId || String(Date.now());

      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => {
        if (prev.some((n) => n._id === incomingId)) return prev;

        return [
          {
            _id: incomingId,
            conversationId: data.conversationId,
            conversationName: data.sender || "New Message",
            sender: data.sender || "Someone",
            preview: data.preview || "Sent a message",
            isRead: false,
            createdAt: new Date().toISOString(),
            type: "single",
          },
          ...prev,
        ];
      });
    };

    const handleNewMessage = () => {
      getUnreadNotificationCount()
        .then((res) => setUnreadCount(res?.count || 0))
        .catch(() => {});
    };

    const handleMessagesRead = () => {
      getUnreadNotificationCount()
        .then((res) => setUnreadCount(res?.count || 0))
        .catch(() => {});
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("newMessage", handleNewMessage);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotificationData();
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();

    const prevNotifications = notifications;
    const prevUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, unreadCount: 0 })),
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  const handleDeleteNotification = async (e, notif) => {
    e.stopPropagation();
    const key = getNotifKey(notif);
    try {
      if (notif.type === "group") {
        await Promise.all(
          notif.notificationIds.map((id) => deleteNotification(id)),
        );
      } else {
        await deleteNotification(notif._id);
      }

      const wasUnreadCount =
        notif.type === "group" ? notif.unreadCount || 0 : notif.isRead ? 0 : 1;

      setNotifications((prev) => prev.filter((n) => getNotifKey(n) !== key));
      if (wasUnreadCount > 0) {
        setUnreadCount((c) => Math.max(0, c - wasUnreadCount));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    const key = getNotifKey(notif);
    const isGroupUnread = notif.type === "group" && notif.unreadCount > 0;
    const isSingleUnread = notif.type !== "group" && !notif.isRead;

    if (isGroupUnread || isSingleUnread) {
      try {
        if (notif.type === "group") {
          await markBatchNotificationsAsRead(notif.notificationIds);
        } else {
          await markNotificationAsRead(notif._id);
        }

        setNotifications((prev) =>
          prev.map((n) =>
            getNotifKey(n) === key ? { ...n, isRead: true, unreadCount: 0 } : n,
          ),
        );
        setUnreadCount((c) =>
          Math.max(0, c - (notif.type === "group" ? notif.unreadCount : 1)),
        );
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    const chatPayload = {
      id: notif.conversationId,
      _id: notif.conversationId,
      name: notif.conversationName || notif.sender || "Chat",
    };

    if (onSelectChat) {
      onSelectChat(chatPayload);
    } else {
      window.dispatchEvent(
        new CustomEvent("vibe:open-chat", { detail: { chat: chatPayload } }),
      );
      navigate("/chat", { state: { openChat: chatPayload } });
    }
  };

  return (
    <div
      className="position-relative notification-dropdown-wrapper"
      ref={dropdownRef}
    >
      <button
        type="button"
        className={`btn p-0 d-flex align-items-center justify-content-center position-relative notification-bell-btn ${
          variant === "light"
            ? "notification-bell-light"
            : "notification-bell-dark"
        } ${isOpen ? "active" : ""}`}
        onClick={handleToggle}
        title="Notifications"
        aria-expanded={isOpen}
      >
        <i className="bi bi-bell-fill" style={{ fontSize: "1.2rem" }} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popup shadow-lg overflow-hidden">
          {/* Header */}
          <div className="notification-popup-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold fs-6 notification-title">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="badge rounded-pill notification-count-chip">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-sm notification-action-btn d-flex align-items-center gap-1.5"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <i className="bi bi-check2-all" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="notification-list overflow-auto">
            {loading && notifications.length === 0 ? (
              <div className="d-flex justify-content-center py-5">
                <span className="spinner-border spinner-border-sm text-success" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-5 px-3">
                <div className="notification-empty-icon mb-3">
                  <i className="bi bi-bell-slash fs-1" />
                </div>
                <p className="small text-light mb-1 fw-medium">
                  No notifications yet
                </p>
                <span className="extra-small text-muted">
                  When you receive messages, they'll appear here.
                </span>
              </div>
            ) : (
              notifications.map((notif) => {
                const key = getNotifKey(notif);
                const isUnread =
                  notif.type === "group"
                    ? notif.unreadCount > 0
                    : !notif.isRead;

                return (
                  <div
                    key={key}
                    className={`notification-item d-flex align-items-start gap-3 px-3 py-3 position-relative ${
                      isUnread ? "notification-item-unread" : ""
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notif)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNotificationClick(notif);
                      }
                    }}
                  >
                    <div className="notification-avatar flex-shrink-0">
                      <span>
                        {(notif.sender || notif.conversationName || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-grow-1 overflow-hidden">
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                        <span className="fw-semibold text-truncate notification-sender-name">
                          {notif.conversationName || notif.sender}
                        </span>
                        <span className="notification-time flex-shrink-0">
                          {formatRelativeTime(
                            notif.createdAt || notif.latestCreatedAt,
                          )}
                        </span>
                      </div>

                      <p className="notification-preview text-truncate mb-0">
                        {notif.preview || "Sent a message"}
                      </p>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {isUnread && <span className="notification-unread-dot" />}
                      <button
                        type="button"
                        className="btn btn-sm p-0 notification-delete-btn d-flex align-items-center justify-content-center"
                        title="Remove notification"
                        onClick={(e) => handleDeleteNotification(e, notif)}
                      >
                        <i className="bi bi-x-lg" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

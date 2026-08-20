import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCall } from "../hooks/useCall";
import { useSocket } from "../context/SocketContext";
import {
  getMessages,
  sendMessage as sendMessageApi,
  deleteMessage as deleteMessageApi,
  markMessagesRead,
} from "../api/messageService";
import { toggleReaction } from "../api/reactionService";
import { uploadAttachment } from "../api/attachmentService";
import { blockUser, unblockUser } from "../api/conversationService";
import { resolveMediaUrl } from "../utils/mediaUrl";
import doodlePattern from "../assets/doodle-pattern.svg";
import "./css/ChatWindow.css";
import "./css/Call.css";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

// How long we wait after the last keystroke before telling the room
// the user stopped typing.
const TYPING_DEBOUNCE_MS = 1500;
// Defensive auto-expiry for a remote user's typing state, in case their
// "stopTyping" event is lost (tab closed, network blip, etc).
const TYPING_EXPIRY_MS = 4000;

const formatFileSize = (bytes) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatRelativeTime = (isoString) => {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
};

// Circular avatar with an image + graceful initials fallback.
function Avatar({
  sender,
  show = true,
  size = 32,
  fallbackBg = "bg-secondary",
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!show) {
    return (
      <span className="flex-shrink-0" style={{ width: size, height: size }} />
    );
  }

  const rawUrl = sender?.avatarUrl;
  const avatarUrl = rawUrl ? resolveMediaUrl(rawUrl) : null;
  const showImage = Boolean(avatarUrl) && !imgFailed;
  const initial = (sender?.username || sender?.name || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <span
      className={`rounded-circle flex-shrink-0 overflow-hidden d-flex align-items-center justify-content-center text-white fw-bold shadow-sm ${fallbackBg}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      title={sender?.username || sender?.name}
    >
      {showImage ? (
        <img
          src={avatarUrl}
          alt={sender?.username || sender?.name || "User"}
          className="w-100 h-100"
          style={{ objectFit: "cover" }}
          onError={() => setImgFailed(true)}
        />
      ) : (
        initial
      )}
    </span>
  );
}

export default function ChatWindow({
  chatId,
  name,
  avatarUrl,
  recipientId,
  recipientUsername,
  isGroup,
  initialIsBlocked = false,
  initialIsBlockedByOther = false,
  onClose, // parent can pass a function to close this tab
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const { socket, onlineUsers, lastSeenMap } = useSocket();
  const { call, startCall } = useCall();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [openPickerFor, setOpenPickerFor] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Conversation-level state
  const [isBlocked, setIsBlocked] = useState(Boolean(initialIsBlocked));
  const [isBlockedByOther, setIsBlockedByOther] = useState(
    Boolean(initialIsBlockedByOther),
  );

  // Simple toast
  const [toast, setToast] = useState(null);

  // Modal State for Deleting
  const [messageToDelete, setMessageToDelete] = useState(null);

  // userId -> { username, avatarUrl }
  const [typingUsers, setTypingUsers] = useState(new Map());

  const isConversationBlocked = isBlocked || isBlockedByOther;
  const blockedNotice = isBlocked
    ? "You blocked this user. Unblock to continue messaging."
    : "This user has blocked you. Messaging is disabled.";

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const typingExpiryTimeoutsRef = useRef(new Map());

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const clearAllTypingExpiryTimers = () => {
    typingExpiryTimeoutsRef.current.forEach((timeoutId) =>
      clearTimeout(timeoutId),
    );
    typingExpiryTimeoutsRef.current.clear();
  };

  // ─── Fetch messages + join room ───────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;
    isInitialLoadRef.current = true;

    async function fetchChatData() {
      setLoading(true);
      try {
        const data = await getMessages(chatId);
        if (isMounted) setMessages(data.messages || []);
      } catch (err) {
        console.error("Failed to load messages:", err?.response?.data || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchChatData();
    markMessagesRead(chatId).catch((err) =>
      console.error("Failed to mark as read:", err?.response?.data || err),
    );

    socket?.emit("joinConversation", chatId);

    return () => {
      isMounted = false;
      setReplyingTo(null);
      setPendingAttachment(null);
      setUploadError(null);
      setOpenPickerFor(null);
      setMessageToDelete(null);

      if (isTypingRef.current) {
        socket?.emit("stopTyping", chatId);
        isTypingRef.current = false;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      clearAllTypingExpiryTimers();
      setTypingUsers(new Map());

      socket?.emit("leaveConversation", chatId);
    };
  }, [chatId, socket]);

  // ─── Scroll to Bottom on Initial Load & Chat Switch ───────────────────────
  useLayoutEffect(() => {
    if (!loading && messages.length > 0 && isInitialLoadRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
      isInitialLoadRef.current = false;
    }
  }, [loading, chatId, messages.length]);

  // ─── Auto-scroll for incoming/sent messages ──────────────────────────────
  useEffect(() => {
    if (loading || isInitialLoadRef.current || !chatContainerRef.current)
      return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 180;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  // ─── Auto-scroll when the typing indicator appears ───────────────────────
  useEffect(() => {
    if (loading || isInitialLoadRef.current || !chatContainerRef.current)
      return;
    if (typingUsers.size === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 180;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingUsers, loading]);

  // ─── Live socket updates ──────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !chatId) return;

    const belongsHere = (conversation) => {
      const id =
        typeof conversation === "object" ? conversation._id : conversation;
      return String(id) === String(chatId);
    };

    const handleNewMessage = (msg) => {
      if (!belongsHere(msg.conversation)) return;
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };

    const handleMessageEdited = (msg) => {
      if (!belongsHere(msg.conversation)) return;
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? msg : m)));
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (!belongsHere(conversationId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                isDeleted: true,
                content: "",
                attachments: [],
                reactions: [],
              }
            : m,
        ),
      );
    };

    const handleReactionUpdated = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)),
      );
    };

    const clearTypingFor = (userId) => {
      setTypingUsers((prev) => {
        if (!prev.has(userId)) return prev;
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      const existingTimeout = typingExpiryTimeoutsRef.current.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingExpiryTimeoutsRef.current.delete(userId);
      }
    };

    const handleUserTyping = ({
      conversationId,
      userId,
      username,
      avatarUrl: typerAvatarUrl,
    }) => {
      if (!belongsHere(conversationId)) return;
      if (String(userId) === String(currentUserId)) return;

      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, { username, avatarUrl: typerAvatarUrl });
        return next;
      });

      const existingTimeout = typingExpiryTimeoutsRef.current.get(userId);
      if (existingTimeout) clearTimeout(existingTimeout);
      const timeoutId = setTimeout(() => {
        clearTypingFor(userId);
      }, TYPING_EXPIRY_MS);
      typingExpiryTimeoutsRef.current.set(userId, timeoutId);
    };

    const handleUserStoppedTyping = ({ conversationId, userId }) => {
      if (!belongsHere(conversationId)) return;
      clearTypingFor(userId);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("reactionUpdated", handleReactionUpdated);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("reactionUpdated", handleReactionUpdated);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [socket, chatId, currentUserId]);

  // ─── Dismiss Reaction Picker on Click Outside or Scroll ──────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        openPickerFor &&
        !e.target.closest(".reaction-picker") &&
        !e.target.closest(".reaction-picker-btn")
      ) {
        setOpenPickerFor(null);
      }
    };

    const handleContainerScroll = () => {
      if (openPickerFor) setOpenPickerFor(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleContainerScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      if (container) {
        container.removeEventListener("scroll", handleContainerScroll);
      }
    };
  }, [openPickerFor]);

  // ─── Scroll to Replied Message ────────────────────────────────────────────
  const scrollToMessage = (messageId) => {
    if (!messageId || !chatContainerRef.current) return;

    const targetElement = document.getElementById(`msg-${messageId}`);
    if (targetElement) {
      const containerTop = chatContainerRef.current.getBoundingClientRect().top;
      const targetTop = targetElement.getBoundingClientRect().top;
      const offsetTop =
        targetTop - containerTop + chatContainerRef.current.scrollTop - 16;

      chatContainerRef.current.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
  };

  // ─── Trigger Reply Action ────────────────────────────────────────────────
  const handleStartReply = (msg) => {
    if (isConversationBlocked) return;
    setReplyingTo(msg);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // ─── Typing signal (debounced) ────────────────────────────────────────────
  const handleInputChange = (e) => {
    if (isConversationBlocked) return;
    const value = e.target.value;
    setInputText(value);

    if (!socket || !chatId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", chatId);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stopTyping", chatId);
    }, TYPING_DEBOUNCE_MS);
  };

  // ─── File upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    if (isConversationBlocked) return;
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const meta = await uploadAttachment(file);
      setPendingAttachment(meta);
    } catch (err) {
      console.error("Failed to upload attachment:", err?.response?.data || err);
      setUploadError(
        err?.response?.data?.message || "Upload failed. Try a different file.",
      );
    } finally {
      setUploading(false);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();

      const text = inputText.trim();
      if (
        (!text && !pendingAttachment) ||
        sending ||
        uploading ||
        isConversationBlocked
      )
        return;

      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket?.emit("stopTyping", chatId);
      }

      setSending(true);
      setInputText("");

      const replyToId = replyingTo?._id;
      const attachmentsPayload = pendingAttachment
        ? [pendingAttachment]
        : undefined;

      setReplyingTo(null);
      setPendingAttachment(null);

      try {
        await sendMessageApi({
          conversationId: chatId,
          content: text,
          replyTo: replyToId,
          attachments: attachmentsPayload,
        });

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 80);
      } catch (err) {
        console.error("Failed to send message:", err?.response?.data || err);
        if (
          err?.response?.status === 403 &&
          /cannot send messages in this conversation/i.test(
            err?.response?.data?.message || "",
          )
        ) {
          setIsBlockedByOther(true);
        }
        setInputText(text);
        if (attachmentsPayload?.[0])
          setPendingAttachment(attachmentsPayload[0]);
      } finally {
        setSending(false);
      }
    },
    [
      chatId,
      inputText,
      sending,
      uploading,
      replyingTo,
      pendingAttachment,
      socket,
      isConversationBlocked,
    ],
  );

  // ─── Delete / React ───────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessageApi(messageToDelete);
    } catch (err) {
      console.error("Failed to delete message:", err?.response?.data || err);
    } finally {
      setMessageToDelete(null);
    }
  };

  const handleReact = async (messageId, emoji) => {
    if (isConversationBlocked) return;
    setOpenPickerFor(null);
    try {
      await toggleReaction(messageId, emoji);
    } catch (err) {
      console.error("Failed to react:", err?.response?.data || err);
    }
  };

  const handleDoubleClickMessage = (msg) => {
    if (msg.isDeleted || isConversationBlocked) return;
    handleReact(msg._id, "❤️");
  };

  // ─── Info popup actions ───────────────────────────────────────────────────
  const handleViewProfile = () => {
    if (isGroup || !recipientUsername) return;
    navigate(`/profile/${recipientUsername}`);
  };

  // ─── Block / Unblock ──────────────────────────────────────────────────────
  const handleToggleBlock = async () => {
    if (!chatId || isGroup) return;

    const isBlockedByCurrentUser = (blockedByList) =>
      Array.isArray(blockedByList) &&
      currentUserId &&
      blockedByList.some((id) => String(id) === String(currentUserId));

    try {
      if (isBlocked) {
        // UNBLOCK
        const res = await unblockUser(chatId);
        const blockedBy = res?.data?.blockedBy;
        const nextBlocked = isBlockedByCurrentUser(blockedBy);
        setIsBlocked(nextBlocked);
        window.dispatchEvent(
          new CustomEvent("vibe:conversation-block-changed", {
            detail: { conversationId: chatId, blocked: nextBlocked },
          }),
        );
        showToast("User unblocked", "success");
      } else {
        // BLOCK
        const res = await blockUser(chatId);
        const blockedBy = res?.data?.blockedBy;
        const nextBlocked = isBlockedByCurrentUser(blockedBy) || true;
        setIsBlocked(nextBlocked);
        window.dispatchEvent(
          new CustomEvent("vibe:conversation-block-changed", {
            detail: { conversationId: chatId, blocked: nextBlocked },
          }),
        );
        showToast("User blocked", "success");

        // Close the tab after blocking
        if (typeof onClose === "function") {
          // small delay so user can see the toast
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch (err) {
      console.error("Failed to toggle block:", err?.response?.data || err);
      showToast(
        err?.response?.data?.message || "Something went wrong",
        "error",
      );
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const summarizeReactions = (reactions = []) => {
    if (!reactions.length) return [];

    const map = new Map();
    reactions.forEach((r) => {
      const entry = map.get(r.emoji) || {
        emoji: r.emoji,
        count: 0,
        mine: false,
      };
      entry.count += 1;

      const reactorId = typeof r.user === "object" ? r.user._id : r.user;
      if (String(reactorId) === String(currentUserId)) entry.mine = true;

      map.set(r.emoji, entry);
    });

    return Array.from(map.values());
  };

  const isLastInSenderGroup = (index) => {
    const current = messages[index];
    const next = messages[index + 1];
    if (!next) return true;

    const currentSenderId =
      typeof current.sender === "object" ? current.sender._id : current.sender;
    const nextSenderId =
      typeof next.sender === "object" ? next.sender._id : next.sender;

    return String(currentSenderId) !== String(nextSenderId);
  };

  const renderAttachment = (att, isMe) => {
    const url = resolveMediaUrl(att.fileUrl);

    if (att.fileType?.startsWith("image/")) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="d-block mb-1"
        >
          <img
            src={url}
            alt={att.fileName || "Image"}
            className="rounded-3 border-0 d-block"
            style={{ maxWidth: 280, maxHeight: 280, objectFit: "cover" }}
          />
        </a>
      );
    }

    if (att.fileType === "video/mp4") {
      return (
        <video
          controls
          className="rounded-3 mb-1 d-block border-0"
          style={{ maxWidth: 280 }}
          src={url}
        />
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`d-flex align-items-center gap-2 rounded-3 p-2 mb-1 text-decoration-none ${
          isMe
            ? "bg-success bg-opacity-25 text-white"
            : "bg-light text-dark border-0"
        }`}
      >
        <i className="bi bi-file-earmark-arrow-down fs-5" />
        <div className="overflow-hidden">
          <div
            className="text-truncate small fw-semibold"
            style={{ maxWidth: 180 }}
          >
            {att.fileName}
          </div>
          <div className="small opacity-75">{formatFileSize(att.fileSize)}</div>
        </div>
      </a>
    );
  };

  const typingEntries = Array.from(typingUsers.values());
  const firstTypingSender = typingEntries[0] || null;

  const isRecipientOnline = recipientId
    ? onlineUsers.has(String(recipientId))
    : false;
  const recipientLastSeen = recipientId
    ? lastSeenMap.get(String(recipientId))
    : null;
  const statusText = isGroup
    ? null
    : isRecipientOnline
      ? "Online"
      : recipientLastSeen
        ? `Offline · last seen ${formatRelativeTime(recipientLastSeen)}`
        : "Offline";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="d-flex flex-column h-100 w-100 bg-white overflow-hidden shadow-sm position-relative">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0 bg-white">
        <div
          className="d-flex align-items-center gap-2 overflow-hidden"
          style={{ cursor: isGroup ? "default" : "pointer" }}
          onClick={handleViewProfile}
          title={isGroup ? undefined : "View profile"}
        >
          <Avatar
            sender={{ username: name, avatarUrl }}
            size={40}
            fallbackBg="bg-success"
          />
          <div className="d-flex flex-column overflow-hidden">
            <span
              className="fw-semibold text-truncate mb-0"
              style={{ fontSize: "0.95rem" }}
            >
              {name}
            </span>
            <span
              className="text-muted small d-flex align-items-center gap-1"
              style={{ fontSize: "0.72rem" }}
            >
              {typingUsers.size > 0 ? (
                `${typingEntries.map((t) => t.username).join(", ")} typing...`
              ) : statusText ? (
                <>
                  <span
                    className="rounded-circle d-inline-block flex-shrink-0"
                    style={{
                      width: 7,
                      height: 7,
                      backgroundColor: isRecipientOnline
                        ? "#2ecc71"
                        : "#adb5bd",
                    }}
                  />
                  {statusText}
                </>
              ) : (
                `ID: ${chatId}`
              )}
            </span>
          </div>
        </div>

        {/* call buttons */}
        {!isGroup && recipientId && (
          <div className="chat-header-actions d-flex gap-1 flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
              style={{ width: 32, height: 32 }}
              title="Audio call"
              disabled={call.status !== "idle" || isConversationBlocked}
              onClick={() => startCall(recipientId, chatId, "audio")}
            >
              <i
                className="bi bi-telephone-fill"
                style={{ fontSize: "0.9rem" }}
              />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
              style={{ width: 32, height: 32 }}
              title="Video call"
              disabled={call.status !== "idle" || isConversationBlocked}
              onClick={() => startCall(recipientId, chatId, "video")}
            >
              <i
                className="bi bi-camera-video-fill"
                style={{ fontSize: "0.9rem" }}
              />
            </button>
          </div>
        )}
        {/* Info button + popup */}
        <div className="dropdown flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
            style={{ width: 32, height: 32 }}
            data-bs-toggle="dropdown"
            aria-expanded="false"
            title="Conversation info"
          >
            <i className="bi bi-info-circle" style={{ fontSize: "1rem" }} />
          </button>

          <ul className="dropdown-menu dropdown-menu-end shadow">
            {!isGroup && (
              <li>
                <button className="dropdown-item" onClick={handleViewProfile}>
                  <span>View profile</span>
                  <i className="bi bi-person" />
                </button>
              </li>
            )}
            {!isGroup && (
              <li>
                <button
                  className={`dropdown-item ${isBlocked ? "" : "text-danger"}`}
                  onClick={handleToggleBlock}
                >
                  <span>{isBlocked ? "Unblock" : "Block"}</span>
                  <i className="bi bi-slash-circle" />
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Messages Area */}
      {!isGroup && isConversationBlocked && (
        <div
          className="px-3 py-2 border-bottom"
          style={{ backgroundColor: "#fff4df", color: "#8a5a00" }}
        >
          <span className="small fw-semibold d-flex align-items-center gap-2">
            <i className="bi bi-slash-circle" />
            {blockedNotice}
          </span>
        </div>
      )}

      <div
        ref={chatContainerRef}
        className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 position-relative"
        style={{
          backgroundColor: "#eef3ea",
          backgroundImage: `url(${doodlePattern})`,
          backgroundRepeat: "repeat",
          backgroundSize: "320px 320px",
        }}
      >
        {loading ? (
          <div className="text-center text-muted small py-3 bg-white bg-opacity-75 rounded-pill mx-auto px-4 shadow-sm">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted small py-3 bg-white bg-opacity-75 rounded-pill mx-auto px-4 shadow-sm">
            No messages yet — say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const senderId =
              typeof msg.sender === "object" ? msg.sender._id : msg.sender;
            const isMe = String(senderId) === String(currentUserId);
            const isLatest = index === messages.length - 1;
            const isTopMessage = index < 2;
            const time = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            const reactionSummary = summarizeReactions(msg.reactions);
            const showAvatar = !isMe && isLastInSenderGroup(index);

            return (
              <div
                key={msg._id}
                id={`msg-${msg._id}`}
                className={`d-flex flex-column chat-bubble-row ${
                  isMe ? "align-items-end" : "align-items-start"
                }`}
              >
                <div
                  className="d-flex align-items-end gap-2 position-relative"
                  style={{ maxWidth: "70%" }}
                >
                  {/* Delete (own messages) */}
                  {isMe && !msg.isDeleted && (
                    <div className="chat-bubble-actions d-flex gap-1 order-0 mb-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
                        style={{ width: 28, height: 28, fontSize: "0.75rem" }}
                        title="Delete"
                        onClick={() => setMessageToDelete(msg._id)}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  )}

                  {/* Avatar (other users only) */}
                  {!isMe && (
                    <div className="order-first mb-0">
                      <Avatar sender={msg.sender} show={showAvatar} />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    onDoubleClick={() => handleDoubleClickMessage(msg)}
                    className={`position-relative px-3 py-2 rounded-4 shadow-sm chat-bubble-animated ${
                      isLatest ? "chat-bubble-latest" : ""
                    } ${
                      msg.isDeleted
                        ? "bg-light text-secondary border border-dashed"
                        : isMe
                          ? "bg-success text-white chat-bubble-me"
                          : "bg-white text-dark chat-bubble-other"
                    }`}
                    style={{
                      wordBreak: "break-word",
                      borderBottomRightRadius: isMe ? 4 : undefined,
                      borderBottomLeftRadius: !isMe ? 4 : undefined,
                      marginBottom: reactionSummary.length > 0 ? 10 : 0,
                      cursor: msg.isDeleted ? "default" : "pointer",
                    }}
                  >
                    {/* Floating Reaction Picker */}
                    {openPickerFor === msg._id && (
                      <div
                        className={`reaction-picker ${
                          isTopMessage
                            ? "reaction-picker-bottom"
                            : "reaction-picker-top"
                        }`}
                        style={isMe ? { right: 0 } : { left: 0 }}
                      >
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="btn btn-sm p-0 border-0"
                            style={{ fontSize: "1.2rem", lineHeight: 1 }}
                            onClick={() => handleReact(msg._id, emoji)}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Reply Preview */}
                    {!msg.isDeleted && msg.replyTo && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMessage(msg.replyTo._id);
                        }}
                        className={`mb-2 px-2 py-1 rounded-2 small reply-preview-clickable ${
                          isMe ? "--sage-bg bg-opacity-15" : "bg-light"
                        }`}
                        style={{
                          opacity: 0.9,
                          borderLeft: "3px solid currentColor",
                        }}
                      >
                        <div
                          className="fw-bold"
                          style={{ fontSize: "0.72rem" }}
                        >
                          {msg.replyTo.sender?.username || "Unknown"}
                        </div>
                        <div
                          className="text-truncate"
                          style={{ fontSize: "0.78rem" }}
                        >
                          {msg.replyTo.isDeleted
                            ? "This message was deleted"
                            : msg.replyTo.content}
                        </div>
                      </div>
                    )}

                    {/* Attachments */}
                    {!msg.isDeleted &&
                      msg.attachments?.map((att) => (
                        <div key={att._id || att.fileUrl}>
                          {renderAttachment(att, isMe)}
                        </div>
                      ))}

                    {/* Content */}
                    <p
                      className="mb-0"
                      style={{
                        fontSize: "0.95rem",
                        lineHeight: "1.4",
                        fontStyle: msg.isDeleted ? "italic" : "normal",
                      }}
                    >
                      {msg.isDeleted ? (
                        <span className="d-flex align-items-center gap-1 opacity-75">
                          <i className="bi bi-slash-circle" /> Message deleted
                        </span>
                      ) : (
                        msg.content
                      )}
                    </p>

                    {/* Reaction Badge */}
                    {reactionSummary.length > 0 && !msg.isDeleted && (
                      <div
                        className="instagram-reaction-badge reaction-picker-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPickerFor((prev) =>
                            prev === msg._id ? null : msg._id,
                          );
                        }}
                      >
                        {reactionSummary.map(({ emoji }) => (
                          <span key={emoji}>{emoji}</span>
                        ))}
                        {reactionSummary.reduce((acc, r) => acc + r.count, 0) >
                          1 && (
                          <span
                            className="text-muted fw-semibold ms-1"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {reactionSummary.reduce(
                              (acc, r) => acc + r.count,
                              0,
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* React + Reply Quick Actions */}
                  {!msg.isDeleted && (
                    <div
                      className={`chat-bubble-actions d-flex gap-1 mb-2 ${
                        isMe ? "order-0" : "order-1"
                      }`}
                    >
                      <button
                        type="button"
                        className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary reaction-picker-btn"
                        style={{ width: 28, height: 28, fontSize: "0.75rem" }}
                        title="React"
                        disabled={isConversationBlocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenPickerFor((prev) =>
                            prev === msg._id ? null : msg._id,
                          );
                        }}
                      >
                        <i className="bi bi-emoji-smile" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border rounded-circle p-0 d-flex align-items-center justify-content-center text-secondary"
                        style={{ width: 28, height: 28, fontSize: "0.75rem" }}
                        title="Reply"
                        disabled={isConversationBlocked}
                        onClick={() => handleStartReply(msg)}
                      >
                        <i className="bi bi-reply" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <span
                  className="mt-1 text-muted"
                  style={{
                    fontSize: "0.68rem",
                    paddingLeft: !isMe ? "40px" : "4px",
                    paddingRight: "4px",
                  }}
                >
                  {time}
                  {msg.isEdited && !msg.isDeleted ? " · edited" : ""}
                </span>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="d-flex flex-column align-items-start chat-bubble-row">
            <div
              className="d-flex align-items-end gap-2"
              style={{ maxWidth: "70%" }}
            >
              <Avatar sender={firstTypingSender} />
              <div
                className="px-3 py-2 rounded-4 shadow-sm bg-white chat-bubble-other"
                style={{ borderBottomLeftRadius: 4 }}
              >
                <span className="typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-3 py-2 border-top bg-light d-flex align-items-center justify-content-between">
          <div className="overflow-hidden">
            <div className="small fw-semibold text-success">
              Replying to {replyingTo.sender?.username || "message"}
            </div>
            <div className="small text-truncate text-muted">
              {replyingTo.content}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle"
            style={{ width: 26, height: 26 }}
            onClick={() => setReplyingTo(null)}
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* Pending Attachment Bar */}
      {(pendingAttachment || uploading || uploadError) && (
        <div className="px-3 py-2 border-top bg-light d-flex align-items-center justify-content-between">
          <div className="overflow-hidden small">
            {uploading && <span className="text-muted">Uploading...</span>}
            {uploadError && <span className="text-danger">{uploadError}</span>}
            {pendingAttachment && !uploading && (
              <span className="text-success fw-semibold">
                <i className="bi bi-paperclip me-1" />
                {pendingAttachment.fileName} (
                {formatFileSize(pendingAttachment.fileSize)})
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle"
            style={{ width: 26, height: 26 }}
            onClick={() => {
              setPendingAttachment(null);
              setUploadError(null);
            }}
          >
            <i className="bi bi-x" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 border-top bg-white d-flex align-items-center gap-2 flex-shrink-0"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="d-none"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4"
        />

        <button
          type="button"
          className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-secondary border"
          style={{ width: 38, height: 38 }}
          title="Attach file"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            uploading || Boolean(pendingAttachment) || isConversationBlocked
          }
        >
          <i className="bi bi-plus-lg" />
        </button>

        <div className="input-group flex-grow-1">
          <input
            ref={inputRef}
            type="text"
            className="form-control border-0 bg-light rounded-pill px-3 py-2"
            style={{ fontSize: "0.95rem" }}
            placeholder={
              isBlocked
                ? "You blocked this user"
                : isBlockedByOther
                  ? "This user blocked you"
                  : `Message ${name || ""}...`
            }
            value={inputText}
            onChange={handleInputChange}
            disabled={sending || isConversationBlocked}
          />
        </div>

        <button
          type="submit"
          className="btn btn-success btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
          style={{ width: 38, height: 38 }}
          disabled={
            (!inputText.trim() && !pendingAttachment) ||
            sending ||
            uploading ||
            isConversationBlocked
          }
          title="Send message"
        >
          <i
            className="bi bi-send-fill text-white"
            style={{ fontSize: "0.9rem" }}
          />
        </button>
      </form>

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="modal-backdrop-custom">
          <div
            className="card shadow-sm border-0 rounded-4 p-3"
            style={{ maxWidth: 320, width: "90%" }}
          >
            <div className="card-body p-1 text-center">
              <i className="bi bi-exclamation-circle text-danger fs-1 mb-2 d-block" />
              <h6 className="fw-bold mb-1">Delete Message?</h6>
              <p className="text-muted small mb-3">
                Are you sure you want to delete this message? This action cannot
                be undone.
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3 btn-sm text-secondary fw-semibold"
                  onClick={() => setMessageToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-3 btn-sm fw-semibold"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-2 rounded-pill shadow text-white ${
            toast.type === "error" ? "bg-danger" : "bg-success"
          }`}
          style={{ zIndex: 9999, fontSize: "0.9rem" }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCall } from "../../hooks/useCall";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import {
  getMessages,
  sendMessage as sendMessageApi,
  editMessage as editMessageApi,
  deleteMessage as deleteMessageApi,
  markMessagesRead,
} from "../../api/messageService";
import { toggleReaction } from "../../api/reactionService";
import { uploadAttachment } from "../../api/attachmentService";
import { blockUser, unblockUser } from "../../api/conversationService";
import { CHAT_CONFIG } from "../../constants/config";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ReplyPreviewBar from "./ReplyPreviewBar";
import MessageInput from "./MessageInput";
import ConfirmModal from "../ui/ConfirmModal";

import doodlePattern from "../../assets/doodle-pattern.svg";
import "../css/ChatWindow.css";
import "../css/Call.css";

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

export default function ChatWindow({
  chatId,
  name,
  avatarUrl,
  recipientId,
  recipientUsername,
  isGroup,
  initialIsBlocked = false,
  initialIsBlockedByOther = false,
  onClose,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const { socket, onlineUsers, lastSeenMap } = useSocket();
  const { call, startCall } = useCall();
  const { showToast } = useToast();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [openPickerFor, setOpenPickerFor] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [isBlocked, setIsBlocked] = useState(Boolean(initialIsBlocked));
  const isBlockedByOther = Boolean(initialIsBlockedByOther);

  const [messageToDelete, setMessageToDelete] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);

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

  const clearAllTypingExpiryTimers = useCallback(() => {
    typingExpiryTimeoutsRef.current.forEach((timeoutId) =>
      clearTimeout(timeoutId),
    );
    typingExpiryTimeoutsRef.current.clear();
  }, []);

  // Fetch messages and setup room on active chat change
  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;
    isInitialLoadRef.current = true;

    async function fetchChatData() {
      setLoading(true);
      try {
        const data = await getMessages(chatId, { limit: 50 });
        if (isMounted) {
          setMessages(data.messages || []);
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor || null);
        }
      } catch (err) {
        console.error("Failed to load messages:", err?.response?.data || err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchChatData();
    markMessagesRead(chatId).catch(() => {});

    socket?.emit("joinConversation", chatId);
    requestAnimationFrame(() => inputRef.current?.focus());

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
  }, [chatId, socket, clearAllTypingExpiryTimers]);

  // Load older messages on scroll to top
  const handleScroll = async () => {
    if (!chatContainerRef.current || loading || loadingMore || !hasMore || !nextCursor)
      return;

    if (chatContainerRef.current.scrollTop <= 10) {
      setLoadingMore(true);
      const container = chatContainerRef.current;
      const prevScrollHeight = container.scrollHeight;

      try {
        const data = await getMessages(chatId, { before: nextCursor, limit: 30 });
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [...data.messages, ...prev]);
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor || null);

          // Maintain scroll position after prepending older messages
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        } else {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Failed to load older messages:", err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  // Initial scroll to bottom
  useLayoutEffect(() => {
    if (!loading && messages.length > 0 && isInitialLoadRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
      isInitialLoadRef.current = false;
    }
  }, [loading, chatId, messages.length]);

  // Auto-scroll on new message if near bottom
  useEffect(() => {
    if (loading || isInitialLoadRef.current || !chatContainerRef.current)
      return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 180;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading]);

  // Socket listeners for real-time chat updates
  useEffect(() => {
    if (!socket || !chatId) return;

    const belongsHere = (conversation) => {
      if (!conversation) return false;
      const id =
        typeof conversation === "object" ? conversation._id || conversation.id || conversation : conversation;
      return String(id) === String(chatId);
    };

    const handleNewMessage = (msg) => {
      if (!belongsHere(msg.conversation)) return;
      setMessages((prev) =>
        prev.some((m) => String(m._id) === String(msg._id)) ? prev : [...prev, msg],
      );
      markMessagesRead(chatId).catch(() => {});
    };

    const handleMessageEdited = (msg) => {
      if (!belongsHere(msg.conversation)) return;
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(msg._id) ? msg : m)),
      );
    };

    const handleMessageDeleted = ({ messageId, conversationId }) => {
      if (!belongsHere(conversationId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(messageId)
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
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions } : m)),
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
      avatarUrl,
    }) => {
      if (!belongsHere(conversationId)) return;
      if (String(userId) === String(currentUserId)) return;

      const existingTimeout = typingExpiryTimeoutsRef.current.get(userId);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeoutId = setTimeout(() => {
        clearTypingFor(userId);
      }, CHAT_CONFIG.TYPING_EXPIRY_MS);

      typingExpiryTimeoutsRef.current.set(userId, timeoutId);
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, { username, avatarUrl });
        return next;
      });
    };

    const handleUserStoppedTyping = ({ conversationId, userId }) => {
      if (!belongsHere(conversationId)) return;
      clearTypingFor(userId);
    };

    const handleMessagesRead = ({ conversationId, userId }) => {
      if (!belongsHere(conversationId)) return;
      setMessages((prev) =>
        prev.map((m) => {
          const readBy = Array.isArray(m.readBy) ? [...m.readBy] : [];
          if (!readBy.some((id) => String(id?._id || id) === String(userId))) {
            readBy.push(userId);
          }
          return { ...m, readBy };
        }),
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageEdited", handleMessageEdited);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("reactionUpdated", handleReactionUpdated);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageEdited", handleMessageEdited);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("reactionUpdated", handleReactionUpdated);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, chatId, currentUserId]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !chatId || isConversationBlocked) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", chatId);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("stopTyping", chatId);
    }, CHAT_CONFIG.TYPING_DEBOUNCE_MS);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const data = await uploadAttachment(file);
      setPendingAttachment(data);
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError("Failed to upload attachment");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = inputText.trim();
    if (!content && !pendingAttachment) return;
    if (sending || isConversationBlocked) return;

    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket?.emit("stopTyping", chatId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    try {
      // ✅ CORRECT – pass an object
      await sendMessageApi({
        conversationId: chatId,
        content,
        type: pendingAttachment ? "file" : "text",
        attachments: pendingAttachment ? [pendingAttachment] : [],
        replyTo: replyingTo ? replyingTo._id : undefined,
      });

      setInputText("");
      setPendingAttachment(null);
      setReplyingTo(null);
    } catch (err) {
      console.error("Failed to send message:", err?.response?.data || err);
      showToast(err?.response?.data?.message || "Failed to send message", {
        type: "error",
      });
    } finally {
      setSending(false);
    }
  };

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

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditText(msg.content || "");
    setOpenPickerFor(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleConfirmEdit = async () => {
    if (!editingMessageId) return;
    const trimmed = editText.trim();
    if (!trimmed) return;
    try {
      await editMessageApi(editingMessageId, trimmed);
    } catch (err) {
      console.error("Failed to edit message:", err?.response?.data || err);
      showToast(err?.response?.data?.message || "Edit failed", {
        type: "error",
      });
    } finally {
      setEditingMessageId(null);
      setEditText("");
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

  const handleStartCall = (callType) => {
    if (!recipientId || isConversationBlocked) return;
    const isOnline = onlineUsers.has(String(recipientId));
    if (!isOnline) {
      showToast(`${name || "User"} is currently offline`, { type: "error" });
      return;
    }
    startCall(recipientId, chatId, callType);
  };

  const handleDoubleClickMessage = (msg) => {
    if (msg.isDeleted || isConversationBlocked) return;
    handleReact(msg._id, "❤️");
  };

  const handleViewProfile = () => {
    if (isGroup || !recipientUsername) return;
    navigate(`/profile/${recipientUsername}`);
  };

  const handleOpenGroupInfo = () => {
    window.dispatchEvent(
      new CustomEvent("vibe:open-group-info", {
        detail: { conversationId: chatId },
      }),
    );
  };

  const handleToggleBlock = async () => {
    try {
      if (isBlocked) {
        const res = await unblockUser(chatId);
        const nextBlocked = res?.data?.blockedBy?.some(
          (id) => String(id) === String(currentUserId),
        );
        setIsBlocked(nextBlocked);
        showToast("User unblocked", { type: "success" });
      } else {
        await blockUser(chatId);
        setIsBlocked(true);
        showToast("User blocked", { type: "success" });
        if (typeof onClose === "function") {
          setTimeout(() => onClose(), 800);
        }
      }
    } catch (err) {
      showToast(err?.response?.data?.message || "Something went wrong", {
        type: "error",
      });
    }
  };

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("chat-bubble-highlight");
      setTimeout(() => el.classList.remove("chat-bubble-highlight"), 1500);
    }
  };

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

  return (
    <div className="d-flex flex-column h-100 w-100 bg-white overflow-hidden shadow-sm position-relative">
      <ChatHeader
        name={name}
        avatarUrl={avatarUrl}
        isGroup={isGroup}
        recipientId={recipientId}
        recipientUsername={recipientUsername}
        isRecipientOnline={isRecipientOnline}
        statusText={statusText}
        typingUsers={typingUsers}
        call={call}
        isConversationBlocked={isConversationBlocked}
        showInfoDropdown={showInfoDropdown}
        setShowInfoDropdown={setShowInfoDropdown}
        isBlocked={isBlocked}
        onStartCall={handleStartCall}
        onOpenGroupInfo={handleOpenGroupInfo}
        onViewProfile={handleViewProfile}
        onToggleBlock={handleToggleBlock}
      />

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

      <MessageList
        chatContainerRef={chatContainerRef}
        messagesEndRef={messagesEndRef}
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onScroll={handleScroll}
        currentUserId={currentUserId}
        isRecipientOnline={isRecipientOnline}
        editingMessageId={editingMessageId}
        openPickerFor={openPickerFor}
        isConversationBlocked={isConversationBlocked}
        typingUsers={typingUsers}
        onDoubleClickMessage={handleDoubleClickMessage}
        onStartEdit={handleStartEdit}
        onDeletePrompt={(id) => setMessageToDelete(id)}
        onStartReply={(msg) => setReplyingTo(msg)}
        onReact={handleReact}
        onTogglePicker={(id) =>
          setOpenPickerFor((prev) => (prev === id ? null : id))
        }
        onScrollToMessage={scrollToMessage}
        doodlePattern={doodlePattern}
      />

      <ReplyPreviewBar
        replyingTo={replyingTo}
        onCancel={() => setReplyingTo(null)}
      />

      <MessageInput
        inputRef={inputRef}
        fileInputRef={fileInputRef}
        inputText={inputText}
        name={name}
        sending={sending}
        uploading={uploading}
        uploadError={uploadError}
        pendingAttachment={pendingAttachment}
        isBlocked={isBlocked}
        isBlockedByOther={isBlockedByOther}
        isConversationBlocked={isConversationBlocked}
        editingMessageId={editingMessageId}
        editText={editText}
        onInputChange={handleInputChange}
        onFileChange={handleFileChange}
        onSend={handleSend}
        onClearAttachment={() => {
          setPendingAttachment(null);
          setUploadError(null);
        }}
        onEditTextChange={setEditText}
        onConfirmEdit={handleConfirmEdit}
        onCancelEdit={handleCancelEdit}
      />

      <ConfirmModal
        open={!!messageToDelete}
        title="Delete Message?"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setMessageToDelete(null)}
      />
    </div>
  );
}

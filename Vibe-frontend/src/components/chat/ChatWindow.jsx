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

const makeTempId = () =>
  `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
  const [newMessageCount, setNewMessageCount] = useState(0);

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

  // FIFO queue of our own optimistic message tempIds still awaiting
  // reconciliation — either by the HTTP response or the socket echo,
  // whichever arrives first.
  const pendingSendsRef = useRef([]);

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
    pendingSendsRef.current = [];

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
      setNewMessageCount(0);

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
    const container = chatContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        80;
      if (isNearBottom && newMessageCount > 0) setNewMessageCount(0);
    }

    if (!container || loading || loadingMore || !hasMore || !nextCursor) return;

    if (container.scrollTop <= 10) {
      setLoadingMore(true);
      const prevScrollHeight = container.scrollHeight;

      try {
        const data = await getMessages(chatId, {
          before: nextCursor,
          limit: 30,
        });
        if (data.messages && data.messages.length > 0) {
          setMessages((prev) => [...data.messages, ...prev]);
          setHasMore(Boolean(data.hasMore));
          setNextCursor(data.nextCursor || null);

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

  // Auto-scroll on new message if near bottom; otherwise surface a
  // "new messages" pill instead of silently appending off-screen.
  useEffect(() => {
    if (loading || isInitialLoadRef.current || !chatContainerRef.current)
      return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 180;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setNewMessageCount(0);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const lastSenderId = lastMessage?.sender?._id || lastMessage?.sender;
    const isFromOther =
      lastMessage && String(lastSenderId) !== String(currentUserId);

    if (isFromOther) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNewMessageCount((prev) => prev + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMessageCount(0);
  };

  // Socket listeners for real-time chat updates
  useEffect(() => {
    if (!socket || !chatId) return;

    const belongsHere = (conversation) => {
      if (!conversation) return false;
      const id =
        typeof conversation === "object"
          ? conversation._id || conversation.id || conversation
          : conversation;
      return String(id) === String(chatId);
    };

    const handleNewMessage = (msg) => {
      if (!belongsHere(msg.conversation)) return;

      const senderId = msg.sender?._id || msg.sender;
      const isOwnMessage = String(senderId) === String(currentUserId);

      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(msg._id))) return prev;

        // If this is the server echo of a message we sent optimistically,
        // reconcile it into the existing temp bubble instead of appending
        // a duplicate — handles the case where the socket event beats the
        // HTTP response back to the client.
        if (isOwnMessage && pendingSendsRef.current.length > 0) {
          const tempId = pendingSendsRef.current.shift();
          const idx = prev.findIndex((m) => m._id === tempId);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...msg, isOptimistic: false };
            return next;
          }
        }

        return [...prev, msg];
      });

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
        prev.map((m) =>
          String(m._id) === String(messageId) ? { ...m, reactions } : m,
        ),
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

  const handlePasteImage = async (file) => {
    if (!file || isConversationBlocked || uploading) return;

    setUploading(true);
    setUploadError(null);

    try {
      const data = await uploadAttachment(file);
      setPendingAttachment(data);
    } catch (err) {
      console.error("Clipboard image upload failed:", err);
      setUploadError("Failed to upload pasted image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Shared send logic — used both by the initial send and by retry, so
  // a failed message can be re-attempted without duplicating this code.
  const performSend = async ({
    content,
    type,
    attachments,
    replyTo,
    tempId,
  }) => {
    try {
      const data = await sendMessageApi({
        conversationId: chatId,
        content,
        type,
        attachments,
        replyTo: replyTo ? replyTo._id : undefined,
      });

      const realMessage = data?.message || data;

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === tempId);
        // Already reconciled by the socket echo — nothing to do.
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...realMessage, isOptimistic: false };
        return next;
      });
      pendingSendsRef.current = pendingSendsRef.current.filter(
        (id) => id !== tempId,
      );
    } catch (err) {
      console.error("Failed to send message:", err?.response?.data || err);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === tempId ? { ...m, sendStatus: "failed" } : m,
        ),
      );
      pendingSendsRef.current = pendingSendsRef.current.filter(
        (id) => id !== tempId,
      );
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

    const tempId = makeTempId();
    const attachmentsSnapshot = pendingAttachment ? [pendingAttachment] : [];
    const replyToSnapshot = replyingTo;
    const type = pendingAttachment ? "file" : "text";

    const optimisticMessage = {
      _id: tempId,
      conversation: chatId,
      sender: {
        _id: currentUserId,
        username: user?.username,
        avatarUrl: user?.avatarUrl,
      },
      content,
      type,
      attachments: attachmentsSnapshot,
      replyTo: replyToSnapshot || undefined,
      createdAt: new Date().toISOString(),
      readBy: [],
      reactions: [],
      isOptimistic: true,
      sendStatus: "sending",
    };

    // Clear the composer immediately — the UI shouldn't wait on the
    // network round-trip to feel responsive.
    setMessages((prev) => [...prev, optimisticMessage]);
    pendingSendsRef.current.push(tempId);
    setInputText("");
    setPendingAttachment(null);
    setReplyingTo(null);
    setSending(true);

    await performSend({
      content,
      type,
      attachments: attachmentsSnapshot,
      replyTo: replyToSnapshot,
      tempId,
    });

    setSending(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Retry a failed optimistic message in place — keeps its position and
  // tempId, just flips it back to "sending" and re-fires the request.
  const handleRetrySend = async (failedMsg) => {
    const tempId = failedMsg._id;

    setMessages((prev) =>
      prev.map((m) => (m._id === tempId ? { ...m, sendStatus: "sending" } : m)),
    );
    pendingSendsRef.current.push(tempId);

    await performSend({
      content: failedMsg.content,
      type: failedMsg.type,
      attachments: failedMsg.attachments,
      replyTo: failedMsg.replyTo,
      tempId,
    });
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
        window.dispatchEvent(
          new CustomEvent("vibe:conversation-block-changed", {
            detail: { conversationId: chatId, blocked: false },
          }),
        );
      } else {
        await blockUser(chatId);
        setIsBlocked(true);
        showToast("User blocked", { type: "success" });
        window.dispatchEvent(
          new CustomEvent("vibe:conversation-block-changed", {
            detail: { conversationId: chatId, blocked: true },
          }),
        );
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

      <div className="position-relative flex-grow-1 overflow-hidden d-flex flex-column">
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
          onRetrySend={handleRetrySend}
          doodlePattern={doodlePattern}
        />

        {newMessageCount > 0 && (
          <button
            type="button"
            className="btn btn-success btn-sm rounded-pill shadow position-absolute d-flex align-items-center gap-2"
            style={{
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 5,
              paddingLeft: "0.9rem",
              paddingRight: "0.9rem",
            }}
            onClick={scrollToBottom}
          >
            <i className="bi bi-arrow-down" />
            {newMessageCount} new message{newMessageCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

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
        onPasteImage={handlePasteImage}
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

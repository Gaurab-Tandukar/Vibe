import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../context/SocketContext";
import {
  getMessages,
  sendMessage as sendMessageApi,
  markMessagesRead,
} from "../api/messageService";
import doodlePattern from "../assets/doodle-pattern.svg";

export default function ChatWindow({ chatId, name }) {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id;
  const { socket } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load history + join this conversation's socket room whenever chatId changes
  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;

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
      socket?.emit("leaveConversation", chatId);
    };
  }, [chatId, socket]);

  // Listen for live incoming messages
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = (msg) => {
      const msgConversationId =
        typeof msg.conversation === "object"
          ? msg.conversation._id
          : msg.conversation;

      if (String(msgConversationId) !== String(chatId)) return;

      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      );
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [socket, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(
    async (e) => {
      e.preventDefault();
      const text = inputText.trim();
      if (!text || sending) return;

      setSending(true);
      setInputText("");

      try {
        await sendMessageApi({ conversationId: chatId, content: text });
      } catch (err) {
        console.error("Failed to send message:", err?.response?.data || err);
        setInputText(text);
      } finally {
        setSending(false);
      }
    },
    [chatId, inputText, sending],
  );

  return (
    <div className="d-flex flex-column h-100 w-100 bg-white overflow-hidden shadow-sm">
      {/* Inline Animation & Dynamic Styles */}
      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.92);
          }
          70% {
            transform: translateY(-2px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chat-bubble-latest {
          animation: popIn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .chat-bubble-latest.chat-bubble-me {
          transform-origin: bottom right;
        }

        .chat-bubble-latest.chat-bubble-other {
          transform-origin: bottom left;
        }

        .chat-bubble-animated {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .chat-bubble-animated:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
        }
      `}</style>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0 bg-white">
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <span
            className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
            style={{ width: "38px", height: "38px", fontSize: "0.95rem" }}
          >
            {name ? name.charAt(0).toUpperCase() : "C"}
          </span>
          <div className="d-flex flex-column overflow-hidden">
            <span className="fw-semibold text-truncate small mb-0">{name}</span>
            <span className="text-muted small" style={{ fontSize: "0.72rem" }}>
              ID: {chatId}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle text-secondary p-2"
            title="Start Call"
          >
            <i className="bi bi-telephone"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle text-secondary p-2"
            title="Search in chat"
          >
            <i className="bi bi-search"></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle text-secondary p-2"
            title="Pinned Messages"
          >
            <i className="bi bi-pin-angle"></i>
          </button>
        </div>
      </div>

      {/* Message List area with Doodle Pattern Background */}
      <div
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
            const time = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={msg._id}
                className={`d-flex flex-column ${
                  isMe ? "align-items-end" : "align-items-start"
                }`}
              >
                <div
                  className={`p-2 px-3 rounded-4 shadow-sm chat-bubble-animated ${
                    isLatest ? "chat-bubble-latest" : ""
                  } ${
                    isMe
                      ? "bg-success text-white chat-bubble-me"
                      : "bg-white text-dark border chat-bubble-other"
                  } ${msg.isDeleted ? "fst-italic text-muted" : ""}`}
                  style={{
                    maxWidth: "80%",
                    wordBreak: "break-word",
                    borderBottomRightRadius: isMe ? "2px" : undefined,
                    borderBottomLeftRadius: !isMe ? "2px" : undefined,
                  }}
                >
                  <p className="mb-0 small">{msg.content}</p>
                </div>

                {/* High contrast timestamp badge */}
                <span
                  className="mt-1 px-2 py-0.5 rounded-pill text-dark fw-bold"
                  style={{
                    fontSize: "0.65rem",
                    backgroundColor: "rgba(255, 255, 255, 0.75)",
                    backdropFilter: "blur(2px)",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  {time}
                  {msg.isEdited && !msg.isDeleted ? " · edited" : ""}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 border-top bg-white d-flex align-items-center gap-2 flex-shrink-0"
      >
        <button
          type="button"
          className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-secondary border"
          style={{ width: "36px", height: "36px" }}
          title="Attach file"
        >
          <i className="bi bi-plus-lg"></i>
        </button>

        <div className="input-group input-group-sm flex-grow-1">
          <input
            type="text"
            className="form-control border-end-0 bg-light rounded-start-pill px-3 py-2"
            placeholder={`Message ${name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button
            type="button"
            className="btn btn-light border border-start-0 text-secondary rounded-end-pill px-3"
            title="Emoji"
          >
            <i className="bi bi-emoji-smile"></i>
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-success btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
          style={{ width: "36px", height: "36px" }}
          disabled={!inputText.trim() || sending}
          title="Send message"
        >
          <i
            className="bi bi-send-fill text-white"
            style={{ fontSize: "0.85rem" }}
          ></i>
        </button>
      </form>
    </div>
  );
}

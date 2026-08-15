import { useState, useEffect, useRef } from "react";

export default function ChatWindow({ chatId, name }) {
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: "other",
      text: `Welcome to conversation #${chatId} with ${name}!`,
      time: "10:42 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now(),
      chatId, // Include chatId when dispatching to socket/backend
      sender: "me",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  return (
    <div className="d-flex flex-column h-100 w-100 bg-white overflow-hidden">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom flex-shrink-0 bg-light-subtle">
        <div className="d-flex align-items-center gap-2 overflow-hidden">
          <span
            className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
            style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}
          >
            {name ? name.charAt(0).toUpperCase() : "C"}
          </span>
          <div className="d-flex flex-column overflow-hidden">
            <span className="fw-semibold text-truncate small mb-0">{name}</span>
            <span className="text-muted small" style={{ fontSize: "0.7rem" }}>
              ID: {chatId}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-1 flex-shrink-0">
          <button
            className="btn btn-sm btn-ghost text-secondary p-1"
            title="Start Call"
          >
            <i className="bi bi-telephone"></i>
          </button>
          <button
            className="btn btn-sm btn-ghost text-secondary p-1"
            title="Search in chat"
          >
            <i className="bi bi-search"></i>
          </button>
          <button
            className="btn btn-sm btn-ghost text-secondary p-1"
            title="Pinned Messages"
          >
            <i className="bi bi-pin-angle"></i>
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 bg-body-tertiary">
        {messages.map((msg) => {
          const isMe = msg.sender === "me";
          return (
            <div
              key={msg.id}
              className={`d-flex flex-column ${isMe ? "align-items-end" : "align-items-start"}`}
            >
              <div
                className={`p-2 px-3 rounded-4 shadow-sm ${
                  isMe
                    ? "bg-success text-white rounded-br-0"
                    : "bg-white text-dark border rounded-bl-0"
                }`}
                style={{ maxWidth: "80%", wordBreak: "break-word" }}
              >
                <p className="mb-0 small">{msg.text}</p>
              </div>
              <span
                className="text-muted mt-1 px-1"
                style={{ fontSize: "0.65rem" }}
              >
                {msg.time}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 border-top bg-white d-flex align-items-center gap-2 flex-shrink-0"
      >
        <button
          type="button"
          className="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center text-secondary"
          style={{ width: "34px", height: "34px" }}
          title="Attach file"
        >
          <i className="bi bi-plus-lg"></i>
        </button>

        <div className="input-group input-group-sm flex-grow-1">
          <input
            type="text"
            className="form-control border-end-0 bg-light"
            placeholder={`Message ${name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-light border border-start-0 text-secondary"
            title="Emoji"
          >
            <i className="bi bi-emoji-smile"></i>
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-success btn-sm rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: "34px", height: "34px" }}
          disabled={!inputText.trim()}
          title="Send message"
        >
          <i
            className="bi bi-send-fill text-white"
            style={{ fontSize: "0.8rem" }}
          ></i>
        </button>
      </form>
    </div>
  );
}

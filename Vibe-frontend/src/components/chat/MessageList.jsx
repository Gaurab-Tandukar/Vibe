import MessageItem from "./MessageItem";
import Avatar from "./Avatar";

export default function MessageList({
  chatContainerRef,
  messagesEndRef,
  messages,
  loading,
  loadingMore,
  currentUserId,
  isRecipientOnline,
  editingMessageId,
  openPickerFor,
  isConversationBlocked,
  typingUsers,
  onScroll,
  onDoubleClickMessage,
  onStartEdit,
  onDeletePrompt,
  onStartReply,
  onReact,
  onTogglePicker,
  onScrollToMessage,
  doodlePattern,
}) {
  const isLastInSenderGroup = (index) => {
    const current = messages[index];
    const next = messages[index + 1];
    if (!next) return true;
    const currentSender =
      typeof current.sender === "object" ? current.sender._id : current.sender;
    const nextSender =
      typeof next.sender === "object" ? next.sender._id : next.sender;
    return String(currentSender) !== String(nextSender);
  };

  const typingEntries = Array.from(typingUsers.values());
  const firstTypingSender = typingEntries[0] || null;

  return (
    <div
      ref={chatContainerRef}
      onScroll={onScroll}
      className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 position-relative"
      style={{
        backgroundColor: "#eef3ea",
        backgroundImage: `url(${doodlePattern})`,
        backgroundRepeat: "repeat",
        backgroundSize: "320px 320px",
      }}
    >
      {loadingMore && (
        <div className="d-flex justify-content-center py-2">
          <span className="spinner-border spinner-border-sm text-secondary" />
        </div>
      )}

      {messages.length === 0 && !loading ? (
        <div className="text-center text-muted m-auto py-5">
          <i className="bi bi-chat-heart display-4 text-secondary opacity-50 mb-2 d-block" />
          <p className="fw-medium mb-1">No messages yet</p>
          <p className="small opacity-75 mb-0">Say hello to break the ice!</p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const senderId =
            typeof msg.sender === "object" ? msg.sender._id : msg.sender;
          const isMe = String(senderId) === String(currentUserId);
          const isLatest = index === messages.length - 1;
          const isTopMessage = index < 2;
          const showAvatar = !isMe && isLastInSenderGroup(index);

          return (
            <MessageItem
              key={msg._id}
              msg={msg}
              isMe={isMe}
              isLatest={isLatest}
              isTopMessage={isTopMessage}
              showAvatar={showAvatar}
              editingMessageId={editingMessageId}
              openPickerFor={openPickerFor}
              isConversationBlocked={isConversationBlocked}
              isRecipientOnline={isRecipientOnline}
              currentUserId={currentUserId}
              onDoubleClick={onDoubleClickMessage}
              onStartEdit={onStartEdit}
              onDeletePrompt={onDeletePrompt}
              onStartReply={onStartReply}
              onReact={onReact}
              onTogglePicker={onTogglePicker}
              onScrollToMessage={onScrollToMessage}
            />
          );
        })
      )}

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
  );
}

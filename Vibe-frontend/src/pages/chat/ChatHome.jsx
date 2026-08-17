import { useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import IdeWorkspace from "../../components/IdeWorkspace";

const normalizeChatId = (chat) => String(chat?._id ?? chat?.id ?? "");

export default function ChatHome() {
  const [openChats, setOpenChats] = useState([]);
  const ideWorkspaceRef = useRef(null);

  const handleSelectChat = (chat) => {
    if (!chat) return;
    const chatId = normalizeChatId(chat);
    if (!chatId) return;

    const alreadyOpen = openChats.some((c) => normalizeChatId(c) === chatId);

    if (alreadyOpen) {
      ideWorkspaceRef.current?.selectChat(chatId);
      return;
    }

    const normalizedChat = {
      ...chat,
      id: chat.id ?? chat._id,
      _id: chat._id ?? chat.id,
      name: chat.name || "Chat",
    };

    setOpenChats((prev) => [...prev, normalizedChat]);
  };

  const handleCloseChat = (chatId) => {
    setOpenChats((prev) => prev.filter((c) => String(c.id) !== String(chatId)));
  };

  const handleChatDragStart = (event, chat) => {
    ideWorkspaceRef.current?.startChatDrag(event, chat, (droppedChat) => {
      setOpenChats((prev) =>
        prev.some((c) => c.id === droppedChat.id)
          ? prev
          : [...prev, droppedChat],
      );
    });
  };

  return (
    <div
      className="d-flex min-vh-100 sage--bg text-dark"
      style={{ transition: "margin-left 0.2s ease" }}
    >
      <Sidebar
        onSelectChat={handleSelectChat}
        onChatDragStart={handleChatDragStart}
      />

      <div
        id="main-content"
        className="flex-grow-1 d-flex flex-column"
        style={{ transition: "margin-left 0.2s ease" }}
      >
        <IdeWorkspace
          ref={ideWorkspaceRef}
          openChats={openChats}
          onCloseChat={handleCloseChat}
        />
      </div>
    </div>
  );
}

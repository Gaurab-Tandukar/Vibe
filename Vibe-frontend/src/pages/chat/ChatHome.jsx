import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import IdeWorkspace from "../../components/workspace/IdeWorkspace";

const normalizeChatId = (chat) => String(chat?._id ?? chat?.id ?? "");

export default function ChatHome() {
  const [openChats, setOpenChats] = useState([]);
  const ideWorkspaceRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openChat) {
      // eslint-disable-next-line react-hooks/immutability
      handleSelectChat(location.state.openChat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    const handleBlockChanged = (event) => {
      const detail = event?.detail || {};
      const conversationId = detail.conversationId;
      const blocked = Boolean(detail.blocked);
      if (!blocked || !conversationId) return;

      setOpenChats((prev) =>
        prev.filter((c) => String(c.id) !== String(conversationId)),
      );
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
  }, []);

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

  const handleChatUpdated = (chatId, updates) => {
    setOpenChats((prev) =>
      prev.map((c) =>
        String(c.id) === String(chatId) ? { ...c, ...updates } : c,
      ),
    );
  };

  const handleChatDragStart = (event, chat) => {
    // Use the correct ref name
    ideWorkspaceRef.current?.startChatDrag(event, chat, (droppedChat) => {
      setOpenChats((prev) => {
        const id = String(droppedChat._id || droppedChat.id);
        if (prev.some((c) => String(c._id || c.id) === id)) return prev;
        return [...prev, droppedChat];
      });
    });
  };

  return (
    <div
      className="d-flex min-vh-100 sage--bg text-dark position-relative overflow-hidden"
      style={{height: "100dvh", width: "100vw" }}
    >
      <Sidebar
        onSelectChat={handleSelectChat}
        onChatDragStart={handleChatDragStart}
        onChatUpdated={handleChatUpdated}
      />

      <div
        id="main-content"
        className="flex-grow-1 d-flex flex-column h-100 overflow-hidden"
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

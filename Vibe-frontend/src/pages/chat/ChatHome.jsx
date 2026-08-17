import { useRef, useState } from "react";
import Sidebar from "../../components/Sidebar";
import IdeWorkspace from "../../components/IdeWorkspace";

export default function ChatHome() {
  // Single source of truth for which chats are open as tabs in the
  // IDE workspace. Shape: [{ id, name }, ...]
  const [openChats, setOpenChats] = useState([]);
  const ideWorkspaceRef = useRef(null);

  // Sidebar click -> open (or focus, if already open) a chat tab
  const handleSelectChat = (chat) => {
    setOpenChats((prev) =>
      prev.some((c) => c.id === chat.id) ? prev : [...prev, chat],
    );
  };

  // FlexLayout tab closed -> remove it from openChats
  const handleCloseChat = (chatId) => {
    setOpenChats((prev) => prev.filter((c) => String(c.id) !== String(chatId)));
  };

  // Sidebar item dragged into the workspace -> hand off to IdeWorkspace's
  // native HTML5 drag handling; only update openChats on a real, successful
  // drop (IdeWorkspace only calls this back when the drop wasn't cancelled).
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

      {/* Main Content Area: dynamically adjusted via Sidebar's useEffect.
          IdeWorkspace itself decides what to render here — WelcomePage
          when openChats is empty, or the tabbed FlexLayout workspace
          once a chat is opened (by click or drag). */}
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

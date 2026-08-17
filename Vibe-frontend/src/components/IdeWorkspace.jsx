import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Layout, Model, Actions } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import WelcomePage from "../pages/main/WelcomePage";
import ChatWindow from "./ChatWindow";

const normalizeChatId = (chat) => String(chat?._id ?? chat?.id ?? "");

const initialJson = {
  global: {
    tabEnableClose: true,
    tabEnableFloat: false,
    tabEnableRename: false,
  },
  borders: [],
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "tabset",
        weight: 100,
        children: [],
      },
    ],
  },
};

const buildTabJson = (chat) => {
  const chatId = normalizeChatId(chat);
  return {
    type: "tab",
    id: chatId,
    name: chat?.name || "Chat",
    component: "chatWindow", // MUST match node.getComponent()
    config: { chatId: chatId, name: chat?.name || "Chat" },
  };
};

const IdeWorkspace = forwardRef(function IdeWorkspace(
  { openChats, onCloseChat },
  ref,
) {
  const [model] = useState(() => Model.fromJson(initialJson));
  const layoutRef = useRef(null);

  // Only relevant while openChats is empty (WelcomePage overlay showing).
  // Lets buttons on WelcomePage be clickable normally, but pointer events
  // pass through to the Layout underneath specifically while a chat is
  // being dragged in from the sidebar, so it can still be dropped.
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!openChats || openChats.length === 0) return;

    openChats.forEach((chat) => {
      const chatId = normalizeChatId(chat);
      if (!chatId) return;

      const existingNode = model.getNodeById(chatId);

      if (!existingNode) {
        layoutRef.current?.addTabToActiveTabSet(buildTabJson(chat));
      } else {
        model.doAction(Actions.selectTab(chatId));
      }
    });
  }, [openChats, model]);

  useImperativeHandle(
    ref,
    () => ({
      selectChat: (chatId) => {
        const id = String(chatId ?? "");
        if (id && model.getNodeById(id)) {
          model.doAction(Actions.selectTab(id));
        }
      },

      startChatDrag: (event, chat, onDropped) => {
        const chatId = normalizeChatId(chat);
        const existingNode = chatId ? model.getNodeById(chatId) : null;

        if (existingNode) {
          event.preventDefault();
          layoutRef.current?.addTabToActiveTabSet(buildTabJson(chat));
          return;
        }

        setIsDragging(true);

        layoutRef.current?.addTabWithDragAndDrop(
          event.nativeEvent ?? event,
          buildTabJson(chat),
          (node) => {
            // Fires whether the drop succeeded or was cancelled — always
            // clear the flag so WelcomePage becomes clickable again.
            setIsDragging(false);
            if (node && onDropped) {
              onDropped(chat);
            }
          },
        );
      },
    }),
    [model],
  );

  const handleAction = (action) => {
    if (action.type === "FlexLayout_DeleteTab") {
      onCloseChat(action.data.node);
    }
    return action;
  };

  const factory = (node) => {
    const component = node.getComponent();

    if (component === "chatWindow") {
      const config = node.getConfig() || {};
      return <ChatWindow chatId={config.chatId} name={config.name} />;
    }

    return null;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Show WelcomePage as an overlay when no chats are open */}
      {openChats.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: isDragging ? "none" : "auto",
          }}
        >
          <WelcomePage />
        </div>
      )}

      <Layout
        factory={factory}
        model={model}
        onAction={handleAction}
        ref={layoutRef}
      />
    </div>
  );
});

export default IdeWorkspace;

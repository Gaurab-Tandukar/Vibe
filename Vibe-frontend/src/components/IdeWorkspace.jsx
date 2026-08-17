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

  useEffect(() => {
    if (!openChats || openChats.length === 0) return;

    openChats.forEach((chat) => {
      const chatId = normalizeChatId(chat);
      if (!chatId) return;

      const existingNode = model.getNodeById(chatId);

      if (!existingNode) {
        // Add to whatever tabset is currently active — avoids having to
        // track/guess a tabset's internal id (custom ids set on tabset/row
        // nodes in initial JSON aren't honored by flexlayout-react; only
        // tab-level ids are preserved).
        layoutRef.current?.addTabToActiveTabSet(buildTabJson(chat));
      } else {
        model.doAction(Actions.selectTab(chatId));
      }
    });
  }, [openChats, model]);

  useImperativeHandle(
    ref,
    () => ({
      // Focuses an already-open tab by id. Called by ChatHome when the
      // sidebar click resolves to a chat that's already in openChats.
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

        // layoutRef is now guaranteed to exist even when openChats.length === 0
        layoutRef.current?.addTabWithDragAndDrop(
          event.nativeEvent ?? event,
          buildTabJson(chat),
          (node) => {
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
            pointerEvents: "none", // Allows native drag events to pass through to Layout underneath
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

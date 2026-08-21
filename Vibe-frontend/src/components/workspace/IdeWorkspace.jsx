import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Layout, Model, Actions } from "flexlayout-react";
import "../css/IdeWorkspace.css";
import "flexlayout-react/style/light.css";
import WelcomePage from "../../pages/main/WelcomePage";
import ChatWindow from "../chat/ChatWindow";

const normalizeChatId = (chat) => String(chat?._id ?? chat?.id ?? "");

// Live source of truth for all open chats
const OpenChatsContext = createContext([]);

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
    component: "chatWindow",
    config: {
      chatId,
      // keep a snapshot only as fallback
      name: chat?.name || "Chat",
      avatarUrl: chat?.avatarUrl,
      recipientId: chat?.recipientId,
      recipientUsername: chat?.recipientUsername,
      isGroup: Boolean(chat?.isGroup),
      isBlocked: Boolean(chat?.isBlocked),
      isBlockedByOther: Boolean(chat?.isBlockedByOther),
    },
  };
};

/**
 * Thin wrapper that always reads the LATEST chat data from context.
 * This is what makes the header dynamic for both click-opened and drag-opened tabs.
 */
function LiveChatWindow({ chatId, fallbackConfig, onClose }) {
  const openChats = useContext(OpenChatsContext);

  const latest = openChats.find((c) => normalizeChatId(c) === String(chatId));

  const props = {
    chatId,
    name: latest?.name ?? fallbackConfig?.name ?? "Chat",
    avatarUrl: latest?.avatarUrl ?? fallbackConfig?.avatarUrl,
    recipientId: latest?.recipientId ?? fallbackConfig?.recipientId,
    recipientUsername:
      latest?.recipientUsername ?? fallbackConfig?.recipientUsername,
    isGroup: Boolean(latest?.isGroup ?? fallbackConfig?.isGroup),
    initialIsBlocked: Boolean(latest?.isBlocked ?? fallbackConfig?.isBlocked),
    initialIsBlockedByOther: Boolean(
      latest?.isBlockedByOther ?? fallbackConfig?.isBlockedByOther,
    ),
  };

  return <ChatWindow {...props} onClose={onClose} />;
}

const IdeWorkspace = forwardRef(function IdeWorkspace(
  { openChats, onCloseChat },
  ref,
) {
  const [model] = useState(() => Model.fromJson(initialJson));
  const layoutRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Keep tabs in sync with openChats (mainly for tab title + existence)
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

        // Only update the visible tab title (name).
        // Content props are handled live by LiveChatWindow + context.
        const nextName = chat?.name || "Chat";
        if (existingNode.getName() !== nextName) {
          model.doAction(
            Actions.updateNodeAttributes(chatId, {
              name: nextName,
            }),
          );
        }
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
          model.doAction(Actions.selectTab(chatId));
          return;
        }

        setIsDragging(true);

        layoutRef.current?.addTabWithDragAndDrop(
          event.nativeEvent ?? event,
          buildTabJson(chat),
          (node) => {
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

  const factory = useCallback(
    (node) => {
      const component = node.getComponent();

      if (component === "chatWindow") {
        const config = node.getConfig() || {};
        const chatId = config.chatId;

        return (
          <LiveChatWindow
            key={chatId}
            chatId={chatId}
            fallbackConfig={config}
            onClose={() => {
              model.doAction(Actions.deleteTab(chatId));
              if (onCloseChat) {
                onCloseChat(chatId);
              }
            }}
          />
        );
      }

      return null;
    },
    [model, onCloseChat],
  );

  return (
    <OpenChatsContext.Provider value={openChats || []}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
    </OpenChatsContext.Provider>
  );
});

export default IdeWorkspace;

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Layout, Model, Actions, DockLocation } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import WelcomePage from "../pages/main/WelcomePage";
import ChatWindow from "./ChatWindow";

const initialJson = {
  global: {
    tabEnableClose: true,
    tabEnableFloat: false,
    tabEnableRename: false,
  },
  borders: [],
  layout: { type: "row", weight: 100, children: [] },
};

const buildTabJson = (chat) => ({
  type: "tab",
  id: String(chat.id),
  name: chat.name,
  component: "chatWindow",
  config: { chatId: chat.id, name: chat.name },
});

const IdeWorkspace = forwardRef(function IdeWorkspace(
  { openChats, onCloseChat },
  ref,
) {
  const [model] = useState(() => Model.fromJson(initialJson));
  const layoutRef = useRef(null);

  useEffect(() => {
    if (openChats.length === 0) return;

    openChats.forEach((chat) => {
      const existingNode = model.getNodeById(String(chat.id));
      if (!existingNode) {
        model.doAction(
          Actions.addTab(
            buildTabJson(chat),
            model.getRoot().getId(),
            DockLocation.CENTER,
            -1,
          ),
        );
      } else {
        model.doAction(Actions.selectTab(String(chat.id)));
      }
    });
  }, [openChats, model]);

  // Exposes a way for anything outside this component tree (e.g. Sidebar's
  // chat list) to drag a chat straight into the FlexLayout workspace using
  // native HTML5 drag-and-drop. Must be wired up from the source element's
  // own onDragStart handler — see Sidebar.jsx and MainLayout.jsx.
  useImperativeHandle(
    ref,
    () => ({
      /**
       * Call from a draggable sidebar item's onDragStart handler:
       *   onDragStart={(e) => ideWorkspaceRef.current?.startChatDrag(e, chat, onDropped)}
       *
       * onDropped(chat) fires only on a genuinely successful drop (not if
       * the user cancels mid-drag) — use it to keep MainLayout's openChats
       * state in sync with what's actually in the FlexLayout model.
       */
      startChatDrag: (event, chat, onDropped) => {
        const existingNode = model.getNodeById(String(chat.id));

        if (existingNode) {
          // Already open somewhere in the layout — focus it instead of
          // creating a duplicate tab, and don't let the native drag start.
          event.preventDefault();
          model.doAction(Actions.selectTab(String(chat.id)));
          return;
        }

        layoutRef.current?.addTabWithDragAndDrop(
          event.nativeEvent ?? event,
          buildTabJson(chat),
          (node) => {
            // node is undefined if the drop was cancelled
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
    if (node.getComponent() === "chatWindow") {
      const { chatId, name } = node.getConfig();
      return <ChatWindow chatId={chatId} name={name} />;
    }
    return null;
  };

  if (openChats.length === 0) return <WelcomePage />;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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

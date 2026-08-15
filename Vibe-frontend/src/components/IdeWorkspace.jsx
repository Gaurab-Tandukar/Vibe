import { useEffect, useRef, useState } from "react";
import { Layout, Model, Actions } from "flexlayout-react";
import "flexlayout-react/style/light.css";
import WelcomePage from "./WelcomePage";
import ChatWindow from "./ChatWindow";
import "./css/IdeWorkspace.css";

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
    children: [],
  },
};

export default function IdeWorkspace({ openChats, onCloseChat }) {
  const [model] = useState(() => Model.fromJson(initialJson));
  const layoutRef = useRef(null);

  // Sync openChats prop with FlexLayout model nodes
  useEffect(() => {
    if (openChats.length === 0) return;

    openChats.forEach((chat) => {
      const existingNode = model.getNodeById(String(chat.id));
      if (!existingNode) {
        model.doAction(
          Actions.addNode(
            {
              type: "tab",
              id: String(chat.id),
              name: chat.name,
              component: "chatWindow",
              config: { chatId: chat.id, name: chat.name },
            },
            model.getRoot().getId(),
            "GRID",
            -1,
          ),
        );
      } else {
        model.doAction(Actions.selectTab(String(chat.id)));
      }
    });
  }, [openChats, model]);

  // Intercept tab close action to sync state back to parent
  const handleAction = (action) => {
    if (action.type === "FlexLayout_DeleteTab") {
      const nodeId = action.data.node;
      onCloseChat(nodeId);
    }
    return action;
  };

  // Factory function: renders content inside each tab
  const factory = (node) => {
    const component = node.getComponent();
    if (component === "chatWindow") {
      const { chatId, name } = node.getConfig();
      return <ChatWindow chatId={chatId} name={name} />;
    }
    return null;
  };

  // Show Welcome screen if no open chat tabs exist
  if (openChats.length === 0) {
    return <WelcomePage />;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <Layout
        ref={layoutRef}
        model={model}
        factory={factory}
        onAction={handleAction}
      />
    </div>
  );
}

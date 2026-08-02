import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  X,
  Search,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Send,
  MessageSquare,
  GripHorizontal,
} from "lucide-react";

/* ---------------------------------------------------------------
   DATA: mock friends + seed messages
--------------------------------------------------------------- */
const FRIENDS = [
  {
    id: "f1",
    name: "Maya Chen",
    status: "online",
    last: "sending the playlist rn",
    unread: 2,
    color: "#7c5cff",
  },
  {
    id: "f2",
    name: "Theo Okafor",
    status: "online",
    last: "lol yes exactly",
    unread: 0,
    color: "#4fd8c4",
  },
  {
    id: "f3",
    name: "Priya Nair",
    status: "offline",
    last: "see you at 8",
    unread: 0,
    color: "#ff9f6b",
  },
  {
    id: "f4",
    name: "Jonas Weber",
    status: "online",
    last: "bruh \u{1F480}",
    unread: 5,
    color: "#f472b6",
  },
  {
    id: "f5",
    name: "Aiko Tanaka",
    status: "idle",
    last: "on my way",
    unread: 0,
    color: "#facc15",
  },
  {
    id: "f6",
    name: "Diego Ruiz",
    status: "offline",
    last: "sent a photo",
    unread: 1,
    color: "#60a5fa",
  },
];

const SEED_MESSAGES = {
  f1: [
    {
      id: "m1",
      sender: "them",
      text: "yo are you coming tonight",
      time: "9:41",
    },
    { id: "m2", sender: "me", text: "depends who's playing lol", time: "9:42" },
    { id: "m3", sender: "them", text: "sending the playlist rn", time: "9:44" },
  ],
  f2: [
    { id: "m1", sender: "them", text: "did you see the score", time: "8:02" },
    {
      id: "m2",
      sender: "me",
      text: "no way that actually happened",
      time: "8:03",
    },
    { id: "m3", sender: "them", text: "lol yes exactly", time: "8:04" },
  ],
  f4: [
    { id: "m1", sender: "them", text: "bro", time: "7:10" },
    { id: "m2", sender: "them", text: "BRO", time: "7:10" },
    { id: "m3", sender: "them", text: "bruh \u{1F480}", time: "7:11" },
  ],
};

const REPLIES = [
  "haha true",
  "wait what",
  "one sec",
  "no way \u{1F480}",
  "for real though",
  "same tbh",
];

/* ---------------------------------------------------------------
   PANE TREE: pure helper functions
   node = { id, type:'leaf', chatId } | { id, type:'split', direction:'row'|'col', children:[node,node,...], sizes:[..] }
--------------------------------------------------------------- */
let idCounter = 0;
const genId = (p) => `${p}-${idCounter++}`;

function findNode(node, id) {
  if (node.id === id) return node;
  if (node.type === "split") {
    for (const c of node.children) {
      const found = findNode(c, id);
      if (found) return found;
    }
  }
  return null;
}

function updateNode(node, id, updater) {
  if (node.id === id) return updater(node);
  if (node.type === "split") {
    return {
      ...node,
      children: node.children.map((c) => updateNode(c, id, updater)),
    };
  }
  return node;
}

function replaceNode(node, id, newNode) {
  if (node.id === id) return newNode;
  if (node.type === "split") {
    return {
      ...node,
      children: node.children.map((c) => replaceNode(c, id, newNode)),
    };
  }
  return node;
}

function splitLeaf(tree, leafId, edge, newChatId) {
  const old = findNode(tree, leafId);
  if (!old) return tree;
  const newLeaf = { id: genId("leaf"), type: "leaf", chatId: newChatId };
  const direction = edge === "top" || edge === "bottom" ? "col" : "row";
  const children =
    edge === "top" || edge === "left" ? [newLeaf, old] : [old, newLeaf];
  const splitNode = {
    id: genId("split"),
    type: "split",
    direction,
    children,
    sizes: [50, 50],
  };
  return replaceNode(tree, leafId, splitNode);
}

function removeHelper(node, leafId) {
  if (node.type === "leaf") return node.id === leafId ? null : node;
  const newChildren = node.children
    .map((c) => removeHelper(c, leafId))
    .filter(Boolean);
  if (newChildren.length === 0) return null;
  if (newChildren.length === 1) return newChildren[0];
  const even = 100 / newChildren.length;
  return { ...node, children: newChildren, sizes: newChildren.map(() => even) };
}
function removeLeaf(tree, leafId) {
  return (
    removeHelper(tree, leafId) || {
      id: genId("leaf"),
      type: "leaf",
      chatId: null,
    }
  );
}

function countLeaves(node) {
  if (node.type === "leaf") return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function setSplitSizes(tree, splitId, sizes) {
  return updateNode(tree, splitId, (n) => ({ ...n, sizes }));
}

/* ---------------------------------------------------------------
   DROP ZONE DETECTION
--------------------------------------------------------------- */
function getZone(e, rect) {
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const EDGE = 0.25;
  if (y < EDGE) return "top";
  if (y > 1 - EDGE) return "bottom";
  if (x < EDGE) return "left";
  if (x > 1 - EDGE) return "right";
  return "center";
}

const ZONE_STYLE = {
  top: { top: 0, left: 0, width: "100%", height: "50%" },
  bottom: { bottom: 0, left: 0, width: "100%", height: "50%" },
  left: { top: 0, left: 0, width: "50%", height: "100%" },
  right: { top: 0, right: 0, width: "50%", height: "100%" },
  center: { top: 0, left: 0, width: "100%", height: "100%" },
};

const initials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ---------------------------------------------------------------
   CHAT PANE (a leaf)
--------------------------------------------------------------- */
function ChatPane({
  node,
  friends,
  messages,
  onSend,
  onClose,
  onDrop,
  onDragStartPane,
  onSplit,
  canClose,
}) {
  const [zone, setZone] = useState(null);
  const [draft, setDraft] = useState("");
  const containerRef = useRef(null);
  const bodyRef = useRef(null);

  const friend = node.chatId ? friends.find((f) => f.id === node.chatId) : null;
  const msgs = node.chatId ? messages[node.chatId] || [] : [];

  const handleDragOver = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setZone(getZone(e, rect));
  };
  const handleDrop = (e) => {
    e.preventDefault();
    if (zone) onDrop(node.id, zone);
    setZone(null);
  };

  const send = () => {
    if (!draft.trim() || !node.chatId) return;
    onSend(node.chatId, draft.trim());
    setDraft("");
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={() => setZone(null)}
      onDrop={handleDrop}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "#1a1922",
        border: "1px solid #2a2836",
        borderRadius: 10,
        overflow: "hidden",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {/* header / tab */}
      <div
        draggable={!!friend}
        onDragStart={(e) => {
          if (!friend) return;
          e.dataTransfer.setData("text/plain", node.id);
          e.dataTransfer.effectAllowed = "move";
          onDragStartPane(node.id, node.chatId);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderBottom: "1px solid #2a2836",
          background: "#1f1e29",
          cursor: friend ? "grab" : "default",
          flexShrink: 0,
        }}
      >
        {friend ? (
          <>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: friend.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#14131a",
                flexShrink: 0,
              }}
            >
              {initials(friend.name)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f0eef7" }}>
              {friend.name}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: "#655f78", fontStyle: "italic" }}>
            Empty pane
          </span>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <button
            title="Split right"
            onClick={() => onSplit(node.id, "right")}
            style={iconBtnStyle}
          >
            <SplitSquareHorizontal size={14} />
          </button>
          <button
            title="Split down"
            onClick={() => onSplit(node.id, "bottom")}
            style={iconBtnStyle}
          >
            <SplitSquareVertical size={14} />
          </button>
          {canClose && (
            <button
              title="Close pane"
              onClick={() => onClose(node.id)}
              style={iconBtnStyle}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* body */}
      {friend ? (
        <>
          <div
            ref={bodyRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === "me" ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  background: m.sender === "me" ? "#4fd8c4" : "#26243280",
                  color: m.sender === "me" ? "#0e1613" : "#f0eef7",
                  border: m.sender === "me" ? "none" : "1px solid #34324280",
                  padding: "7px 11px",
                  borderRadius: 12,
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
                  {m.time}
                </div>
              </div>
            ))}
            {msgs.length === 0 && (
              <div style={{ margin: "auto", color: "#4b4859", fontSize: 12 }}>
                No messages yet — say hi 👋
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: 10,
              borderTop: "1px solid #2a2836",
              flexShrink: 0,
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Message ${friend.name.split(" ")[0]}`}
              style={{
                flex: 1,
                background: "#14131a",
                border: "1px solid #2a2836",
                borderRadius: 8,
                padding: "8px 10px",
                color: "#f0eef7",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              onClick={send}
              style={{
                background: "#4fd8c4",
                border: "none",
                borderRadius: 8,
                width: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Send size={14} color="#0e1613" />
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div style={{ textAlign: "center", color: "#4b4859" }}>
            <MessageSquare
              size={22}
              style={{ marginBottom: 6, opacity: 0.6 }}
            />
            <div style={{ fontSize: 12 }}>Drag a conversation here</div>
          </div>
        </div>
      )}

      {/* drop zone overlay */}
      {zone && (
        <div
          style={{
            position: "absolute",
            ...ZONE_STYLE[zone],
            background: "#4fd8c433",
            border: "2px solid #4fd8c4",
            borderRadius: 8,
            pointerEvents: "none",
            transition: "all 60ms ease-out",
            zIndex: 5,
          }}
        />
      )}
    </div>
  );
}

const iconBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#8b899b",
  cursor: "pointer",
  width: 22,
  height: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 4,
};

/* ---------------------------------------------------------------
   RESIZABLE DIVIDER
--------------------------------------------------------------- */
function Divider({ direction, onResize }) {
  const dragging = useRef(false);
  const start = useRef({ pos: 0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    start.current.pos = direction === "row" ? e.clientX : e.clientY;
    document.body.style.cursor =
      direction === "row" ? "col-resize" : "row-resize";

    const onMove = (ev) => {
      if (!dragging.current) return;
      const pos = direction === "row" ? ev.clientX : ev.clientY;
      const delta = pos - start.current.pos;
      start.current.pos = pos;
      onResize(delta);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        flexShrink: 0,
        cursor: direction === "row" ? "col-resize" : "row-resize",
        width: direction === "row" ? 8 : "100%",
        height: direction === "row" ? "100%" : 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: direction === "row" ? 2 : 20,
          height: direction === "row" ? 20 : 2,
          borderRadius: 2,
          background: "#3a3848",
        }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   PANEL NODE (recursive renderer)
--------------------------------------------------------------- */
function PanelNode({
  node,
  friends,
  messages,
  onSend,
  onClose,
  onDrop,
  onDragStartPane,
  onSplit,
  onResizeSplit,
  totalLeaves,
}) {
  if (node.type === "leaf") {
    return (
      <ChatPane
        node={node}
        friends={friends}
        messages={messages}
        onSend={onSend}
        onClose={onClose}
        onDrop={onDrop}
        onDragStartPane={onDragStartPane}
        onSplit={onSplit}
        canClose={totalLeaves > 1}
      />
    );
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: node.direction === "row" ? "row" : "column",
        width: "100%",
        height: "100%",
        gap: 6,
        minWidth: 0,
        minHeight: 0,
      }}
    >
      {node.children.map((child, i) => (
        <React.Fragment key={child.id}>
          <div
            style={{
              flexBasis: `${node.sizes[i]}%`,
              flexGrow: 0,
              flexShrink: 0,
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <PanelNode
              node={child}
              friends={friends}
              messages={messages}
              onSend={onSend}
              onClose={onClose}
              onDrop={onDrop}
              onDragStartPane={onDragStartPane}
              onSplit={onSplit}
              onResizeSplit={onResizeSplit}
              totalLeaves={totalLeaves}
            />
          </div>
          {i < node.children.length - 1 && (
            <Divider
              direction={node.direction}
              onResize={(deltaPx) => {
                const rect = containerRef.current.getBoundingClientRect();
                const total =
                  node.direction === "row" ? rect.width : rect.height;
                const deltaPct = (deltaPx / total) * 100;
                const sizes = [...node.sizes];
                const a = Math.max(10, Math.min(90, sizes[i] + deltaPct));
                const b = sizes[i] + sizes[i + 1] - a;
                if (b < 10 || b > 90) return;
                sizes[i] = a;
                sizes[i + 1] = b;
                onResizeSplit(node.id, sizes);
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   APP
--------------------------------------------------------------- */
export default function App() {
  const [tree, setTree] = useState({
    id: genId("leaf"),
    type: "leaf",
    chatId: "f1",
  });
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [search, setSearch] = useState("");
  const dragPayload = useRef(null);

  const totalLeaves = useMemo(() => countLeaves(tree), [tree]);

  const handleSend = useCallback((chatId, text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    setMessages((prev) => ({
      ...prev,
      [chatId]: [
        ...(prev[chatId] || []),
        { id: genId("m"), sender: "me", text, time },
      ],
    }));
    // simulate a reply
    setTimeout(
      () => {
        const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        setMessages((prev) => ({
          ...prev,
          [chatId]: [
            ...(prev[chatId] || []),
            { id: genId("m"), sender: "them", text: reply, time: "now" },
          ],
        }));
      },
      900 + Math.random() * 900,
    );
  }, []);

  const handleClose = useCallback((leafId) => {
    setTree((prev) => removeLeaf(prev, leafId));
  }, []);

  const handleSplitClick = useCallback((leafId, edge) => {
    setTree((prev) => splitLeaf(prev, leafId, edge, null));
  }, []);

  const handleResizeSplit = useCallback((splitId, sizes) => {
    setTree((prev) => setSplitSizes(prev, splitId, sizes));
  }, []);

  const handleDrop = useCallback((targetLeafId, zone) => {
    const payload = dragPayload.current;
    if (!payload) return;
    if (payload.kind === "pane" && payload.leafId === targetLeafId) {
      dragPayload.current = null;
      return;
    }
    setTree((prev) => {
      let next =
        zone === "center"
          ? updateNode(prev, targetLeafId, (n) => ({
              ...n,
              chatId: payload.chatId,
            }))
          : splitLeaf(prev, targetLeafId, zone, payload.chatId);
      if (payload.kind === "pane") next = removeLeaf(next, payload.leafId);
      return next;
    });
    dragPayload.current = null;
  }, []);

  const filteredFriends = FRIENDS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "#100f15",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#f0eef7",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #2a2836; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        input::placeholder { color: #5a5768; }
      `}</style>

      {/* SECTION 1 — friends / conversations */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid #221f2c",
          display: "flex",
          flexDirection: "column",
          padding: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: -0.3,
            padding: "4px 4px 12px",
          }}
        >
          vibe
        </div>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search
            size={13}
            style={{ position: "absolute", left: 9, top: 9, color: "#5a5768" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            style={{
              width: "100%",
              background: "#1a1922",
              border: "1px solid #2a2836",
              borderRadius: 8,
              padding: "7px 10px 7px 28px",
              color: "#f0eef7",
              fontSize: 12,
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {filteredFriends.map((f) => (
            <div
              key={f.id}
              draggable
              onDragStart={(e) => {
                dragPayload.current = { kind: "friend", chatId: f.id };
                e.dataTransfer.setData("text/plain", f.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 8px",
                borderRadius: 8,
                cursor: "grab",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1a1922")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: f.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#14131a",
                  }}
                >
                  {initials(f.name)}
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: -1,
                    right: -1,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    border: "2px solid #100f15",
                    background:
                      f.status === "online"
                        ? "#4fd8c4"
                        : f.status === "idle"
                          ? "#facc15"
                          : "#4b4859",
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {f.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#655f78",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {f.last}
                </div>
              </div>
              {f.unread > 0 && (
                <div
                  style={{
                    background: "#ff9f6b",
                    color: "#14131a",
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 20,
                    minWidth: 16,
                    height: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    flexShrink: 0,
                  }}
                >
                  {f.unread}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 10,
            borderTop: "1px solid #221f2c",
            fontSize: 11,
            color: "#4b4859",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <GripHorizontal size={12} />
          Drag a name onto a pane edge to split
        </div>
      </div>

      {/* SECTION 2 — the workspace of panes */}
      <div style={{ flex: 1, padding: 8, minWidth: 0 }}>
        <PanelNode
          node={tree}
          friends={FRIENDS}
          messages={messages}
          onSend={handleSend}
          onClose={handleClose}
          onDrop={handleDrop}
          onDragStartPane={(leafId, chatId) => {
            dragPayload.current = { kind: "pane", leafId, chatId };
          }}
          onSplit={handleSplitClick}
          onResizeSplit={handleResizeSplit}
          totalLeaves={totalLeaves}
        />
      </div>
    </div>
  );
}

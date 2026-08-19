import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:3000";

// How long the user can be idle before we tell the server they're away.
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  // userId -> "online" | "away" (absent key = offline)
  const [statusMap, setStatusMap] = useState(() => new Map());
  // userId -> ISO timestamp of when they last went offline
  const [lastSeenMap, setLastSeenMap] = useState(() => new Map());
  // Our own live status, since the server only broadcasts to *others*
  const [myStatus, setMyStatus] = useState("online");

  const isAwayRef = useRef(false);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem("vibe_token");
    if (!token) return;

    const newSocket = io(SOCKET_URL, { auth: { token } });

    const handleConnect = () => {
      setIsConnected(true);
      setSocket(newSocket);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocket(null);
    };

    const handlePresenceSnapshot = (snapshot) => {
      setStatusMap(() => {
        const next = new Map();
        snapshot.forEach(({ userId, status }) => next.set(userId, status));
        return next;
      });
    };

    const handlePresenceUpdate = ({ userId, status, lastSeenAt }) => {
      setStatusMap((prev) => {
        const next = new Map(prev);
        if (status === "offline") next.delete(userId);
        else next.set(userId, status);
        return next;
      });
      if (status === "offline" && lastSeenAt) {
        setLastSeenMap((prev) => new Map(prev).set(userId, lastSeenAt));
      }
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("presenceSnapshot", handlePresenceSnapshot);
    newSocket.on("presenceUpdate", handlePresenceUpdate);

    // ── Idle detection ────────────────────────────────────────────────
    const goActive = () => {
      if (isAwayRef.current) {
        isAwayRef.current = false;
        setMyStatus("online");
        newSocket.emit("presence:active");
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(goAway, IDLE_TIMEOUT_MS);
    };

    function goAway() {
      isAwayRef.current = true;
      setMyStatus("away");
      newSocket.emit("presence:away");
    }

    // Switching tabs away shouldn't wait for the idle timer
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        goActive();
      } else {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        goAway();
      }
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, goActive, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);
    idleTimerRef.current = setTimeout(goAway, IDLE_TIMEOUT_MS);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("presenceSnapshot", handlePresenceSnapshot);
      newSocket.off("presenceUpdate", handlePresenceUpdate);
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, goActive),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setStatusMap(new Map());
      setLastSeenMap(new Map());
      setMyStatus("online");
    };
  }, [isAuthenticated, user?._id]);

  // Kept for any existing code checking onlineUsers.has(id) — "online or away"
  const onlineUsers = new Set(statusMap.keys());

  const getUserStatus = (userId) =>
    userId ? statusMap.get(String(userId)) || "offline" : "offline";

  const value = {
    socket,
    isConnected,
    onlineUsers,
    statusMap,
    lastSeenMap,
    myStatus,
    getUserStatus,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

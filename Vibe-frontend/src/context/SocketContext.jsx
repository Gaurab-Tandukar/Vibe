import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

const SocketContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:3000";

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  // userId -> ISO timestamp of when they last went offline
  const [lastSeenMap, setLastSeenMap] = useState(() => new Map());

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

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    const handleUserOffline = ({ userId, lastSeenAt }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      if (lastSeenAt) {
        setLastSeenMap((prev) => {
          const next = new Map(prev);
          next.set(userId, lastSeenAt);
          return next;
        });
      }
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("userOnline", handleUserOnline);
    newSocket.on("userOffline", handleUserOffline);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("userOnline", handleUserOnline);
      newSocket.off("userOffline", handleUserOffline);
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers(new Set());
      setLastSeenMap(new Map());
    };
  }, [isAuthenticated, user?._id]);

  const value = {
    socket,
    isConnected,
    onlineUsers,
    lastSeenMap,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

// userId -> { socketId, status: "online" | "away" }
const onlineUsers = new Map();

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication Failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    onlineUsers.set(userId, { socketId: socket.id, status: "online" });

    // Tell everyone else this user just came online
    socket.broadcast.emit("presenceUpdate", { userId, status: "online" });

    // Give the newly-connected client a snapshot of who's currently
    // online/away, since presenceUpdate broadcasts only go to *others*.
    socket.emit(
      "presenceSnapshot",
      Array.from(onlineUsers.entries()).map(([id, v]) => ({
        userId: id,
        status: v.status,
      })),
    );

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on("typing", (conversationId) => {
      socket.to(conversationId).emit("userTyping", {
        conversationId,
        userId,
        username: socket.user.username,
        avatarUrl: socket.user.avatarUrl,
      });
    });

    socket.on("stopTyping", (conversationId) => {
      socket.to(conversationId).emit("userStoppedTyping", {
        conversationId,
        userId,
      });
    });

    // Client-driven presence, fired by the frontend idle timer
    socket.on("presence:away", () => {
      const entry = onlineUsers.get(userId);
      if (!entry || entry.socketId !== socket.id || entry.status === "away")
        return;
      entry.status = "away";
      socket.broadcast.emit("presenceUpdate", { userId, status: "away" });
    });

    socket.on("presence:active", () => {
      const entry = onlineUsers.get(userId);
      if (!entry || entry.socketId !== socket.id || entry.status === "online")
        return;
      entry.status = "online";
      socket.broadcast.emit("presenceUpdate", { userId, status: "online" });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      const entry = onlineUsers.get(userId);
      // Guard against a user connected from two tabs: only clear state if
      // this socket is the one we were actually tracking.
      if (entry && entry.socketId === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("presenceUpdate", {
          userId,
          status: "offline",
          lastSeenAt: new Date().toISOString(),
        });
      }
    });
  });

  io.onlineUsers = onlineUsers;
};

// socket/socketHandler.js
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const onlineUsers = new Map(); // userId -> socketId

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

    onlineUsers.set(userId, socket.id);

    // tell everyone this user is online
    socket.broadcast.emit("userOnline", { userId });

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
      console.log(`${socket.user.username} joined room ${conversationId}`);
    });

    socket.on("leaveConversation", (conversationId) => {
      socket.leave(conversationId);
    });

    // typing indicators
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

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);

      // tell everyone this user went offline
      const lastSeenAt = new Date().toISOString();

      socket.broadcast.emit("userOffline", { userId, lastSeenAt });
    });
  });

  io.onlineUsers = onlineUsers;
};

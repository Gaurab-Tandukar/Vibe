const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const onlineUsers = new Map();

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-passwordHash");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user; // attach user to this socket, like req.user in Express
      next();
    } catch (error) {
      next(new Error("Authentication Failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // mark this user as online
    onlineUsers.set(userId, socket.id);

    // let the client tell us which conversation they're viewing
    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId); // conversationId becomes the room name
      console.log(`${socket.user.username} joined room ${conversationId}`);
    });

    // handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.username}`);
      onlineUsers.delete(userId);
    });
  });

  // expose onlineUsers so controllers can check who's connected
  io.onlineUsers = onlineUsers;
};

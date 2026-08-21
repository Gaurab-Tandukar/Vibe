const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/dbConfig");
const cors = require("cors");
const errorHandler = require("./middleware/Errorhandler");
const env = require("./config/env");

// pathing for file upload
const path = require("path");

const app = express();

const allowedOrigins = env.CLIENT_URL
  ? [env.CLIENT_URL, "http://localhost:5173", "http://localhost:3000"]
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production" ||
        allowedOrigins.includes("*")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routing
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api/users", require("./routes/userRoute"));
app.use("/api/chats", require("./routes/conversationRoute"));
app.use("/api/messages", require("./routes/messageRoute"));
app.use("/api/reactions", require("./routes/reactionRoute"));
app.use("/api/attachments", require("./routes/attachmentRoute"));
app.use("/api/notifications", require("./routes/notificationRoute"));

app.use(errorHandler);

// create a raw http server wrapping the express app
const server = http.createServer(app);

// attach socket.io to that server
const io = new Server(server, {
  cors: { origin: "*" },
});

// load our socket connection logic
require("./socket/socketHandler")(io);

app.set("io", io);

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  const PORT = env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${env.NODE_ENV}]`);
  });
};

startServer();

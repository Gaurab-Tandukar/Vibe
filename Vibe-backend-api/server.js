// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConfig");
const cors = require("cors");

// pathing for file upload
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
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

  const PORT = process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConfig");

// pathing for file upload
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();

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

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

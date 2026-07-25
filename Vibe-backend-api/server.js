// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/dbConfig");

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());

// Routing
app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api/users", require("./routes/userRoute"));

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

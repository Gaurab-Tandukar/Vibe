const dotenv = require("dotenv");
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/vibe",
  JWT_SECRET: process.env.JWT_SECRET || "vibe_super_secret_jwt_key_default",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "30d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  MESSAGE_ENCRYPTION_KEY: process.env.MESSAGE_ENCRYPTION_KEY || "vibe_secure_default_32_byte_enc_key",
};

// Validate critical configs in production
if (env.NODE_ENV === "production") {
  if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET is not set in production. Using default key is insecure.");
  }
  if (!process.env.MONGO_URI) {
    console.warn("WARNING: MONGO_URI is not explicitly set in production.");
  }
}

module.exports = env;

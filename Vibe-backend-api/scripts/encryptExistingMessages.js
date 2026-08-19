/**
 * One-off migration script.
 * Encrypts the `content` field on every existing Message document that is
 * still plaintext (i.e. not already in "iv:authTag:ciphertext" hex format).
 *
 * Usage:
 *   cd Vibe-backend-api
 *   node ../scripts/encryptExistingMessages.js
 *
 * Safe to re-run: already-encrypted or empty-content messages are skipped.
 * BACK UP YOUR DATABASE before running this against production data.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Message = require("../model/messageModel");

// Matches the iv:authTag:ciphertext hex format produced by util/encryption.js
const ENCRYPTED_FORMAT = /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/i;

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set in your .env file.");
    process.exit(1);
  }
  if (!process.env.MESSAGE_ENCRYPTION_KEY) {
    console.error("MESSAGE_ENCRYPTION_KEY is not set in your .env file.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const cursor = Message.find({
    content: { $exists: true, $ne: "" },
  }).cursor();

  let scanned = 0;
  let encrypted = 0;
  let skipped = 0;
  let failed = 0;

  for await (const doc of cursor) {
    scanned++;

    if (ENCRYPTED_FORMAT.test(doc.content)) {
      skipped++;
      continue;
    }

    try {
      // Re-assigning the same string marks the path modified so the
      // pre("save") hook in messageModel.js encrypts it before writing.
      doc.content = doc.content;
      doc.markModified("content");
      await doc.save();
      encrypted++;
    } catch (err) {
      failed++;
      console.error(`Failed to encrypt message ${doc._id}:`, err.message);
    }

    if (scanned % 500 === 0) {
      console.log(`...scanned ${scanned} so far`);
    }
  }

  console.log("Done.");
  console.log(`Scanned: ${scanned}`);
  console.log(`Encrypted: ${encrypted}`);
  console.log(`Already encrypted (skipped): ${skipped}`);
  console.log(`Failed: ${failed}`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

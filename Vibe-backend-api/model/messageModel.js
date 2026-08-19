const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../util/encryption");

const messageSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Improved field
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "messages",
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

messageSchema.virtual("attachments", {
  ref: "Attachment",
  localField: "_id",
  foreignField: "message",
});

messageSchema.virtual("reactions", {
  ref: "Reaction",
  localField: "_id",
  foreignField: "message",
});

// --- Encryption hooks ---
// Encrypt content right before it's written to MongoDB.
// (No `next` callback param here — modern Mongoose treats a zero-arg
// function as "run synchronously, then continue automatically". Using
// the old next()-callback style was throwing "next is not a function"
// on this project's Mongoose version.)
messageSchema.pre("save", function () {
  if (this.isModified("content") && this.content) {
    this.content = encrypt(this.content);
  }
});

// Also cover updateOne/findOneAndUpdate/updateMany style writes, in case
// content is ever changed outside of doc.save() (e.g. Message.updateOne(...)).
messageSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  const update = this.getUpdate();
  if (update?.content) {
    update.content = encrypt(update.content);
  }
  if (update?.$set?.content) {
    update.$set.content = encrypt(update.$set.content);
  }
});

function decryptDoc(doc) {
  if (doc && doc.content) {
    doc.content = decrypt(doc.content);
  }
}

// Decrypt content whenever docs come back out of MongoDB.
messageSchema.post("find", function (docs) {
  docs.forEach(decryptDoc);
});

messageSchema.post("findOne", function (doc) {
  decryptDoc(doc);
});

messageSchema.post("findOneAndUpdate", function (doc) {
  decryptDoc(doc);
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;

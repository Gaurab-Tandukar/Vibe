const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
    },

    // References
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    emoji: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "reactions",
  },
);

// Prevent duplicate reactions (one user can react only once per message)
reactionSchema.index({ message: 1, user: 1, emoji: 1 }, { unique: true });

// Virtuals for easy population
reactionSchema.virtual("userDetails", {
  ref: "User",
  localField: "user",
  foreignField: "_id",
  justOne: true,
});

reactionSchema.virtual("messageDetails", {
  ref: "Message",
  localField: "message",
  foreignField: "_id",
  justOne: true,
});

const Reaction = mongoose.model("Reaction", reactionSchema);

module.exports = Reaction;

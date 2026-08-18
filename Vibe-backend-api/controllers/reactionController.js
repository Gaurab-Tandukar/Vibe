const mongoose = require("mongoose");
const Reaction = require("../model/reactionModel");
const Message = require("../model/messageModel");
const Conversation = require("../model/conversationModel");

const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }
    if (!emoji || !emoji.trim()) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    if (message.isDeleted) {
      return res
        .status(400)
        .json({ message: "Cannot react to a deleted message" });
    }

    const conversation = await Conversation.findById(message.conversation);
    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    const existing = await Reaction.findOne({
      message: messageId,
      user: currentUserId,
      emoji,
    });

    if (existing) {
      await existing.deleteOne();
    } else {
      try {
        await Reaction.create({
          message: messageId,
          user: currentUserId,
          emoji,
        });
      } catch (error) {
        if (error.code === 11000) {
          return res.status(409).json({ message: "Reaction already exists" });
        }
        throw error;
      }
    }

    // send the full, current reaction list for this message so every
    // client just replaces its local copy — avoids drift from missed events
    const reactions = await Reaction.find({ message: messageId }).populate(
      "user",
      "username avatarUrl",
    );

    const io = req.app.get("io");
    io.to(message.conversation.toString()).emit("reactionUpdated", {
      messageId,
      reactions,
    });

    res.status(200).json({ reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReactions = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const reactions = await Reaction.find({ message: messageId }).populate(
      "user",
      "username avatarUrl",
    );

    res.status(200).json(reactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addReaction, getReactions };

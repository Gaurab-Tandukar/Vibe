const mongoose = require("mongoose");
const Reaction = require("../model/reactionModel");
const Message = require("../model/messageModel");
const Conversation = require("../model/conversationModel");
const ApiError = require("../util/ApiError");
const asyncHandler = require("../middleware/asyncHandler");

// @desc   Add or remove a reaction (toggle)
// @route  POST /api/reactions/:messageId
const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw ApiError.badRequest("Invalid message ID");
  }
  if (!emoji || !emoji.trim()) {
    throw ApiError.badRequest("Emoji is required");
  }

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound("Message not found");
  if (message.isDeleted) throw ApiError.badRequest("Cannot react to a deleted message");

  const conversation = await Conversation.findById(message.conversation);
  const isMember = conversation?.participants.some(
    (p) => p.toString() === currentUserId.toString(),
  );
  if (!isMember) throw ApiError.forbidden("You are not a member of this conversation");

  const existing = await Reaction.findOne({
    message: messageId,
    user: currentUserId,
    emoji: emoji.trim(),
  });

  if (existing) {
    await existing.deleteOne();
  } else {
    try {
      await Reaction.create({
        message: messageId,
        user: currentUserId,
        emoji: emoji.trim(),
      });
    } catch (error) {
      if (error.code === 11000) {
        throw ApiError.conflict("Reaction already exists");
      }
      throw error;
    }
  }

  const reactions = await Reaction.find({ message: messageId }).populate(
    "user",
    "username avatarUrl",
  );

  const io = req.app.get("io");
  if (io) {
    io.to(message.conversation.toString()).emit("reactionUpdated", {
      messageId,
      reactions,
    });
  }

  res.status(200).json({ reactions });
});

// @desc   Get reactions for a message
// @route  GET /api/reactions/:messageId
const getReactions = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw ApiError.badRequest("Invalid message ID");
  }

  const reactions = await Reaction.find({ message: messageId }).populate(
    "user",
    "username avatarUrl",
  );

  res.status(200).json(reactions);
});

module.exports = { addReaction, getReactions };

const Conversation = require("../model/conversationModel");
const ConversationMember = require("../model/conversationMemberModel");
const User = require("../model/userModel");

// @desc   create Conversation
// @route  POST /api/chat
const createConversation = async (req, res) => {
  try {
    const { name, isGroup, members } = req.body;
    const currentUserId = req.user._id;

    // Validation
    if (!members || members.length === 0) {
      return res.status(400).json({ message: "Members are required" });
    }

    // For private chat → only 1 other user
    if (!isGroup && members.length !== 1) {
      return res
        .status(400)
        .json({ message: "Private chat needs exactly 1 other user" });
    }

    // Prevent creating duplicate private conversation
    if (!isGroup) {
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, members[0]], $size: 2 },
      });

      if (existing) {
        return res.status(200).json(existing); // return existing private chat
      }
    }

    // Create conversation
    const conversation = await Conversation.create({
      name: isGroup ? name : null,
      isGroup: isGroup || false,
      participants: [currentUserId, ...members],
      lastMessageAt: Date.now(),
    });

    // Create ConversationMember records
    const allMembers = [currentUserId, ...members];

    const memberDocs = allMembers.map((userId) => {
      let role = "member";

      // Only set admin if it's a GROUP and the user is the creator
      if (isGroup && userId.toString() === currentUserId.toString()) {
        role = "admin";
      }

      return {
        conversation: conversation._id,
        user: userId,
        role: role,
      };
    });

    await ConversationMember.insertMany(memberDocs);

    // Populate and return
    const fullConversation = await Conversation.findById(
      conversation._id,
    ).populate("participants", "username email avatarUrl");

    res.status(201).json(fullConversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createConversation,
};

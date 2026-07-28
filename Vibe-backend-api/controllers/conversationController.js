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

// @desc   get all Conversation for a single user
// @route  GET /api/chat
const getMyConversations = async (req, res) => {
  try {
    const conversation = await Conversation.find({ participants: req.user._id })
      .populate("participatintsparticipants", "username email avatarUrl status")
      .sort({ lastMessageAt: -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single conversation
// @route   GET /api/chat/:id
const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      "participants",
      "username email avatarUrl status",
    );

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if current user is a member
    const isMember = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString(),
    );

    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to group conversation
// @route   POST /api/chats/:id/members
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation || !conversation.isGroup) {
      return res
        .status(400)
        .json({ message: "Only group conversations can add members" });
    }

    // Check if already a member
    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add to participants
    conversation.participants.push(userId);
    await conversation.save();

    // Create ConversationMember
    await ConversationMember.create({
      conversation: conversationId,
      user: userId,
      role: "member",
    });

    res.status(200).json({ message: "Member added successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from group (Admin only)
// @route   DELETE /api/chats/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userIdToRemove = req.params.userId;
    const currentUserId = req.user._id.toString();

    // 1. Find conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // 2. Only group allowed
    if (!conversation.isGroup) {
      return res
        .status(400)
        .json({ message: "Cannot remove members from private chat" });
    }

    // 3. Check if current user is admin of this group
    const currentMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });

    if (!currentMember || currentMember.role !== "admin") {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    // 4. Prevent admin from removing themselves this way (optional)
    if (userIdToRemove === currentUserId) {
      return res
        .status(400)
        .json({
          message: "Admin cannot remove themselves. Use leave group instead.",
        });
    }

    // 5. Check if the user is actually a member
    const memberToRemove = await ConversationMember.findOne({
      conversation: conversationId,
      user: userIdToRemove,
    });

    if (!memberToRemove) {
      return res
        .status(404)
        .json({ message: "User is not a member of this group" });
    }

    // 6. Remove from ConversationMember collection
    await ConversationMember.deleteOne({
      conversation: conversationId,
      user: userIdToRemove,
    });

    // 7. Remove from participants array in Conversation
    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userIdToRemove,
    );
    await conversation.save();

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createConversation,
  getMyConversations,
  getConversationById,
  addMember,
  removeMember,
};

const Conversation = require("../model/conversationModel");
const ConversationMember = require("../model/conversationMemberModel");
const User = require("../model/userModel");

// @desc   create Conversation
// @route  POST /api/chat
const createConversation = async (req, res) => {
  try {
    const { name, isGroup, members } = req.body;
    const currentUserId = req.user._id;

    // 1. Basic validation
    if (!members || members.length === 0) {
      return res.status(400).json({ message: "Members are required" });
    }

    // 2. Validate each member id is a proper ObjectId (prevents CastError)
    const invalidId = members.find(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    if (invalidId) {
      return res
        .status(400)
        .json({ message: `Invalid member id: ${invalidId}` });
    }

    // 3. Dedupe + strip current user from the array
    //    (prevents the duplicate-key bug in conversation_members)
    const uniqueMembers = [...new Set(members.map(String))].filter(
      (id) => id !== currentUserId.toString(),
    );

    if (uniqueMembers.length === 0) {
      return res
        .status(400)
        .json({ message: "Cannot create a conversation with yourself only" });
    }

    // 4. Confirm all target users actually exist
    const existingUsers = await User.find({
      _id: { $in: uniqueMembers },
    }).select("_id");
    if (existingUsers.length !== uniqueMembers.length) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    // 5. Group-specific validation
    if (isGroup && (!name || !name.trim())) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // 6. Private chat: exactly 1 other user
    if (!isGroup && uniqueMembers.length !== 1) {
      return res
        .status(400)
        .json({ message: "Private chat needs exactly 1 other user" });
    }

    // 7. Prevent duplicate private conversation
    if (!isGroup) {
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, uniqueMembers[0]], $size: 2 },
      }).populate("participants", "username email avatarUrl");

      if (existing) {
        return res.status(200).json(existing); // return existing private chat
      }
    }

    // 8. Create conversation
    const conversation = await Conversation.create({
      name: isGroup ? name.trim() : null,
      isGroup: isGroup || false,
      participants: [currentUserId, ...uniqueMembers],
      lastMessageAt: Date.now(),
    });

    // 9. Create ConversationMember records
    const allMembers = [currentUserId, ...uniqueMembers];

    const memberDocs = allMembers.map((userId) => {
      let role = "member";

      // Only set admin if it's a GROUP and the user is the creator
      if (isGroup && userId.toString() === currentUserId.toString()) {
        role = "admin";
      }

      return {
        conversation: conversation._id,
        user: userId,
        role,
      };
    });

    try {
      await ConversationMember.insertMany(memberDocs, { ordered: true });
    } catch (memberError) {
      // Rollback conversation if member creation fails (no transactions on standalone Mongo)
      await Conversation.findByIdAndDelete(conversation._id);
      throw memberError;
    }

    // 10. Populate and return
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
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username email avatarUrl status")
      .sort({ lastMessageAt: -1 });

    res.status(200).json(conversations);
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
    const currentUserId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      return res
        .status(400)
        .json({ message: "Only group conversations can add members" });
    }

    // ✅ requester must be an admin of this group
    const requester = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // ✅ target user must actually exist
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    conversation.participants.push(userId);
    await conversation.save();

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
      return res.status(400).json({
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

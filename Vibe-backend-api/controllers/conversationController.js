const mongoose = require("mongoose");
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
    // 7. Prevent duplicate private conversation
    if (!isGroup) {
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, uniqueMembers[0]], $size: 2 },
      });

      if (existing) {
        const wasHidden = existing.hiddenBy.some(
          (id) => id.toString() === currentUserId.toString(),
        );
        const wasPinned = existing.pinnedBy.some(
          (id) => id.toString() === currentUserId.toString(),
        );

        // Starting a new conversation with someone whose chat you'd hidden
        // should un-hide it, and un-hiding always clears the pin too.
        if (wasHidden || wasPinned) {
          existing.hiddenBy.pull(currentUserId);
          existing.pinnedBy.pull(currentUserId);
          await existing.save();
        }

        const populated = await existing.populate(
          "participants",
          "username email avatarUrl",
        );

        return res.status(200).json(populated); // return existing private chat
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
    const userId = req.user._id || req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
      hiddenBy: { $ne: userId },
    })
      .populate(
        "participants",
        "username firstName lastName avatarUrl email status",
      )
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching conversations", error });
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

// @desc   leave a group conversation (self-service, non-admin or admin who isn't last)
// @route  DELETE /api/chat/:id/leave
const leaveConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Cannot leave a private chat" });
    }

    const membership = await ConversationMember.findOne({
      conversation: id,
      user: currentUserId,
    });
    if (!membership) {
      return res
        .status(400)
        .json({ message: "You are not a member of this conversation" });
    }

    // ✅ if this user is the only admin, block leaving until they transfer admin
    if (membership.role === "admin") {
      const adminCount = await ConversationMember.countDocuments({
        conversation: id,
        role: "admin",
      });
      if (adminCount === 1) {
        const otherMembersCount = await ConversationMember.countDocuments({
          conversation: id,
          user: { $ne: currentUserId },
        });

        if (otherMembersCount > 0) {
          return res.status(400).json({
            message:
              "You are the only admin. Transfer admin role to another member before leaving.",
          });
        }
        // if they're the only member left, leaving effectively deletes the group below
      }
    }

    await ConversationMember.findOneAndDelete({
      conversation: id,
      user: currentUserId,
    });
    await Conversation.findByIdAndUpdate(id, {
      $pull: { participants: currentUserId },
    });

    // ✅ if no members remain, delete the empty group entirely
    const remainingMembers = await ConversationMember.countDocuments({
      conversation: id,
    });
    if (remainingMembers === 0) {
      await Conversation.findByIdAndDelete(id);
    }

    res.status(200).json({ message: "Left conversation successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   transfer admin role to another member (current admin only)
// @route  PUT /api/chat/:id/transfer-admin
const transferAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { newAdminUserId } = req.body;
    const currentUserId = req.user._id;

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(newAdminUserId)
    ) {
      return res.status(400).json({ message: "Invalid id(s)" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res
        .status(400)
        .json({ message: "Only group conversations have admins" });
    }

    const requesterMembership = await ConversationMember.findOne({
      conversation: id,
      user: currentUserId,
    });
    if (!requesterMembership || requesterMembership.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only the current admin can transfer this role" });
    }

    const targetMembership = await ConversationMember.findOne({
      conversation: id,
      user: newAdminUserId,
    });
    if (!targetMembership) {
      return res
        .status(404)
        .json({ message: "Target user is not a member of this group" });
    }

    // ✅ swap roles
    requesterMembership.role = "member";
    targetMembership.role = "admin";

    await requesterMembership.save();
    await targetMembership.save();

    res.status(200).json({ message: "Admin role transferred successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   rename a group conversation (admin only)
// @route  PUT /api/chat/:id
const renameConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res
        .status(400)
        .json({ message: "Only group conversations can be renamed" });
    }

    const membership = await ConversationMember.findOne({
      conversation: id,
      user: currentUserId,
    });
    if (!membership || membership.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can rename the group" });
    }

    conversation.name = name.trim();
    await conversation.save();

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   soft delete (hide) a conversation
// @route  PATCH /api/chat/:conversationId/hide
const hideConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id; // Extracted from auth middleware

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { hiddenBy: userId },
        $pull: { pinnedBy: userId }, // hiding a chat always clears its pin
      },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json({
      message: "Conversation hidden successfully",
      conversation,
    });
  } catch (error) {
    res.status(500).json({ message: "Error hiding conversation", error });
  }
};

// Helper to populate participants consistently
const POPULATE_FIELDS = "username firstName lastName avatarUrl email status";

// @desc    Toggle pin conversations
// @route   PATCH /api/chat/:conversationId/pin
const togglePinConversation = async (req, res) => {
  try {
    const conversationId = req.params.id || req.params.conversationId;
    const userId = req.user._id || req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isPinned = conversation.pinnedBy.includes(userId);
    const update = isPinned
      ? { $pull: { pinnedBy: userId } }
      : { $addToSet: { pinnedBy: userId } };

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversationId,
      update,
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    res.status(200).json({
      message: isPinned ? "Conversation unpinned" : "Conversation pinned",
      isPinned: !isPinned,
      conversation: updatedConv,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error toggling pin state", error: error.message });
  }
};

// @desc    Toggle mute conversations
// @route   PATCH /api/chat/:conversationId/mute
const toggleMuteConversation = async (req, res) => {
  try {
    const conversationId = req.params.id || req.params.conversationId;
    const userId = req.user._id || req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMuted = conversation.mutedBy.includes(userId);
    const update = isMuted
      ? { $pull: { mutedBy: userId } }
      : { $addToSet: { mutedBy: userId } };

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversationId,
      update,
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    res.status(200).json({
      message: isMuted ? "Conversation unmuted" : "Conversation muted",
      isMuted: !isMuted,
      conversation: updatedConv,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error toggling mute state", error: error.message });
  }
};

// @desc    Mark as Unread conversations
// @route   PATCH /api/chat/:conversationId/unread
const markAsUnread = async (req, res) => {
  try {
    const conversationId = req.params.id || req.params.conversationId;
    const userId = req.user._id || req.user.id;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, participants: userId },
      { $addToSet: { unreadBy: userId } },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json({ message: "Marked as unread", conversation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking as unread", error: error.message });
  }
};

// @desc    Mark as read conversations
// @route   PATCH /api/chat/:conversationId/read
const markAsRead = async (req, res) => {
  try {
    const conversationId = req.params.id || req.params.conversationId;
    const userId = req.user._id || req.user.id;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, participants: userId },
      { $pull: { unreadBy: userId } },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json({ message: "Marked as read", conversation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking as read", error: error.message });
  }
};

// @desc    Block user in a conversation (1:1 only)
// @route   PATCH /api/chat/:conversationId/block
const blockUser = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.params.id;
    const userId = req.user._id || req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Only allow blocking in 1:1 conversations
    if (conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot block users in group conversations. Remove them instead.",
      });
    }

    // Check if current user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString(),
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this conversation",
      });
    }

    // Already blocked?
    const alreadyBlocked = conversation.blockedBy.some(
      (id) => id.toString() === userId.toString(),
    );

    if (alreadyBlocked) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked",
      });
    }

    // Add current user to blockedBy
    conversation.blockedBy.push(userId);

    // Optional: also hide the conversation for the blocker
    if (
      !conversation.hiddenBy.some((id) => id.toString() === userId.toString())
    ) {
      conversation.hiddenBy.push(userId);
    }

    await conversation.save();

    // Optional: emit socket event so the other user gets real-time update
    // req.app.get("io")?.to(conversationId).emit("user_blocked", { conversationId, blockedBy: userId });

    return res.status(200).json({
      success: true,
      message: "User blocked successfully",
      data: {
        conversationId: conversation._id,
        blockedBy: conversation.blockedBy,
      },
    });
  } catch (error) {
    console.error("blockUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while blocking user",
      error: error.message,
    });
  }
};

// @desc    Unblock user in a conversation
// @route   PATCH /api/chat/:conversationId/unblock
// @access  Private
const unblockUser = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.params.id;
    const userId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Remove user from blockedBy
    conversation.blockedBy = conversation.blockedBy.filter(
      (id) => id.toString() !== userId.toString(),
    );

    // If this conversation was auto-hidden during block, restore it on unblock
    conversation.hiddenBy = conversation.hiddenBy.filter(
      (id) => id.toString() !== userId.toString(),
    );

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: {
        conversationId: conversation._id,
        blockedBy: conversation.blockedBy,
      },
    });
  } catch (error) {
    console.error("unblockUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while unblocking user",
      error: error.message,
    });
  }
};

// @desc    Get users blocked by current user (1:1 conversations)
// @route   GET /api/chat/blocked/users
// @access  Private
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const blockedConversations = await Conversation.find({
      isGroup: false,
      participants: userId,
      blockedBy: userId,
    }).populate("participants", "username firstName lastName avatarUrl email");

    const blockedUsers = blockedConversations
      .map((conversation) => {
        const blockedUser = conversation.participants.find(
          (p) => p._id.toString() !== userId.toString(),
        );

        if (!blockedUser) return null;

        return {
          conversationId: conversation._id,
          user: blockedUser,
          blockedAt: conversation.updatedAt,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      count: blockedUsers.length,
      users: blockedUsers,
    });
  } catch (error) {
    console.error("getBlockedUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching blocked users",
      error: error.message,
    });
  }
};

// @desc   Get all members of a group with roles + user info
// @route  GET /api/chat/:id/members
const getGroupMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation || !conversation.isGroup) {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    const members = await ConversationMember.find({ conversation: id })
      .populate("user", "username firstName lastName avatarUrl email status")
      .sort({ role: 1, joinedAt: 1 }); // admins first

    res.status(200).json({ members });
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
  leaveConversation,
  transferAdmin,
  renameConversation,
  hideConversation,
  togglePinConversation,
  toggleMuteConversation,
  markAsUnread,
  markAsRead,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getGroupMembers,
};

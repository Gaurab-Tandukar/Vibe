const mongoose = require("mongoose");
const Conversation = require("../model/conversationModel");
const ConversationMember = require("../model/conversationMemberModel");
const User = require("../model/userModel");
const ApiError = require("../util/ApiError");

const POPULATE_FIELDS = "username firstName lastName avatarUrl email status";

/**
 * Enterprise Service Layer for Conversation & Group Operations
 */
class ConversationService {
  async createConversation(currentUserId, { name, isGroup, members }) {
    if (!members || !Array.isArray(members) || members.length === 0) {
      throw ApiError.badRequest("Members array is required");
    }

    const invalidId = members.find((id) => !mongoose.Types.ObjectId.isValid(id));
    if (invalidId) {
      throw ApiError.badRequest(`Invalid member id: ${invalidId}`);
    }

    const uniqueMembers = [...new Set(members.map(String))].filter(
      (id) => id !== currentUserId.toString(),
    );

    if (uniqueMembers.length === 0) {
      throw ApiError.badRequest("Cannot create a conversation with yourself only");
    }

    const existingUsers = await User.find({ _id: { $in: uniqueMembers } }).select("_id");
    if (existingUsers.length !== uniqueMembers.length) {
      throw ApiError.notFound("One or more specified users were not found");
    }

    if (isGroup && (!name || !name.trim())) {
      throw ApiError.badRequest("Group name is required");
    }

    if (!isGroup && uniqueMembers.length !== 1) {
      throw ApiError.badRequest("Private chat needs exactly 1 other user");
    }

    // Return existing private conversation if already created
    if (!isGroup) {
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [currentUserId, uniqueMembers[0]], $size: 2 },
      });

      if (existing) {
        let needsSave = false;
        if (existing.hiddenBy?.some((id) => id.toString() === currentUserId.toString())) {
          existing.hiddenBy.pull(currentUserId);
          needsSave = true;
        }
        if (existing.pinnedBy?.some((id) => id.toString() === currentUserId.toString())) {
          existing.pinnedBy.pull(currentUserId);
          needsSave = true;
        }
        if (needsSave) await existing.save();

        return existing.populate("participants", POPULATE_FIELDS);
      }
    }

    // Create new conversation
    const conversation = await Conversation.create({
      name: isGroup ? name.trim() : null,
      isGroup: Boolean(isGroup),
      participants: [currentUserId, ...uniqueMembers],
      lastMessageAt: Date.now(),
    });

    const allMembers = [currentUserId, ...uniqueMembers];
    const memberDocs = allMembers.map((userId) => ({
      conversation: conversation._id,
      user: userId,
      role: isGroup && userId.toString() === currentUserId.toString() ? "admin" : "member",
    }));

    try {
      await ConversationMember.insertMany(memberDocs, { ordered: true });
    } catch (memberError) {
      await Conversation.findByIdAndDelete(conversation._id);
      throw memberError;
    }

    // Increment user stats
    if (isGroup) {
      await User.updateMany({ _id: { $in: allMembers } }, { $inc: { "stats.groupsJoined": 1 } });
    } else {
      await User.updateMany({ _id: { $in: allMembers } }, { $inc: { "stats.totalChats": 1 } });
    }

    return Conversation.findById(conversation._id).populate("participants", POPULATE_FIELDS);
  }

  async getMyConversations(userId) {
    return Conversation.find({
      participants: userId,
      hiddenBy: { $ne: userId },
    })
      .populate("participants", POPULATE_FIELDS)
      .sort({ updatedAt: -1 });
  }

  async getConversationById(conversationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest("Invalid conversation ID");
    }

    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      POPULATE_FIELDS,
    );

    if (!conversation) {
      throw ApiError.notFound("Conversation not found");
    }

    const isMember = conversation.participants.some(
      (p) => p._id.toString() === userId.toString(),
    );

    if (!isMember) {
      throw ApiError.forbidden("You are not a member of this conversation");
    }

    return conversation;
  }

  async addMember(conversationId, currentUserId, targetUserId) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw ApiError.badRequest("Invalid user ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw ApiError.badRequest("Only group conversations can add members");
    }

    const requester = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!requester || requester.role !== "admin") {
      throw ApiError.forbidden("Only group admins can add members");
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw ApiError.notFound("User not found");
    }

    if (conversation.participants.includes(targetUserId)) {
      throw ApiError.badRequest("User is already a member of this group");
    }

    conversation.participants.push(targetUserId);
    await conversation.save();

    await ConversationMember.create({
      conversation: conversationId,
      user: targetUserId,
      role: "member",
    });

    await User.findByIdAndUpdate(targetUserId, { $inc: { "stats.groupsJoined": 1 } });

    return { message: "Member added successfully" };
  }

  async removeMember(conversationId, currentUserId, userIdToRemove) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (!conversation.isGroup) throw ApiError.badRequest("Cannot remove members from private chat");

    const currentMember = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!currentMember || currentMember.role !== "admin") {
      throw ApiError.forbidden("Only admins can remove members");
    }

    if (userIdToRemove === currentUserId.toString()) {
      throw ApiError.badRequest("Admins cannot remove themselves. Use leave group instead.");
    }

    const memberToRemove = await ConversationMember.findOne({
      conversation: conversationId,
      user: userIdToRemove,
    });
    if (!memberToRemove) throw ApiError.notFound("User is not a member of this group");

    await ConversationMember.deleteOne({ conversation: conversationId, user: userIdToRemove });

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userIdToRemove,
    );
    await conversation.save();

    return { message: "Member removed successfully" };
  }

  async leaveConversation(conversationId, currentUserId) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest("Invalid conversation ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (!conversation.isGroup) throw ApiError.badRequest("Cannot leave a private chat");

    const membership = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!membership) throw ApiError.badRequest("You are not a member of this conversation");

    if (membership.role === "admin") {
      const adminCount = await ConversationMember.countDocuments({
        conversation: conversationId,
        role: "admin",
      });
      if (adminCount === 1) {
        const otherMembersCount = await ConversationMember.countDocuments({
          conversation: conversationId,
          user: { $ne: currentUserId },
        });

        if (otherMembersCount > 0) {
          throw ApiError.badRequest(
            "You are the only admin. Transfer admin role to another member before leaving.",
          );
        }
      }
    }

    await ConversationMember.findOneAndDelete({ conversation: conversationId, user: currentUserId });
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { participants: currentUserId },
    });

    const remainingMembers = await ConversationMember.countDocuments({
      conversation: conversationId,
    });
    if (remainingMembers === 0) {
      await Conversation.findByIdAndDelete(conversationId);
    }

    return { message: "Left conversation successfully" };
  }

  async transferAdmin(conversationId, currentUserId, newAdminUserId) {
    if (!mongoose.Types.ObjectId.isValid(newAdminUserId)) {
      throw ApiError.badRequest("Invalid target user ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw ApiError.badRequest("Only group conversations have admins");
    }

    const requesterMembership = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!requesterMembership || requesterMembership.role !== "admin") {
      throw ApiError.forbidden("Only the current admin can transfer this role");
    }

    const targetMembership = await ConversationMember.findOne({
      conversation: conversationId,
      user: newAdminUserId,
    });
    if (!targetMembership) {
      throw ApiError.notFound("Target user is not a member of this group");
    }

    requesterMembership.role = "member";
    targetMembership.role = "admin";

    await requesterMembership.save();
    await targetMembership.save();

    return { message: "Admin role transferred successfully" };
  }

  async setMemberNickname(conversationId, currentUserId, targetUserId, nickname) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw ApiError.badRequest("Only group conversations support nicknames");
    }

    const requester = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!requester || requester.role !== "admin") {
      throw ApiError.forbidden("Only admins can set member nicknames");
    }

    const target = await ConversationMember.findOne({
      conversation: conversationId,
      user: targetUserId,
    });
    if (!target) throw ApiError.notFound("User is not a member of this group");

    const trimmed = typeof nickname === "string" ? nickname.trim() : "";
    target.nickname = trimmed.length > 0 ? trimmed : null;
    await target.save();

    return {
      message: "Nickname updated",
      userId: target.user,
      nickname: target.nickname,
    };
  }

  async updateGroup(conversationId, currentUserId, name, file) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw ApiError.badRequest("Only group conversations can be updated");
    }

    const membership = await ConversationMember.findOne({
      conversation: conversationId,
      user: currentUserId,
    });
    if (!membership || membership.role !== "admin") {
      throw ApiError.forbidden("Only admins can update the group");
    }

    if (name !== undefined) {
      if (!name.trim()) throw ApiError.badRequest("Group name cannot be empty");
      conversation.name = name.trim();
    }

    if (file) {
      conversation.avatarUrl = `/uploads/groupAvatars/${file.filename}`;
    }

    await conversation.save();
    return conversation;
  }

  async hideConversation(conversationId, userId) {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: { hiddenBy: userId },
        $pull: { pinnedBy: userId },
      },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    if (!conversation) throw ApiError.notFound("Conversation not found");
    return { message: "Conversation hidden successfully", conversation };
  }

  async togglePin(conversationId, userId) {
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
    if (!conversation) throw ApiError.notFound("Conversation not found");

    const isPinned = conversation.pinnedBy.includes(userId);
    const update = isPinned ? { $pull: { pinnedBy: userId } } : { $addToSet: { pinnedBy: userId } };

    const updatedConv = await Conversation.findByIdAndUpdate(conversationId, update, {
      returnDocument: "after",
    }).populate("participants", POPULATE_FIELDS);

    return {
      message: isPinned ? "Conversation unpinned" : "Conversation pinned",
      isPinned: !isPinned,
      conversation: updatedConv,
    };
  }

  async toggleMute(conversationId, userId) {
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
    if (!conversation) throw ApiError.notFound("Conversation not found");

    const isMuted = conversation.mutedBy.includes(userId);
    const update = isMuted ? { $pull: { mutedBy: userId } } : { $addToSet: { mutedBy: userId } };

    const updatedConv = await Conversation.findByIdAndUpdate(conversationId, update, {
      returnDocument: "after",
    }).populate("participants", POPULATE_FIELDS);

    return {
      message: isMuted ? "Conversation unmuted" : "Conversation muted",
      isMuted: !isMuted,
      conversation: updatedConv,
    };
  }

  async markAsUnread(conversationId, userId) {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, participants: userId },
      { $addToSet: { unreadBy: userId } },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    if (!conversation) throw ApiError.notFound("Conversation not found");
    return { message: "Marked as unread", conversation };
  }

  async markAsRead(conversationId, userId) {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, participants: userId },
      { $pull: { unreadBy: userId } },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    if (!conversation) throw ApiError.notFound("Conversation not found");
    return { message: "Marked as read", conversation };
  }

  async blockUser(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (conversation.isGroup) throw ApiError.badRequest("Cannot block users in group conversations");

    const otherParticipant = conversation.participants.find(
      (id) => id.toString() !== userId.toString(),
    );
    if (!otherParticipant) throw ApiError.badRequest("Cannot block in a solo conversation");

    const isAlreadyBlocked = conversation.blockedBy?.some(
      (id) => id.toString() === userId.toString(),
    );
    if (isAlreadyBlocked) {
      return { success: true, message: "User is already blocked", data: conversation };
    }

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { blockedBy: userId } },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    return {
      success: true,
      message: "User blocked successfully",
      data: {
        conversationId: updatedConv._id,
        blockedUser: otherParticipant,
        blockedBy: updatedConv.blockedBy,
      },
    };
  }

  async unblockUser(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversationId,
      { $pull: { blockedBy: userId } },
      { returnDocument: "after" },
    ).populate("participants", POPULATE_FIELDS);

    return {
      success: true,
      message: "User unblocked successfully",
      data: { conversationId: updatedConv._id, blockedBy: updatedConv.blockedBy },
    };
  }

  async getBlockedUsers(userId) {
    const blockedConversations = await Conversation.find({
      isGroup: false,
      blockedBy: userId,
    }).populate("participants", POPULATE_FIELDS);

    const blockedUsers = blockedConversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString(),
      );
      return {
        conversationId: conv._id,
        user: otherParticipant,
        blockedAt: conv.updatedAt,
      };
    });

    return {
      success: true,
      count: blockedUsers.length,
      data: blockedUsers,
    };
  }

  async getGroupMembers(conversationId, currentUserId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      throw ApiError.badRequest("Not a group conversation");
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) throw ApiError.forbidden("Not a member of this group");

    const members = await ConversationMember.find({ conversation: conversationId })
      .populate("user", POPULATE_FIELDS)
      .sort({ role: 1, joinedAt: 1 });

    return { members };
  }
}

module.exports = new ConversationService();

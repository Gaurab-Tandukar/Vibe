const mongoose = require("mongoose");
const Message = require("../model/messageModel");
const Conversation = require("../model/conversationModel");
const Attachment = require("../model/attachmentModel");
const Notification = require("../model/notificationModel");
const User = require("../model/userModel");
const ApiError = require("../util/ApiError");

/**
 * Enterprise Service Layer for Messages
 */
class MessageService {
  async createMessage(currentUserId, { conversationId, content, type, attachments, replyTo }, io) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest("Invalid conversation ID");
    }

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
      throw ApiError.badRequest("Message must have content or an attachment");
    }

    if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) {
      throw ApiError.badRequest("Invalid replyTo message ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) throw ApiError.forbidden("You are not a member of this conversation");

    if (!conversation.isGroup) {
      const isBlockedByMe = conversation.blockedBy?.some(
        (id) => id.toString() === currentUserId.toString(),
      );
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== currentUserId.toString(),
      );
      const isBlockedByOther = otherParticipant
        ? conversation.blockedBy?.some((id) => id.toString() === otherParticipant.toString())
        : false;

      if (isBlockedByMe || isBlockedByOther) {
        throw ApiError.forbidden("You cannot send messages in this conversation");
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      content,
      type: type || "text",
      replyTo: replyTo || undefined,
      readBy: [currentUserId],
    });

    await User.findByIdAndUpdate(currentUserId, { $inc: { "stats.messagesSent": 1 } });

    if (attachments && attachments.length > 0) {
      const attachmentDocs = attachments.map((att) => ({
        message: message._id,
        fileUrl: att.fileUrl,
        fileType: att.fileType,
        fileName: att.fileName,
        fileSize: att.fileSize,
      }));
      await Attachment.insertMany(attachmentDocs);
    }

    const recipientIds = conversation.participants.filter(
      (p) => p.toString() !== currentUserId.toString(),
    );
    const mutedSet = new Set((conversation.mutedBy || []).map((id) => id.toString()));
    const notifyRecipientIds = recipientIds.filter((id) => !mutedSet.has(id.toString()));

    conversation.lastMessageAt = Date.now();
    conversation.unreadBy = (conversation.unreadBy || []).filter(
      (id) => id.toString() !== currentUserId.toString(),
    );
    notifyRecipientIds.forEach((recipientId) => {
      const alreadyUnread = conversation.unreadBy.some(
        (id) => id.toString() === recipientId.toString(),
      );
      if (!alreadyUnread) conversation.unreadBy.push(recipientId);
    });
    await conversation.save();

    if (notifyRecipientIds.length > 0) {
      const notificationDocs = notifyRecipientIds.map((userId) => ({
        user: userId,
        message: message._id,
      }));
      await Notification.insertMany(notificationDocs);
    }

    const fullMessage = await Message.findById(message._id)
      .populate("sender", "username firstName lastName avatarUrl")
      .populate("attachments")
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "username" },
      });

    if (io) {
      io.to(conversationId).emit("newMessage", fullMessage);
      notifyRecipientIds.forEach((userId) => {
        const socketId = io.onlineUsers?.get(userId.toString());
        if (socketId) {
          io.to(socketId).emit("newNotification", {
            conversationId,
            messageId: message._id,
            preview: content,
            sender: fullMessage.sender.username,
          });
        }
      });
    }

    return fullMessage;
  }

  async getMessages(conversationId, currentUserId, before, limit = 20) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest("Invalid conversation ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) throw ApiError.forbidden("You are not a member of this conversation");

    const query = { conversation: conversationId };

    if (before) {
      if (!mongoose.Types.ObjectId.isValid(before)) {
        throw ApiError.badRequest("Invalid 'before' cursor");
      }
      const cursorMessage = await Message.findById(before).select("createdAt");
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    const safeLimit = Math.min(Number(limit) || 20, 50);
    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate("sender", "username firstName lastName avatarUrl")
      .populate("attachments")
      .populate({
        path: "replyTo",
        select: "content sender isDeleted",
        populate: { path: "sender", select: "username" },
      })
      .populate("reactions");

    const messages = rawMessages.map((msg) => {
      const obj = msg.toObject();
      if (obj.isDeleted) {
        obj.content = "This message was deleted";
        obj.attachments = [];
        obj.reactions = [];
      }
      if (obj.replyTo?.isDeleted) {
        obj.replyTo.content = "This message was deleted";
      }
      return obj;
    });

    const hasMore = messages.length === safeLimit;

    return {
      messages: messages.reverse(),
      hasMore,
      nextCursor: messages.length > 0 ? messages[0]._id : null,
    };
  }

  async deleteMessage(messageId, currentUserId, io) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw ApiError.badRequest("Invalid message ID");
    }

    const message = await Message.findById(messageId);
    if (!message) throw ApiError.notFound("Message not found");

    if (message.sender.toString() !== currentUserId.toString()) {
      throw ApiError.forbidden("You can only delete your own messages");
    }

    if (message.isDeleted) throw ApiError.badRequest("Message is already deleted");

    message.isDeleted = true;
    message.content = "";
    await message.save();

    await Attachment.deleteMany({ message: message._id });

    if (io) {
      io.to(message.conversation.toString()).emit("messageDeleted", {
        messageId: message._id,
        conversationId: message.conversation,
      });
    }

    return { message: "Message deleted successfully" };
  }

  async editMessage(messageId, currentUserId, content, io) {
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw ApiError.badRequest("Invalid message ID");
    }

    if (!content || !content.trim()) {
      throw ApiError.badRequest("Content is required");
    }

    const message = await Message.findById(messageId);
    if (!message) throw ApiError.notFound("Message not found");

    if (message.sender.toString() !== currentUserId.toString()) {
      throw ApiError.forbidden("You can only edit your own messages");
    }

    if (message.isDeleted) throw ApiError.badRequest("Cannot edit a deleted message");

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    const fullMessage = await Message.findById(message._id)
      .populate("sender", "username firstName lastName avatarUrl")
      .populate("attachments")
      .populate({
        path: "replyTo",
        select: "content sender isDeleted",
        populate: { path: "sender", select: "username" },
      })
      .populate("reactions");

    if (io) {
      io.to(fullMessage.conversation.toString()).emit("messageEdited", fullMessage);
    }

    return fullMessage;
  }

  async markMessagesAsRead(conversationId, currentUserId, io) {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      throw ApiError.badRequest("Invalid conversation ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound("Conversation not found");

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) throw ApiError.forbidden("You are not a member of this conversation");

    const result = await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: currentUserId } },
      { $addToSet: { readBy: currentUserId } },
    );

    const conversationMessages = await Message.find({ conversation: conversationId }).select("_id");
    const messageIds = conversationMessages.map((m) => m._id);

    await Notification.updateMany(
      { user: currentUserId, message: { $in: messageIds }, isRead: false },
      { $set: { isRead: true } },
    );

    if (io) {
      io.to(conversationId).emit("messagesRead", {
        conversationId,
        userId: currentUserId,
      });
    }

    return { message: "Messages marked as read", modifiedCount: result.modifiedCount };
  }
}

module.exports = new MessageService();

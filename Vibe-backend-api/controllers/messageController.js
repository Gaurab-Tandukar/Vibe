const mongoose = require("mongoose");
const Message = require("../model/messageModel");
const Conversation = require("../model/conversationModel");
const Attachment = require("../model/AttachmentModel");
const Notification = require("../model/notificationModel");
const User = require("../model/userModel");

// @desc   create Message
// @route  POST /api/messages
const createMessage = async (req, res) => {
  try {
    const { conversationId, content, type, attachments, replyTo } = req.body;
    const currentUserId = req.user._id;

    // validation
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    if (
      (!content || !content.trim()) &&
      (!attachments || attachments.length === 0)
    ) {
      return res
        .status(400)
        .json({ message: "Message must have content or an attachment" });
    }

    if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) {
      return res.status(400).json({ message: "Invalid replyTo message id" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // validation: check if the current user is a member of the conversation
    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    // Only relevant for 1:1 chats (block chat participants)
    if (!conversation.isGroup) {
      const isBlockedByMe = conversation.blockedBy?.some(
        (id) => id.toString() === currentUserId.toString(),
      );

      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== currentUserId.toString(),
      );

      const isBlockedByOther = otherParticipant
        ? conversation.blockedBy?.some(
          (id) => id.toString() === otherParticipant.toString(),
        )
        : false;

      if (isBlockedByMe || isBlockedByOther) {
        return res.status(403).json({
          message: "You cannot send messages in this conversation",
        });
      }
    }

    // create the message
    const message = await Message.create({
      conversation: conversationId,
      sender: currentUserId,
      content,
      type: type || "text",
      replyTo: replyTo || undefined,
      readBy: [currentUserId], // sender has implicitly "read" their own message
    });

    await User.findByIdAndUpdate(currentUserId, {
      $inc: { "stats.messagesSent": 1 },
    });

    // if attachments were provided, create them as real Attachment docs
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

    // notification
    const recipientIds = conversation.participants.filter(
      (p) => p.toString() !== currentUserId.toString(),
    );

    // Recipients who have muted this conversation shouldn't get unread
    // badges, Notification docs, or live toasts — but they still receive
    // the "newMessage" broadcast below so the chat itself stays in sync.
    const mutedSet = new Set(
      (conversation.mutedBy || []).map((id) => id.toString()),
    );
    const notifyRecipientIds = recipientIds.filter(
      (id) => !mutedSet.has(id.toString()),
    );

    // keep conversation list sorted by recent activity + mark recipients unread
    conversation.lastMessageAt = Date.now();
    conversation.unreadBy = (conversation.unreadBy || []).filter(
      (id) => id.toString() !== currentUserId.toString(),
    );
    notifyRecipientIds.forEach((recipientId) => {
      const alreadyUnread = conversation.unreadBy.some(
        (id) => id.toString() === recipientId.toString(),
      );
      if (!alreadyUnread) {
        conversation.unreadBy.push(recipientId);
      }
    });
    await conversation.save();

    if (notifyRecipientIds.length > 0) {
      const notificationDocs = notifyRecipientIds.map((userId) => ({
        user: userId,
        message: message._id,
      }));
      await Notification.insertMany(notificationDocs);
    }

    // return fully populated message
    const fullMessage = await Message.findById(message._id)
      .populate("sender", "username firstName lastName avatarUrl")
      .populate("attachments")
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "username" },
      });

    // broadcast to everyone in this conversation's room
    const io = req.app.get("io");
    io.to(conversationId).emit("newMessage", fullMessage);

    // also push a notification directly to each recipient, if online
    // (muted recipients are excluded — see notifyRecipientIds above)
    notifyRecipientIds.forEach((userId) => {
      const socketId = io.onlineUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit("newNotification", {
          conversationId,
          messageId: message._id,
          preview: content,
          sender: fullMessage.sender.username,
        });
      }
    });

    res.status(201).json(fullMessage);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc   get messages for a conversation (cursor-based pagination)
// @route  GET /api/messages/:conversationId?limit=20&before=<messageId>
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { before, limit = 20 } = req.query;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    // ✅ no isDeleted filter — we mask instead, to preserve order/replies
    const query = { conversation: conversationId };

    if (before) {
      if (!mongoose.Types.ObjectId.isValid(before)) {
        return res.status(400).json({ message: "Invalid 'before' cursor" });
      }
      const cursorMessage = await Message.findById(before).select("createdAt");
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    // ✅ renamed to rawMessages
    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 50))
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

    const hasMore = messages.length === Math.min(Number(limit), 50);

    res.status(200).json({
      messages: messages.reverse(),
      hasMore,
      nextCursor: messages.length > 0 ? messages[0]._id : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   soft delete a message (sender only)
// @route  DELETE /api/messages/:messageId
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own messages" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Message is already deleted" });
    }

    message.isDeleted = true;
    message.content = ""; // clear actual content — don't just hide it client-side
    await message.save();

    // also remove any attachments tied to this message
    await Attachment.deleteMany({ message: message._id });

    const io = req.app.get("io");
    io.to(message.conversation.toString()).emit("messageDeleted", {
      messageId: message._id,
      conversationId: message.conversation,
    });

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   edit a message (sender only)
// @route  PUT /api/messages/:messageId
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own messages" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted message" });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save(); // timestamps:true auto-updates updatedAt too

    const fullMessage = await Message.findById(message._id)
      .populate("sender", "username firstName lastName avatarUrl")
      .populate("attachments")
      .populate({
        path: "replyTo",
        select: "content sender isDeleted",
        populate: { path: "sender", select: "username" },
      })
      .populate("reactions");

    const io = req.app.get("io");
    io.to(fullMessage.conversation.toString()).emit(
      "messageEdited",
      fullMessage,
    );

    res.status(200).json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   mark all unread messages in a conversation as read by current user
// @route  PUT /api/messages/:conversationId/read
const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isMember = conversation.participants.some(
      (p) => p.toString() === currentUserId.toString(),
    );
    if (!isMember) {
      return res
        .status(403)
        .json({ message: "You are not a member of this conversation" });
    }

    // add currentUserId to readBy on every message that doesn't already have it
    const result = await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: currentUserId } },
      { $addToSet: { readBy: currentUserId } },
    );

    // also clear their notifications for this conversation
    const conversationMessages = await Message.find({
      conversation: conversationId,
    }).select("_id");
    const messageIds = conversationMessages.map((m) => m._id);

    await Notification.updateMany(
      { user: currentUserId, message: { $in: messageIds }, isRead: false },
      { $set: { isRead: true } },
    );

    // notify other members live that this user has read up to now
    const io = req.app.get("io");
    io.to(conversationId).emit("messagesRead", {
      conversationId,
      userId: currentUserId,
    });

    res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMessage,
  getMessages,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
};

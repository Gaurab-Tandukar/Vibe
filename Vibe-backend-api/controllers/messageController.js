const messageService = require("../services/messageService");
const asyncHandler = require("../middleware/asyncHandler");

// @desc   Create Message
// @route  POST /api/messages
const createMessage = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const fullMessage = await messageService.createMessage(req.user._id, req.body, io);
  res.status(201).json(fullMessage);
});

// @desc   Get messages for a conversation (cursor-based pagination)
// @route  GET /api/messages/:conversationId
const getMessages = asyncHandler(async (req, res) => {
  const { before, limit } = req.query;
  const result = await messageService.getMessages(req.params.conversationId, req.user._id, before, limit);
  res.status(200).json(result);
});

// @desc   Soft delete a message (sender only)
// @route  DELETE /api/messages/:messageId
const deleteMessage = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const result = await messageService.deleteMessage(req.params.messageId, req.user._id, io);
  res.status(200).json(result);
});

// @desc   Edit a message (sender only)
// @route  PUT /api/messages/:messageId
const editMessage = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const updatedMessage = await messageService.editMessage(req.params.messageId, req.user._id, req.body.content, io);
  res.status(200).json(updatedMessage);
});

// @desc   Mark all unread messages in a conversation as read by current user
// @route  PUT /api/messages/:conversationId/read
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const result = await messageService.markMessagesAsRead(req.params.conversationId, req.user._id, io);
  res.status(200).json(result);
});

module.exports = {
  createMessage,
  getMessages,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
};

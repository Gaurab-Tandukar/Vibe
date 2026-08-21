const conversationService = require("../services/conversationService");
const asyncHandler = require("../middleware/asyncHandler");

// @desc   Create Conversation
// @route  POST /api/chats
const createConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.createConversation(req.user._id, req.body);
  res.status(201).json(conversation);
});

// @desc   Get all Conversations for authenticated user
// @route  GET /api/chats
const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await conversationService.getMyConversations(req.user._id);
  res.status(200).json(conversations);
});

// @desc   Get single conversation by ID
// @route  GET /api/chats/:id
const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
  res.status(200).json(conversation);
});

// @desc   Add member to group conversation (Admin only)
// @route  POST /api/chats/:id/members
const addMember = asyncHandler(async (req, res) => {
  const result = await conversationService.addMember(req.params.id, req.user._id.toString(), req.body.userId);
  res.status(200).json(result);
});

// @desc   Remove member from group (Admin only)
// @route  DELETE /api/chats/:id/members/:userId
const removeMember = asyncHandler(async (req, res) => {
  const result = await conversationService.removeMember(req.params.id, req.user._id.toString(), req.params.userId);
  res.status(200).json(result);
});

// @desc   Leave a group conversation
// @route  DELETE /api/chats/:id/leave
const leaveConversation = asyncHandler(async (req, res) => {
  const result = await conversationService.leaveConversation(req.params.id, req.user._id);
  res.status(200).json(result);
});

// @desc   Transfer admin role to another member (Admin only)
// @route  PUT /api/chats/:id/transfer-admin
const transferAdmin = asyncHandler(async (req, res) => {
  const result = await conversationService.transferAdmin(req.params.id, req.user._id, req.body.newAdminUserId);
  res.status(200).json(result);
});

// @desc   Set or clear a member's nickname (Admin only)
// @route  PATCH /api/chats/:id/members/:userId/nickname
const setMemberNickname = asyncHandler(async (req, res) => {
  const result = await conversationService.setMemberNickname(req.params.id, req.user._id, req.params.userId, req.body.nickname);
  res.status(200).json(result);
});

// @desc   Update a group's name and/or avatar (Admin only)
// @route  PUT /api/chats/:id
const renameConversation = asyncHandler(async (req, res) => {
  const conversation = await conversationService.updateGroup(req.params.id, req.user._id, req.body.name, req.file);
  res.status(200).json(conversation);
});

// @desc   Soft delete (hide) a conversation
// @route  PATCH /api/chats/:conversationId/hide
const hideConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId || req.params.id;
  const result = await conversationService.hideConversation(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Toggle pin conversation
// @route  PATCH /api/chats/:conversationId/pin
const togglePinConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.id || req.params.conversationId;
  const result = await conversationService.togglePin(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Toggle mute conversation
// @route  PATCH /api/chats/:conversationId/mute
const toggleMuteConversation = asyncHandler(async (req, res) => {
  const conversationId = req.params.id || req.params.conversationId;
  const result = await conversationService.toggleMute(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Mark as Unread
// @route  PATCH /api/chats/:conversationId/unread
const markAsUnread = asyncHandler(async (req, res) => {
  const conversationId = req.params.id || req.params.conversationId;
  const result = await conversationService.markAsUnread(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Mark as Read
// @route  PATCH /api/chats/:conversationId/read
const markAsRead = asyncHandler(async (req, res) => {
  const conversationId = req.params.id || req.params.conversationId;
  const result = await conversationService.markAsRead(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Block user in a 1:1 conversation
// @route  PATCH /api/chats/:conversationId/block
const blockUser = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId || req.params.id;
  const result = await conversationService.blockUser(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Unblock user in a conversation
// @route  PATCH /api/chats/:conversationId/unblock
const unblockUser = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId || req.params.id;
  const result = await conversationService.unblockUser(conversationId, req.user._id);
  res.status(200).json(result);
});

// @desc   Get all blocked users
// @route  GET /api/chats/blocked
const getBlockedUsers = asyncHandler(async (req, res) => {
  const result = await conversationService.getBlockedUsers(req.user._id);
  res.status(200).json(result);
});

// @desc   Get all members of a group with roles + user info
// @route  GET /api/chats/:id/members
const getGroupMembers = asyncHandler(async (req, res) => {
  const result = await conversationService.getGroupMembers(req.params.id, req.user._id);
  res.status(200).json(result);
});

module.exports = {
  createConversation,
  getMyConversations,
  getConversationById,
  addMember,
  removeMember,
  leaveConversation,
  transferAdmin,
  setMemberNickname,
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

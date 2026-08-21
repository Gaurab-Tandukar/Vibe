const mongoose = require("mongoose");
const Attachment = require("../model/attachmentModel");
const ApiError = require("../util/ApiError");
const asyncHandler = require("../middleware/asyncHandler");

// @desc   Upload an attachment file (returns metadata, not yet linked to a message)
// @route  POST /api/attachments/upload
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No file provided");
  }

  res.status(200).json({
    fileUrl: `/uploads/attachments/${req.file.filename}`,
    fileType: req.file.mimetype,
    fileName: req.file.originalname,
    fileSize: req.file.size,
  });
});

// @desc   Get all attachments for a message
// @route  GET /api/attachments/:messageId
const getAttachments = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw ApiError.badRequest("Invalid message ID");
  }

  const attachments = await Attachment.find({ message: messageId });
  res.status(200).json(attachments);
});

module.exports = { uploadAttachment, getAttachments };

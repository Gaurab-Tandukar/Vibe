const mongoose = require("mongoose");
const Attachment = require("../model/AttachmentModel");
const Message = require("../model/messageModel");

// @desc   upload an attachment file (returns metadata, not yet linked to a message)
// @route  POST /api/attachments/upload
const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // ✅ return metadata only — createMessage links it to a message afterward
    res.status(200).json({
      fileUrl: `/uploads/attachments/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   get all attachments for a message
// @route  GET /api/attachments/:messageId
const getAttachments = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const attachments = await Attachment.find({ message: messageId });
    res.status(200).json(attachments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadAttachment, getAttachments };

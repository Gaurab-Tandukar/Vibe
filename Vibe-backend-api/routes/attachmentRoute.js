const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const createUploadMiddleware = require("../middleware/uploadMiddleware");

// wider file type support + bigger size limit for chat attachments
const attachmentUpload = createUploadMiddleware("attachments", {
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "video/mp4",
  ],
  maxSizeMB: 20,
});

const {
  uploadAttachment,
  getAttachments,
} = require("../controllers/attachmentController");

router.post(
  "/upload",
  protect,
  attachmentUpload.single("file"),
  uploadAttachment,
);
router.get("/:messageId", protect, getAttachments);

module.exports = router;

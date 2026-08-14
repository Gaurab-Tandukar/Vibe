const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Creates a multer upload instance scoped to a specific subfolder
 * under /uploads (e.g. "avatars", "attachments").
 *
 * @param {string} folderName - subfolder name under /uploads
 * @param {object} options - optional overrides
 * @param {string[]} options.allowedTypes - allowed mimetypes
 * @param {number} options.maxSizeMB - max file size in MB
 */
const createUploadMiddleware = (folderName, options = {}) => {
  const resolveDir = (fieldname) => {
    const sub =
      typeof folderName === "string" ? folderName : folderName[fieldname];
    const dir = path.join(__dirname, "..", "uploads", sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, resolveDir(file.fieldname)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${req.user._id}_${Date.now()}${ext}`;
      cb(null, uniqueName);
    },
  });

  const allowedTypes = options.allowedTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(`File type not allowed. Allowed: ${allowedTypes.join(", ")}`),
      );
    }
  };

  const maxSizeMB = options.maxSizeMB || 5;

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};

module.exports = createUploadMiddleware;

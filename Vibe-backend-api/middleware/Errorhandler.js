const multer = require("multer");

/**
 * Catches Multer errors (file too large, wrong type, etc.) and any other
 * errors that reach here, and returns JSON instead of Express's default
 * HTML error page. Mount this AFTER all your routes:
 *
 *   app.use("/api/users", userRoutes);
 *   ...
 *   app.use(errorHandler);
 */
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
    };
    return res.status(400).json({
      message: messages[err.code] || err.message,
    });
  }

  // Custom fileFilter errors from createUploadMiddleware also land here
  if (err?.message?.startsWith("File type not allowed")) {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  res.status(err.status || 500).json({ message: "Server error" });
}

module.exports = errorHandler;

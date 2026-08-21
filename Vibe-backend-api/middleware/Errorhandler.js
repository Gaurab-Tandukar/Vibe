const multer = require("multer");
const ApiError = require("../util/ApiError");
const env = require("../config/env");

/**
 * Enterprise Centralized Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || [];

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    const messages = {
      LIMIT_FILE_SIZE: "File is too large. Maximum size exceeded.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field in upload.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
    };
    message = messages[err.code] || err.message;
  }

  // Handle custom file filter errors
  if (err?.message?.startsWith("File type not allowed")) {
    statusCode = 400;
    message = err.message;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for resource ID: ${err.value}`;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
    errors = Object.values(err.errors || {}).map((e) => e.message);
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `A record with that ${field} already exists.`
      : "Duplicate field value entered.";
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token. Please log in again.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired. Please log in again.";
  }

  // Log non-operational/server errors in development/production
  if (statusCode >= 500) {
    console.error("Unhandled Server Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;

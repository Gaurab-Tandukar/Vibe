const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const ApiError = require("../util/ApiError");
const asyncHandler = require("./asyncHandler");
const env = require("../config/env");

/**
 * Authentication Middleware: Validates Bearer token and attaches user to req
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw ApiError.unauthorized("Authentication token required");
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      throw ApiError.unauthorized("User account no longer exists");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.unauthorized("Invalid or expired authentication token");
  }
});

/**
 * Role Based Authorization Middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access denied. Role '${req.user?.role || "UNKNOWN"}' is not allowed`,
      );
    }
    next();
  };
};

module.exports = { protect, authorize };

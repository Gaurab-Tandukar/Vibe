const ApiError = require("../util/ApiError");

/**
 * Validates request data against specified rules
 * @param {Object} schema - Object containing validation functions for body, params, or query
 */
const validate = (schema) => (req, res, next) => {
  const validationErrors = [];

  ["body", "params", "query"].forEach((key) => {
    if (schema[key]) {
      const validator = schema[key];
      const errors = validator(req[key]);
      if (errors && errors.length > 0) {
        validationErrors.push(...errors);
      }
    }
  });

  if (validationErrors.length > 0) {
    return next(new ApiError(400, validationErrors[0], validationErrors));
  }

  next();
};

// Reusable validators
const validators = {
  isValidObjectId: (id) => /^[0-9a-fA-F]{24}$/.test(String(id)),
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()),
  isNonEmptyString: (str) => typeof str === "string" && str.trim().length > 0,
};

module.exports = {
  validate,
  validators,
};

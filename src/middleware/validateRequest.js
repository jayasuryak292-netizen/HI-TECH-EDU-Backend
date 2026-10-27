
const AppError = require("../utils/appError");

function validateRequest(validator) {
  if (typeof validator !== "function") {
    throw new TypeError("validator must be a function.");
  }

  return function requestValidationMiddleware(req, res, next) {
    try {
      const result = validator(req);

      if (result === false) {
        return next(
          new AppError("Validation failed.", 400)
        );
      }

      if (Array.isArray(result) && result.length > 0) {
        return next(
          new AppError("Validation failed.", 400, result)
        );
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = validateRequest;

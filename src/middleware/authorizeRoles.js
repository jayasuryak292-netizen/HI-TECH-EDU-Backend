
const AppError = require("../utils/appError");
const HTTP_STATUS = require("../constants/httpStatus");
const ROLES = require("../constants/roles");

const ALLOWED_ROLES = new Set(Object.values(ROLES));

function authorizeRoles(...allowedRoles) {
  if (
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => !ALLOWED_ROLES.has(role))
  ) {
    throw new TypeError("Provide one or more valid user roles.");
  }

  return function roleAuthorizationMiddleware(req, res, next) {
    if (!req.user) {
      return next(
        new AppError(
          "Authentication is required.",
          HTTP_STATUS.UNAUTHORIZED
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

    return next();
  };
}

module.exports = authorizeRoles;

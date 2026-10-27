
const AppError = require("../utils/appError");
const HTTP_STATUS = require("../constants/httpStatus");

function requireJson(req, res, next) {
  const methodsWithBody = new Set(["POST", "PUT", "PATCH"]);

  if (!methodsWithBody.has(req.method)) {
    return next();
  }

  if (!req.is("application/json")) {
    return next(
      new AppError(
        "Content-Type must be application/json.",
        HTTP_STATUS.BAD_REQUEST
      )
    );
  }

  return next();
}

module.exports = requireJson;

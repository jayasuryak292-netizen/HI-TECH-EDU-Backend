
const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/token");
const HTTP_STATUS = require("../constants/httpStatus");

function authenticate(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(
      new AppError("Authentication token is required.", HTTP_STATUS.UNAUTHORIZED)
    );
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return next(
      new AppError("Authentication token is required.", HTTP_STATUS.UNAUTHORIZED)
    );
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(
      new AppError("Invalid or expired authentication token.", HTTP_STATUS.UNAUTHORIZED)
    );
  }
}

module.exports = authenticate;

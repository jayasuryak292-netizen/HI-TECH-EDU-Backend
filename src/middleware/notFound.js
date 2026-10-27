const AppError = require("../utils/appError");

function notFound(req, res, next) {
  const message = `Route not found: ${req.method} ${req.originalUrl}`;

  next(new AppError(message, 404));
}

module.exports = notFound;
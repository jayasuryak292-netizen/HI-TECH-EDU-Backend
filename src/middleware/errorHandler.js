
const HTTP_STATUS = require("../constants/httpStatus");
const API_MESSAGES = require("../constants/apiMessages");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
      ? err.statusCode
      : HTTP_STATUS.INTERNAL_SERVER_ERROR;

  if (statusCode >= 500) {
    console.error("[API Error]", {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: err.message,
      stack: err.stack
    });
  }

  const response = {
    success: false,
    message:
      statusCode >= 500
        ? API_MESSAGES.INTERNAL_ERROR
        : err.message || API_MESSAGES.INTERNAL_ERROR
  };

  if (err.details) {
    response.details = err.details;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;

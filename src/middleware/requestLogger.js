
const logger = require("../config/logger");

function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - startTime
    });
  });

  next();
}

module.exports = requestLogger;

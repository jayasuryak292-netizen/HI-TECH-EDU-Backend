
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const securityHeaders = helmet();

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

module.exports = {
  securityHeaders,
  apiRateLimiter
};


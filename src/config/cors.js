
const cors = require("cors");
const env = require("./env");

const allowedOrigins = new Set([
  env.frontendUrl,
  "http://localhost:51081",
]);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests that do not send an Origin header.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    // Allow Flutter web's localhost development server on changing ports.
    try {
      const url = new URL(origin);
      if (
        url.protocol === "http:" &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
        /^51\d{3}$/.test(url.port)
      ) {
        return callback(null, true);
      }
    } catch (_) {
      // Invalid origin: reject it below.
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

module.exports = cors(corsOptions);

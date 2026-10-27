
require("dotenv").config();

function getNumber(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: getNumber("PORT", 3000),

  database: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: getNumber("DB_PORT", 3306),
    name: process.env.DB_NAME || "hi_tech_edu",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || ""
  },

  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  },

  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",

  email: {
    host: process.env.EMAIL_HOST || "",
    port: getNumber("EMAIL_PORT", 587),
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    from: process.env.EMAIL_FROM || ""
  }
};

if (env.nodeEnv === "production" && env.jwt.secret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters in production.");
}

module.exports = env;

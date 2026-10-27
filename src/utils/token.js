
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function getSecret() {
  if (!env.jwt.secret || env.jwt.secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with at least 32 characters."
    );
  }

  return env.jwt.secret;
}

function generateToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: env.jwt.expiresIn
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = {
  generateToken,
  verifyToken
};

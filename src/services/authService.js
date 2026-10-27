
"use strict";

const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

async function hashPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    const error = new Error("Password must be at least 8 characters long.");
    error.statusCode = 400;
    throw error;
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  if (typeof password !== "string" || typeof passwordHash !== "string") {
    return false;
  }

  return bcrypt.compare(password, passwordHash);
}

module.exports = {
  hashPassword,
  verifyPassword
};

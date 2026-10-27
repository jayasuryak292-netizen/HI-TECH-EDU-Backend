
"use strict";

const { User } = require("../models");
const { hashPassword, verifyPassword } = require("../services/authService");
const { generateToken } = require("../utils/token");
const ROLES = require("../constants/roles");

async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (
      typeof fullName !== "string" ||
      fullName.trim().length < 2 ||
      !normalizedEmail ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid full name, email, and password of at least 8 characters."
      });
    }

    const existingUser = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.STUDENT
    });

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      where: { email: normalizedEmail }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const passwordIsValid = await verifyPassword(password, user.passwordHash);

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

  const token = generateToken({
  id: user.id,
  email: user.email,
  role: user.role
});

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login
};


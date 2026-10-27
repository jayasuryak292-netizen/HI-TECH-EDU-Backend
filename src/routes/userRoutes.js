"use strict";

const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const ROLES = require("../constants/roles");
const {
  listUsers,
  getUserById,
  updateUser
} = require("../controllers/userController");

const router = express.Router();

router.use(authenticate);
router.use(
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.MAIN_ADMIN)
);

router.get("/", listUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);

module.exports = router;

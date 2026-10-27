

const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const ROLES = require("../constants/roles");
const superAdminDashboardController = require("../controllers/superAdminDashboardController");

const router = express.Router();

// All dashboard endpoints require authentication.
router.use(authenticate);

// Only Super Admins may access platform-wide dashboard metrics.
router.use(authorizeRoles(ROLES.SUPER_ADMIN));

router.get("/summary", superAdminDashboardController.getSummary);

module.exports = router;

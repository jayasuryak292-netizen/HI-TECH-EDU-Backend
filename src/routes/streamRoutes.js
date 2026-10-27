

const express = require("express");
const streamController = require("../controllers/streamController");
const authenticate = require("../middleware/authenticate");
const authorizeRoles = require("../middleware/authorizeRoles");
const ROLES = require("../constants/roles");

const router = express.Router();

const manageStreamRoles = [
  ROLES.SUPER_ADMIN,
  ROLES.MAIN_ADMIN
];

// All stream endpoints require authentication.
router.use(authenticate);

/**
 * @openapi
 * /streams:
 *   get:
 *     tags:
 *       - Streams
 *     summary: List streams
 *     description: Returns a paginated list of streams with optional active-status filtering and search.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Streams retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Authentication required
 */
router.get("/", streamController.listStreams);

/**
 * @openapi
 * /streams/{id}:
 *   get:
 *     tags:
 *       - Streams
 *     summary: Get a stream by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Stream retrieved successfully
 *       400:
 *         description: Invalid stream ID
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Stream not found
 */
router.get("/:id", streamController.getStreamById);

/**
 * @openapi
 * /streams:
 *   post:
 *     tags:
 *       - Streams
 *     summary: Create a stream
 *     description: Requires SUPER_ADMIN or MAIN_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *                 pattern: "^[A-Za-z0-9_-]+$"
 *                 example: SCIENCE
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 120
 *                 example: Science
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: Science stream
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Stream created successfully
 *       400:
 *         description: Invalid stream data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient role permissions
 *       409:
 *         description: Stream code or name already exists
 */
router.post(
  "/",
  authorizeRoles(...manageStreamRoles),
  streamController.createStream
);

/**
 * @openapi
 * /streams/{id}:
 *   patch:
 *     tags:
 *       - Streams
 *     summary: Update a stream
 *     description: Requires SUPER_ADMIN or MAIN_ADMIN role. Send one or more valid stream fields.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 20
 *                 pattern: "^[A-Za-z0-9_-]+$"
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 120
 *               description:
 *                 type: string
 *                 nullable: true
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Stream updated successfully
 *       400:
 *         description: Invalid stream ID or data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient role permissions
 *       404:
 *         description: Stream not found
 *       409:
 *         description: Stream code or name already exists
 */
router.patch(
  "/:id",
  authorizeRoles(...manageStreamRoles),
  streamController.updateStream
);

/**
 * @openapi
 * /streams/{id}:
 *   delete:
 *     tags:
 *       - Streams
 *     summary: Delete a stream
 *     description: Requires SUPER_ADMIN or MAIN_ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Stream deleted successfully
 *       400:
 *         description: Invalid stream ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient role permissions
 *       404:
 *         description: Stream not found
 */
router.delete(
  "/:id",
  authorizeRoles(...manageStreamRoles),
  streamController.deleteStream
);

module.exports = router;

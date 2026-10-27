"use strict";

const { Op } = require("sequelize");
const { User } = require("../models");
const ROLES = require("../constants/roles");
const HTTP_STATUS = require("../constants/httpStatus");
const AppError = require("../utils/appError");
const {
  successResponse
} = require("../utils/apiResponse");

const ADMIN_ROLES = new Set([
  ROLES.SUPER_ADMIN,
  ROLES.MAIN_ADMIN
]);

const USER_ROLES = new Set(Object.values(ROLES));

function serializeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function canManageTarget(actor, target) {
  if (actor.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  if (actor.role === ROLES.MAIN_ADMIN) {
    return (
      target.role === ROLES.STAFF ||
      target.role === ROLES.STUDENT
    );
  }

  return false;
}


function validateTargetRole(actor, role) {
  if (typeof role !== "string" || !USER_ROLES.has(role)) {
    throw new AppError(
      "A valid user role is required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (
    actor.role === ROLES.MAIN_ADMIN &&
    role !== ROLES.STAFF &&
    role !== ROLES.STUDENT
  ) {
    throw new AppError(
      "Main Admin can only assign Staff or Student roles.",
      HTTP_STATUS.FORBIDDEN
    );
  }
}


async function listUsers(req, res, next) {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 20;

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new AppError(
        "Page must be positive and limit must be between 1 and 100.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

   const where = {};
if (req.user.role === ROLES.MAIN_ADMIN) {
  where.role = {
    [Op.in]: [ROLES.STAFF, ROLES.STUDENT]
  };
}
    const { role, isActive, search } = req.query;
if (role !== undefined) {
  if (!USER_ROLES.has(role)) {
    throw new AppError(
      "Invalid role filter.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (
    req.user.role === ROLES.MAIN_ADMIN &&
    ![ROLES.STAFF, ROLES.STUDENT].includes(role)
  ) {
    throw new AppError(
      "Main Admin can only view Staff and Student accounts.",
      HTTP_STATUS.FORBIDDEN
    );
  }

  where.role = role;
}

    if (isActive !== undefined) {
      if (!["true", "false"].includes(isActive)) {
        throw new AppError(
          "isActive must be true or false.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      where.isActive = isActive === "true";
    }

    if (search !== undefined) {
      if (typeof search !== "string" || search.trim().length > 100) {
        throw new AppError(
          "Search must not exceed 100 characters.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const term = search.trim();

      if (term) {
        where[Op.or] = [
          { fullName: { [Op.like]: `%${term}%` } },
          { email: { [Op.like]: `%${term}%` } }
        ];
      }
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ["passwordHash"]
      },
      order: [["id", "ASC"]],
      limit,
      offset: (page - 1) * limit
    });

    return successResponse(res, {
      message: "Users retrieved successfully.",
      data: {
        users: rows.map(serializeUser),
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      throw new AppError(
        "A valid user ID is required.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (!canManageTarget(req.user, user)) {
      throw new AppError(
        "You do not have permission to view this user.",
        HTTP_STATUS.FORBIDDEN
      );
    }

    return successResponse(res, {
      message: "User retrieved successfully.",
      data: { user: serializeUser(user) }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      throw new AppError(
        "A valid user ID is required.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const allowedFields = ["fullName", "email", "role", "isActive"];
    const submittedFields = Object.keys(req.body || {});
    const invalidFields = submittedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0 || submittedFields.length === 0) {
      throw new AppError(
        "Provide one or more valid fields: fullName, email, role, isActive.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (!canManageTarget(req.user, user)) {
      throw new AppError(
        "You do not have permission to update this user.",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (req.body.role !== undefined) {
      validateTargetRole(req.user, req.body.role);
    }

    if (req.body.fullName !== undefined) {
      if (
        typeof req.body.fullName !== "string" ||
        req.body.fullName.trim().length < 2 ||
        req.body.fullName.trim().length > 120
      ) {
        throw new AppError(
          "Full name must be between 2 and 120 characters.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      user.fullName = req.body.fullName.trim();
    }

    if (req.body.email !== undefined) {
      if (
        typeof req.body.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())
      ) {
        throw new AppError(
          "A valid email address is required.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      user.email = req.body.email.trim().toLowerCase();
    }

    if (req.body.role !== undefined) {
      user.role = req.body.role;
    }

    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive !== "boolean") {
        throw new AppError(
          "isActive must be a boolean.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (user.id === req.user.id && req.body.isActive === false) {
        throw new AppError(
          "You cannot deactivate your own account.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      user.isActive = req.body.isActive;
    }

    await user.save();

    return successResponse(res, {
      message: "User updated successfully.",
      data: { user: serializeUser(user) }
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return next(
        new AppError(
          "That email address is already registered.",
          HTTP_STATUS.CONFLICT
        )
      );
    }

    if (error.name === "SequelizeValidationError") {
      return next(
        new AppError(
          "The submitted user data is invalid.",
          HTTP_STATUS.BAD_REQUEST
        )
      );
    }

    return next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  updateUser,
  canManageTarget,
  validateTargetRole
};

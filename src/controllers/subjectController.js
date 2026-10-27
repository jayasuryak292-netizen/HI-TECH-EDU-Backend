

const { Subject, Stream } = require("../models");
const subjectService = require("../services/subjectService");
const HTTP_STATUS = require("../constants/httpStatus");
const AppError = require("../utils/appError");
const ROLES = require("../constants/roles");
const { successResponse } = require("../utils/apiResponse");

function serializeSubject(subject) {
  return {
    id: subject.id,
    streamId: subject.streamId,
    stream: subject.stream
      ? {
          id: subject.stream.id,
          code: subject.stream.code,
          name: subject.stream.name
        }
      : null,
    name: subject.name,
    introduction: subject.introduction,
    status: subject.status,
    displayOrder: subject.displayOrder,
    createdBy: subject.createdBy,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt
  };
}

function validateSubjectId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(
      "A valid subject ID is required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return id;
}

function validatePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  if (
    !Number.isInteger(page) ||
    !Number.isInteger(limit) ||
    page < 1 ||
    limit < 1 ||
    limit > 100
  ) {
    throw new AppError(
      "Page must be positive and limit must be between 1 and 100.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return { page, limit };
}

function validateStreamFilter(value) {
  if (value === undefined) {
    return undefined;
  }

  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(
      "A valid stream ID is required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return id;
}

function validateStatus(value) {
  if (value === undefined) {
    return undefined;
  }

  if (!["DRAFT", "ACTIVE", "INACTIVE"].includes(value)) {
    throw new AppError(
      "Status must be DRAFT, ACTIVE, or INACTIVE.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return value;
}

async function listSubjects(req, res, next) {
  try {
    const { page, limit } = validatePagination(req.query);
    const streamId = validateStreamFilter(req.query.streamId);
    const requestedStatus = validateStatus(req.query.status);

    if (
      req.query.search !== undefined &&
      (typeof req.query.search !== "string" ||
        req.query.search.trim().length > 100)
    ) {
      throw new AppError(
        "Search must not exceed 100 characters.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Non-administrative roles may only see published subjects.
    const isAdministrator = [
      ROLES.SUPER_ADMIN,
      ROLES.MAIN_ADMIN
    ].includes(req.user.role);

    const status = isAdministrator
      ? requestedStatus
      : "ACTIVE";

    const subjects = await subjectService.listSubjects({
      streamId,
      status,
      search: req.query.search
    });

    const total = subjects.length;
    const offset = (page - 1) * limit;
    const paginatedSubjects = subjects.slice(offset, offset + limit);

    return successResponse(res, {
      message: "Subjects retrieved successfully.",
      data: {
        subjects: paginatedSubjects.map(serializeSubject),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function getSubjectById(req, res, next) {
  try {
    const id = validateSubjectId(req.params.id);
    const subject = await subjectService.getSubjectById(id);

    const isAdministrator = [
      ROLES.SUPER_ADMIN,
      ROLES.MAIN_ADMIN
    ].includes(req.user.role);

    if (!isAdministrator && subject.status !== "ACTIVE") {
      throw new AppError(
        "Subject not found.",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return successResponse(res, {
      message: "Subject retrieved successfully.",
      data: {
        subject: serializeSubject(subject)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function createSubject(req, res, next) {
  try {
    const body = req.body || {};
    const allowedFields = [
      "streamId",
      "name",
      "introduction",
      "status",
      "displayOrder"
    ];

    const fields = Object.keys(body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      throw new AppError(
        "Provide valid subject fields: streamId, name, introduction, status, displayOrder.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (
      typeof body.name !== "string" ||
      body.name.trim().length < 2 ||
      body.name.trim().length > 120
    ) {
      throw new AppError(
        "Subject name must be between 2 and 120 characters.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (
      body.introduction !== undefined &&
      body.introduction !== null &&
      typeof body.introduction !== "string"
    ) {
      throw new AppError(
        "Introduction must be a string or null.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (
      body.status !== undefined &&
      !["DRAFT", "ACTIVE", "INACTIVE"].includes(body.status)
    ) {
      throw new AppError(
        "Status must be DRAFT, ACTIVE, or INACTIVE.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (body.displayOrder !== undefined) {
      const displayOrder = Number(body.displayOrder);

      if (!Number.isSafeInteger(displayOrder) || displayOrder < 0) {
        throw new AppError(
          "Display order must be a non-negative integer.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      body.displayOrder = displayOrder;
    }

    const subject = await subjectService.createSubject(
      body,
      req.user.id
    );

    const completeSubject = await subjectService.getSubjectById(
      subject.id
    );

    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Subject created successfully.",
      data: {
        subject: serializeSubject(completeSubject)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateSubject(req, res, next) {
  try {
    const id = validateSubjectId(req.params.id);
    const body = req.body || {};

    const allowedFields = [
      "streamId",
      "name",
      "introduction",
      "status",
      "displayOrder"
    ];

    const fields = Object.keys(body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      throw new AppError(
        "Provide at least one valid subject field.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updatedSubject = await subjectService.updateSubject(id, body);

    return successResponse(res, {
      message: "Subject updated successfully.",
      data: {
        subject: serializeSubject(updatedSubject)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const id = validateSubjectId(req.params.id);

    await subjectService.deleteSubject(id);

    return successResponse(res, {
      message: "Subject deleted successfully.",
      data: { id }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};

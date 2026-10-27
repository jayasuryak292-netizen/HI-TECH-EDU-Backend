


const { Op } = require("sequelize");
const { Stream } = require("../models");
const HTTP_STATUS = require("../constants/httpStatus");
const AppError = require("../utils/appError");
const { successResponse } = require("../utils/apiResponse");

function serializeStream(stream) {
  return {
    id: stream.id,
    code: stream.code,
    name: stream.name,
    description: stream.description,
    isActive: stream.isActive,
    createdAt: stream.createdAt,
    updatedAt: stream.updatedAt
  };
}

function validateStreamId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError(
      "A valid stream ID is required.",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return id;
}

async function listStreams(req, res, next) {
  try {
   const page = req.query.page === undefined
  ? 1
  : Number(req.query.page);

const limit = req.query.limit === undefined
  ? 20
  : Number(req.query.limit); 

    if (
      page < 1 ||
      limit < 1 ||
      limit > 100 ||
      !Number.isInteger(page) ||
      !Number.isInteger(limit)
    ) {
      throw new AppError(
        "Page must be positive and limit must be between 1 and 100.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const where = {};

    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        throw new AppError(
          "isActive must be true or false.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      where.isActive = req.query.isActive === "true";
    }

    if (req.query.search !== undefined) {
      if (
        typeof req.query.search !== "string" ||
        req.query.search.trim().length > 100
      ) {
        throw new AppError(
          "Search must not exceed 100 characters.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const term = req.query.search.trim();

      if (term) {
        where[Op.or] = [
          { code: { [Op.like]: `%${term}%` } },
          { name: { [Op.like]: `%${term}%` } }
        ];
      }
    }

    const { count, rows } = await Stream.findAndCountAll({
      where,
      order: [["name", "ASC"]],
      limit,
      offset: (page - 1) * limit
    });

    return successResponse(res, {
      message: "Streams retrieved successfully.",
      data: {
        streams: rows.map(serializeStream),
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

async function getStreamById(req, res, next) {
  try {
    const id = validateStreamId(req.params.id);
    const stream = await Stream.findByPk(id);

    if (!stream) {
      throw new AppError("Stream not found.", HTTP_STATUS.NOT_FOUND);
    }

    return successResponse(res, {
      message: "Stream retrieved successfully.",
      data: { stream: serializeStream(stream) }
    });
  } catch (error) {
    return next(error);
  }
}

async function createStream(req, res, next) {
  try {
    const { code, name, description, isActive } = req.body || {};

    if (
      typeof code !== "string" ||
      code.trim().length < 2 ||
      code.trim().length > 20 ||
      !/^[A-Za-z0-9_-]+$/.test(code.trim())
    ) {
      throw new AppError(
        "Stream code must be 2–20 characters and contain only letters, numbers, underscores, or hyphens.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 120
    ) {
      throw new AppError(
        "Stream name must be between 2 and 120 characters.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      throw new AppError(
        "Description must be a string or null.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      throw new AppError(
        "isActive must be a boolean.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const normalizedCode = code.trim().toUpperCase();
    const normalizedName = name.trim();

    const existing = await Stream.findOne({
      where: {
        [Op.or]: [
          { code: normalizedCode },
          { name: normalizedName }
        ]
      }
    });

    if (existing) {
      throw new AppError(
        "A stream with this code or name already exists.",
        HTTP_STATUS.CONFLICT
      );
    }

    const stream = await Stream.create({
      code: normalizedCode,
      name: normalizedName,
      description: description == null ? null : description.trim(),
      isActive: isActive === undefined ? true : isActive
    });

    return successResponse(res, {
      statusCode: HTTP_STATUS.CREATED,
      message: "Stream created successfully.",
      data: { stream: serializeStream(stream) }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateStream(req, res, next) {
  try {
    const id = validateStreamId(req.params.id);
    const body = req.body || {};
    const allowedFields = ["code", "name", "description", "isActive"];
    const fields = Object.keys(body);

    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      throw new AppError(
        "Provide valid stream fields: code, name, description, isActive.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const stream = await Stream.findByPk(id);

    if (!stream) {
      throw new AppError("Stream not found.", HTTP_STATUS.NOT_FOUND);
    }

    if (body.code !== undefined) {
      if (
        typeof body.code !== "string" ||
        body.code.trim().length < 2 ||
        body.code.trim().length > 20 ||
        !/^[A-Za-z0-9_-]+$/.test(body.code.trim())
      ) {
        throw new AppError(
          "Stream code must be 2–20 characters and contain only letters, numbers, underscores, or hyphens.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      stream.code = body.code.trim().toUpperCase();
    }

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        body.name.trim().length < 2 ||
        body.name.trim().length > 120
      ) {
        throw new AppError(
          "Stream name must be between 2 and 120 characters.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      stream.name = body.name.trim();
    }

    if (body.description !== undefined) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        throw new AppError(
          "Description must be a string or null.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      stream.description =
        body.description === null ? null : body.description.trim();
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        throw new AppError(
          "isActive must be a boolean.",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      stream.isActive = body.isActive;
    }

    const duplicate = await Stream.findOne({
      where: {
        [Op.or]: [
          { code: stream.code },
          { name: stream.name }
        ],
        id: { [Op.ne]: stream.id }
      }
    });

    if (duplicate) {
      throw new AppError(
        "A stream with this code or name already exists.",
        HTTP_STATUS.CONFLICT
      );
    }

    await stream.save();

    return successResponse(res, {
      message: "Stream updated successfully.",
      data: { stream: serializeStream(stream) }
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteStream(req, res, next) {
  try {
    const id = validateStreamId(req.params.id);
    const stream = await Stream.findByPk(id);

    if (!stream) {
      throw new AppError("Stream not found.", HTTP_STATUS.NOT_FOUND);
    }

    await stream.destroy();

    return successResponse(res, {
      message: "Stream deleted successfully.",
      data: { id }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listStreams,
  getStreamById,
  createStream,
  updateStream,
  deleteStream
};

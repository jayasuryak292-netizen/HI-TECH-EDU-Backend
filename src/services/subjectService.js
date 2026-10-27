

const { Op } = require("sequelize");
const { Subject, Stream } = require("../models");
const AppError = require("../utils/appError");

async function ensureStreamExists(streamId) {
  const id = Number(streamId);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AppError("A valid stream ID is required.", 400);
  }

  const stream = await Stream.findByPk(id);

  if (!stream) {
    throw new AppError("Stream not found.", 404);
  }

  return stream;
}

async function getSubjectById(id) {
  const subjectId = Number(id);

  if (!Number.isSafeInteger(subjectId) || subjectId < 1) {
    throw new AppError("A valid subject ID is required.", 400);
  }

  const subject = await Subject.findByPk(subjectId, {
    include: [
      {
        model: Stream,
        as: "stream",
        attributes: ["id", "code", "name"]
      }
    ]
  });

  if (!subject) {
    throw new AppError("Subject not found.", 404);
  }

  return subject;
}

async function listSubjects(options = {}) {
  const where = {};

  if (options.streamId !== undefined) {
    const stream = await ensureStreamExists(options.streamId);
    where.streamId = stream.id;
  }

  if (options.status !== undefined) {
    const allowedStatuses = ["DRAFT", "ACTIVE", "INACTIVE"];

    if (!allowedStatuses.includes(options.status)) {
      throw new AppError(
        "Status must be DRAFT, ACTIVE, or INACTIVE.",
        400
      );
    }

    where.status = options.status;
  }

  if (options.search !== undefined) {
    if (typeof options.search !== "string" || options.search.length > 100) {
      throw new AppError(
        "Search must not exceed 100 characters.",
        400
      );
    }

    const term = options.search.trim();

    if (term) {
      where[Op.or] = [
        { name: { [Op.like]: `%${term}%` } },
        { introduction: { [Op.like]: `%${term}%` } }
      ];
    }
  }

  return Subject.findAll({
    where,
    include: [
      {
        model: Stream,
        as: "stream",
        attributes: ["id", "code", "name"]
      }
    ],
    order: [
      ["displayOrder", "ASC"],
      ["name", "ASC"]
    ]
  });
}

async function createSubject(data, userId) {
  const stream = await ensureStreamExists(data.streamId);
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (name.length < 2 || name.length > 120) {
    throw new AppError(
      "Subject name must be between 2 and 120 characters.",
      400
    );
  }

  if (
    data.introduction !== undefined &&
    data.introduction !== null &&
    typeof data.introduction !== "string"
  ) {
    throw new AppError(
      "Introduction must be a string or null.",
      400
    );
  }

  const introduction =
    data.introduction == null ? null : data.introduction.trim();

  const displayOrder =
    data.displayOrder === undefined ? 0 : Number(data.displayOrder);

  if (!Number.isSafeInteger(displayOrder) || displayOrder < 0) {
    throw new AppError(
      "Display order must be a non-negative integer.",
      400
    );
  }

  const status = data.status === undefined ? "DRAFT" : data.status;
  const allowedStatuses = ["DRAFT", "ACTIVE", "INACTIVE"];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(
      "Status must be DRAFT, ACTIVE, or INACTIVE.",
      400
    );
  }

  const existing = await Subject.findOne({
    where: {
      streamId: stream.id,
      name
    }
  });

  if (existing) {
    throw new AppError(
      "A subject with this name already exists in the selected stream.",
      409
    );
  }

  let createdBy = null;

  if (userId !== undefined && userId !== null) {
    const id = Number(userId);

    if (!Number.isSafeInteger(id) || id < 1) {
      throw new AppError("A valid creator ID is required.", 400);
    }

    createdBy = id;
  }

  return Subject.create({
    streamId: stream.id,
    name,
    introduction,
    status,
    displayOrder,
    createdBy
  });
}

async function updateSubject(id, data) {
  const subject = await getSubjectById(id);
  const updates = {};

  if (data.streamId !== undefined) {
    const stream = await ensureStreamExists(data.streamId);
    updates.streamId = stream.id;
  }

  if (data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      data.name.trim().length < 2 ||
      data.name.trim().length > 120
    ) {
      throw new AppError(
        "Subject name must be between 2 and 120 characters.",
        400
      );
    }

    updates.name = data.name.trim();
  }

  if (data.introduction !== undefined) {
    if (
      data.introduction !== null &&
      typeof data.introduction !== "string"
    ) {
      throw new AppError(
        "Introduction must be a string or null.",
        400
      );
    }

    updates.introduction =
      data.introduction === null ? null : data.introduction.trim();
  }

  if (data.status !== undefined) {
    if (!["DRAFT", "ACTIVE", "INACTIVE"].includes(data.status)) {
      throw new AppError(
        "Status must be DRAFT, ACTIVE, or INACTIVE.",
        400
      );
    }

    updates.status = data.status;
  }

  if (data.displayOrder !== undefined) {
    const displayOrder = Number(data.displayOrder);

    if (!Number.isSafeInteger(displayOrder) || displayOrder < 0) {
      throw new AppError(
        "Display order must be a non-negative integer.",
        400
      );
    }

    updates.displayOrder = displayOrder;
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError("Provide at least one valid subject field.", 400);
  }

  const streamId = updates.streamId ?? subject.streamId;
  const name = updates.name ?? subject.name;

  const duplicate = await Subject.findOne({
    where: {
      streamId,
      name,
      id: { [Op.ne]: subject.id }
    }
  });

  if (duplicate) {
    throw new AppError(
      "A subject with this name already exists in the selected stream.",
      409
    );
  }

  await subject.update(updates);

  return getSubjectById(subject.id);
}

async function deleteSubject(id) {
  const subject = await getSubjectById(id);
  await subject.destroy();
}

module.exports = {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};

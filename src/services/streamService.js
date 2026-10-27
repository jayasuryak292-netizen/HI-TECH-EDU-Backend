

const { Stream } = require("../models");
const AppError = require("../utils/appError");

async function createStream(data) {
  const code = String(data.code || "").trim().toUpperCase();
  const name = String(data.name || "").trim();
  const description = data.description
    ? String(data.description).trim()
    : null;

  if (!code || !name) {
    throw new AppError("Stream code and name are required.", 400);
  }

  const existing = await Stream.findOne({
    where: {
      [require("sequelize").Op.or]: [{ code }, { name }]
    }
  });

  if (existing) {
    throw new AppError("A stream with this code or name already exists.", 409);
  }

  return Stream.create({
    code,
    name,
    description,
    isActive: data.isActive === undefined ? true : data.isActive
  });
}

async function getAllStreams(options = {}) {
  const where = {};

  if (options.activeOnly === true) {
    where.isActive = true;
  }

  return Stream.findAll({
    where,
    order: [["name", "ASC"]]
  });
}

async function getStreamById(id) {
  const stream = await Stream.findByPk(id);

  if (!stream) {
    throw new AppError("Stream not found.", 404);
  }

  return stream;
}

async function updateStream(id, data) {
  const stream = await getStreamById(id);

  const updates = {};

  if (data.code !== undefined) {
    updates.code = String(data.code).trim().toUpperCase();
  }

  if (data.name !== undefined) {
    updates.name = String(data.name).trim();
  }

  if (data.description !== undefined) {
    updates.description = data.description === null
      ? null
      : String(data.description).trim();
  }

  if (data.isActive !== undefined) {
    updates.isActive = data.isActive;
  }

  const code = updates.code || stream.code;
  const name = updates.name || stream.name;

  const duplicate = await Stream.findOne({
    where: {
      [require("sequelize").Op.or]: [{ code }, { name }]
    }
  });

  if (duplicate && duplicate.id !== stream.id) {
    throw new AppError("A stream with this code or name already exists.", 409);
  }

  await stream.update(updates);
  return stream;
}

async function deleteStream(id) {
  const stream = await getStreamById(id);
  await stream.destroy();
}

module.exports = {
  createStream,
  getAllStreams,
  getStreamById,
  updateStream,
  deleteStream
};

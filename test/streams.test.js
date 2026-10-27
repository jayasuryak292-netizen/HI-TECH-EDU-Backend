"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { Stream } = require("../src/models");
const ROLES = require("../src/constants/roles");
const { generateToken } = require("../src/utils/token");

function createToken(role) {
  return generateToken({
    id: 900001,
    role,
    email: `streams-test-${role.toLowerCase().replace(/[^a-z0-9]/g, "-")}@example.com`
  });
}

function uniqueCode() {
  return `S${Date.now().toString().slice(-8)}${process.pid.toString().slice(-4)}`;
}

test("Streams API requires authentication", async () => {
  const response = await request(app).get("/api/streams");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
});

test("Only authorized administrators can manage streams", async () => {
  const studentToken = createToken(ROLES.STUDENT);
  const code = uniqueCode();

  const response = await request(app)
    .post("/api/streams")
    .set("Authorization", `Bearer ${studentToken}`)
    .send({
      code,
      name: `Unauthorized Stream ${Date.now()}`
    });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.success, false);

  const stream = await Stream.findOne({ where: { code } });
  assert.equal(stream, null);
});

test("Main Admin can create, list, retrieve, update, and delete a stream", async () => {
  const token = createToken(ROLES.MAIN_ADMIN);
  const code = uniqueCode();
  const updatedCode = `${code.slice(0, 18)}X`;
  const name = `Test Stream ${Date.now()}`;
  let streamId;

  try {
    const createResponse = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code,
        name,
        description: "Temporary automated test stream",
        isActive: true
      });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.body.success, true);
    assert.equal(createResponse.body.data.stream.code, code);
    assert.equal(createResponse.body.data.stream.name, name);
    assert.equal(createResponse.body.data.stream.isActive, true);

    streamId = createResponse.body.data.stream.id;
    assert.ok(streamId);

    const listResponse = await request(app)
      .get("/api/streams")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(listResponse.statusCode, 200);
    assert.equal(listResponse.body.success, true);
    assert.ok(Array.isArray(listResponse.body.data.streams));
    assert.ok(
      listResponse.body.data.streams.some((stream) => stream.id === streamId)
    );
    assert.ok(listResponse.body.data.pagination);

    const getResponse = await request(app)
      .get(`/api/streams/${streamId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(getResponse.statusCode, 200);
    assert.equal(getResponse.body.data.stream.id, streamId);
    assert.equal(getResponse.body.data.stream.code, code);

    const updateResponse = await request(app)
      .patch(`/api/streams/${streamId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: updatedCode,
        name: `${name} Updated`,
        description: "Updated test description",
        isActive: false
      });

    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.success, true);
    assert.equal(updateResponse.body.data.stream.code, updatedCode);
    assert.equal(updateResponse.body.data.stream.name, `${name} Updated`);
    assert.equal(updateResponse.body.data.stream.description, "Updated test description");
    assert.equal(updateResponse.body.data.stream.isActive, false);

    const inactiveResponse = await request(app)
      .get("/api/streams")
      .query({ isActive: "false" })
      .set("Authorization", `Bearer ${token}`);

    assert.equal(inactiveResponse.statusCode, 200);
    assert.ok(
      inactiveResponse.body.data.streams.some((stream) => stream.id === streamId)
    );

    const deleteResponse = await request(app)
      .delete(`/api/streams/${streamId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(deleteResponse.statusCode, 200);
    assert.equal(deleteResponse.body.success, true);

    const deletedResponse = await request(app)
      .get(`/api/streams/${streamId}`)
      .set("Authorization", `Bearer ${token}`);

    assert.equal(deletedResponse.statusCode, 404);
  } finally {
    if (streamId) {
      await Stream.destroy({ where: { id: streamId } });
    }

    await Stream.destroy({
      where: {
        code: [code, updatedCode]
      }
    });
  }
});

test("Streams API rejects invalid input and duplicate codes or names", async () => {
  const token = createToken(ROLES.MAIN_ADMIN);
  const code = uniqueCode();
  const name = `Duplicate Test Stream ${Date.now()}`;
  let streamId;

  try {
    const invalidResponse = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "!",
        name: "Invalid"
      });

    assert.equal(invalidResponse.statusCode, 400);
    assert.equal(invalidResponse.body.success, false);

    const createResponse = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${token}`)
      .send({ code, name });

    assert.equal(createResponse.statusCode, 201);
    streamId = createResponse.body.data.stream.id;

    const duplicateCodeResponse = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code,
        name: `${name} Different`
      });

    assert.equal(duplicateCodeResponse.statusCode, 409);
    assert.equal(duplicateCodeResponse.body.success, false);

    const duplicateNameResponse = await request(app)
      .post("/api/streams")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: `${code.slice(0, 18)}X`,
        name
      });

    assert.equal(duplicateNameResponse.statusCode, 409);
    assert.equal(duplicateNameResponse.body.success, false);
  } finally {
    if (streamId) {
      await Stream.destroy({ where: { id: streamId } });
    }

    await Stream.destroy({
      where: {
        name
      }
    });
  }
});

test("Streams API validates IDs and pagination parameters", async () => {
  const token = createToken(ROLES.MAIN_ADMIN);

  const invalidIdResponse = await request(app)
    .get("/api/streams/invalid-id")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(invalidIdResponse.statusCode, 400);

  const invalidPageResponse = await request(app)
    .get("/api/streams")
    .query({ page: 0 })
    .set("Authorization", `Bearer ${token}`);

  assert.equal(invalidPageResponse.statusCode, 400);

  const invalidLimitResponse = await request(app)
    .get("/api/streams")
    .query({ limit: 101 })
    .set("Authorization", `Bearer ${token}`);

  assert.equal(invalidLimitResponse.statusCode, 400);
});

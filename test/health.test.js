
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

test("GET /api/health returns a healthy API response", async () => {
  const response = await request(app).get("/api/health");

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, "healthy");
  assert.equal(typeof response.body.message, "string");
});

test("Unknown API routes return HTTP 404", async () => {
  const response = await request(app).get("/api/route-that-does-not-exist");

  assert.equal(response.statusCode, 404);
  assert.equal(response.body.success, false);
});

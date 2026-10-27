const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { User } = require("../src/models");

test("Authentication API handles registration and login correctly", async () => {
  const email = `auth-test-${Date.now()}-${process.pid}@example.com`;
  let userCreated = false;

  try {
    // Reject registration with invalid input.
    const invalidRegistration = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "A",
        email,
        password: "short"
      });

    assert.equal(invalidRegistration.statusCode, 400);
    assert.equal(invalidRegistration.body.success, false);

    // Register a new student.
    const registration = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test Student",
        email,
        password: "TestPass123!"
      });

    assert.equal(registration.statusCode, 201);
    assert.equal(registration.body.success, true);
    assert.equal(registration.body.data.user.email, email);
    assert.equal(registration.body.data.user.role, "student");
    assert.equal(
      Object.hasOwn(registration.body.data.user, "passwordHash"),
      false
    );

    userCreated = true;

    // Reject a duplicate email.
    const duplicateRegistration = await request(app)
      .post("/api/auth/register")
      .send({
        fullName: "Test Student",
        email,
        password: "TestPass123!"
      });

    assert.equal(duplicateRegistration.statusCode, 409);

    // Reject an incorrect password.
    const incorrectLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "WrongPass123!"
      });

    assert.equal(incorrectLogin.statusCode, 401);

    // Login successfully using a case-insensitive email.
    const login = await request(app)
      .post("/api/auth/login")
      .send({
        email: email.toUpperCase(),
        password: "TestPass123!"
      });

    assert.equal(login.statusCode, 200);
    assert.equal(login.body.success, true);
    assert.equal(typeof login.body.data.token, "string");
    assert.ok(login.body.data.token.length > 0);
    assert.equal(login.body.data.user.email, email);
    assert.equal(login.body.data.user.role, "student");
  } finally {
    // Remove the temporary account so the test can be repeated.
    if (userCreated) {
      await User.destroy({
        where: { email }
      });
    }
  }
});

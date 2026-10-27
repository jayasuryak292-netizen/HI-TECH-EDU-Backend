
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");
const { User } = require("../src/models");
const ROLES = require("../src/constants/roles");
const { generateToken } = require("../src/utils/token");

function createToken(user) {
  return generateToken({
    id: user.id,
    role: user.role,
    email: user.email
  });
}

test("Users API enforces authentication and role-based access", async () => {
  const unauthenticated = await request(app).get("/api/users");

  assert.equal(unauthenticated.statusCode, 401);
  assert.equal(unauthenticated.body.success, false);

  const studentToken = createToken({
    id: 900001,
    role: ROLES.STUDENT,
    email: "users-api-student-test@example.com"
  });

  const studentResponse = await request(app)
    .get("/api/users")
    .set("Authorization", `Bearer ${studentToken}`);

  assert.equal(studentResponse.statusCode, 403);
  assert.equal(studentResponse.body.success, false);

  const staffToken = createToken({
    id: 900002,
    role: ROLES.STAFF,
    email: "users-api-staff-test@example.com"
  });

  const staffResponse = await request(app)
    .get("/api/users")
    .set("Authorization", `Bearer ${staffToken}`);

  assert.equal(staffResponse.statusCode, 403);
  assert.equal(staffResponse.body.success, false);
});

test("Main Admin can list only Staff and Student accounts", async () => {
  const email = `users-main-admin-${Date.now()}-${process.pid}@example.com`;
  let admin;

  try {
    admin = await User.create({
      fullName: "Temporary Main Admin",
      email,
      passwordHash: "not-used-for-token-tests",
      role: ROLES.MAIN_ADMIN,
      isActive: true
    });

    const token = createToken(admin);

    const response = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.ok(Array.isArray(response.body.data.users));

    for (const user of response.body.data.users) {
      assert.ok(
        [ROLES.STAFF, ROLES.STUDENT].includes(user.role),
        `Unexpected role in Main Admin results: ${user.role}`
      );

      assert.equal(Object.hasOwn(user, "passwordHash"), false);
    }

    assert.ok(response.body.data.pagination);
  } finally {
    if (admin) {
      await admin.destroy();
    }
  }
});

test("Main Admin cannot request privileged roles or assign them", async () => {
  const email = `users-target-student-${Date.now()}-${process.pid}@example.com`;
  const adminEmail = `users-target-admin-${Date.now()}-${process.pid}@example.com`;

  let student;
  let admin;

  try {
    student = await User.create({
      fullName: "Temporary Target Student",
      email,
      passwordHash: "not-used-for-token-tests",
      role: ROLES.STUDENT,
      isActive: true
    });

    admin = await User.create({
      fullName: "Temporary Main Admin",
      email: adminEmail,
      passwordHash: "not-used-for-token-tests",
      role: ROLES.MAIN_ADMIN,
      isActive: true
    });

    const token = createToken(admin);

    for (const role of [ROLES.MAIN_ADMIN, ROLES.SUPER_ADMIN]) {
      const listResponse = await request(app)
        .get("/api/users")
        .query({ role })
        .set("Authorization", `Bearer ${token}`);

      assert.equal(listResponse.statusCode, 403);

      const updateResponse = await request(app)
        .patch(`/api/users/${student.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ role });

      assert.equal(updateResponse.statusCode, 403);
      assert.equal(updateResponse.body.success, false);
    }

    await student.reload();
    assert.equal(student.role, ROLES.STUDENT);
  } finally {
    if (student) {
      await student.destroy();
    }

    if (admin) {
      await admin.destroy();
    }
  }
});

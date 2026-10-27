

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

test("Super Admin dashboard rejects unauthenticated requests", async () => {
  const response = await request(app)
    .get("/api/super-admin/dashboard/summary");

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.success, false);
});

test("Super Admin dashboard rejects non-Super-Admin roles", async () => {
  const roles = [
    ROLES.STUDENT,
    ROLES.STAFF,
    ROLES.MAIN_ADMIN
  ];

  for (const role of roles) {
    const token = createToken({
      id: 900000 + roles.indexOf(role),
      role,
      email: `dashboard-${role}@example.com`
    });

    const response = await request(app)
      .get("/api/super-admin/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.statusCode, 403, `Role ${role} must be rejected`);
    assert.equal(response.body.success, false);
  }
});

test("Super Admin can retrieve database-backed dashboard counts", async () => {
  const email = `dashboard-super-admin-${Date.now()}-${process.pid}@example.com`;
  let admin;

  try {
    admin = await User.create({
      fullName: "Temporary Dashboard Super Admin",
      email,
      passwordHash: "not-used-for-token-tests",
      role: ROLES.SUPER_ADMIN,
      isActive: true
    });

    const token = createToken(admin);

    const response = await request(app)
      .get("/api/super-admin/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);

    const data = response.body.data;

    assert.ok(data);
    assert.ok(Number.isInteger(data.users.registered));
    assert.ok(Number.isInteger(data.users.active));
    assert.ok(Number.isInteger(data.users.inactive));
    assert.ok(Number.isInteger(data.users.byRole.superAdmins));
    assert.ok(Number.isInteger(data.users.byRole.mainAdmins));
    assert.ok(Number.isInteger(data.users.byRole.staff));
    assert.ok(Number.isInteger(data.users.byRole.students));

    assert.ok(Number.isInteger(data.streams.total));
    assert.ok(Number.isInteger(data.streams.active));
    assert.ok(Number.isInteger(data.streams.inactive));

    assert.ok(Number.isInteger(data.subjects.total));
    assert.ok(Number.isInteger(data.subjects.active));
    assert.ok(Number.isInteger(data.subjects.draft));
    assert.ok(Number.isInteger(data.subjects.inactive));

    assert.equal(
      data.users.registered,
      data.users.active + data.users.inactive
    );

    assert.equal(
      data.users.registered,
      data.users.byRole.superAdmins +
        data.users.byRole.mainAdmins +
        data.users.byRole.staff +
        data.users.byRole.students
    );

    assert.equal(
      data.streams.total,
      data.streams.active + data.streams.inactive
    );

    assert.equal(
      data.subjects.total,
      data.subjects.active +
        data.subjects.draft +
        data.subjects.inactive
    );
  } finally {
    if (admin) {
      await admin.destroy();
    }
  }
});

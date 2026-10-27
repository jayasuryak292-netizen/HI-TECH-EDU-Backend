

const { User, Stream, Subject } = require("../models");
const ROLES = require("../constants/roles");

async function getDashboardSummary() {
  const [
    registeredUsers,
    activeUsers,
    inactiveUsers,
    superAdmins,
    mainAdmins,
    staff,
    students,
    totalStreams,
    activeStreams,
    totalSubjects,
    activeSubjects,
    draftSubjects,
    inactiveSubjects
  ] = await Promise.all([
    User.count(),

    User.count({
      where: { isActive: true }
    }),

    User.count({
      where: { isActive: false }
    }),

    User.count({
      where: { role: ROLES.SUPER_ADMIN }
    }),

    User.count({
      where: { role: ROLES.MAIN_ADMIN }
    }),

    User.count({
      where: { role: ROLES.STAFF }
    }),

    User.count({
      where: { role: ROLES.STUDENT }
    }),

    Stream.count(),

    Stream.count({
      where: { isActive: true }
    }),

    Subject.count(),

    Subject.count({
      where: { status: "ACTIVE" }
    }),

    Subject.count({
      where: { status: "DRAFT" }
    }),

    Subject.count({
      where: { status: "INACTIVE" }
    })
  ]);

  return {
    users: {
      registered: registeredUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: {
        superAdmins,
        mainAdmins,
        staff,
        students
      }
    },
    streams: {
      total: totalStreams,
      active: activeStreams,
      inactive: totalStreams - activeStreams
    },
    subjects: {
      total: totalSubjects,
      active: activeSubjects,
      draft: draftSubjects,
      inactive: inactiveSubjects
    }
  };
}

module.exports = {
  getDashboardSummary
};



const { successResponse } = require("../utils/apiResponse");
const { getDashboardSummary } = require("../services/superAdminDashboardService");

async function getSummary(req, res) {
  const summary = await getDashboardSummary();

  return successResponse(res, {
    message: "Super Admin dashboard summary retrieved successfully.",
    data: summary
  });
}

module.exports = {
  getSummary
};

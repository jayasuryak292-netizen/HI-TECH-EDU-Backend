
function successResponse(res, {
  statusCode = 200,
  message = "Request completed successfully.",
  data = null
} = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function createdResponse(res, {
  message = "Resource created successfully.",
  data = null
} = {}) {
  return successResponse(res, {
    statusCode: 201,
    message,
    data
  });
}

module.exports = {
  successResponse,
  createdResponse
};

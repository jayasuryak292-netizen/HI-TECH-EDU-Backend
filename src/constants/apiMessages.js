
const API_MESSAGES = Object.freeze({
  SUCCESS: "Request completed successfully.",
  RESOURCE_CREATED: "Resource created successfully.",
  RESOURCE_UPDATED: "Resource updated successfully.",
  RESOURCE_DELETED: "Resource deleted successfully.",

  INVALID_REQUEST: "The request is invalid.",
  VALIDATION_FAILED: "Validation failed.",
  UNAUTHORIZED: "Authentication is required.",
  FORBIDDEN: "You do not have permission to perform this action.",
  RESOURCE_NOT_FOUND: "The requested resource was not found.",
  DUPLICATE_RESOURCE: "This resource already exists.",

  INTERNAL_ERROR: "An unexpected server error occurred.",
  TOO_MANY_REQUESTS: "Too many requests. Please try again later."
});

module.exports = API_MESSAGES;

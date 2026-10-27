
function isValidEmail(email) {
  if (typeof email !== "string") {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
}

function isRequiredText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isRequiredText
};

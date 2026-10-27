
const env = require("./env");

function formatLog(level, message, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message
  };

  if (details !== undefined) {
    entry.details = details;
  }

  return JSON.stringify(entry);
}

function info(message, details) {
  console.log(formatLog("info", message, details));
}

function warn(message, details) {
  console.warn(formatLog("warn", message, details));
}

function error(message, details) {
  console.error(formatLog("error", message, details));
}

function debug(message, details) {
  if (env.nodeEnv === "development") {
    console.debug(formatLog("debug", message, details));
  }
}

module.exports = {
  info,
  warn,
  error,
  debug
};

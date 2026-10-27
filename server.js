
const app = require("./src/app");
const sequelize = require("./src/config/database");
const env = require("./src/config/env");
const logger = require("./src/config/logger");

let server;

async function startServer() {
  try {
    await sequelize.authenticate();

    logger.info("MySQL connection established.");

    server = app.listen(env.port, () => {
      logger.info("HI-TECH-EDU API server started.", {
        port: env.port,
        environment: env.nodeEnv,
        healthUrl: `http://localhost:${env.port}/api/health`,
        docsUrl: `http://localhost:${env.port}/api-docs`
      });
    });
  } catch (error) {
    logger.error("Failed to start the API server.", {
      message: error.message
    });

    process.exitCode = 1;
  }
}

async function shutdown(signal) {
  logger.info("Server shutdown requested.", { signal });

  if (server) {
    server.close(async () => {
      try {
        await sequelize.close();
        logger.info("Server and database connection closed.");
        process.exit(0);
      } catch (error) {
        logger.error("Error closing database connection.", {
          message: error.message
        });
        process.exit(1);
      }
    });
  } else {
    await sequelize.close();
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

if (require.main === module) {
  startServer();
}

module.exports = { startServer, shutdown };

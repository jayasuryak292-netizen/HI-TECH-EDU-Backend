

const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "HI-TECH-EDU API",
      version: "1.0.0",
      description:
        "REST API for the HI-TECH-EDU learning platform."
    },
    servers: [
      {
        url: `http://localhost:${env.port}/api`,
        description: "Local development server"
      }
    ],
    tags: [
      { name: "Health", description: "API health checks" },
      { name: "Authentication", description: "User authentication" },
      { name: "Users", description: "User management" },
      { name: "Streams", description: "Stream management" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter the JWT access token obtained after login."
        }
      }
    }
  },
  apis: ["src/routes/*.js", "src/controllers/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

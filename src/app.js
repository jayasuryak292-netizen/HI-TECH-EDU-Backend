

const express = require("express");
const swaggerUi = require("swagger-ui-express");

const {
  cors,
  security,
  swagger,
  logger
} = require("./config");

const {
  notFound,
  errorHandler,
  requestLogger
} = require("./middleware");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const streamRoutes = require("./routes/streamRoutes");
const superAdminDashboardRoutes = require("./routes/superAdminDashboardRoutes");
const HTTP_STATUS = require("./constants/httpStatus");


const app = express();

app.disable("x-powered-by");

app.use(security.securityHeaders);
app.use(cors);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(requestLogger);
app.use(security.apiRateLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/streams", streamRoutes);
app.use("/api/super-admin/dashboard", superAdminDashboardRoutes);

app.get("/api/health", (req, res) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "HI-TECH-EDU API is running.",
    data: {
      status: "healthy",
      environment: require("./config/env").nodeEnv
    }
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const indexRoute = require("./routes/index.route");
const env = require("./config/env");
const { errorHandler, notFoundHandler } = require("./middlewares/error.middleware");
const sanitizeInput = require("./middlewares/sanitize.middleware");

const app = express();

// Trust reverse proxy (nginx / cloud load balancer)
app.set("trust proxy", 1);

// Security HTTP Headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// CORS configuration: Restrict to explicit origins if configured, with same-origin / preview fallback
const allowedOrigins = env.CORS_ORIGIN && env.CORS_ORIGIN !== "*" 
  ? env.CORS_ORIGIN.split(",").map((o) => o.trim()) 
  : null;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin requests (where origin is undefined)
    if (!origin) return callback(null, true);
    
    // If wildcard is configured or origin is in explicit whitelist
    if (!allowedOrigins || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production with strict CORS, block untrusted origins
    if (env.NODE_ENV === "production" && allowedOrigins) {
      return callback(new Error(`CORS blocked: Origin ${origin} not permitted`));
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
app.use(cors(corsOptions));

// Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Body parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// XSS and NoSQL injection sanitizer for all requests
app.use(sanitizeInput);

// Root info endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TechHub Production REST API is active",
    documentation: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      rentals: "/api/rentals",
      orders: "/api/orders",
    },
    version: "1.0.0",
  });
});

// Primary API Router
app.use("/api", indexRoute);

// 404 Handler for undefined routes
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

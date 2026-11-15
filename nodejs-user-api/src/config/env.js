const path = require("path");
const dotenv = require("dotenv");

// Load .env from multiple possible root and local locations
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || "",
  JWT_ACCESS_SECRET:
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    "techhub_access_token_super_secret_key_2025",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "techhub_refresh_token_super_secret_key_2025",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

module.exports = env;

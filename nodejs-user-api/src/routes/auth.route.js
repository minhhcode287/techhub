const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const authValidation = require("../validations/auth.validation");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// Strict rate limit for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per IP
  message: {
    success: false,
    message: "Quá nhiều yêu cầu đăng nhập/đăng ký từ IP này. Vui lòng thử lại sau 15 phút.",
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
    default: false,
  },
});

router.post(
  "/register",
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(authValidation.login),
  authController.login
);

router.post(
  "/refresh-token",
  validate(authValidation.refreshToken),
  authController.refreshToken
);

router.post("/logout", requireAuth, authController.logout);

router.get("/me", requireAuth, authController.getMe);

router.put("/profile", requireAuth, authController.updateProfile);

module.exports = router;

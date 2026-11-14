const express = require("express");
const userController = require("../controllers/user.controller");
const userValidation = require("../validations/user.validation");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  requireRole,
  requireSelfOrAdmin,
  requireSelf,
} = require("../middlewares/role.middleware");

const router = express.Router();

// GET /api/users - Admin only with pagination, filtering and search
router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(userValidation.getUsers),
  userController.getUsers
);

// GET /api/users/:id - Admin or Self
router.get(
  "/:id",
  requireAuth,
  requireSelfOrAdmin("id"),
  validate(userValidation.getUser),
  userController.getUser
);

// PUT /api/users/:id - Admin or Self
router.put(
  "/:id",
  requireAuth,
  requireSelfOrAdmin("id"),
  validate(userValidation.updateUser),
  userController.updateUser
);

// PATCH /api/users/:id/change-password - Self only
router.patch(
  "/:id/change-password",
  requireAuth,
  requireSelf("id"),
  validate(userValidation.changePassword),
  userController.changePassword
);

// PATCH /api/users/:id/role - Admin only
router.patch(
  "/:id/role",
  requireAuth,
  requireRole("admin"),
  validate(userValidation.changeRole),
  userController.changeRole
);

// DELETE /api/users/:id - Admin or Self
router.delete(
  "/:id",
  requireAuth,
  requireSelfOrAdmin("id"),
  validate(userValidation.deleteUser),
  userController.deleteUser
);

module.exports = router;

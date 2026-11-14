const express = require("express");
const orderController = require("../controllers/order.controller");
const orderValidation = require("../validations/order.validation");
const validate = require("../middlewares/validate.middleware");
const { optionalAuth, requireAuth } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

const router = express.Router();

// Customer creates order
router.post(
  "/",
  optionalAuth,
  validate(orderValidation.createOrder),
  orderController.createOrder
);

// Authenticated user views their own orders
router.get("/my-orders", requireAuth, orderController.getMyOrders);

// Admin & Staff: view all orders and update order status
router.get(
  "/",
  requireAuth,
  checkRole(["admin", "staff"]),
  orderController.getAllOrders
);

router.patch(
  "/:id/status",
  requireAuth,
  checkRole(["admin", "staff"]),
  validate(orderValidation.updateOrderStatus),
  orderController.updateOrderStatus
);

// View order by ID with ownership/role authorization check
router.get(
  "/:id",
  requireAuth,
  validate(orderValidation.getOrderById),
  orderController.getOrderById
);

module.exports = router;


const express = require("express");
const staffController = require("../controllers/staff.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

const router = express.Router();

// All staff routes require at least 'staff' or 'admin' role
router.use(requireAuth);
router.use(checkRole(["staff", "admin"]));

router.get("/orders", staffController.getOrders);
router.patch("/orders/:id/status", staffController.updateOrderStatus);
router.get("/stats", staffController.getStats);

module.exports = router;

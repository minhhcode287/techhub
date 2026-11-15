const express = require("express");
const voucherController = require("../controllers/voucher.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

const router = express.Router();

// Public: Get active vouchers & validate voucher
router.get("/", voucherController.getActiveVouchers);
router.post("/validate", voucherController.validateVoucher);

// Admin & Staff: Get all vouchers
router.get("/admin/all", requireAuth, checkRole(["admin", "staff"]), voucherController.getAllVouchers);

// Admin Only: Create, Update, Delete Vouchers
router.post("/", requireAuth, checkRole(["admin"]), voucherController.createVoucher);
router.put("/:id", requireAuth, checkRole(["admin"]), voucherController.updateVoucher);
router.delete("/:id", requireAuth, checkRole(["admin"]), voucherController.deleteVoucher);

module.exports = router;

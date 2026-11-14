const express = require("express");
const adminController = require("../controllers/admin.controller");
const adminValidation = require("../validations/admin.validation");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

const router = express.Router();

// ALL admin routes strictly require 'admin' role!
router.use(requireAuth);
router.use(checkRole(["admin"]));

// Revenue and Financial Reports (Admin Only)
router.get("/revenue", validate(adminValidation.getRevenue), adminController.getRevenue);

// Personnel Management: Staff (Admin Only)
router.get("/staff", adminController.getStaff);
router.post("/staff", validate(adminValidation.createStaff), adminController.createStaff);
router.delete("/staff/:id", validate(adminValidation.deleteStaff), adminController.deleteStaff);
router.patch("/staff/:id/status", validate(adminValidation.toggleStaffStatus), adminController.toggleStaffStatus);

// Customer Accounts View (Admin Only)
router.get("/customers", adminController.getCustomers);

// Inventory & Stock Report (Admin Only)
router.get("/inventory", adminController.getInventory);

// Top Performing Products & Cameras (Admin Only)
router.get("/reports/top-performing", adminController.getTopPerforming);

module.exports = router;

const express = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const productRoute = require("./product.route");
const rentalRoute = require("./rental.route");
const orderRoute = require("./order.route");
const staffRoute = require("./staff.route");
const adminRoute = require("./admin.route");
const { healthCheck } = require("../controllers/health.controller");

const router = express.Router();

router.get("/health", healthCheck);
router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/products", productRoute);
router.use("/rentals", rentalRoute);
router.use("/orders", orderRoute);
router.use("/staff", staffRoute);
router.use("/admin", adminRoute);

module.exports = router;


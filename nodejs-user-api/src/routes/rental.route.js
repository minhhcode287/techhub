const express = require("express");
const rentalController = require("../controllers/rental.controller");
const rentalValidation = require("../validations/rental.validation");
const validate = require("../middlewares/validate.middleware");
const { optionalAuth, requireAuth } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

const router = express.Router();

// Camera catalog (Public)
router.get("/cameras", rentalController.getAllCameras);
router.get("/cameras/:id", rentalController.getCameraById);

// Admin & Staff camera management
router.post(
  "/cameras",
  requireAuth,
  checkRole(["admin", "staff"]),
  validate(rentalValidation.createCamera),
  rentalController.createCamera
);

// Customer booking
router.post(
  "/bookings",
  optionalAuth,
  validate(rentalValidation.createBooking),
  rentalController.createBooking
);

router.get("/my-bookings", requireAuth, rentalController.getMyBookings);

router.patch(
  "/bookings/:id/cancel",
  requireAuth,
  validate(rentalValidation.cancelBooking),
  rentalController.cancelBooking
);

// Admin & Staff booking management
router.get(
  "/bookings",
  requireAuth,
  checkRole(["admin", "staff"]),
  rentalController.getAllBookings
);

router.patch(
  "/bookings/:id/status",
  requireAuth,
  checkRole(["admin", "staff"]),
  validate(rentalValidation.updateBookingStatus),
  rentalController.updateBookingStatus
);

module.exports = router;


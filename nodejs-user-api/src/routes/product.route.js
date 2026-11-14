const express = require("express");
const productController = require("../controllers/product.controller");
const productValidation = require("../validations/product.validation");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");
const { checkRole } = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", validate(productValidation.getProducts), productController.getAll);
router.get("/:id", validate(productValidation.getProductById), productController.getById);

// Staff & Admin: Create and Edit products
router.post(
  "/",
  requireAuth,
  checkRole(["admin", "staff"]),
  validate(productValidation.createProduct),
  productController.create
);

router.put(
  "/:id",
  requireAuth,
  checkRole(["admin", "staff"]),
  validate(productValidation.updateProduct),
  productController.update
);

router.patch(
  "/:id",
  requireAuth,
  checkRole(["admin", "staff"]),
  validate(productValidation.updateProduct),
  productController.update
);

// Admin ONLY: Delete product (Staff is strictly forbidden from deleting)
router.delete(
  "/:id",
  requireAuth,
  checkRole(["admin"]),
  validate(productValidation.deleteProduct),
  productController.remove
);

module.exports = router;



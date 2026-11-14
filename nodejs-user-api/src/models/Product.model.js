const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên sản phẩm"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["laptop", "phone", "audio", "camera", "accessory"],
      default: "accessory",
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Vui lòng nhập giá sản phẩm"],
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    image: {
      type: String,
      required: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = ProductModel;

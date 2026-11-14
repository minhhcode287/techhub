const mongoose = require("mongoose");

const rentalCameraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Vui lòng nhập tên máy ảnh"],
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      enum: ["Sony", "Canon", "Fujifilm", "Nikon", "Blackmagic", "DJI"],
    },
    sensorType: {
      type: String,
      required: true,
      default: "Full-Frame",
    },
    maxResolution: {
      type: String,
      required: true,
      default: "4K 60p",
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    weeklyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      default: 3,
      min: 0,
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 3,
      min: 1,
    },
    description: {
      type: String,
      required: true,
    },
    includedAccessories: {
      type: [String],
      default: [
        "2 Pin zin",
        "Sạc đôi",
        "Thẻ nhớ 128GB SanDisk Extreme Pro",
        "Túi đựng chuyên dụng",
      ],
    },
    image: {
      type: String,
      required: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["available", "rented_out", "maintenance"],
      default: "available",
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const RentalCameraModel =
  mongoose.models.RentalCamera ||
  mongoose.model("RentalCamera", rentalCameraSchema);

module.exports = RentalCameraModel;

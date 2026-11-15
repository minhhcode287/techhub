const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Vui lòng nhập mã giảm giá"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: [true, "Vui lòng chọn loại giảm giá (percent hoặc fixed)"],
      default: "fixed",
    },
    discountValue: {
      type: Number,
      required: [true, "Vui lòng nhập giá trị giảm"],
      min: [1, "Giá trị giảm phải lớn hơn 0"],
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 100,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: [true, "Vui lòng chọn ngày hết hạn"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const VoucherModel =
  mongoose.models.Voucher || mongoose.model("Voucher", voucherSchema);

module.exports = VoucherModel;

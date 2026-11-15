const mongoose = require("mongoose");

const paymentSessionSchema = new mongoose.Schema(
  {
    transactionCode: {
      type: String,
      required: [true, "Mã đối soát giao dịch là bắt buộc"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    expectedAmount: {
      type: Number,
      required: [true, "Số tiền thanh toán là bắt buộc"],
      min: [0, "Số tiền thanh toán không được âm"],
    },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "EXPIRED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["banking", "momo", "qr"],
      default: "banking",
    },
    bankRef: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    qrUrl: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const PaymentSessionModel =
  mongoose.models.PaymentSession ||
  mongoose.model("PaymentSession", paymentSessionSchema);

module.exports = PaymentSessionModel;

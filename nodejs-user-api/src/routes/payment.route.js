const express = require("express");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

// Tạo phiên thanh toán mới (Nhận amount, sinh transactionCode, trả về VietQR url)
router.post("/create-session", paymentController.createSession);

// Polling kiểm tra trạng thái thanh toán theo thời gian thực (Frontend gọi mỗi 2s)
router.get("/status/:transactionCode", paymentController.getStatus);

// Webhook biến động số dư từ Casso, SePay, Ngân hàng hoặc Test Simulator
router.post("/webhook", paymentController.webhook);

module.exports = router;

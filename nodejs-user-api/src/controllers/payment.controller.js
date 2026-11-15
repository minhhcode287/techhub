const paymentService = require("../services/payment.service");

/**
 * POST /api/payments/create-session
 * Tạo phiên thanh toán mới kèm link VietQR và mã đối soát THxxxxxx
 */
const createSession = async (req, res, next) => {
  try {
    const { amount, method, metadata } = req.body;
    const session = await paymentService.createSession({
      amount,
      method,
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo phiên thanh toán thành công",
      data: session,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/payments/status/:transactionCode
 * Polling kiểm tra trạng thái thanh toán theo thời gian thực
 */
const getStatus = async (req, res, next) => {
  try {
    const { transactionCode } = req.params;
    const statusData = await paymentService.getSessionStatus(transactionCode);

    return res.status(200).json({
      success: true,
      data: statusData,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/payments/webhook
 * Tiếp nhận biến động số dư từ Casso, SePay, VietQR hoặc Test Simulator
 */
const webhook = async (req, res, next) => {
  try {
    const payload = req.body;
    const result = await paymentService.handleWebhook(payload);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSession,
  getStatus,
  webhook,
};

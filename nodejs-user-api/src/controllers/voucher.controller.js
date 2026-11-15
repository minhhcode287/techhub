const voucherService = require("../services/voucher.service");

const getActiveVouchers = async (req, res, next) => {
  try {
    const vouchers = await voucherService.getActiveVouchers();
    return res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const validateVoucher = async (req, res, next) => {
  try {
    const { code, orderTotal } = req.body;
    const result = await voucherService.validateVoucher(code, Number(orderTotal) || 0);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: {
          isValid: false,
          discountAmount: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        isValid: true,
        discountAmount: result.discountAmount,
        voucher: result.voucher,
      },
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllVouchers = async (req, res, next) => {
  try {
    const vouchers = await voucherService.getAllVouchers();
    return res.status(200).json({
      success: true,
      count: vouchers.length,
      data: vouchers,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createVoucher = async (req, res, next) => {
  try {
    const voucher = await voucherService.createVoucher(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo mã giảm giá thành công",
      data: voucher,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.updateVoucher(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: voucher,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.deleteVoucher(id);
    return res.status(200).json({
      success: true,
      message: "Xóa mã giảm giá thành công",
      data: voucher,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getActiveVouchers,
  validateVoucher,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};

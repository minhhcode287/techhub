const staffService = require("../services/staff.service");

const getOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const orders = await staffService.getStaffOrders({ status, search });
    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái đơn hàng mới",
      });
    }
    const order = await staffService.updateOrderStatus(id, status);
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await staffService.getStaffStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getOrders,
  updateOrderStatus,
  getStats,
};

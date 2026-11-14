const orderService = require("../services/order.service");

const createOrder = async (req, res, next) => {
  try {
    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      paymentMethod,
      notes,
    } = req.body;

    const userId = req.user?.id || req.user?.userId || "guest-user-" + Date.now();
    const finalEmail = req.user?.email || customerEmail;
    const finalName = req.user?.name || customerName;

    if (!items || items.length === 0 || !shippingAddress || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp danh sách sản phẩm, số điện thoại và địa chỉ giao hàng",
      });
    }

    const order = await orderService.createOrder({
      userId,
      customerName: finalName || "Khách hàng",
      customerEmail: finalEmail || "customer@techhub.vn",
      customerPhone,
      shippingAddress,
      items,
      paymentMethod,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Đặt hàng thành công",
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

const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || "demo-user-1";
    const orders = await orderService.getOrdersByUser(userId);
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

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    const isStaffOrAdmin = user && (user.role === "admin" || user.role === "staff");
    const isOwner = user && (order.userId === user.id || order.userId === user._id || order.customerEmail === user.email);

    if (!isStaffOrAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem thông tin đơn hàng này",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAllOrders();
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
    const order = await orderService.updateOrderStatus(id, status);
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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};


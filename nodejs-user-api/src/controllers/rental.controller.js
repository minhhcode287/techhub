const rentalService = require("../services/rental.service");

const getAllCameras = async (req, res, next) => {
  try {
    const { brand } = req.query;
    const cameras = await rentalService.getAllCameras(brand);
    return res.status(200).json({
      success: true,
      count: cameras.length,
      data: cameras,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCameraById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const camera = await rentalService.getCameraById(id);
    return res.status(200).json({
      success: true,
      data: camera,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const createBooking = async (req, res, next) => {
  try {
    const {
      cameraId,
      startDate,
      endDate,
      idCardNumber,
      notes,
      userName,
      userEmail,
      userPhone,
    } = req.body;

    const userId = req.user?.id || req.user?.userId || "guest-user-" + Date.now();
    const finalEmail = req.user?.email || userEmail || "customer@techhub.vn";
    const finalName = req.user?.name || userName || "Khách hàng";
    const finalPhone = userPhone || "0987654321";

    if (!cameraId || !startDate || !endDate || !idCardNumber) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ: thiết bị máy ảnh, ngày bắt đầu, ngày kết thúc và số CCCD/CMND",
      });
    }

    const booking = await rentalService.createBooking({
      userId,
      userEmail: finalEmail,
      userName: finalName,
      userPhone: finalPhone,
      cameraId,
      startDate,
      endDate,
      idCardNumber,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Đặt thuê máy ảnh thành công",
      data: booking,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || "demo-user-1";
    const bookings = await rentalService.getBookingsByUser(userId);
    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?.userId || "demo-user-1";
    const booking = await rentalService.cancelBooking(id, userId);
    return res.status(200).json({
      success: true,
      message: "Hủy lịch thuê thành công",
      data: booking,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createCamera = async (req, res, next) => {
  try {
    const camera = await rentalService.createCamera(req.body);
    return res.status(201).json({
      success: true,
      message: "Thêm thiết bị máy ảnh thành công",
      data: camera,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await rentalService.getAllBookings();
    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp trạng thái thuê mới",
      });
    }
    const booking = await rentalService.updateBookingStatus(id, status);
    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn thuê thành công",
      data: booking,
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
  getAllCameras,
  getCameraById,
  createCamera,
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
};


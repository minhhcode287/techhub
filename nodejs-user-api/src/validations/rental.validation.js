const Joi = require("joi");

const createBooking = {
  body: Joi.object().keys({
    cameraId: Joi.string().required().messages({
      "any.required": "Mã thiết bị máy ảnh là bắt buộc",
    }),
    startDate: Joi.string().required().messages({
      "any.required": "Ngày bắt đầu thuê là bắt buộc",
    }),
    endDate: Joi.string().required().messages({
      "any.required": "Ngày trả máy là bắt buộc",
    }),
    idCardNumber: Joi.string()
      .trim()
      .pattern(/^[0-9A-Za-z]{9,15}$/)
      .required()
      .messages({
        "string.pattern.base": "Số CCCD/Hộ chiếu không hợp lệ (từ 9-15 ký tự)",
        "string.empty": "Số CCCD/Hộ chiếu không được để trống",
        "any.required": "Vui lòng nhập số CCCD/Hộ chiếu để làm thủ tục thuê",
      }),
    userName: Joi.string().trim().min(2).max(100).allow("", null).optional(),
    userEmail: Joi.string().trim().email().allow("", null).optional(),
    userPhone: Joi.string().trim().pattern(/^[0-9+]{9,15}$/).allow("", null).optional(),
    notes: Joi.string().trim().max(500).allow("", null).optional(),
  }),
};

const updateBookingStatus = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã đặt cọc/thuê là bắt buộc",
    }),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid("pending", "confirmed", "active", "completed", "cancelled")
      .required()
      .messages({
        "any.only": "Trạng thái phải là: pending, confirmed, active, completed hoặc cancelled",
        "any.required": "Vui lòng chọn trạng thái mới",
      }),
  }),
};

const cancelBooking = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã đặt cọc/thuê là bắt buộc",
    }),
  }),
};

const createCamera = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(150).required().messages({
      "any.required": "Tên máy ảnh là bắt buộc",
    }),
    brand: Joi.string().trim().required().messages({
      "any.required": "Thương hiệu là bắt buộc",
    }),
    sensorType: Joi.string().trim().required().messages({
      "any.required": "Loại cảm biến là bắt buộc",
    }),
    maxResolution: Joi.string().trim().required().messages({
      "any.required": "Độ phân giải tối đa là bắt buộc",
    }),
    dailyRate: Joi.number().min(0).required().messages({
      "number.min": "Giá thuê ngày không được âm",
      "any.required": "Giá thuê ngày là bắt buộc",
    }),
    weeklyRate: Joi.number().min(0).allow(null).optional(),
    depositAmount: Joi.number().min(0).required().messages({
      "number.min": "Tiền cọc không được âm",
      "any.required": "Tiền cọc là bắt buộc",
    }),
    availableQuantity: Joi.number().integer().min(0).default(1),
    totalQuantity: Joi.number().integer().min(1).default(1),
    description: Joi.string().trim().max(2000).allow("", null).optional(),
    includedAccessories: Joi.array().items(Joi.string()).optional(),
    image: Joi.string().allow("", null).optional(),
    status: Joi.string().valid("available", "rented_out", "maintenance").default("available"),
    isPopular: Joi.boolean().optional(),
  }),
};

module.exports = {
  createBooking,
  updateBookingStatus,
  cancelBooking,
  createCamera,
};

const Joi = require("joi");

const createOrder = {
  body: Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object().keys({
          productId: Joi.string().required().messages({
            "any.required": "Mã sản phẩm là bắt buộc",
          }),
          name: Joi.string().trim().required().messages({
            "any.required": "Tên sản phẩm là bắt buộc",
          }),
          price: Joi.number().min(0).required().messages({
            "number.min": "Giá sản phẩm không được âm",
            "any.required": "Giá sản phẩm là bắt buộc",
          }),
          quantity: Joi.number().integer().min(1).max(100).required().messages({
            "number.min": "Số lượng tối thiểu là 1",
            "number.max": "Số lượng tối đa mỗi mặt hàng là 100",
            "any.required": "Số lượng là bắt buộc",
          }),
          image: Joi.string().allow("", null).optional(),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.min": "Giỏ hàng phải có ít nhất 1 sản phẩm",
        "any.required": "Danh sách sản phẩm không được để trống",
      }),
    customerName: Joi.string().trim().min(2).max(100).required().messages({
      "string.empty": "Họ và tên người nhận không được để trống",
      "string.min": "Họ và tên phải có ít nhất 2 ký tự",
      "any.required": "Vui lòng nhập họ và tên người nhận",
    }),
    customerEmail: Joi.string().trim().email().required().messages({
      "string.email": "Email người nhận không đúng định dạng",
      "string.empty": "Email người nhận không được để trống",
      "any.required": "Vui lòng nhập email người nhận",
    }),
    customerPhone: Joi.string()
      .trim()
      .pattern(/^[0-9+]{9,15}$/)
      .required()
      .messages({
        "string.pattern.base": "Số điện thoại không hợp lệ (từ 9-15 chữ số)",
        "string.empty": "Số điện thoại không được để trống",
        "any.required": "Vui lòng nhập số điện thoại người nhận",
      }),
    shippingAddress: Joi.string().trim().min(5).max(300).required().messages({
      "string.min": "Địa chỉ giao hàng phải từ 5 ký tự trở lên",
      "string.empty": "Địa chỉ giao hàng không được để trống",
      "any.required": "Vui lòng nhập địa chỉ nhận hàng",
    }),
    paymentMethod: Joi.string().valid("cod", "banking", "momo").default("cod"),
    voucherCode: Joi.string().trim().uppercase().allow("", null).optional(),
    pointsToUse: Joi.number().integer().min(0).default(0).optional(),
    notes: Joi.string().trim().max(500).allow("", null).optional(),
  }),
};

const updateOrderStatus = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã đơn hàng là bắt buộc",
    }),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid("processing", "shipped", "delivered", "cancelled")
      .required()
      .messages({
        "any.only": "Trạng thái đơn hàng phải là: processing, shipped, delivered hoặc cancelled",
        "any.required": "Vui lòng chọn trạng thái mới",
      }),
  }),
};

const getOrderById = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã đơn hàng là bắt buộc",
    }),
  }),
};

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderById,
};

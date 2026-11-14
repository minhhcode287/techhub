const Joi = require("joi");

const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid("customer", "staff", "admin", "user").optional(),
    search: Joi.string().allow("").optional(),
    isActive: Joi.boolean().optional(),
    sort: Joi.string().optional(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "User ID là bắt buộc",
    }),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(100).optional(),
      phone: Joi.string().allow("", null).optional(),
      address: Joi.string().allow("", null).optional(),
      avatar: Joi.string().uri().allow("", null).optional(),
      isActive: Joi.boolean().optional(),
    })
    .min(1)
    .messages({
      "object.min": "Cần ít nhất một trường thông tin để cập nhật",
    }),
};

const changePassword = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Mật khẩu hiện tại không được để trống",
      "any.required": "Vui lòng nhập mật khẩu hiện tại",
    }),
    newPassword: Joi.string().min(6).max(128).required().messages({
      "string.min": "Mật khẩu mới phải từ 6 ký tự trở lên",
      "string.empty": "Mật khẩu mới không được để trống",
      "any.required": "Vui lòng nhập mật khẩu mới",
    }),
  }),
};

const changeRole = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    role: Joi.string().valid("customer", "staff", "admin", "user").required().messages({
      "any.only": "Role chỉ có thể là customer, staff hoặc admin",
      "any.required": "Vui lòng chỉ định role mới",
    }),
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  changePassword,
  changeRole,
  deleteUser,
};

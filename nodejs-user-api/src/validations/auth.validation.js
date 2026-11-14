const Joi = require("joi");

const register = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100).required().messages({
      "string.empty": "Họ và tên không được để trống",
      "string.min": "Họ và tên phải có ít nhất 2 ký tự",
      "any.required": "Vui lòng nhập họ và tên",
    }),
    email: Joi.string().trim().email().required().messages({
      "string.email": "Email không đúng định dạng",
      "string.empty": "Email không được để trống",
      "any.required": "Vui lòng nhập email",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "Mật khẩu phải từ 6 ký tự trở lên",
      "string.empty": "Mật khẩu không được để trống",
      "any.required": "Vui lòng nhập mật khẩu",
    }),
    phone: Joi.string().allow("", null).optional(),
    address: Joi.string().allow("", null).optional(),
    avatar: Joi.string().uri().allow("", null).optional(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      "string.email": "Email không đúng định dạng",
      "string.empty": "Email không được để trống",
      "any.required": "Vui lòng nhập email",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Mật khẩu không được để trống",
      "any.required": "Vui lòng nhập mật khẩu",
    }),
  }),
};

const refreshToken = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required().messages({
      "string.empty": "Refresh token không được để trống",
      "any.required": "Vui lòng cung cấp refresh token",
    }),
  }),
};

module.exports = {
  register,
  login,
  refreshToken,
};

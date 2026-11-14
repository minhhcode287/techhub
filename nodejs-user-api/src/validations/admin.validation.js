const Joi = require("joi");

const createStaff = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100).required().messages({
      "string.min": "Họ và tên nhân viên phải từ 2 ký tự trở lên",
      "any.required": "Họ và tên nhân viên là bắt buộc",
    }),
    email: Joi.string().trim().email().required().messages({
      "string.email": "Email nhân viên không đúng định dạng",
      "any.required": "Email nhân viên là bắt buộc",
    }),
    password: Joi.string().min(6).max(128).optional().messages({
      "string.min": "Mật khẩu khởi tạo phải từ 6 ký tự trở lên",
    }),
    phone: Joi.string().trim().allow("", null).optional(),
    address: Joi.string().trim().allow("", null).optional(),
  }),
};

const toggleStaffStatus = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "ID nhân viên là bắt buộc",
    }),
  }),
  body: Joi.object().keys({
    isActive: Joi.boolean().required().messages({
      "any.required": "Trạng thái kích hoạt (isActive) là bắt buộc",
    }),
  }),
};

const deleteStaff = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "ID nhân viên là bắt buộc",
    }),
  }),
};

const getRevenue = {
  query: Joi.object().keys({
    period: Joi.string().valid("today", "7days", "30days", "all").optional(),
    type: Joi.string().valid("all", "retail", "rental").optional(),
  }),
};

module.exports = {
  createStaff,
  toggleStaffStatus,
  deleteStaff,
  getRevenue,
};

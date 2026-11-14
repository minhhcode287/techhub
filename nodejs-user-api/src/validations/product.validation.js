const Joi = require("joi");

const getProducts = {
  query: Joi.object().keys({
    category: Joi.string().trim().allow("").optional(),
    brand: Joi.string().trim().allow("").optional(),
    search: Joi.string().trim().allow("").optional(),
    sort: Joi.string().trim().allow("").optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

const getProductById = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã sản phẩm là bắt buộc",
    }),
  }),
};

const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(150).required().messages({
      "string.min": "Tên sản phẩm phải có ít nhất 2 ký tự",
      "any.required": "Tên sản phẩm là bắt buộc",
    }),
    category: Joi.string()
      .valid("laptop", "phone", "audio", "camera", "accessory")
      .required()
      .messages({
        "any.only": "Danh mục phải là: laptop, phone, audio, camera, accessory",
        "any.required": "Danh mục sản phẩm là bắt buộc",
      }),
    brand: Joi.string().trim().required().messages({
      "any.required": "Thương hiệu sản phẩm là bắt buộc",
    }),
    price: Joi.number().min(0).required().messages({
      "number.min": "Giá sản phẩm không được nhỏ hơn 0",
      "any.required": "Giá sản phẩm là bắt buộc",
    }),
    originalPrice: Joi.number().min(0).allow(null).optional(),
    stock: Joi.number().integer().min(0).default(0),
    description: Joi.string().trim().max(3000).allow("", null).optional(),
    specs: Joi.object().optional(),
    image: Joi.string().allow("", null).optional(),
    gallery: Joi.array().items(Joi.string()).optional(),
    isFeatured: Joi.boolean().optional(),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã sản phẩm là bắt buộc",
    }),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().trim().min(2).max(150).optional(),
      category: Joi.string()
        .valid("laptop", "phone", "audio", "camera", "accessory")
        .optional(),
      brand: Joi.string().trim().optional(),
      price: Joi.number().min(0).optional(),
      originalPrice: Joi.number().min(0).allow(null).optional(),
      stock: Joi.number().integer().min(0).optional(),
      description: Joi.string().trim().max(3000).allow("", null).optional(),
      specs: Joi.object().optional(),
      image: Joi.string().allow("", null).optional(),
      gallery: Joi.array().items(Joi.string()).optional(),
      isFeatured: Joi.boolean().optional(),
    })
    .min(1)
    .messages({
      "object.min": "Cần ít nhất một trường thông tin để cập nhật",
    }),
};

const deleteProduct = {
  params: Joi.object().keys({
    id: Joi.string().required().messages({
      "any.required": "Mã sản phẩm là bắt buộc",
    }),
  }),
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

const productService = require("../services/product.service");

const getAll = async (req, res, next) => {
  try {
    const { category, brand, search, sort } = req.query;
    console.log(`[API Products] Nhận yêu cầu GET /api/products | Filters: category=${category || "all"}, brand=${brand || "all"}, search="${search || ""}", sort=${sort || "default"}`);
    
    const products = await productService.getAllProducts({
      category,
      brand,
      search,
      sort,
    });

    console.log(`[API Products] Trả về thành công ${products.length} sản phẩm.`);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("[API Products] Lỗi khi lấy danh sách sản phẩm:", error);
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await productService.updateProduct(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin sản phẩm thành công",
      data: updated,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
      data: result,
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
  getAll,
  getById,
  create,
  update,
  remove,
};


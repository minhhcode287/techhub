const Product = require("../models/Product.model");
const { initialProducts } = require("./seed.service");
const { getDBStatus } = require("../config/database");

let inMemoryProducts = initialProducts.map((p, idx) => ({
  ...p,
  _id: "prod-" + (idx + 1),
  id: "prod-" + (idx + 1),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const seedIfEmpty = async () => {
  const { seedProducts } = require("./seed.service");
  try {
    await seedProducts({ force: false });
  } catch (err) {
    console.warn("[ProductService] Seed error:", err.message);
  }
};

const getAllProducts = async ({ category, brand, search, sort } = {}) => {
  const dbStatus = getDBStatus();

  // Normalize category: Ignore "all", "tat-ca", "tất cả", empty or null
  const cleanCat =
    category &&
    category.trim() !== "" &&
    category.toLowerCase() !== "all" &&
    category.toLowerCase() !== "tat-ca" &&
    category.toLowerCase() !== "tất cả"
      ? category.trim().toLowerCase()
      : null;

  const cleanBrand =
    brand &&
    brand.trim() !== "" &&
    brand.toLowerCase() !== "all" &&
    brand.toLowerCase() !== "tất cả"
      ? brand.trim()
      : null;

  if (dbStatus.connected) {
    try {
      // Auto seed if database has 0 products
      const count = await Product.countDocuments();
      if (count === 0) {
        await seedIfEmpty();
      }

      const query = {};
      if (cleanCat) {
        query.category = new RegExp(`^${cleanCat}$`, "i");
      }
      if (cleanBrand) {
        query.brand = new RegExp(cleanBrand, "i");
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        query.$or = [
          { name: regex },
          { description: regex },
          { brand: regex },
          { category: regex },
        ];
      }

      let sortOption = { createdAt: -1 };
      if (sort === "price-asc") sortOption = { price: 1 };
      if (sort === "price-desc") sortOption = { price: -1 };
      if (sort === "rating") sortOption = { rating: -1 };

      const products = await Product.find(query).sort(sortOption);
      return products;
    } catch (err) {
      console.warn("[ProductService] Fallback to in-memory store due to DB error:", err.message);
    }
  }

  // Memory fallback store
  let results = [...inMemoryProducts];
  if (cleanCat) {
    results = results.filter((p) => p.category.toLowerCase() === cleanCat);
  }
  if (cleanBrand) {
    results = results.filter((p) => p.brand.toLowerCase() === cleanBrand.toLowerCase());
  }
  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }
  if (sort === "price-asc") {
    results.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    results.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    results.sort((a, b) => b.rating - a.rating);
  }

  return results;
};

const getProductById = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const product = await Product.findOne({
        $or: [{ _id: id }, { slug: id }],
      });
      if (product) return product;
    } catch (err) {
      // Ignored for fallback
    }
  }

  const found = inMemoryProducts.find((p) => p._id === id || p.id === id || p.slug === id);
  if (!found) {
    throw new Error("Không tìm thấy sản phẩm");
  }
  return found;
};

const createProduct = async (data) => {
  const dbStatus = getDBStatus();

  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  if (dbStatus.connected) {
    try {
      const product = await Product.create({ ...data, slug });
      return product;
    } catch (err) {
      console.warn("[ProductService] DB create failed, saving to in-memory store:", err.message);
    }
  }

  const newProd = {
    ...data,
    slug,
    _id: "prod-" + Date.now(),
    id: "prod-" + Date.now(),
    rating: 5.0,
    reviewsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemoryProducts.unshift(newProd);
  return newProd;
};

const updateProduct = async (id, data) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const updated = await Product.findOneAndUpdate(
        { $or: [{ _id: id }, { slug: id }] },
        { ...data, updatedAt: new Date() },
        { new: true }
      );
      if (updated) return updated;
    } catch (err) {
      console.warn("[ProductService] DB update failed, falling back to memory:", err.message);
    }
  }

  const index = inMemoryProducts.findIndex((p) => p._id === id || p.id === id || p.slug === id);
  if (index === -1) {
    throw new Error("Không tìm thấy sản phẩm để cập nhật");
  }

  inMemoryProducts[index] = {
    ...inMemoryProducts[index],
    ...data,
    updatedAt: new Date(),
  };
  return inMemoryProducts[index];
};

const deleteProduct = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const deleted = await Product.findOneAndDelete({
        $or: [{ _id: id }, { slug: id }],
      });
      if (deleted) return { success: true, message: "Đã xóa sản phẩm thành công", id };
    } catch (err) {
      console.warn("[ProductService] DB delete failed, falling back to memory:", err.message);
    }
  }

  const index = inMemoryProducts.findIndex((p) => p._id === id || p.id === id || p.slug === id);
  if (index === -1) {
    throw new Error("Không tìm thấy sản phẩm để xóa");
  }

  const removed = inMemoryProducts.splice(index, 1)[0];
  return { success: true, message: "Đã xóa sản phẩm thành công", id: removed._id || removed.id };
};

const productService = {
  seedIfEmpty,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};

module.exports = productService;


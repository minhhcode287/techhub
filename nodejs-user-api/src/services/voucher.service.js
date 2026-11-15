const Voucher = require("../models/Voucher.model");
const { initialVouchers, seedVouchersIfEmpty } = require("./seed.service");
const { getDBStatus } = require("../config/database");

let inMemoryVouchers = Array.isArray(initialVouchers)
  ? initialVouchers.map((v, idx) => ({
      _id: "vouch-" + (idx + 1),
      id: "vouch-" + (idx + 1),
      ...v,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  : [];

const seedIfEmpty = async () => {
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    await seedVouchersIfEmpty();
  }
};

/**
 * Get active vouchers for customer selection
 */
const getActiveVouchers = async () => {
  const now = new Date();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const vouchers = await Voucher.find({
        isActive: true,
        expiryDate: { $gte: now },
        $expr: { $lt: ["$usedCount", "$usageLimit"] },
      }).sort({ createdAt: -1 });

      if (vouchers && vouchers.length > 0) return vouchers;
    } catch (err) {
      console.warn("[VoucherService] DB error on getActiveVouchers:", err.message);
    }
  }

  return inMemoryVouchers.filter(
    (v) =>
      v.isActive &&
      new Date(v.expiryDate) >= now &&
      v.usedCount < v.usageLimit
  );
};

/**
 * Validate voucher code and compute discount
 */
const validateVoucher = async (code, orderTotal = 0) => {
  if (!code || typeof code !== "string" || !code.trim()) {
    return { isValid: false, message: "Vui lòng nhập mã giảm giá", discountAmount: 0 };
  }

  const cleanCode = code.trim().toUpperCase();
  const now = new Date();
  const dbStatus = getDBStatus();
  let voucher = null;

  if (dbStatus.connected) {
    try {
      voucher = await Voucher.findOne({ code: cleanCode });
    } catch (err) {
      console.warn("[VoucherService] DB error on validateVoucher:", err.message);
    }
  }

  if (!voucher) {
    voucher = inMemoryVouchers.find((v) => v.code.toUpperCase() === cleanCode);
  }

  if (!voucher) {
    return {
      isValid: false,
      message: `Mã giảm giá "${cleanCode}" không tồn tại trong hệ thống`,
      discountAmount: 0,
    };
  }

  if (!voucher.isActive) {
    return {
      isValid: false,
      message: `Mã giảm giá "${cleanCode}" hiện đang tạm ngưng sử dụng`,
      discountAmount: 0,
    };
  }

  if (new Date(voucher.expiryDate) < now) {
    return {
      isValid: false,
      message: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng`,
      discountAmount: 0,
    };
  }

  if (voucher.usedCount >= voucher.usageLimit) {
    return {
      isValid: false,
      message: `Mã giảm giá "${cleanCode}" đã đạt giới hạn lượt sử dụng`,
      discountAmount: 0,
    };
  }

  const minOrder = Number(voucher.minOrderValue) || 0;
  if (orderTotal < minOrder) {
    const formattedMin = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(minOrder);

    return {
      isValid: false,
      message: `Mã "${cleanCode}" chỉ áp dụng cho đơn hàng từ ${formattedMin} trở lên`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  if (voucher.discountType === "percent") {
    discountAmount = Math.round(orderTotal * (Number(voucher.discountValue) / 100));
    if (voucher.maxDiscount && voucher.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
    }
  } else {
    discountAmount = Number(voucher.discountValue) || 0;
  }

  discountAmount = Math.min(discountAmount, orderTotal);

  return {
    isValid: true,
    message: `Áp dụng mã ${cleanCode} thành công`,
    discountAmount,
    voucher: typeof voucher.toObject === "function" ? voucher.toObject() : voucher,
  };
};

/**
 * Record voucher usage (+1 usedCount)
 */
const recordVoucherUsage = async (code) => {
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      await Voucher.findOneAndUpdate(
        { code: cleanCode },
        { $inc: { usedCount: 1 } }
      );
    } catch (err) {
      console.warn("[VoucherService] DB error on recordVoucherUsage:", err.message);
    }
  }

  const memVoucher = inMemoryVouchers.find((v) => v.code.toUpperCase() === cleanCode);
  if (memVoucher) {
    memVoucher.usedCount = (memVoucher.usedCount || 0) + 1;
  }
};

/**
 * Rollback voucher usage (-1 usedCount, min 0) upon order cancellation
 */
const rollbackVoucherUsage = async (code) => {
  if (!code) return;
  const cleanCode = code.trim().toUpperCase();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const v = await Voucher.findOne({ code: cleanCode });
      if (v && v.usedCount > 0) {
        v.usedCount -= 1;
        await v.save();
      }
    } catch (err) {
      console.warn("[VoucherService] DB error on rollbackVoucherUsage:", err.message);
    }
  }

  const memVoucher = inMemoryVouchers.find((v) => v.code.toUpperCase() === cleanCode);
  if (memVoucher && memVoucher.usedCount > 0) {
    memVoucher.usedCount -= 1;
  }
};

/**
 * Admin: Get all vouchers
 */
const getAllVouchers = async () => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const vouchers = await Voucher.find().sort({ createdAt: -1 });
      if (vouchers && vouchers.length > 0) return vouchers;
    } catch (err) {
      console.warn("[VoucherService] DB error on getAllVouchers:", err.message);
    }
  }

  return inMemoryVouchers;
};

/**
 * Admin: Create voucher
 */
const createVoucher = async (data) => {
  const cleanCode = (data.code || "").trim().toUpperCase();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const existing = await Voucher.findOne({ code: cleanCode });
      if (existing) {
        throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại`);
      }
      const newVoucher = await Voucher.create({
        ...data,
        code: cleanCode,
      });
      return newVoucher;
    } catch (err) {
      if (err.code === 11000) {
        throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại`);
      }
      throw err;
    }
  }

  const existing = inMemoryVouchers.find((v) => v.code.toUpperCase() === cleanCode);
  if (existing) {
    throw new Error(`Mã giảm giá "${cleanCode}" đã tồn tại`);
  }

  const newVoucher = {
    _id: "vouch-" + Date.now(),
    id: "vouch-" + Date.now(),
    ...data,
    code: cleanCode,
    usedCount: 0,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemoryVouchers.unshift(newVoucher);
  return newVoucher;
};

/**
 * Admin: Update voucher
 */
const updateVoucher = async (id, data) => {
  const dbStatus = getDBStatus();
  if (data.code) {
    data.code = data.code.trim().toUpperCase();
  }

  if (dbStatus.connected) {
    try {
      const updated = await Voucher.findByIdAndUpdate(id, data, { new: true });
      if (updated) return updated;
    } catch (err) {
      console.warn("[VoucherService] DB error on updateVoucher:", err.message);
    }
  }

  const index = inMemoryVouchers.findIndex((v) => v._id === id || v.id === id);
  if (index === -1) {
    throw new Error("Không tìm thấy mã giảm giá để cập nhật");
  }

  inMemoryVouchers[index] = {
    ...inMemoryVouchers[index],
    ...data,
    updatedAt: new Date(),
  };
  return inMemoryVouchers[index];
};

/**
 * Admin: Delete voucher
 */
const deleteVoucher = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const deleted = await Voucher.findByIdAndDelete(id);
      if (deleted) return deleted;
    } catch (err) {
      console.warn("[VoucherService] DB error on deleteVoucher:", err.message);
    }
  }

  const index = inMemoryVouchers.findIndex((v) => v._id === id || v.id === id);
  if (index === -1) {
    throw new Error("Không tìm thấy mã giảm giá để xóa");
  }

  const deleted = inMemoryVouchers.splice(index, 1);
  return deleted[0];
};

module.exports = {
  seedIfEmpty,
  getActiveVouchers,
  validateVoucher,
  recordVoucherUsage,
  rollbackVoucherUsage,
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
};

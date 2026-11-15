const Order = require("../models/Order.model");
const User = require("../models/user.model");
const { inMemoryUsers } = require("./auth.service");
const voucherService = require("./voucher.service");
const { getDBStatus } = require("../config/database");

let inMemoryOrders = [
  {
    _id: "order-demo-1",
    id: "order-demo-1",
    userId: "demo-user-1",
    customerName: "Nguyen Van A",
    customerEmail: "demo@techhub.vn",
    customerPhone: "0901234567",
    shippingAddress: "70 To Ky, Quan 12, TP.HCM",
    items: [
      {
        productId: "prod-3",
        name: "iPhone 16 Pro Max 256GB",
        price: 34490000,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80",
      },
    ],
    subtotal: 34490000,
    shippingFee: 0,
    voucherCode: "",
    voucherDiscount: 0,
    pointsUsed: 0,
    pointsDiscount: 0,
    pointsEarned: 344,
    totalAmount: 34490000,
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "processing",
    notes: "Giao hàng giờ hành chính",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Determine membership tier based on points
 */
const calculateTier = (points = 0) => {
  if (points >= 2500) return "Platinum";
  if (points >= 1000) return "Gold";
  return "Silver";
};

const createOrder = async (data) => {
  const subtotal = data.items.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  // Free ship for orders >= 2,000,000 VND
  const shippingFee = subtotal >= 2000000 ? 0 : 30000;

  // 1. Voucher Calculation
  let appliedVoucherCode = "";
  let voucherDiscount = 0;
  if (data.voucherCode && data.voucherCode.trim()) {
    const cleanCode = data.voucherCode.trim().toUpperCase();
    const vResult = await voucherService.validateVoucher(cleanCode, subtotal);
    if (!vResult.isValid) {
      throw new Error(vResult.message);
    }
    appliedVoucherCode = cleanCode;
    voucherDiscount = vResult.discountAmount || 0;
  }

  // 2. Loyalty Points Validation & Calculation
  const requestedPoints = Math.max(0, parseInt(data.pointsToUse, 10) || 0);
  let userPoints = 0;
  let userDoc = null;
  let memUser = null;
  const dbStatus = getDBStatus();

  const isRegisteredUser = data.userId && !String(data.userId).startsWith("guest-user-");

  if (isRegisteredUser) {
    if (dbStatus.connected) {
      try {
        userDoc = await User.findById(data.userId);
        if (!userDoc && data.customerEmail) {
          userDoc = await User.findOne({ email: data.customerEmail.toLowerCase().trim() });
        }
      } catch (e) {
        // ignore
      }
    }

    if (userDoc) {
      userPoints = Number(userDoc.points) || 0;
    } else {
      memUser = inMemoryUsers.find(
        (u) =>
          u._id === data.userId ||
          u.id === data.userId ||
          (data.customerEmail && u.email === data.customerEmail.toLowerCase().trim())
      );
      if (memUser) {
        userPoints = Number(memUser.points) || 0;
      }
    }
  }

  if (requestedPoints > 0 && !isRegisteredUser) {
    throw new Error("Vui lòng đăng nhập tài khoản để sử dụng điểm thưởng tích lũy");
  }

  if (requestedPoints > userPoints) {
    throw new Error(
      `Bạn hiện chỉ có ${userPoints} điểm tích lũy, không thể sử dụng ${requestedPoints} điểm`
    );
  }

  // Cap points discount so it doesn't exceed the amount remaining after voucher discount
  // 1 point = 10,000 VND
  const maxPointsDiscount = Math.max(0, subtotal - voucherDiscount);
  const maxPointsCanUse = Math.floor(maxPointsDiscount / 10000);
  const pointsUsed = Math.min(requestedPoints, maxPointsCanUse);
  const pointsDiscount = pointsUsed * 10000;

  // Final amount to pay
  const totalAmount = Math.max(0, subtotal - voucherDiscount - pointsDiscount) + shippingFee;

  // Points earned: 100,000 VND paid = 1 point
  const pointsEarned = Math.floor(totalAmount / 100000);

  // 3. Atomic update on user balance
  if (isRegisteredUser && (pointsUsed > 0 || pointsEarned > 0)) {
    const netChange = pointsEarned - pointsUsed;
    if (userDoc) {
      userDoc.points = Math.max(0, (userDoc.points || 0) + netChange);
      userDoc.membershipTier = calculateTier(userDoc.points);
      await userDoc.save();
    } else if (memUser) {
      memUser.points = Math.max(0, (memUser.points || 0) + netChange);
      memUser.membershipTier = calculateTier(memUser.points);
    }
  }

  // 4. Record voucher usage count
  if (appliedVoucherCode) {
    await voucherService.recordVoucherUsage(appliedVoucherCode);
  }

  const orderPayload = {
    ...data,
    subtotal,
    shippingFee,
    voucherCode: appliedVoucherCode,
    voucherDiscount,
    pointsUsed,
    pointsDiscount,
    pointsEarned,
    totalAmount,
    paymentStatus:
      data.paymentMethod === "banking" || data.paymentMethod === "momo"
        ? "paid"
        : "pending",
    orderStatus: "processing",
  };

  if (dbStatus.connected) {
    try {
      const order = await Order.create(orderPayload);
      return order;
    } catch (err) {
      console.warn("[OrderService] DB error on order creation, saving to in-memory store:", err.message);
    }
  }

  const memoryOrder = {
    _id: "order-" + Date.now(),
    id: "order-" + Date.now(),
    ...orderPayload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryOrders.unshift(memoryOrder);
  return memoryOrder;
};

const getOrdersByUser = async (userId) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const orders = await Order.find({
        $or: [{ userId }, { customerEmail: userId }],
      }).sort({ createdAt: -1 });
      if (orders && orders.length > 0) return orders;
    } catch (err) {
      // fallback
    }
  }

  return inMemoryOrders.filter((o) => o.userId === userId || o.customerEmail === userId);
};

const getOrderById = async (orderId) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const order = await Order.findById(orderId);
      if (order) return order;
    } catch (err) {
      // fallback
    }
  }

  const order = inMemoryOrders.find(
    (o) => o._id === orderId || o.id === orderId
  );

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  return order;
};

const getAllOrders = async () => {
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      if (orders && orders.length > 0) return orders;
    } catch (err) {
      // fallback
    }
  }
  return inMemoryOrders;
};

const updateOrderStatus = async (orderId, status) => {
  const dbStatus = getDBStatus();
  let existingOrder = null;

  if (dbStatus.connected) {
    try {
      existingOrder = await Order.findById(orderId);
    } catch (err) {
      // ignore
    }
  }

  if (!existingOrder) {
    existingOrder = inMemoryOrders.find((o) => o._id === orderId || o.id === orderId);
  }

  if (!existingOrder) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  const wasCancelled = (existingOrder.orderStatus || "").toLowerCase() === "cancelled";
  const willCancel = status.toLowerCase() === "cancelled";

  // Rollback points and voucher usage if cancelled
  if (!wasCancelled && willCancel) {
    // 1. Rollback Voucher usage
    if (existingOrder.voucherCode) {
      await voucherService.rollbackVoucherUsage(existingOrder.voucherCode);
    }

    // 2. Rollback Points: Refund used points, deduct earned points
    const pointsRefund = Number(existingOrder.pointsUsed) || 0;
    const pointsClawback = Number(existingOrder.pointsEarned) || 0;
    const netPointsRollback = pointsRefund - pointsClawback;

    if (existingOrder.userId) {
      if (dbStatus.connected) {
        try {
          const userDoc = await User.findById(existingOrder.userId);
          if (userDoc) {
            userDoc.points = Math.max(0, (userDoc.points || 0) + netPointsRollback);
            userDoc.membershipTier = calculateTier(userDoc.points);
            await userDoc.save();
          }
        } catch (e) {
          // ignore
        }
      }

      const memUser = inMemoryUsers.find(
        (u) => u._id === existingOrder.userId || u.id === existingOrder.userId
      );
      if (memUser) {
        memUser.points = Math.max(0, (memUser.points || 0) + netPointsRollback);
        memUser.membershipTier = calculateTier(memUser.points);
      }
    }
  }

  if (dbStatus.connected) {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        { orderStatus: status, updatedAt: new Date() },
        { new: true }
      );
      if (order) return order;
    } catch (err) {
      // fallback
    }
  }

  existingOrder.orderStatus = status;
  existingOrder.updatedAt = new Date();
  return existingOrder;
};

const orderService = {
  createOrder,
  getOrdersByUser,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};

module.exports = orderService;

const Order = require("../models/Order.model");
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
    totalAmount: 34490000,
    paymentMethod: "cod",
    paymentStatus: "pending",
    orderStatus: "processing",
    notes: "Giao hàng giờ hành chính",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const createOrder = async (data) => {
  const subtotal = data.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const shippingFee = subtotal > 10000000 ? 0 : 30000;
  const totalAmount = subtotal + shippingFee;

  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const order = await Order.create({
        ...data,
        subtotal,
        shippingFee,
        totalAmount,
        paymentStatus: data.paymentMethod === "banking" || data.paymentMethod === "momo" ? "paid" : "pending",
        orderStatus: "processing",
      });
      return order;
    } catch (err) {
      console.warn("[OrderService] DB error on order creation, saving to in-memory store:", err.message);
    }
  }

  const memoryOrder = {
    _id: "order-" + Date.now(),
    id: "order-" + Date.now(),
    ...data,
    subtotal,
    shippingFee,
    totalAmount,
    paymentStatus: data.paymentMethod === "banking" || data.paymentMethod === "momo" ? "paid" : "pending",
    orderStatus: "processing",
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

  const order = inMemoryOrders.find((o) => o._id === orderId || o.id === orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }
  order.orderStatus = status;
  order.updatedAt = new Date();
  return order;
};

const orderService = {
  createOrder,
  getOrdersByUser,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
};

module.exports = orderService;


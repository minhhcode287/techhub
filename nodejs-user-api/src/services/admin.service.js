const User = require("../models/user.model");
const { inMemoryUsers, sanitizeUser } = require("./auth.service");
const { hashPassword } = require("../utils/password");
const { getDBStatus } = require("../config/database");
const ApiError = require("../utils/ApiError");
const orderService = require("./order.service");
const productService = require("./product.service");
const rentalService = require("./rental.service");

/* -------------------------------------------------------------------------- */
/*                          1. PERSONNEL (STAFF & CUSTOMERS)                   */
/* -------------------------------------------------------------------------- */

const getStaffList = async () => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const staffMembers = await User.find({ role: "staff" }).sort({ createdAt: -1 });
      return staffMembers.map((u) => sanitizeUser(u));
    } catch (err) {
      console.warn("[AdminService] DB error on getStaffList:", err.message);
    }
  }

  return inMemoryUsers
    .filter((u) => u.role === "staff")
    .map((u) => sanitizeUser(u));
};

const createStaff = async ({ name, email, password = "Test@123", phone, address }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        throw ApiError.badRequest("Email này đã được sử dụng bởi tài khoản khác");
      }

      const staff = await User.create({
        name,
        email: normalizedEmail,
        password, // pre-save will hash
        role: "staff",
        phone: phone || "",
        address: address || "",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
        isActive: true,
        status: "active",
      });

      return sanitizeUser(staff);
    } catch (err) {
      if (err instanceof ApiError || err.statusCode) throw err;
      console.warn("[AdminService] DB error on createStaff, fallback to memory:", err.message);
    }
  }

  const existingMem = inMemoryUsers.find((u) => u.email === normalizedEmail);
  if (existingMem) {
    throw ApiError.badRequest("Email này đã được sử dụng bởi tài khoản khác");
  }

  const newStaff = {
    _id: "staff-" + Date.now(),
    id: "staff-" + Date.now(),
    name,
    email: normalizedEmail,
    password: await hashPassword(password),
    role: "staff",
    phone: phone || "",
    address: address || "",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    isActive: true,
    status: "active",
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryUsers.unshift(newStaff);
  return sanitizeUser(newStaff);
};

const deleteStaff = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const deleted = await User.findOneAndDelete({ _id: id, role: "staff" });
      if (deleted) {
        return { success: true, message: "Đã xóa tài khoản nhân viên thành công", id };
      }
    } catch (err) {
      console.warn("[AdminService] DB error on deleteStaff:", err.message);
    }
  }

  const index = inMemoryUsers.findIndex((u) => (u._id === id || u.id === id) && u.role === "staff");
  if (index === -1) {
    throw ApiError.notFound("Không tìm thấy nhân viên để xóa");
  }

  inMemoryUsers.splice(index, 1);
  return { success: true, message: "Đã xóa tài khoản nhân viên thành công", id };
};

const toggleStaffStatus = async (id, isActive) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const updated = await User.findOneAndUpdate(
        { _id: id, role: "staff" },
        {
          isActive: Boolean(isActive),
          status: isActive ? "active" : "inactive",
          updatedAt: new Date(),
        },
        { new: true }
      );
      if (updated) return sanitizeUser(updated);
    } catch (err) {
      console.warn("[AdminService] DB error on toggleStaffStatus:", err.message);
    }
  }

  const staff = inMemoryUsers.find((u) => (u._id === id || u.id === id) && u.role === "staff");
  if (!staff) {
    throw ApiError.notFound("Không tìm thấy nhân viên");
  }

  staff.isActive = Boolean(isActive);
  staff.status = isActive ? "active" : "inactive";
  staff.updatedAt = new Date();
  return sanitizeUser(staff);
};

const getCustomersList = async () => {
  const [orders, bookings] = await Promise.all([
    orderService.getAllOrders(),
    rentalService.getAllBookings(),
  ]);

  const dbStatus = getDBStatus();
  let rawCustomers = [];

  if (dbStatus.connected) {
    try {
      const dbUsers = await User.find({ role: { $in: ["customer", "user"] } }).sort({ createdAt: -1 });
      rawCustomers = dbUsers.map((u) => sanitizeUser(u));
    } catch (err) {
      console.warn("[AdminService] DB error on getCustomersList:", err.message);
    }
  }

  if (rawCustomers.length === 0) {
    rawCustomers = inMemoryUsers
      .filter((u) => u.role === "customer" || u.role === "user")
      .map((u) => sanitizeUser(u));
  }

  // Calculate purchase stats for each customer
  const customers = rawCustomers.map((cust) => {
    const custId = cust.id || cust._id;
    const custEmail = cust.email;

    const userOrders = orders.filter(
      (o) => (o.userId && o.userId === custId) || (o.customerEmail && o.customerEmail === custEmail)
    );
    const userBookings = bookings.filter(
      (b) => (b.userId && b.userId === custId) || (b.customerEmail && b.customerEmail === custEmail)
    );

    const totalSpentRetail = userOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalSpentRental = userBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    return {
      ...cust,
      ordersCount: userOrders.length,
      bookingsCount: userBookings.length,
      totalSpent: totalSpentRetail + totalSpentRental,
      totalSpentRetail,
      totalSpentRental,
    };
  });

  return customers;
};

/* -------------------------------------------------------------------------- */
/*                    2. INVENTORY & PRODUCT REPORT                           */
/* -------------------------------------------------------------------------- */

const getInventoryReport = async () => {
  const [products, cameras] = await Promise.all([
    productService.getAllProducts(),
    rentalService.getAllCameras(),
  ]);

  const totalRetailUnits = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const lowStockProducts = products.filter((p) => (Number(p.stock) || 0) <= 5 && (Number(p.stock) || 0) > 0);
  const outOfStockProducts = products.filter((p) => (Number(p.stock) || 0) <= 0);

  const totalCameraUnits = cameras.length;
  const availableCameras = cameras.filter((c) => c.status === "available" || !c.status).length;
  const rentedCameras = cameras.filter((c) => c.status === "rented").length;
  const maintenanceCameras = cameras.filter((c) => c.status === "maintenance").length;

  return {
    retailSummary: {
      totalProductsCount: products.length,
      totalStockUnits: totalRetailUnits,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockItems: lowStockProducts,
      outOfStockItems: outOfStockProducts,
    },
    rentalSummary: {
      totalCamerasCount: totalCameraUnits,
      availableCount: availableCameras,
      rentedCount: rentedCameras,
      maintenanceCount: maintenanceCameras,
      cameras,
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                    3. REVENUE & FINANCIAL REPORTS                          */
/* -------------------------------------------------------------------------- */

const getRevenueReport = async ({ period = "30days", type = "all" } = {}) => {
  const [orders, bookings] = await Promise.all([
    orderService.getAllOrders(),
    rentalService.getAllBookings(),
  ]);

  const now = new Date();
  let startDate = new Date();

  if (period === "day" || period === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week" || period === "7days") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month" || period === "30days") {
    startDate.setDate(now.getDate() - 30);
  } else if (period === "year" || period === "365days") {
    startDate.setFullYear(now.getFullYear() - 1);
  } else {
    startDate = new Date(0); // All time
  }

  // Filter orders by date
  const filteredOrders = orders.filter((o) => {
    const d = new Date(o.createdAt || Date.now());
    const validDate = d >= startDate;
    const notCancelled = (o.orderStatus || "").toLowerCase() !== "cancelled";
    return validDate && notCancelled;
  });

  // Filter bookings by date
  const filteredBookings = bookings.filter((b) => {
    const d = new Date(b.createdAt || Date.now());
    const validDate = d >= startDate;
    const notCancelled = (b.status || "").toLowerCase() !== "cancelled";
    return validDate && notCancelled;
  });

  const retailRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const rentalRevenue = filteredBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  let totalRevenue = 0;
  if (type === "retail") totalRevenue = retailRevenue;
  else if (type === "rental") totalRevenue = rentalRevenue;
  else totalRevenue = retailRevenue + rentalRevenue;

  const totalTransactions = filteredOrders.length + filteredBookings.length;
  const averageOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Generate trend points for daily revenue (last 7 or 14 points)
  const daysMap = {};
  const numDays = period === "7days" || period === "week" ? 7 : 14;
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    daysMap[key] = { label: key, retail: 0, rental: 0, total: 0 };
  }

  filteredOrders.forEach((o) => {
    const d = new Date(o.createdAt || Date.now());
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (daysMap[key]) {
      daysMap[key].retail += Number(o.totalAmount) || 0;
      daysMap[key].total += Number(o.totalAmount) || 0;
    }
  });

  filteredBookings.forEach((b) => {
    const d = new Date(b.createdAt || Date.now());
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    if (daysMap[key]) {
      daysMap[key].rental += Number(b.totalPrice) || 0;
      daysMap[key].total += Number(b.totalPrice) || 0;
    }
  });

  const revenueTimeline = Object.values(daysMap);

  return {
    period,
    type,
    totalRevenue,
    retailRevenue,
    rentalRevenue,
    ordersCount: filteredOrders.length,
    bookingsCount: filteredBookings.length,
    totalTransactions,
    averageOrderValue,
    revenueTimeline,
  };
};

/* -------------------------------------------------------------------------- */
/*                  4. TOP PERFORMING PRODUCTS & CAMERAS                     */
/* -------------------------------------------------------------------------- */

const getTopPerformingReports = async () => {
  const [orders, bookings, products, cameras] = await Promise.all([
    orderService.getAllOrders(),
    rentalService.getAllBookings(),
    productService.getAllProducts(),
    rentalService.getAllCameras(),
  ]);

  // Product sales map
  const productMap = {};
  orders.forEach((order) => {
    if ((order.orderStatus || "").toLowerCase() === "cancelled") return;
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const id = item.productId || item.id || item.name;
        if (!productMap[id]) {
          productMap[id] = {
            id,
            name: item.name || "Sản phẩm",
            category: item.category || "tech",
            brand: item.brand || "TechHub",
            image: item.image || "",
            unitsSold: 0,
            totalRevenue: 0,
          };
        }
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        productMap[id].unitsSold += qty;
        productMap[id].totalRevenue += qty * price;
      });
    }
  });

  const topSellingProducts = Object.values(productMap)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 8);

  // Camera rental map
  const cameraMap = {};
  bookings.forEach((booking) => {
    if ((booking.status || "").toLowerCase() === "cancelled") return;
    const camId = booking.cameraId || booking.cameraName;
    if (!cameraMap[camId]) {
      const camDoc = cameras.find((c) => c.id === camId || c._id === camId);
      cameraMap[camId] = {
        id: camId,
        name: booking.cameraName || (camDoc ? camDoc.name : "Máy ảnh"),
        brand: camDoc ? camDoc.brand : "Sony",
        image: camDoc ? camDoc.image : "",
        rentalCount: 0,
        totalRentalRevenue: 0,
        totalRentalDays: 0,
      };
    }
    cameraMap[camId].rentalCount += 1;
    cameraMap[camId].totalRentalRevenue += Number(booking.totalPrice) || 0;
    cameraMap[camId].totalRentalDays += Number(booking.rentalDays) || 1;
  });

  const topRentedCameras = Object.values(cameraMap)
    .sort((a, b) => b.totalRentalRevenue - a.totalRentalRevenue)
    .slice(0, 8);

  // Category breakdown
  const categoryMap = {
    laptop: { name: "Laptop & Macbook", count: 0, revenue: 0 },
    phone: { name: "Điện thoại & Tablet", count: 0, revenue: 0 },
    audio: { name: "Âm thanh & Tai nghe", count: 0, revenue: 0 },
    camera: { name: "Máy ảnh & Phụ kiện", count: 0, revenue: 0 },
    accessory: { name: "Phụ kiện công nghệ", count: 0, revenue: 0 },
  };

  orders.forEach((order) => {
    if ((order.orderStatus || "").toLowerCase() === "cancelled") return;
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const cat = (item.category || "accessory").toLowerCase();
        const target = categoryMap[cat] || categoryMap.accessory;
        const qty = Number(item.quantity) || 1;
        const price = Number(item.price) || 0;
        target.count += qty;
        target.revenue += qty * price;
      });
    }
  });

  return {
    topSellingProducts,
    topRentedCameras,
    categoryBreakdown: Object.entries(categoryMap).map(([key, val]) => ({
      key,
      ...val,
    })),
  };
};

module.exports = {
  getStaffList,
  createStaff,
  deleteStaff,
  toggleStaffStatus,
  getCustomersList,
  getInventoryReport,
  getRevenueReport,
  getTopPerformingReports,
};

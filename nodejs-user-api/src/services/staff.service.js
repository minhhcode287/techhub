const orderService = require("./order.service");
const productService = require("./product.service");
const rentalService = require("./rental.service");

const getStaffOrders = async ({ status, search } = {}) => {
  let orders = await orderService.getAllOrders();

  if (status && status !== "all") {
    orders = orders.filter((o) => (o.orderStatus || "processing").toLowerCase() === status.toLowerCase());
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        (o._id && o._id.toString().toLowerCase().includes(q)) ||
        (o.id && o.id.toString().toLowerCase().includes(q))
    );
  }

  return orders;
};

const updateOrderStatus = async (orderId, status) => {
  return await orderService.updateOrderStatus(orderId, status);
};

const getStaffStats = async () => {
  const [orders, products] = await Promise.all([
    orderService.getAllOrders(),
    productService.getAllProducts(),
  ]);

  const statusCounts = {
    pending: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
  };

  const productSoldMap = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let ordersToday = 0;
  let ordersDeliveredToday = 0;

  orders.forEach((order) => {
    const st = (order.orderStatus || "processing").toLowerCase();
    if (statusCounts[st] !== undefined) {
      statusCounts[st] += 1;
    } else {
      statusCounts.processing += 1;
    }

    const orderDate = new Date(order.createdAt || Date.now());
    if (orderDate >= today) {
      ordersToday += 1;
      if (st === "delivered") {
        ordersDeliveredToday += 1;
      }
    }

    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const pId = item.productId || item.id || item.name;
        const pName = item.name || "Sản phẩm";
        if (!productSoldMap[pId]) {
          productSoldMap[pId] = {
            productId: pId,
            name: pName,
            category: item.category || "retail",
            image: item.image || "",
            quantitySold: 0,
          };
        }
        productSoldMap[pId].quantitySold += item.quantity || 1;
      });
    }
  });

  const soldProductsList = Object.values(productSoldMap).sort(
    (a, b) => b.quantitySold - a.quantitySold
  );

  return {
    totalOrders: orders.length,
    ordersToday,
    ordersDeliveredToday,
    statusCounts,
    totalProductsInCatalog: products.length,
    soldProductsList,
  };
};

module.exports = {
  getStaffOrders,
  updateOrderStatus,
  getStaffStats,
};

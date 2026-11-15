const API_BASE = "/api";
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  avatar?: string;
  points?: number;
  membershipTier?: "Silver" | "Gold" | "Platinum";
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: "laptop" | "phone" | "audio" | "camera" | "accessory";
  brand: string;
  price: number;
  originalPrice?: number;
  stock: number;
  description: string;
  specs?: Record<string, string>;
  image: string;
  gallery?: string[];
  rating: number;
  reviewsCount: number;
  isFeatured?: boolean;
}

export interface RentalCamera {
  _id: string;
  name: string;
  brand: string;
  sensorType: string;
  maxResolution: string;
  dailyRate: number;
  weeklyRate: number;
  depositAmount: number;
  availableQuantity: number;
  totalQuantity: number;
  description: string;
  includedAccessories: string[];
  image: string;
  status: "available" | "rented_out" | "maintenance";
  isPopular?: boolean;
}

export interface RentalBooking {
  _id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  cameraId: string;
  cameraName: string;
  cameraImage: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  dailyRate: number;
  rentalFee: number;
  depositAmount: number;
  totalAmount: number;
  idCardNumber: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  _id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  voucherCode?: string;
  voucherDiscount?: number;
  pointsUsed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  totalAmount: number;
  paymentMethod: "cod" | "banking" | "momo";
  paymentStatus: "pending" | "paid";
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
}

export interface Voucher {
  _id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  expiryDate: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentSession {
  transactionCode: string;
  expectedAmount: number;
  status: "PENDING" | "PAID" | "EXPIRED";
  paymentMethod: "banking" | "momo" | "qr";
  bankRef?: string;
  paidAt?: string;
  qrUrl: string;
  bankInfo?: {
    bankId: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    content: string;
  };
  momoInfo?: {
    phone: string;
    accountName: string;
    amount: number;
    content: string;
    qrUrl: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type Booking = RentalBooking;

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

function handleSessionExpired() {
  localStorage.removeItem("techhub_token");
  localStorage.removeItem("techhub_refresh_token");
  window.dispatchEvent(new CustomEvent("techhub:auth_expired"));
  if (!window.location.pathname.includes("/login")) {
    sessionStorage.setItem(
      "techhub_auth_notice",
      "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
    );
    window.location.href = "/login";
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = localStorage.getItem("techhub_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  // Kiểm tra HTTP 401 hoặc thông báo token hết hạn
  const isTokenExpired =
    response.status === 401 ||
    (data &&
      typeof data.message === "string" &&
      (data.message.includes("hết hạn") || data.message.includes("TokenExpiredError")));

  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/register") ||
    endpoint.includes("/auth/refresh-token");

  if (isTokenExpired && !isRetry && !isAuthEndpoint) {
    const refreshToken = localStorage.getItem("techhub_refresh_token");

    if (!refreshToken) {
      handleSessionExpired();
      throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
    }

    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber((newToken: string) => {
          const newHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };
          request<T>(endpoint, { ...options, headers: newHeaders }, true)
            .then(resolve)
            .catch(reject);
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const refreshData = await refreshRes.json().catch(() => ({}));

      if (!refreshRes.ok || !refreshData.success || !refreshData.data) {
        throw new Error(refreshData.message || "Cấp lại token thất bại");
      }

      const newAccessToken =
        refreshData.data.accessToken || refreshData.data.token;
      const newRefreshToken = refreshData.data.refreshToken;

      if (newAccessToken) {
        localStorage.setItem("techhub_token", newAccessToken);
      }
      if (newRefreshToken) {
        localStorage.setItem("techhub_refresh_token", newRefreshToken);
      }

      isRefreshing = false;
      onTokenRefreshed(newAccessToken);

      const newHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      return request<T>(endpoint, { ...options, headers: newHeaders }, true);
    } catch (refreshErr) {
      isRefreshing = false;
      refreshSubscribers = [];
      handleSessionExpired();
      throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Lỗi yêu cầu: ${response.statusText}`);
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; database: { status: string; provider: string } }>("/health"),

  // Auth
  register: (payload: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    request<{
      success: boolean;
      message: string;
      data: {
        user: User;
        token: string;
        accessToken?: string;
        refreshToken?: string;
        tokens?: { accessToken: string; refreshToken: string };
      };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{
      success: boolean;
      message: string;
      data: {
        user: User;
        token: string;
        accessToken?: string;
        refreshToken?: string;
        tokens?: { accessToken: string; refreshToken: string };
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refreshToken: (refreshToken: string) =>
    request<{
      success: boolean;
      message: string;
      data: {
        accessToken: string;
        refreshToken: string;
        token: string;
      };
    }>("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  getMe: () => request<{ success: boolean; data: User }>("/auth/me"),

  updateProfile: (payload: { name?: string; phone?: string; address?: string }) =>
    request<{ success: boolean; message: string; data: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Products
  getProducts: (params?: { category?: string; brand?: string; search?: string; sort?: string }) => {
    const query = new URLSearchParams();
    if (
      params?.category &&
      params.category.toLowerCase() !== "all" &&
      params.category.toLowerCase() !== "tat-ca" &&
      params.category.toLowerCase() !== "tất cả"
    ) {
      query.append("category", params.category.trim());
    }
    if (
      params?.brand &&
      params.brand.toLowerCase() !== "all" &&
      params.brand.toLowerCase() !== "tất cả"
    ) {
      query.append("brand", params.brand.trim());
    }
    if (params?.search && params.search.trim()) {
      query.append("search", params.search.trim());
    }
    if (params?.sort) {
      query.append("sort", params.sort);
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ success: boolean; count: number; data: Product[] }>(`/products${qs}`);
  },

  getProductById: (id: string) => request<{ success: boolean; data: Product }>(`/products/${id}`),

  // Rentals
  getRentalCameras: (brand?: string) => {
    const qs = brand && brand !== "all" ? `?brand=${encodeURIComponent(brand)}` : "";
    return request<{ success: boolean; count: number; data: RentalCamera[] }>(`/rentals/cameras${qs}`);
  },

  createBooking: (payload: {
    cameraId: string;
    startDate: string;
    endDate: string;
    idCardNumber: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string; data: RentalBooking }>("/rentals/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyBookings: () => request<{ success: boolean; count: number; data: RentalBooking[] }>("/rentals/my-bookings"),

  cancelBooking: (bookingId: string) =>
    request<{ success: boolean; message: string; data: RentalBooking }>(`/rentals/bookings/${bookingId}/cancel`, {
      method: "PATCH",
    }),

  // Orders
  createOrder: (payload: {
    items: OrderItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod?: "cod" | "banking" | "momo";
    paymentStatus?: "pending" | "paid";
    voucherCode?: string;
    pointsToUse?: number;
    notes?: string;
  }) =>
    request<{ success: boolean; message: string; data: Order }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request<{ success: boolean; count: number; data: Order[] }>("/orders/my-orders"),
  cancelOrder: (orderId: string) =>
    request<{ success: boolean; message: string; data: Order }>(`/orders/${orderId}/cancel`, {
      method: "PATCH",
    }),

  // Products Management (Staff & Admin)
  createProduct: (payload: Partial<Product>) =>
    request<{ success: boolean; message: string; data: Product }>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: Partial<Product>) =>
    request<{ success: boolean; message: string; data: Product }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: string) =>
    request<{ success: boolean; message: string; data: { id: string } }>(`/products/${id}`, {
      method: "DELETE",
    }),

  // Staff APIs
  getStaffOrders: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{ success: boolean; count: number; data: Order[] }>(`/staff/orders${qs}`);
  },

  updateOrderStatus: (orderId: string, status: string) =>
    request<{ success: boolean; message: string; data: Order }>(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getStaffStats: () =>
    request<{
      success: boolean;
      data: {
        totalOrders: number;
        ordersToday: number;
        ordersDeliveredToday: number;
        statusCounts: {
          pending: number;
          processing: number;
          shipping: number;
          delivered: number;
          cancelled: number;
        };
        totalProductsInCatalog: number;
        soldProductsList: Array<{
          productId: string;
          name: string;
          category: string;
          image: string;
          quantitySold: number;
        }>;
      };
    }>("/staff/stats"),

  getAllRentalBookings: () =>
    request<{ success: boolean; count: number; data: RentalBooking[] }>("/rentals/bookings"),

  updateRentalBookingStatus: (bookingId: string, status: string) =>
    request<{ success: boolean; message: string; data: RentalBooking }>(`/rentals/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Admin APIs (Admin Only)
  getAdminRevenue: (params?: { period?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append("period", params.period);
    if (params?.type) query.append("type", params.type);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request<{
      success: boolean;
      data: {
        period: string;
        type: string;
        totalRevenue: number;
        retailRevenue: number;
        rentalRevenue: number;
        ordersCount: number;
        bookingsCount: number;
        totalTransactions: number;
        averageOrderValue: number;
        revenueTimeline: Array<{ label: string; retail: number; rental: number; total: number }>;
      };
    }>(`/admin/revenue${qs}`);
  },

  getStaffList: () =>
    request<{ success: boolean; count: number; data: User[] }>("/admin/staff"),

  createStaff: (payload: { name: string; email: string; password?: string; phone?: string; address?: string }) =>
    request<{ success: boolean; message: string; data: User }>("/admin/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteStaff: (id: string) =>
    request<{ success: boolean; message: string; data: { id: string } }>(`/admin/staff/${id}`, {
      method: "DELETE",
    }),

  toggleStaffStatus: (id: string, isActive: boolean) =>
    request<{ success: boolean; message: string; data: User }>(`/admin/staff/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),

  getAdminCustomers: () =>
    request<{
      success: boolean;
      count: number;
      data: Array<
        User & {
          ordersCount: number;
          bookingsCount: number;
          totalSpent: number;
          totalSpentRetail: number;
          totalSpentRental: number;
        }
      >;
    }>("/admin/customers"),

  getAdminInventory: () =>
    request<{
      success: boolean;
      data: {
        retailSummary: {
          totalProductsCount: number;
          totalStockUnits: number;
          lowStockCount: number;
          outOfStockCount: number;
          lowStockItems: Product[];
          outOfStockItems: Product[];
        };
        rentalSummary: {
          totalCamerasCount: number;
          availableCount: number;
          rentedCount: number;
          maintenanceCount: number;
          cameras: RentalCamera[];
        };
      };
    }>("/admin/inventory"),

  getAdminTopPerforming: () =>
    request<{
      success: boolean;
      data: {
        topSellingProducts: Array<{
          id: string;
          name: string;
          category: string;
          brand: string;
          image: string;
          unitsSold: number;
          totalRevenue: number;
        }>;
        topRentedCameras: Array<{
          id: string;
          name: string;
          brand: string;
          image: string;
          rentalCount: number;
          totalRentalRevenue: number;
          totalRentalDays: number;
        }>;
        categoryBreakdown: Array<{
          key: string;
          name: string;
          count: number;
          revenue: number;
        }>;
      };
    }>("/admin/reports/top-performing"),

  // Voucher APIs
  getVouchers: () =>
    request<{ success: boolean; count: number; data: Voucher[] }>("/vouchers"),

  validateVoucher: (payload: { code: string; orderTotal: number }) =>
    request<{
      success: boolean;
      message: string;
      data: {
        isValid: boolean;
        discountAmount: number;
        voucher?: Voucher;
      };
    }>("/vouchers/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminGetVouchers: () =>
    request<{ success: boolean; count: number; data: Voucher[] }>("/vouchers/admin/all"),

  adminCreateVoucher: (payload: Partial<Voucher>) =>
    request<{ success: boolean; message: string; data: Voucher }>("/vouchers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  adminUpdateVoucher: (id: string, payload: Partial<Voucher>) =>
    request<{ success: boolean; message: string; data: Voucher }>(`/vouchers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  adminDeleteVoucher: (id: string) =>
    request<{ success: boolean; message: string; data: Voucher }>(`/vouchers/${id}`, {
      method: "DELETE",
    }),

  // Payment APIs (VietQR & MoMo Webhook Auto-Reconciliation)
  createPaymentSession: (payload: {
    amount: number;
    method?: "banking" | "momo";
    metadata?: Record<string, unknown>;
  }) =>
    request<{ success: boolean; message: string; data: PaymentSession }>("/payments/create-session", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getPaymentSessionStatus: (transactionCode: string) =>
    request<{ success: boolean; data: PaymentSession }>(`/payments/status/${encodeURIComponent(transactionCode)}`),

  simulatePaymentWebhook: (payload: {
    transactionCode?: string;
    content?: string;
    amount: number;
    referenceCode?: string;
  }) =>
    request<{ success: boolean; message: string; session?: PaymentSession }>("/payments/webhook", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // AI Chatbot Assistant API
  chatWithAI: (payload: {
    message: string;
    history?: Array<{ role: "user" | "model" | "assistant"; text: string }>;
  }) =>
    request<{ success: boolean; reply: string; source?: string }>("/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

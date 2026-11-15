import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Camera,
  Users,
  BarChart3,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Search,
  CheckCircle2,
  Truck,
  XCircle,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  AlertCircle,
  ImageOff,
  Upload,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, type Product, type Order, type RentalBooking, type User } from "../services/api";
import SEO from "../components/SEO";
import {
  NeuNavbar,
  NeuFooter,
  NeuCard,
  NeuButton,
  NeuBadge,
  NeuInput,
  NeuModal,
  NeuIconWell,
  NeuErrorState,
} from "../components/NeumorphicComponents";

interface CustomerWithStats extends User {
  ordersCount: number;
  bookingsCount: number;
  totalSpent: number;
  totalSpentRetail: number;
  totalSpentRental: number;
}

interface StaffStatsData {
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
}

interface RevenueReportData {
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
}

interface InventoryReportData {
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
  };
}

interface TopPerformingData {
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
}

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80";

// Tự động lọc ký tự không phải số, loại bỏ số 0 vô nghĩa ở đầu và format theo vi-VN (phân tách hàng nghìn bằng dấu chấm)
const formatCurrencyDisplay = (val: string | number): string => {
  if (val === "" || val === undefined || val === null) return "";
  const cleanStr = String(val).replace(/\D/g, "");
  if (!cleanStr) return "";
  const noLeadingZero = cleanStr.replace(/^0+(?=\d)/, "");
  return noLeadingZero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Parse chuỗi đã format về kiểu Number nguyên thủy
const parseCurrencyValue = (val: string): number => {
  if (!val) return 0;
  const cleanStr = val.replace(/\D/g, "");
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
};

export default function ManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  const location = useLocation();

  // Role permissions
  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isAuthorized = isAdmin || isStaff;

  // Active Tab
  type TabType = "products" | "orders" | "rentals" | "staff_stats" | "personnel" | "revenue";
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rentals, setRentals] = useState<RentalBooking[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [customerList, setCustomerList] = useState<CustomerWithStats[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStatsData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReportData | null>(null);
  const [inventoryData, setInventoryData] = useState<InventoryReportData | null>(null);
  const [topPerformingData, setTopPerformingData] = useState<TopPerformingData | null>(null);

  // Filters & Search
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [revenuePeriod, setRevenuePeriod] = useState("30days");
  const [revenueType, setRevenueType] = useState("all");
  const [personnelSubTab, setPersonnelSubTab] = useState<"staff" | "customers">("staff");

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");
  const [originalPriceInput, setOriginalPriceInput] = useState<string>("");
  const [imagePreviewError, setImagePreviewError] = useState<boolean>(false);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "laptop" as Product["category"],
    brand: "Apple",
    stock: 10,
    description: "",
    image: "",
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "Test@123",
    phone: "",
    address: "",
  });

  const [deleteProductConfirmId, setDeleteProductConfirmId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Sync tab from URL query if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab") as TabType;
    if (tabParam) {
      if (tabParam === "revenue" || tabParam === "personnel") {
        if (isAdmin) setActiveTab(tabParam);
      } else {
        setActiveTab(tabParam);
      }
    }
  }, [location.search, isAdmin]);

  // Fetch initial data based on active tab
  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !isAuthorized) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (activeTab === "products") {
        const res = await api.getProducts({
          category: productCategory !== "all" ? productCategory : undefined,
          search: productSearch || undefined,
        });
        setProducts(res.data || []);
      } else if (activeTab === "orders") {
        const res = await api.getStaffOrders({
          status: orderStatusFilter !== "all" ? orderStatusFilter : undefined,
          search: orderSearch || undefined,
        });
        setOrders(res.data || []);
      } else if (activeTab === "rentals") {
        const res = await api.getAllRentalBookings();
        setRentals(res.data || []);
      } else if (activeTab === "staff_stats") {
        const res = await api.getStaffStats();
        setStaffStats(res.data);
      } else if (activeTab === "personnel" && isAdmin) {
        const [staffRes, custRes] = await Promise.all([
          api.getStaffList(),
          api.getAdminCustomers(),
        ]);
        setStaffList(staffRes.data || []);
        setCustomerList(custRes.data || []);
      } else if (activeTab === "revenue" && isAdmin) {
        const [revRes, invRes, topRes] = await Promise.all([
          api.getAdminRevenue({ period: revenuePeriod, type: revenueType }),
          api.getAdminInventory(),
          api.getAdminTopPerforming(),
        ]);
        setRevenueData(revRes.data);
        setInventoryData(invRes.data);
        setTopPerformingData(topRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải dữ liệu.";
      console.error("[Management] Fetch error:", msg);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    isAuthorized,
    activeTab,
    productCategory,
    productSearch,
    orderStatusFilter,
    orderSearch,
    isAdmin,
    revenuePeriod,
    revenueType,
  ]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAuthorized) {
      fetchData();
    }
  }, [fetchData, authLoading, isAuthenticated, isAuthorized]);

  // Currency Formatter
  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  // Date Formatter
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            PRODUCT HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn dung lượng < 4MB (4 * 1024 * 1024)
    const MAX_FILE_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(
        `File ảnh "${file.name}" quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn ảnh dung lượng dưới 4MB.`
      );
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        setProductForm((prev) => ({ ...prev, image: base64Data }));
        setImagePreviewError(false);
        showToast(`Đã tải ảnh "${file.name}" từ thiết bị thành công!`);
      }
    };
    reader.onerror = () => {
      setErrorMessage("Đã xảy ra lỗi khi đọc file ảnh từ máy. Vui lòng thử lại.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleOpenProductModal = (product?: Product) => {
    setImagePreviewError(false);
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        description: product.description || "",
        image: product.image || "",
      });
      setPriceInput(formatCurrencyDisplay(product.price));
      setOriginalPriceInput(
        product.originalPrice ? formatCurrencyDisplay(product.originalPrice) : ""
      );
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        category: "laptop",
        brand: "Apple",
        stock: 10,
        description: "",
        image: "",
      });
      setPriceInput("");
      setOriginalPriceInput("");
    }
    setIsProductModalOpen(true);
  };

  const handleAdjustPrice = (delta: number) => {
    const current = parseCurrencyValue(priceInput);
    const next = Math.max(0, current + delta);
    setPriceInput(next === 0 && delta < 0 ? "" : formatCurrencyDisplay(next));
  };

  const handleAdjustOriginalPrice = (delta: number) => {
    const current = parseCurrencyValue(originalPriceInput);
    const next = Math.max(0, current + delta);
    setOriginalPriceInput(next === 0 && delta < 0 ? "" : formatCurrencyDisplay(next));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPrice = parseCurrencyValue(priceInput);
    const finalOriginalPrice = parseCurrencyValue(originalPriceInput);

    if (!productForm.name.trim()) {
      setErrorMessage("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (finalPrice <= 0) {
      setErrorMessage("Vui lòng nhập giá bán sản phẩm hợp lệ (> 0 VNĐ)");
      return;
    }

    const finalImage =
      !productForm.image.trim() || imagePreviewError
        ? DEFAULT_PRODUCT_IMAGE
        : productForm.image.trim();

    const payload: Partial<Product> = {
      name: productForm.name.trim(),
      category: productForm.category,
      brand: productForm.brand.trim() || "TechHub",
      price: finalPrice,
      originalPrice: finalOriginalPrice || finalPrice,
      stock: Number(productForm.stock) >= 0 ? Number(productForm.stock) : 10,
      description: productForm.description.trim() || "Sản phẩm công nghệ chính hãng tại TechHub.",
      image: finalImage,
    };

    try {
      setLoading(true);
      if (editingProduct) {
        const res = await api.updateProduct(editingProduct._id, payload);
        showToast("Cập nhật thông tin sản phẩm thành công!");
        if (res.data) {
          setProducts((prev) =>
            prev.map((p) => (p._id === editingProduct._id ? res.data : p))
          );
        }
      } else {
        const res = await api.createProduct(payload);
        showToast("Thêm sản phẩm mới vào kho thành công!");
        if (res.data) {
          // Append trực tiếp item mới vào đầu state danh sách
          setProducts((prev) => [res.data, ...prev.filter((p) => p._id !== res.data._id)]);
        }
      }

      setIsProductModalOpen(false);

      // Reset form về rỗng
      setEditingProduct(null);
      setProductForm({
        name: "",
        category: "laptop",
        brand: "Apple",
        stock: 10,
        description: "",
        image: "",
      });
      setPriceInput("");
      setOriginalPriceInput("");
      setImagePreviewError(false);

      // Reset bộ lọc để sản phẩm mới thêm lập tức xuất hiện trên bảng quản lý
      setProductSearch("");
      setProductCategory("all");

      // Đồng bộ lại danh sách mới nhất từ server
      const freshRes = await api.getProducts();
      if (freshRes.success && freshRes.data) {
        setProducts(freshRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi lưu sản phẩm";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) {
      setErrorMessage("Chỉ Quản trị viên (Admin) mới có quyền xóa sản phẩm khỏi hệ thống.");
      return;
    }

    try {
      setLoading(true);
      await api.deleteProduct(id);
      showToast("Đã xóa sản phẩm thành công!");
      setDeleteProductConfirmId(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xóa sản phẩm";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             ORDER HANDLERS                                 */
  /* -------------------------------------------------------------------------- */

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`Đã chuyển trạng thái đơn hàng sang: ${newStatus.toUpperCase()}`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái đơn hàng";
      setErrorMessage(msg);
    }
  };

  const handleUpdateRentalStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.updateRentalBookingStatus(bookingId, newStatus);
      showToast(`Đã cập nhật trạng thái thuê máy ảnh thành công!`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái đơn thuê";
      setErrorMessage(msg);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                            PERSONNEL HANDLERS                              */
  /* -------------------------------------------------------------------------- */

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!staffForm.name || !staffForm.email) {
      setErrorMessage("Vui lòng nhập họ tên và email nhân viên");
      return;
    }

    try {
      setLoading(true);
      await api.createStaff(staffForm);
      showToast("Đã tạo tài khoản nhân viên mới thành công (Role: staff)!");
      setIsStaffModalOpen(false);
      setStaffForm({
        name: "",
        email: "",
        password: "Test@123",
        phone: "",
        address: "",
      });
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi tạo nhân viên";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản nhân viên này?")) return;

    try {
      setLoading(true);
      await api.deleteStaff(staffId);
      showToast("Đã xóa tài khoản nhân viên thành công!");
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi xóa nhân viên";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentActive: boolean) => {
    if (!isAdmin) return;
    try {
      await api.toggleStaffStatus(staffId, !currentActive);
      showToast(`Đã ${!currentActive ? "kích hoạt" : "tạm khóa"} tài khoản nhân viên!`);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi thay đổi trạng thái nhân viên";
      setErrorMessage(msg);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                         RENDER ACCESS DENIED                               */
  /* -------------------------------------------------------------------------- */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6C63FF] border-t-transparent mx-auto" />
          <p className="text-sm font-bold text-[#3D4852]">Đang xác thực quyền truy cập hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
        <NeuNavbar />
        <main className="max-w-md mx-auto my-12 px-6 w-full">
          <NeuCard rounded="32" className="p-8 text-center space-y-5">
            <div className="flex justify-center">
              <NeuIconWell size="lg" className="text-[#6C63FF]">
                <Lock className="h-7 w-7" />
              </NeuIconWell>
            </div>
            <h2 className="text-2xl font-extrabold text-[#3D4852] font-display">Yêu cầu đăng nhập</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Bạn cần đăng nhập bằng tài khoản <strong>Nhân viên (Staff)</strong> hoặc <strong>Quản trị viên (Admin)</strong> để truy cập Trung tâm Quản trị & Vận hành.
            </p>
            <div className="pt-2">
              <NeuButton variant="primary" size="md" className="w-full" onClick={() => navigate("/login")}>
                Đến trang Đăng nhập
              </NeuButton>
            </div>
          </NeuCard>
        </main>
        <NeuFooter />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
        <SEO title="403 - Giới Hạn Quyền Truy Cập" description="Trang quản lý nội bộ hệ thống TechHub." />
        <NeuNavbar />
        <main className="max-w-lg mx-auto my-12 px-6 w-full">
          <NeuCard rounded="32" className="p-8 text-center space-y-5">
            <div className="flex justify-center">
              <NeuIconWell size="lg" className="text-[#E53E3E]">
                <AlertTriangle className="h-7 w-7" />
              </NeuIconWell>
            </div>
            <NeuBadge variant="danger">HTTP 403 FORBIDDEN</NeuBadge>
            <h2 className="text-2xl font-extrabold text-[#3D4852] font-display">Không có quyền truy cập</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed neu-inset-sm p-4 rounded-2xl">
              Tài khoản hiện tại của bạn là <strong>Khách hàng ({user?.email})</strong>. Trang quản lý này chỉ dành riêng cho <strong>Nhân viên (Staff)</strong> và <strong>Quản trị viên (Admin)</strong>.
            </p>
            <div className="pt-2 flex gap-3 justify-center">
              <NeuButton variant="secondary" size="md" onClick={() => navigate("/account")}>
                Về trang cá nhân
              </NeuButton>
              <NeuButton variant="primary" size="md" onClick={() => navigate("/")}>
                Về trang chủ
              </NeuButton>
            </div>
          </NeuCard>
        </main>
        <NeuFooter />
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                         MAIN MANAGEMENT DASHBOARD                          */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
      <SEO
        title={isAdmin ? "Quản Trị Hệ Thống (Admin Portal)" : "Quản Lý Nghiệp Vụ (Staff Portal)"}
        description="Hệ thống điều hành sản phẩm, đơn hàng bán lẻ và lịch thuê máy ảnh TechHub."
      />
      <NeuNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* TOAST NOTIFICATION */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <NeuCard rounded="24" className="p-4 bg-[#E0E5EC] border-2 border-[#38B2AC] flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#38B2AC] shrink-0" />
              <span className="text-xs font-extrabold text-[#3D4852]">{successToast}</span>
            </NeuCard>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="mb-6">
            <NeuErrorState
              title="Lỗi xử lý hệ thống"
              message={errorMessage}
              onRetry={() => {
                setErrorMessage(null);
                fetchData();
              }}
            />
          </div>
        )}

        {/* TOP BANNER & ROLE BAR */}
        <NeuCard rounded="32" className="p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#3D4852] font-display">
                  Trung Tâm Quản Trị & Vận Hành
                </h1>
                {isAdmin ? (
                  <NeuBadge variant="accent" className="text-xs py-1 px-3.5">
                    <ShieldCheck className="h-4 w-4" /> QUẢN TRỊ VIÊN (ADMIN)
                  </NeuBadge>
                ) : (
                  <NeuBadge variant="teal" className="text-xs py-1 px-3.5">
                    <UserCheck className="h-4 w-4" /> NHÂN VIÊN VẬN HÀNH (STAFF)
                  </NeuBadge>
                )}
              </div>
              <p className="text-xs md:text-sm text-[#6B7280] font-medium">
                {isAdmin
                  ? "Toàn quyền quản lý danh mục, nhân sự, kiểm soát kho, phê duyệt đơn hàng và thống kê tài chính doanh thu."
                  : "Quản lý sản phẩm, tiếp nhận xử lý đơn hàng, theo dõi lịch thuê máy ảnh và thống kê hiệu suất công việc."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <NeuButton variant="secondary" size="sm" onClick={fetchData} loading={loading}>
                <RefreshCw className="h-3.5 w-3.5" /> Làm mới
              </NeuButton>
              {activeTab === "products" && (
                <NeuButton variant="primary" size="sm" onClick={() => handleOpenProductModal()}>
                  <Plus className="h-4 w-4" /> Thêm sản phẩm
                </NeuButton>
              )}
              {activeTab === "personnel" && isAdmin && (
                <NeuButton variant="primary" size="sm" onClick={() => setIsStaffModalOpen(true)}>
                  <Plus className="h-4 w-4" /> Thêm nhân viên
                </NeuButton>
              )}
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="mt-8 pt-6 border-t border-[#D1D9E6]/80 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {/* Products Tab (Staff & Admin) */}
            <NeuButton
              variant={activeTab === "products" ? "primary" : "secondary"}
              size="sm"
              isActive={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              className="shrink-0"
            >
              <Package className="h-4 w-4" /> Quản lý sản phẩm
            </NeuButton>

            {/* Orders Tab (Staff & Admin) */}
            <NeuButton
              variant={activeTab === "orders" ? "primary" : "secondary"}
              size="sm"
              isActive={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
              className="shrink-0"
            >
              <ShoppingBag className="h-4 w-4" /> Quản lý đơn hàng
            </NeuButton>

            {/* Rentals Tab (Staff & Admin) */}
            <NeuButton
              variant={activeTab === "rentals" ? "primary" : "secondary"}
              size="sm"
              isActive={activeTab === "rentals"}
              onClick={() => setActiveTab("rentals")}
              className="shrink-0"
            >
              <Camera className="h-4 w-4" /> Thuê máy ảnh
            </NeuButton>

            {/* Staff Work Stats (Staff view) */}
            <NeuButton
              variant={activeTab === "staff_stats" ? "primary" : "secondary"}
              size="sm"
              isActive={activeTab === "staff_stats"}
              onClick={() => setActiveTab("staff_stats")}
              className="shrink-0"
            >
              <BarChart3 className="h-4 w-4" /> Thống kê công việc
            </NeuButton>

            {/* Admin Personnel (ADMIN ONLY) */}
            {isAdmin && (
              <NeuButton
                variant={activeTab === "personnel" ? "primary" : "secondary"}
                size="sm"
                isActive={activeTab === "personnel"}
                onClick={() => setActiveTab("personnel")}
                className="shrink-0"
              >
                <Users className="h-4 w-4" /> Quản lý nhân sự & Khách
              </NeuButton>
            )}

            {/* Admin Revenue & Reports (ADMIN ONLY) */}
            {isAdmin && (
              <NeuButton
                variant={activeTab === "revenue" ? "primary" : "secondary"}
                size="sm"
                isActive={activeTab === "revenue"}
                onClick={() => setActiveTab("revenue")}
                className="shrink-0"
              >
                <TrendingUp className="h-4 w-4" /> Báo cáo doanh thu
              </NeuButton>
            )}
          </div>
        </NeuCard>

        {/* ------------------------------------------------------------------ */}
        {/*                         TAB 1: PRODUCTS                            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Search & Filter bar */}
            <NeuCard rounded="24" className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 w-full flex gap-3">
                <NeuInput
                  placeholder="Tìm kiếm sản phẩm theo tên hoặc hãng..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  icon={<Search className="h-4 w-4 text-[#6B7280]" />}
                  className="w-full"
                />
                <NeuButton variant="secondary" size="md" onClick={fetchData}>
                  Tìm
                </NeuButton>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {["all", "laptop", "phone", "audio", "camera"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setProductCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      productCategory === cat
                        ? "neu-accent font-extrabold"
                        : "neu-btn text-[#6B7280]"
                    }`}
                  >
                    {cat === "all"
                      ? "Tất cả"
                      : cat === "laptop"
                      ? "Laptop"
                      : cat === "phone"
                      ? "Điện thoại"
                      : cat === "audio"
                      ? "Âm thanh"
                      : "Máy ảnh"}
                  </button>
                ))}
              </div>
            </NeuCard>

            {/* Notice for Staff */}
            {isStaff && (
              <div className="p-4 rounded-2xl neu-inset bg-[#E0E5EC] flex items-center gap-3 text-xs text-[#6B7280]">
                <ShieldCheck className="h-5 w-5 text-[#38B2AC] shrink-0" />
                <span>
                  <strong>Quyền của Nhân viên:</strong> Bạn có thể thêm sản phẩm mới và chỉnh sửa giá, mô tả, tồn kho. Thao tác xóa sản phẩm chỉ dành riêng cho Quản trị viên (Admin).
                </span>
              </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <NeuCard key={prod._id} rounded="24" className="p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden aspect-video neu-inset">
                      <img
                        src={prod.image || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2">
                        <NeuBadge variant="default" className="text-[10px] uppercase">
                          {prod.category}
                        </NeuBadge>
                      </span>
                      <span className="absolute top-2 right-2">
                        <NeuBadge
                          variant={prod.stock <= 3 ? "danger" : prod.stock <= 8 ? "warning" : "teal"}
                          className="text-[10px]"
                        >
                          Tồn kho: {prod.stock}
                        </NeuBadge>
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-[#6C63FF] uppercase tracking-wider">
                        {prod.brand}
                      </span>
                      <h3 className="font-extrabold text-[#3D4852] text-base leading-snug line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-[#6B7280] line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>

                    <div className="flex items-baseline gap-2 pt-2 border-t border-[#D1D9E6]/60">
                      <span className="text-base font-extrabold text-[#3D4852]">
                        {formatVND(prod.price)}
                      </span>
                      {prod.originalPrice && prod.originalPrice > prod.price && (
                        <span className="text-xs text-[#9CA3AF] line-through">
                          {formatVND(prod.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 flex items-center justify-between gap-2 border-t border-[#D1D9E6]/60">
                    <NeuButton
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenProductModal(prod)}
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Sửa thông tin
                    </NeuButton>

                    {isAdmin ? (
                      <NeuButton
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteProductConfirmId(prod._id)}
                        title="Xóa sản phẩm (Admin Only)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </NeuButton>
                    ) : (
                      <div
                        title="Chỉ Admin mới có quyền xóa sản phẩm"
                        className="opacity-40 cursor-not-allowed"
                      >
                        <NeuButton variant="secondary" size="sm" disabled>
                          <Lock className="h-3.5 w-3.5" />
                        </NeuButton>
                      </div>
                    )}
                  </div>
                </NeuCard>
              ))}
            </div>

            {products.length === 0 && !loading && (
              <NeuCard rounded="32" className="p-12 text-center">
                <p className="text-sm font-bold text-[#6B7280]">Không tìm thấy sản phẩm nào phù hợp.</p>
              </NeuCard>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                          TAB 2: ORDERS                             */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Filter Pills & Search */}
            <NeuCard rounded="24" className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 w-full flex gap-3">
                <NeuInput
                  placeholder="Tìm đơn hàng theo tên khách, SĐT, mã đơn..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  icon={<Search className="h-4 w-4 text-[#6B7280]" />}
                />
                <NeuButton variant="secondary" size="md" onClick={fetchData}>
                  Lọc
                </NeuButton>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "processing", label: "Đang xử lý" },
                  { id: "shipping", label: "Đang giao" },
                  { id: "delivered", label: "Đã giao" },
                  { id: "cancelled", label: "Đã hủy" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      orderStatusFilter === st.id
                        ? "neu-accent font-extrabold"
                        : "neu-btn text-[#6B7280]"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </NeuCard>

            {/* Orders List */}
            <div className="space-y-4">
              {orders.map((ord) => (
                <NeuCard key={ord._id} rounded="24" className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D1D9E6]/70">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-[#3D4852] font-display">
                          Mã đơn: #{ord._id.slice(-6).toUpperCase()}
                        </span>
                        <NeuBadge
                          variant={
                            ord.orderStatus === "delivered"
                              ? "teal"
                              : ord.orderStatus === "shipped"
                              ? "accent"
                              : ord.orderStatus === "cancelled"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {ord.orderStatus === "delivered"
                            ? "Đã giao hàng"
                            : ord.orderStatus === "shipped"
                            ? "Đang vận chuyển"
                            : ord.orderStatus === "cancelled"
                            ? "Đã hủy"
                            : "Đang xử lý"}
                        </NeuBadge>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(ord.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#6B7280]">Chuyển trạng thái:</span>
                      <NeuButton
                        variant={ord.orderStatus === "processing" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(ord._id, "processing")}
                      >
                        Đang xử lý
                      </NeuButton>
                      <NeuButton
                        variant={ord.orderStatus === "shipped" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(ord._id, "shipped")}
                      >
                        <Truck className="h-3.5 w-3.5" /> Đang giao
                      </NeuButton>
                      <NeuButton
                        variant={ord.orderStatus === "delivered" ? "teal" : "secondary"}
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(ord._id, "delivered")}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Đã giao
                      </NeuButton>
                      <NeuButton
                        variant={ord.orderStatus === "cancelled" ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(ord._id, "cancelled")}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Hủy
                      </NeuButton>
                    </div>
                  </div>

                  {/* Customer Info & Items */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-1 text-xs text-[#6B7280] neu-inset p-3.5 rounded-2xl">
                      <p className="font-bold text-[#3D4852] flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#6C63FF]" /> Khách hàng: {ord.customerName}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#6B7280]" /> {ord.customerPhone}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#6B7280]" /> {ord.customerEmail}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#6B7280]" /> {ord.shippingAddress}
                      </p>
                    </div>

                    <div className="lg:col-span-2 space-y-2">
                      <div className="text-xs font-bold text-[#3D4852] mb-1">Chi tiết mặt hàng:</div>
                      {ord.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 text-xs bg-[#E0E5EC] neu-inset-sm p-2.5 rounded-xl"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={it.image || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200"}
                              alt={it.name}
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                            <span className="font-bold text-[#3D4852]">{it.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#6B7280] font-medium mr-2">x{it.quantity}</span>
                            <span className="font-extrabold text-[#3D4852]">
                              {formatVND(it.price * it.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between items-center text-xs font-bold text-[#3D4852]">
                        <span>Phương thức: {ord.paymentMethod?.toUpperCase()}</span>
                        <span className="text-sm font-extrabold text-[#6C63FF]">
                          Tổng tiền: {formatVND(ord.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </NeuCard>
              ))}

              {orders.length === 0 && !loading && (
                <NeuCard rounded="32" className="p-12 text-center">
                  <p className="text-sm font-bold text-[#6B7280]">Không có đơn hàng nào.</p>
                </NeuCard>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                        TAB 3: RENTALS                              */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "rentals" && (
          <div className="space-y-6">
            <NeuCard rounded="24" className="p-4 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#3D4852]">Danh Sách Lịch Thuê Máy Ảnh</h3>
              <span className="text-xs font-bold text-[#6B7280]">{rentals.length} lượt thuê</span>
            </NeuCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rentals.map((b) => (
                <NeuCard key={b._id} rounded="24" className="p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-[#3D4852] font-display">
                          #{b._id.slice(-6).toUpperCase()}
                        </span>
                        <h4 className="text-base font-extrabold text-[#6C63FF] mt-0.5">
                          {b.cameraName}
                        </h4>
                      </div>
                      <NeuBadge
                        variant={
                          b.status === "completed"
                            ? "teal"
                            : b.status === "active"
                            ? "accent"
                            : b.status === "cancelled"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {b.status === "completed"
                          ? "Đã trả máy"
                          : b.status === "active"
                          ? "Đang thuê"
                          : b.status === "cancelled"
                          ? "Đã hủy"
                          : "Đã duyệt/Chờ nhận"}
                      </NeuBadge>
                    </div>

                    <div className="neu-inset p-3 rounded-2xl text-xs space-y-1 text-[#6B7280]">
                      <p className="font-bold text-[#3D4852]">Khách thuê: {b.userName || b.userEmail}</p>
                      <p>SĐT: {b.userPhone || "Chưa cung cấp"}</p>
                      <p>CCCD: {b.idCardNumber || "Đã lưu bản cứng"}</p>
                      <p>
                        Thời gian thuê: <strong>{b.startDate}</strong> đến <strong>{b.endDate}</strong> ({b.totalDays} ngày)
                      </p>
                      <p className="font-extrabold text-[#3D4852] pt-1">
                        Tổng thanh toán: {formatVND(b.totalAmount || (b as unknown as { totalPrice: number }).totalPrice || 0)} (Cọc: {formatVND(b.depositAmount || 0)})
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D1D9E6]/70 flex items-center gap-2">
                    <NeuButton
                      variant={b.status === "confirmed" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleUpdateRentalStatus(b._id, "confirmed")}
                    >
                      Duyệt
                    </NeuButton>
                    <NeuButton
                      variant={b.status === "active" ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleUpdateRentalStatus(b._id, "active")}
                    >
                      Giao máy
                    </NeuButton>
                    <NeuButton
                      variant={b.status === "completed" ? "teal" : "secondary"}
                      size="sm"
                      onClick={() => handleUpdateRentalStatus(b._id, "completed")}
                    >
                      Đã hoàn tất
                    </NeuButton>
                    <NeuButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleUpdateRentalStatus(b._id, "cancelled")}
                    >
                      Hủy
                    </NeuButton>
                  </div>
                </NeuCard>
              ))}
            </div>

            {rentals.length === 0 && !loading && (
              <NeuCard rounded="32" className="p-12 text-center">
                <p className="text-sm font-bold text-[#6B7280]">Chưa có lịch thuê máy ảnh nào.</p>
              </NeuCard>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                      TAB 4: STAFF WORK STATS                       */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "staff_stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">ĐƠN ĐANG XỬ LÝ</p>
                <h3 className="text-2xl font-extrabold text-[#D97706] mt-2">
                  {staffStats?.statusCounts?.processing || 0}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Cần chuẩn bị hàng</p>
              </NeuCard>

              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">ĐƠN ĐANG GIAO</p>
                <h3 className="text-2xl font-extrabold text-[#6C63FF] mt-2">
                  {staffStats?.statusCounts?.shipping || 0}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Đang trên đường giao</p>
              </NeuCard>

              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">ĐÃ GIAO HÔM NAY</p>
                <h3 className="text-2xl font-extrabold text-[#38B2AC] mt-2">
                  {staffStats?.ordersDeliveredToday || 0}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Hoàn thành trong ngày</p>
              </NeuCard>

              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">SẢN PHẨM TRONG DANH MỤC</p>
                <h3 className="text-2xl font-extrabold text-[#3D4852] mt-2">
                  {staffStats?.totalProductsInCatalog || 0}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Đang sẵn sàng bán</p>
              </NeuCard>
            </div>

            {/* Sold Products Leaderboard (Without financial revenue leak) */}
            <NeuCard rounded="24" className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D1D9E6]/70">
                <div>
                  <h3 className="text-base font-extrabold text-[#3D4852] font-display">
                    Số Lượng Sản Phẩm Đã Bán
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Thống kê số lượng mặt hàng được khách đặt mua
                  </p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-[#D1D9E6]/60">
                {staffStats?.soldProductsList?.map((item, idx: number) => (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-[#E0E5EC] neu-inset-sm flex items-center justify-center text-xs font-extrabold text-[#6C63FF]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#3D4852] text-sm">{item.name}</span>
                    </div>
                    <NeuBadge variant="accent">
                      Đã bán: {item.quantitySold} cái
                    </NeuBadge>
                  </div>
                ))}
                {(!staffStats?.soldProductsList || staffStats.soldProductsList.length === 0) && (
                  <p className="text-xs text-[#6B7280] py-6 text-center">Chưa có dữ liệu bán hàng.</p>
                )}
              </div>
            </NeuCard>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                      TAB 5: PERSONNEL (ADMIN ONLY)                 */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "personnel" && isAdmin && (
          <div className="space-y-6">
            <NeuCard rounded="24" className="p-4 flex gap-3">
              <NeuButton
                variant={personnelSubTab === "staff" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPersonnelSubTab("staff")}
              >
                <UserCheck className="h-4 w-4" /> Danh sách nhân viên ({staffList.length})
              </NeuButton>
              <NeuButton
                variant={personnelSubTab === "customers" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setPersonnelSubTab("customers")}
              >
                <Users className="h-4 w-4" /> Danh sách khách hàng ({customerList.length})
              </NeuButton>
            </NeuCard>

            {personnelSubTab === "staff" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staffList.map((st) => {
                    const isStaffActive = (st as unknown as { isActive?: boolean }).isActive !== false;
                    return (
                      <NeuCard key={st.id} rounded="24" className="p-5 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200"}
                              alt={st.name}
                              className="h-12 w-12 rounded-2xl object-cover neu-inset"
                            />
                            <div>
                              <h4 className="font-extrabold text-[#3D4852] text-sm">{st.name}</h4>
                              <p className="text-xs text-[#6B7280]">{st.email}</p>
                            </div>
                          </div>

                          <div className="neu-inset p-3 rounded-2xl text-xs space-y-1 text-[#6B7280]">
                            <p>SĐT: <strong>{st.phone || "Chưa cập nhật"}</strong></p>
                            <p>Địa chỉ: <strong>{st.address || "Chưa cập nhật"}</strong></p>
                            <p>Vai trò: <span className="font-bold text-[#38B2AC]">Nhân viên (staff)</span></p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#D1D9E6]/70 flex items-center justify-between gap-2">
                          <NeuButton
                            variant={isStaffActive ? "secondary" : "teal"}
                            size="sm"
                            onClick={() => handleToggleStaffStatus(st.id, isStaffActive)}
                          >
                            {isStaffActive ? (
                              <>
                                <UserX className="h-3.5 w-3.5 text-[#E53E3E]" /> Khóa tài khoản
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 text-[#38B2AC]" /> Mở khóa
                              </>
                            )}
                          </NeuButton>

                          <NeuButton
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteStaff(st.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Xóa
                          </NeuButton>
                        </div>
                      </NeuCard>
                    );
                  })}
                </div>

                {staffList.length === 0 && (
                  <NeuCard rounded="32" className="p-12 text-center">
                    <p className="text-sm font-bold text-[#6B7280]">Chưa có tài khoản nhân viên nào.</p>
                  </NeuCard>
                )}
              </div>
            )}

            {personnelSubTab === "customers" && (
              <NeuCard rounded="24" className="p-6">
                <div className="pb-4 border-b border-[#D1D9E6]/70">
                  <h3 className="text-base font-extrabold text-[#3D4852]">Danh Sách Khách Hàng</h3>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Bảo mật quyền riêng tư: Admin được xem tổng hợp số đơn và chi tiêu, không sửa đổi thông tin cá nhân của khách.
                  </p>
                </div>

                <div className="mt-4 divide-y divide-[#D1D9E6]/60">
                  {customerList.map((cust) => (
                    <div key={cust.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-extrabold text-[#3D4852] text-sm">{cust.name}</p>
                        <p className="text-[#6B7280]">{cust.email} • SĐT: {cust.phone || "N/A"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <NeuBadge variant="default">
                          {cust.ordersCount || 0} đơn mua • {cust.bookingsCount || 0} lượt thuê
                        </NeuBadge>
                        <span className="font-extrabold text-[#6C63FF] text-sm">
                          {formatVND(cust.totalSpent || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </NeuCard>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/*                   TAB 6: REVENUE & REPORTS (ADMIN ONLY)            */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "revenue" && isAdmin && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <NeuCard rounded="24" className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <span className="text-xs font-bold text-[#6B7280]">Kỳ báo cáo:</span>
                {[
                  { id: "today", label: "Hôm nay" },
                  { id: "7days", label: "7 ngày qua" },
                  { id: "30days", label: "30 ngày qua" },
                  { id: "365days", label: "1 năm qua" },
                  { id: "all", label: "Toàn thời gian" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setRevenuePeriod(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      revenuePeriod === p.id
                        ? "neu-accent font-extrabold"
                        : "neu-btn text-[#6B7280]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6B7280]">Loại doanh thu:</span>
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "retail", label: "Bán hàng" },
                  { id: "rental", label: "Thuê máy ảnh" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRevenueType(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      revenueType === t.id
                        ? "neu-accent font-extrabold"
                        : "neu-btn text-[#6B7280]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </NeuCard>

            {/* Revenue Highlights Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">TỔNG DOANH THU</p>
                <h3 className="text-2xl font-extrabold text-[#6C63FF] mt-2 font-display">
                  {formatVND(revenueData?.totalRevenue || 0)}
                </h3>
                <p className="text-[11px] text-[#38B2AC] mt-1 font-bold">
                  {revenueData?.totalTransactions || 0} lượt thanh toán
                </p>
              </NeuCard>

              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">DOANH THU BÁN HÀNG</p>
                <h3 className="text-2xl font-extrabold text-[#3D4852] mt-2 font-display">
                  {formatVND(revenueData?.retailRevenue || 0)}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {revenueData?.ordersCount || 0} đơn hàng bán lẻ
                </p>
              </NeuCard>

              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">DOANH THU CHO THUÊ MÁY</p>
                <h3 className="text-2xl font-extrabold text-[#38B2AC] mt-2 font-display">
                  {formatVND(revenueData?.rentalRevenue || 0)}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">
                  {revenueData?.bookingsCount || 0} lượt đặt thuê
                </p>
              </NeuCard>

              <NeuCard rounded="24" className="p-5">
                <p className="text-xs font-bold text-[#6B7280]">GIÁ TRỊ TRUNG BÌNH (AOV)</p>
                <h3 className="text-2xl font-extrabold text-[#D97706] mt-2 font-display">
                  {formatVND(revenueData?.averageOrderValue || 0)}
                </h3>
                <p className="text-[11px] text-[#6B7280] mt-1">Trên mỗi giao dịch</p>
              </NeuCard>
            </div>

            {/* Inventory Alerts & Top Performing Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <NeuCard rounded="24" className="p-6">
                <h3 className="text-base font-extrabold text-[#3D4852] pb-3 border-b border-[#D1D9E6]/70 font-display">
                  Top Sản Phẩm Bán Chạy Nhất
                </h3>
                <div className="mt-3 divide-y divide-[#D1D9E6]/60">
                  {topPerformingData?.topSellingProducts && topPerformingData.topSellingProducts.length > 0 ? (
                    topPerformingData.topSellingProducts.map((p, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-extrabold text-[#6C63FF]">#{idx + 1}</span>
                          <span className="font-bold text-[#3D4852] truncate">{p.name}</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="text-[#6B7280] mr-3">{p.unitsSold} cái</span>
                          <span className="font-extrabold text-[#3D4852]">{formatVND(p.totalRevenue)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[#6B7280]">Chưa có dữ liệu bán hàng trong kỳ này</div>
                  )}
                </div>
              </NeuCard>

              {/* Top Rented Cameras */}
              <NeuCard rounded="24" className="p-6">
                <h3 className="text-base font-extrabold text-[#3D4852] pb-3 border-b border-[#D1D9E6]/70 font-display">
                  Top Máy Ảnh Cho Thuê Nhiều Nhất
                </h3>
                <div className="mt-3 divide-y divide-[#D1D9E6]/60">
                  {topPerformingData?.topRentedCameras && topPerformingData.topRentedCameras.length > 0 ? (
                    topPerformingData.topRentedCameras.map((c, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-extrabold text-[#38B2AC]">#{idx + 1}</span>
                          <span className="font-bold text-[#3D4852] truncate">{c.name}</span>
                        </div>
                        <div className="text-right whitespace-nowrap">
                          <span className="text-[#6B7280] mr-3">
                            {c.rentalCount} lượt{c.totalRentalDays ? ` (${c.totalRentalDays} ngày)` : ""}
                          </span>
                          <span className="font-extrabold text-[#38B2AC]">{formatVND(c.totalRentalRevenue)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-[#6B7280]">Chưa có dữ liệu thuê máy ảnh trong kỳ này</div>
                  )}
                </div>
              </NeuCard>
            </div>

            {/* Inventory Status Alert */}
            <NeuCard rounded="24" className="p-6">
              <h3 className="text-base font-extrabold text-[#3D4852] pb-3 border-b border-[#D1D9E6]/70 font-display">
                Cảnh Báo Tồn Kho Hệ Thống
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="neu-inset p-4 rounded-2xl">
                  <p className="font-extrabold text-[#D97706] mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Hàng sắp hết ({inventoryData?.retailSummary?.lowStockCount || 0} mặt hàng)
                  </p>
                  <ul className="space-y-1 text-[#6B7280]">
                    {inventoryData?.retailSummary?.lowStockItems?.map((it) => (
                      <li key={it._id} className="flex justify-between">
                        <span>{it.name}</span>
                        <strong className="text-[#D97706]">{it.stock} còn lại</strong>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="neu-inset p-4 rounded-2xl">
                  <p className="font-extrabold text-[#38B2AC] mb-2 flex items-center gap-1.5">
                    <Camera className="h-4 w-4" /> Trạng thái máy ảnh cho thuê
                  </p>
                  <div className="space-y-1 text-[#6B7280]">
                    <p>Tổng máy ảnh: <strong>{inventoryData?.rentalSummary?.totalCamerasCount || 0} máy</strong></p>
                    <p>Sẵn sàng cho thuê: <strong className="text-[#38B2AC]">{inventoryData?.rentalSummary?.availableCount || 0} máy</strong></p>
                    <p>Đang có khách thuê: <strong className="text-[#6C63FF]">{inventoryData?.rentalSummary?.rentedCount || 0} máy</strong></p>
                  </div>
                </div>
              </div>
            </NeuCard>
          </div>
        )}
      </main>

      {/* -------------------------------------------------------------------- */}
      {/*                       PRODUCT EDIT / CREATE MODAL                     */}
      {/* -------------------------------------------------------------------- */}
      <NeuModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        subtitle={editingProduct ? "Cập nhật giá, mô tả, tồn kho và hình ảnh thiết bị" : "Thêm thiết bị mới vào danh mục bán hàng"}
        maxWidth="3xl"
        id="product-manage-modal"
      >
        <form onSubmit={handleSaveProduct} className="space-y-5">
          <NeuInput
            label="Tên sản phẩm *"
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            placeholder="Ví dụ: MacBook Pro 16 M3 Max, Sony A7 IV..."
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#6B7280]">
                Danh mục *
              </label>
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value as Product["category"] })}
                className="w-full bg-[#E0E5EC] text-[#3D4852] font-medium rounded-2xl py-3 px-4 text-sm neu-input outline-none"
              >
                <option value="laptop">Laptop & Macbook</option>
                <option value="phone">Điện thoại & Tablet</option>
                <option value="audio">Âm thanh & Tai nghe</option>
                <option value="camera">Máy ảnh & Ống kính</option>
                <option value="accessory">Phụ kiện công nghệ</option>
              </select>
            </div>

            <NeuInput
              label="Thương hiệu *"
              value={productForm.brand}
              onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
              placeholder="Apple, Sony, Dell, Samsung..."
              required
            />
          </div>

          {/* Ô NHẬP GIÁ TIỀN RỘNG RÃI (BỎ VỠ SỐ LỚN, TABULAR-NUMS, NÚT +- 100K) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* GIÁ BÁN */}
            <div className="flex flex-col justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#6B7280]">
                GIÁ BÁN (VNĐ) *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={(e) => setPriceInput(formatCurrencyDisplay(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        handleAdjustPrice(100000);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        handleAdjustPrice(-100000);
                      }
                    }}
                    placeholder="0"
                    className="w-full bg-[#E0E5EC] text-[#3D4852] font-extrabold tabular-nums text-base md:text-lg rounded-2xl py-3.5 pl-4 pr-16 neu-input outline-none tracking-wide"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs md:text-sm font-black text-[#6B7280] pointer-events-none select-none tracking-normal">
                    VNĐ
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustPrice(-100000)}
                    className="h-12 w-12 rounded-2xl neu-btn flex items-center justify-center font-black text-lg text-[#6B7280] hover:text-[#E53E3E] cursor-pointer transition-colors active:scale-95"
                    title="Giảm 100.000 VNĐ (Phím mũi tên Xuống)"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustPrice(100000)}
                    className="h-12 w-12 rounded-2xl neu-btn flex items-center justify-center font-black text-lg text-[#6B7280] hover:text-[#6C63FF] cursor-pointer transition-colors active:scale-95"
                    title="Tăng 100.000 VNĐ (Phím mũi tên Lên)"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-[#6B7280] font-medium">
                Dùng nút + / - hoặc phím mũi tên Lên/Xuống để chỉnh ±100.000 VNĐ
              </p>
            </div>

            {/* GIÁ GỐC */}
            <div className="flex flex-col justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#6B7280]">
                GIÁ GỐC (VNĐ)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={originalPriceInput}
                    onChange={(e) => setOriginalPriceInput(formatCurrencyDisplay(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        handleAdjustOriginalPrice(100000);
                      } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        handleAdjustOriginalPrice(-100000);
                      }
                    }}
                    placeholder="0"
                    className="w-full bg-[#E0E5EC] text-[#3D4852] font-extrabold tabular-nums text-base md:text-lg rounded-2xl py-3.5 pl-4 pr-16 neu-input outline-none tracking-wide"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs md:text-sm font-black text-[#6B7280] pointer-events-none select-none tracking-normal">
                    VNĐ
                  </span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdjustOriginalPrice(-100000)}
                    className="h-12 w-12 rounded-2xl neu-btn flex items-center justify-center font-black text-lg text-[#6B7280] hover:text-[#E53E3E] cursor-pointer transition-colors active:scale-95"
                    title="Giảm 100.000 VNĐ (Phím mũi tên Xuống)"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustOriginalPrice(100000)}
                    className="h-12 w-12 rounded-2xl neu-btn flex items-center justify-center font-black text-lg text-[#6B7280] hover:text-[#6C63FF] cursor-pointer transition-colors active:scale-95"
                    title="Tăng 100.000 VNĐ (Phím mũi tên Lên)"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-[#6B7280] font-medium">
                Giá niêm yết trước khi áp dụng chiết khấu / khuyến mãi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="sm:col-span-1">
              <NeuInput
                label="Số lượng tồn kho *"
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                required
              />
            </div>

            {/* KHU VỰC CHỌN VÀ NHẬP HÌNH ẢNH */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#6B7280]">
                Hình ảnh sản phẩm
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={
                      productForm.image.startsWith("data:image/")
                        ? "Đã chọn ảnh từ máy tính (Định dạng Base64)"
                        : productForm.image
                    }
                    onChange={(e) => {
                      setProductForm({ ...productForm, image: e.target.value });
                      setImagePreviewError(false);
                    }}
                    placeholder="Dán link ảnh https://... hoặc bấm nút bên cạnh"
                    className="w-full bg-[#E0E5EC] text-[#3D4852] font-medium rounded-2xl py-3 pl-4 pr-12 text-sm neu-input outline-none"
                  />
                  {productForm.image && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductForm({ ...productForm, image: "" });
                        setImagePreviewError(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#E53E3E] hover:underline cursor-pointer"
                      title="Xóa ảnh hiện tại"
                    >
                      Xóa
                    </button>
                  )}
                </div>

                {/* Input file ẩn từ máy tính */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <NeuButton
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 flex items-center justify-center gap-2 whitespace-nowrap text-xs font-bold"
                >
                  <Upload className="h-4 w-4 text-[#6C63FF]" />
                  <span>Chọn ảnh từ máy tính</span>
                </NeuButton>
              </div>
            </div>
          </div>

          {/* KHUNG XEM TRƯỚC HÌNH ẢNH (IMAGE PREVIEW) */}
          <div className="rounded-2xl neu-inset p-4 bg-[#E0E5EC] flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden neu-extruded bg-[#E0E5EC] flex items-center justify-center">
              {productForm.image.trim() && !imagePreviewError ? (
                <img
                  src={productForm.image.trim()}
                  alt="Xem trước sản phẩm"
                  className="h-full w-full object-cover transition-all duration-300"
                  onError={() => setImagePreviewError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-1 text-center text-[#6B7280]">
                  <ImageOff className="h-6 w-6 mb-1 opacity-60" />
                  <span className="text-[10px] font-bold opacity-75">Chưa có ảnh</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-[#3D4852]">Xem trước ảnh sản phẩm</p>
                {productForm.image.trim() && !imagePreviewError && (
                  <NeuBadge variant="teal" className="text-[10px] py-0.5 px-2">
                    {productForm.image.startsWith("data:image/") ? "Ảnh từ máy tính (Sẵn sàng)" : "URL Hợp lệ"}
                  </NeuBadge>
                )}
              </div>
              {imagePreviewError ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#E53E3E] font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Link ảnh không hợp lệ hoặc không thể tải (sẽ tự động dùng ảnh mặc định khi lưu)</span>
                </p>
              ) : !productForm.image.trim() ? (
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
                  Chưa có ảnh. Bạn có thể dán link trực tuyến hoặc bấm <strong>"Chọn ảnh từ máy tính"</strong> (dung lượng &lt; 4MB). Khi để trống, hệ thống tự động gán ảnh chất lượng cao để tránh vỡ giao diện.
                </p>
              ) : (
                <p className="mt-1 text-xs text-[#38B2AC] font-medium truncate">
                  {productForm.image.startsWith("data:image/")
                    ? "Ảnh tải trực tiếp từ máy tính đã được chuyển đổi Base64 và sẵn sàng lưu vào hệ thống."
                    : productForm.image.trim()}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#6B7280]">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full bg-[#E0E5EC] text-[#3D4852] font-medium rounded-2xl p-3.5 text-sm neu-input outline-none"
              placeholder="Mô tả cấu hình, tính năng nổi bật..."
            />
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <NeuButton type="button" variant="secondary" size="md" onClick={() => setIsProductModalOpen(false)}>
              Hủy
            </NeuButton>
            <NeuButton type="submit" variant="primary" size="md" loading={loading}>
              Lưu sản phẩm
            </NeuButton>
          </div>
        </form>
      </NeuModal>

      {/* -------------------------------------------------------------------- */}
      {/*                        STAFF CREATE MODAL (ADMIN ONLY)               */}
      {/* -------------------------------------------------------------------- */}
      {isAdmin && (
        <NeuModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          title="Thêm nhân viên mới"
          subtitle="Tạo tài khoản nhân viên vận hành (Role: staff)"
        >
          <form onSubmit={handleSaveStaff} className="space-y-4">
            <NeuInput
              label="Họ và tên nhân viên *"
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              placeholder="Nguyễn Văn B"
              required
            />

            <NeuInput
              label="Email đăng nhập *"
              type="email"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
              placeholder="staff2@techhub.vn"
              required
            />

            <NeuInput
              label="Mật khẩu khởi tạo"
              type="text"
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              helperText="Mặc định: Test@123"
            />

            <div className="grid grid-cols-2 gap-4">
              <NeuInput
                label="Số điện thoại"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder="0912345678"
              />
              <NeuInput
                label="Địa chỉ / Chi nhánh"
                value={staffForm.address}
                onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                placeholder="Showroom Q.1, TP.HCM"
              />
            </div>

            <div className="pt-3 flex justify-end gap-3">
              <NeuButton type="button" variant="secondary" size="md" onClick={() => setIsStaffModalOpen(false)}>
                Hủy
              </NeuButton>
              <NeuButton type="submit" variant="primary" size="md" loading={loading}>
                Tạo tài khoản
              </NeuButton>
            </div>
          </form>
        </NeuModal>
      )}

      {/* -------------------------------------------------------------------- */}
      {/*                  DELETE PRODUCT CONFIRM MODAL (ADMIN)                */}
      {/* -------------------------------------------------------------------- */}
      {isAdmin && deleteProductConfirmId && (
        <NeuModal
          isOpen={true}
          onClose={() => setDeleteProductConfirmId(null)}
          title="Xác nhận xóa sản phẩm"
          maxWidth="sm"
        >
          <div className="space-y-4 text-center">
            <NeuIconWell size="lg" className="text-[#E53E3E] mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </NeuIconWell>
            <p className="text-xs text-[#6B7280]">
              Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <NeuButton variant="secondary" size="md" onClick={() => setDeleteProductConfirmId(null)}>
                Hủy bỏ
              </NeuButton>
              <NeuButton
                variant="danger"
                size="md"
                onClick={() => handleDeleteProduct(deleteProductConfirmId)}
                loading={loading}
              >
                Xóa ngay
              </NeuButton>
            </div>
          </div>
        </NeuModal>
      )}

      <NeuFooter />
    </div>
  );
}

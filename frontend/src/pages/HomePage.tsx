import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api, type Product, type RentalCamera, type Voucher } from "../services/api";
import SEO from "../components/SEO";
import {
  Camera,
  ShoppingBag,
  Star,
  CheckCircle2,
  Search,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingCart,
  Tag,
  Coins,
  Gift,
  X,
  Flame,
} from "lucide-react";
import {
  NeuNavbar,
  NeuFooter,
  NeuCard,
  NeuButton,
  NeuInput,
  NeuBadge,
  NeuIconWell,
  NeuModal,
  NeuSkeleton,
  NeuEmptyState,
} from "../components/NeumorphicComponents";
import PaymentQRCard from "../components/PaymentQRCard";

// Cấu hình hình ảnh sản phẩm nổi bật trên Hero Card (Dễ dàng thay đổi link hoặc upload ảnh mới)
const HERO_SHOWCASE_IMAGES = {
  // Ảnh cho tab "Thiết bị số & Laptop" (MacBook / Laptop công nghệ hiện đại)
  store: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
  // Ảnh cho tab "Thuê máy ảnh & Phụ kiện" (Máy ảnh chuyên nghiệp Mirrorless & Ống kính)
  rentals: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
};

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const { addToCart } = useCart();

  // Active Catalog Tab
  const [catalogTab, setCatalogTab] = useState<"store" | "rentals">("store");

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategory, setProductCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Cameras State
  const [cameras, setCameras] = useState<RentalCamera[]>([]);
  const [cameraBrand, setCameraBrand] = useState<string>("all");
  const [loadingCameras, setLoadingCameras] = useState<boolean>(true);

  // Quick Buy Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyQty, setBuyQty] = useState<number>(1);
  const [buyName, setBuyName] = useState<string>(user?.name || "");
  const [buyPhone, setBuyPhone] = useState<string>(user?.phone || "");
  const [buyAddress, setBuyAddress] = useState<string>(user?.address || "");
  const [buyPaymentMethod, setBuyPaymentMethod] = useState<"cod" | "banking" | "momo">("cod");
  const [buyPaymentPaid, setBuyPaymentPaid] = useState<boolean>(false);
  const [ordering, setOrdering] = useState<boolean>(false);
  const [buyErrors, setBuyErrors] = useState<{ phone?: string; address?: string }>({});

  // Quick Buy Voucher & Loyalty Points State
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [voucherInput, setVoucherInput] = useState<string>("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState<number>(0);
  const [validatingVoucher, setValidatingVoucher] = useState<boolean>(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const userPoints = user?.points || 0;
  const [pointsInput, setPointsInput] = useState<string>("");
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [isUseMaxPoints, setIsUseMaxPoints] = useState<boolean>(false);

  // Rental Booking Modal State
  const [selectedCamera, setSelectedCamera] = useState<RentalCamera | null>(null);
  const [rentalStartDate, setRentalStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [rentalEndDate, setRentalEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [rentalIdCard, setRentalIdCard] = useState<string>("");
  const [rentalName, setRentalName] = useState<string>(user?.name || "");
  const [rentalPhone, setRentalPhone] = useState<string>(user?.phone || "");
  const [rentalNotes, setRentalNotes] = useState<string>("");
  const [rentalPaymentMethod, setRentalPaymentMethod] = useState<"cod" | "banking" | "momo">("cod");
  const [rentalPaymentPaid, setRentalPaymentPaid] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [rentalErrors, setRentalErrors] = useState<{ idCard?: string; phone?: string }>({});

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; linkText?: string; linkTo?: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const res = await api.getProducts({
        category: productCategory,
        search: searchQuery,
      });
      console.log(`[Frontend] Loaded products for category="${productCategory}":`, res.data);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err: unknown) {
      console.error("Error fetching products:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [productCategory, searchQuery]);

  const fetchCameras = useCallback(async () => {
    try {
      setLoadingCameras(true);
      const res = await api.getRentalCameras(cameraBrand);
      if (res.success && res.data) {
        setCameras(res.data);
      }
    } catch (err: unknown) {
      console.error("Error fetching cameras:", err);
    } finally {
      setLoadingCameras(false);
    }
  }, [cameraBrand]);

  useEffect(() => {
    if (user) {
      if (!buyName) setBuyName(user.name);
      if (!buyPhone && user.phone) setBuyPhone(user.phone);
      if (!buyAddress && user.address) setBuyAddress(user.address);
      if (!rentalName) setRentalName(user.name);
      if (!rentalPhone && user.phone) setRentalPhone(user.phone);
    }
  }, [user, buyName, buyPhone, buyAddress, rentalName, rentalPhone]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await api.getVouchers();
        if (res.success && res.data) {
          setAvailableVouchers(res.data);
        }
      } catch (err) {
        console.warn("Could not load active vouchers:", err);
      }
    };
    fetchVouchers();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  // Quick Buy Financial Computations
  const buySubtotal = selectedProduct ? selectedProduct.price * buyQty : 0;
  const maxPointsDiscount = Math.max(0, buySubtotal - voucherDiscount);
  const maxPointsCanUse = Math.min(userPoints, Math.floor(maxPointsDiscount / 10000));
  const pointsDiscount = pointsToUse * 10000;
  const buyFinalTotal = Math.max(0, buySubtotal - voucherDiscount - pointsDiscount);
  const calculatedEarnedPoints = Math.floor(buyFinalTotal / 100000);

  const handleOpenQuickBuy = (item: Product) => {
    setSelectedProduct(item);
    setBuyQty(1);
    setBuyErrors({});
    setBuyPaymentPaid(false);
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherInput("");
    setVoucherMessage(null);
    setPointsToUse(0);
    setPointsInput("");
    setIsUseMaxPoints(false);
  };

  // Lắng nghe sự kiện mở Quick Buy từ Modal So sánh & Tin nổi bật
  useEffect(() => {
    const handleQuickBuyEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Product>;
      if (customEvent.detail) {
        handleOpenQuickBuy(customEvent.detail);
      }
    };
    window.addEventListener("techhub:open_quick_buy", handleQuickBuyEvent);
    return () => {
      window.removeEventListener("techhub:open_quick_buy", handleQuickBuyEvent);
    };
  }, []);

  const handleAdjustBuyQty = (newQty: number) => {
    const maxStock = selectedProduct?.stock || 99;
    const validQty = Math.max(1, Math.min(newQty, maxStock));
    setBuyQty(validQty);
    const newSubtotal = selectedProduct ? selectedProduct.price * validQty : 0;

    if (appliedVoucher) {
      if (appliedVoucher.minOrderValue && newSubtotal < appliedVoucher.minOrderValue) {
        setVoucherMessage({
          type: "error",
          text: `Đơn hàng chưa đạt ${formatVND(appliedVoucher.minOrderValue)} để áp dụng mã ${appliedVoucher.code}`,
        });
        setAppliedVoucher(null);
        setVoucherDiscount(0);
      } else if (appliedVoucher.discountType === "percent") {
        let disc = Math.round(newSubtotal * (appliedVoucher.discountValue / 100));
        if (appliedVoucher.maxDiscount && appliedVoucher.maxDiscount > 0) {
          disc = Math.min(disc, appliedVoucher.maxDiscount);
        }
        setVoucherDiscount(disc);
      }
    }

    // Giới hạn lại số điểm dùng theo subtotal mới
    const currentVoucherDisc = appliedVoucher ? voucherDiscount : 0;
    const remainingAfterVoucher = Math.max(0, newSubtotal - currentVoucherDisc);
    const newMaxPoints = Math.min(userPoints, Math.floor(remainingAfterVoucher / 10000));
    if (pointsToUse > newMaxPoints) {
      setPointsToUse(newMaxPoints);
      setPointsInput(newMaxPoints > 0 ? String(newMaxPoints) : "");
      if (newMaxPoints === 0) setIsUseMaxPoints(false);
    }
  };

  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    if (!code) {
      setVoucherMessage({ type: "error", text: "Vui lòng nhập mã ưu đãi" });
      return;
    }
    try {
      setValidatingVoucher(true);
      setVoucherMessage(null);
      const res = await api.validateVoucher({ code, orderTotal: buySubtotal });
      if (res.success && res.data?.isValid) {
        setAppliedVoucher(
          res.data.voucher ||
            ({
              code,
              discountType: "fixed",
              discountValue: res.data.discountAmount,
            } as Voucher)
        );
        setVoucherDiscount(res.data.discountAmount);
        setVoucherMessage({
          type: "success",
          text: res.message || `Áp dụng mã ${code} thành công: Giảm ${formatVND(res.data.discountAmount)}`,
        });
        setVoucherInput(code);

        const remaining = Math.max(0, buySubtotal - res.data.discountAmount);
        const newMaxPoints = Math.min(userPoints, Math.floor(remaining / 10000));
        if (pointsToUse > newMaxPoints) {
          setPointsToUse(newMaxPoints);
          setPointsInput(newMaxPoints > 0 ? String(newMaxPoints) : "");
          if (newMaxPoints === 0) setIsUseMaxPoints(false);
        }
      } else {
        setVoucherMessage({
          type: "error",
          text: res.message || "Mã không hợp lệ hoặc chưa đủ điều kiện áp dụng",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi khi kiểm tra mã ưu đãi";
      setVoucherMessage({ type: "error", text: msg });
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherInput("");
    setVoucherMessage(null);
  };

  const handleToggleMaxPoints = () => {
    if (isUseMaxPoints) {
      setIsUseMaxPoints(false);
      setPointsToUse(0);
      setPointsInput("");
    } else {
      setIsUseMaxPoints(true);
      setPointsToUse(maxPointsCanUse);
      setPointsInput(String(maxPointsCanUse));
    }
  };

  const handlePointsInputChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      setPointsInput("");
      setPointsToUse(0);
      setIsUseMaxPoints(false);
      return;
    }
    let num = parseInt(clean, 10);
    if (num > maxPointsCanUse) num = maxPointsCanUse;
    setPointsInput(String(num));
    setPointsToUse(num);
    setIsUseMaxPoints(num === maxPointsCanUse && maxPointsCanUse > 0);
  };

  // Submit Order with validation
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const errs: { phone?: string; address?: string } = {};
    if (!buyPhone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại";
    }
    if (!buyAddress.trim()) {
      errs.address = "Vui lòng nhập địa chỉ nhận hàng";
    }

    if (Object.keys(errs).length > 0) {
      setBuyErrors(errs);
      return;
    }

    try {
      setOrdering(true);
      await api.createOrder({
        customerName: buyName || "Khách hàng",
        customerEmail: user?.email || "customer@techhub.vn",
        customerPhone: buyPhone,
        shippingAddress: buyAddress,
        paymentMethod: buyPaymentMethod,
        paymentStatus: buyPaymentPaid ? "paid" : "pending",
        voucherCode: appliedVoucher ? appliedVoucher.code : (voucherInput.trim() ? voucherInput.trim().toUpperCase() : undefined),
        pointsToUse,
        items: [
          {
            productId: selectedProduct._id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            quantity: buyQty,
            image: selectedProduct.image,
          },
        ],
      });

      if (typeof refreshUser === "function") {
        await refreshUser();
      }

      setSelectedProduct(null);
      setToast({
        message: `Đặt hàng thành công sản phẩm "${selectedProduct.name}"! +${calculatedEarnedPoints} điểm tích lũy.`,
        linkText: "Xem đơn hàng của bạn",
        linkTo: "/account",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đặt hàng thất bại. Vui lòng thử lại.";
      alert(msg);
    } finally {
      setOrdering(false);
    }
  };

  // Quick Add To Cart from Home
  const handleQuickAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setToast({
      message: `Đã thêm "${product.name}" vào giỏ hàng!`,
      linkText: "Mở giỏ hàng",
      linkTo: "/cart",
    });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Calculate rental days & fees
  const calculateRentalDays = () => {
    const start = new Date(rentalStartDate);
    const end = new Date(rentalEndDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(days) ? 1 : days);
  };

  // Submit Rental Booking with validation
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera) return;

    const errs: { idCard?: string; phone?: string } = {};
    if (!rentalIdCard.trim()) {
      errs.idCard = "Vui lòng nhập số CCCD/CMND để làm hợp đồng";
    }
    if (!rentalPhone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại";
    }

    if (Object.keys(errs).length > 0) {
      setRentalErrors(errs);
      return;
    }

    try {
      setBookingLoading(true);
      await api.createBooking({
        cameraId: selectedCamera._id,
        startDate: rentalStartDate,
        endDate: rentalEndDate,
        idCardNumber: rentalIdCard,
        userName: rentalName || "Khách hàng",
        userEmail: user?.email || "customer@techhub.vn",
        userPhone: rentalPhone,
        notes: rentalNotes,
      });

      setSelectedCamera(null);
      setToast({
        message: `Đã giữ chỗ máy ảnh "${selectedCamera.name}" thành công!`,
        linkText: "Xem lịch thuê của bạn",
        linkTo: "/account",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đặt thuê thất bại";
      alert(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const rentalDays = calculateRentalDays();
  const rentalDailyRate = selectedCamera?.dailyRate || 0;
  const totalRentalFee = rentalDays * rentalDailyRate;
  const depositAmount = selectedCamera?.depositAmount || 0;
  const totalRentalCost = totalRentalFee + depositAmount;

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-[#3D4852] font-sans selection:bg-[#6C63FF] selection:text-white flex flex-col justify-between">
      {/* DYNAMIC SEO TAGS */}
      <SEO
        title="TechHub - Hệ Thống Bán Lẻ Công Nghệ & Thuê Máy Ảnh Cao Cấp"
        description="Khám phá Laptop, iPhone, phụ kiện công nghệ chính hãng và dịch vụ thuê máy ảnh Mirrorless chuyên nghiệp với quy trình đặt chỗ tự động tại TechHub."
        keywords="TechHub, mua laptop, mua iphone, thuê máy ảnh, sony a7 iv, canon r6, mua tai nghe"
      />

      {/* NAVBAR */}
      <NeuNavbar />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl neu-extruded bg-[#E0E5EC] p-4 text-sm shadow-2xl animate-fadeIn">
          <NeuIconWell size="sm" className="text-[#38B2AC]">
            <CheckCircle2 className="h-4 w-4" />
          </NeuIconWell>
          <div>
            <p className="font-bold text-[#3D4852]">{toast.message}</p>
            {toast.linkTo && (
              <Link
                to={toast.linkTo}
                className="mt-0.5 inline-block text-xs font-bold text-[#6C63FF] hover:underline"
              >
                {toast.linkText} →
              </Link>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-[#6B7280] hover:text-[#3D4852] p-1 rounded-lg hover:neu-inset-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 pt-24 md:pt-28">
        {/* HERO BANNER */}
        <section className="relative overflow-hidden py-16 md:py-20">
        {/* Ambient Neumorphic Background Circles */}
        <div className="absolute -top-12 -right-12 h-96 w-96 rounded-full neu-inset-deep opacity-40 animate-float-slow pointer-events-none" />
        <div className="absolute top-1/2 -left-20 h-80 w-80 rounded-full neu-extruded opacity-50 animate-float pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full neu-inset-sm px-4 py-1.5 text-xs font-bold tracking-wider text-[#6C63FF] uppercase mb-6">
                <Sparkles className="h-3.5 w-3.5" /> E-Commerce & Smart Camera Rental
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.1] tracking-tight text-[#3D4852]">
                Trải nghiệm công nghệ & <span className="text-[#6C63FF]">dịch vụ thuê máy</span> mượt mà.
              </h1>

              <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#6B7280] max-w-2xl font-medium">
                Nền tảng mua sắm thiết bị chính hãng và dịch vụ cho thuê máy ảnh, máy quay chuyên nghiệp với quy trình giữ lịch tự động hóa, giao tận nơi.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <NeuButton
                  id="hero-select-store-btn"
                  variant={catalogTab === "store" ? "primary" : "secondary"}
                  size="lg"
                  onClick={() => setCatalogTab("store")}
                  className="flex items-center gap-2.5"
                >
                  <ShoppingBag className="h-5 w-5" /> Mua thiết bị công nghệ
                </NeuButton>

                <NeuButton
                  id="hero-select-rentals-btn"
                  variant={catalogTab === "rentals" ? "primary" : "secondary"}
                  size="lg"
                  onClick={() => setCatalogTab("rentals")}
                  className="flex items-center gap-2.5"
                >
                  <Camera className="h-5 w-5" /> Thuê máy ảnh chuyên nghiệp
                </NeuButton>

                <NeuButton
                  id="hero-compare-highlights-btn"
                  variant="secondary"
                  size="lg"
                  onClick={() => window.dispatchEvent(new CustomEvent("techhub:open_compare_modal"))}
                  className="flex items-center gap-2 font-black text-[#E53E3E] border border-orange-200/80 shadow-md"
                >
                  <Flame className="h-5 w-5 text-[#E53E3E] fill-[#E53E3E]" /> 🔥 Tin nổi bật & So sánh
                </NeuButton>
              </div>

              {/* Trust Badges in Soft Inset Row */}
              <div className="mt-12 grid grid-cols-3 gap-4 pt-6 border-t border-[#D1D9E6]/80 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <NeuIconWell size="sm">
                    <Truck className="h-4 w-4" />
                  </NeuIconWell>
                  <div>
                    <p className="text-xs font-bold text-[#3D4852]">Giao hỏa tốc</p>
                    <p className="text-[11px] text-[#6B7280]">Toàn quốc 2h - 48h</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <NeuIconWell size="sm">
                    <ShieldCheck className="h-4 w-4" />
                  </NeuIconWell>
                  <div>
                    <p className="text-xs font-bold text-[#3D4852]">Bảo hành 12T</p>
                    <p className="text-[11px] text-[#6B7280]">Chính hãng 100%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <NeuIconWell size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </NeuIconWell>
                  <div>
                    <p className="text-xs font-bold text-[#3D4852]">Đổi trả 7 ngày</p>
                    <p className="text-[11px] text-[#6B7280]">Lỗi 1 đổi 1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase Visual Hero Card */}
            <div className="md:col-span-5 flex justify-center">
              <NeuCard rounded="32" className="p-7 w-full max-w-sm text-center relative overflow-hidden">
                {/* Product Image Frame with Inset Deep Well */}
                <div className="relative mx-auto w-full aspect-4/3 rounded-2xl neu-inset-deep p-2.5 bg-[#E0E5EC] overflow-hidden group">
                  <img
                    src={
                      catalogTab === "store"
                        ? HERO_SHOWCASE_IMAGES.store
                        : HERO_SHOWCASE_IMAGES.rentals
                    }
                    alt={catalogTab === "store" ? "Thiết bị số & Laptop" : "Máy ảnh & Phụ kiện"}
                    className="h-full w-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                    loading="eager"
                  />
                  <span className="absolute top-4 left-4 rounded-full neu-extruded-sm bg-[#E0E5EC]/95 backdrop-blur-sm px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D4852]">
                    {catalogTab === "store" ? "Nổi bật" : "Sẵn sàng thuê"}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-extrabold font-display text-[#3D4852]">
                  {catalogTab === "store" ? "Thiết bị số & Laptop" : "Máy ảnh & Phụ kiện"}
                </h3>
                <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
                  {catalogTab === "store"
                    ? "Hàng trăm sản phẩm công nghệ thế hệ mới cập nhật liên tục mỗi ngày."
                    : "Dàn máy ảnh Sony, Canon, Fujifilm sẵn sàng phục vụ quay chụp sự kiện."}
                </p>
              </NeuCard>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION */}
      <section className="mx-auto max-w-7xl px-6 py-10 w-full">
        {/* VIEW: STORE PRODUCTS */}
        {catalogTab === "store" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#D1D9E6]/80">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#3D4852]">
                  Cửa hàng thiết bị công nghệ
                </h2>
                <p className="text-sm text-[#6B7280] mt-1 font-medium">
                  Sản phẩm chính hãng, bảo hành 12 tháng, giao hàng hỏa tốc
                </p>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px]">
                  <NeuInput
                    id="product-search-input"
                    type="text"
                    placeholder="Tìm laptop, điện thoại..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search className="h-4 w-4 text-[#6B7280]" />}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl neu-inset bg-[#E0E5EC]">
                  {[
                    { id: "all", label: "Tất cả" },
                    { id: "laptop", label: "Laptop" },
                    { id: "phone", label: "Điện thoại" },
                    { id: "audio", label: "Âm thanh" },
                    { id: "camera", label: "Máy ảnh" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setProductCategory(cat.id)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        productCategory === cat.id
                          ? "neu-accent font-extrabold"
                          : "text-[#6B7280] hover:text-[#3D4852]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PRODUCT GRID */}
            {loadingProducts ? (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <NeuCard key={i} rounded="32" className="p-6 space-y-4">
                    <NeuSkeleton className="h-48 w-full" rounded="24" />
                    <NeuSkeleton className="h-6 w-3/4" />
                    <NeuSkeleton className="h-4 w-full" />
                    <NeuSkeleton className="h-10 w-full" rounded="16" />
                  </NeuCard>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="my-10">
                <NeuEmptyState
                  icon={<ShoppingBag className="h-8 w-8" />}
                  title="Không tìm thấy sản phẩm"
                  description="Không có sản phẩm nào khớp với từ khóa tìm kiếm hoặc danh mục đã chọn."
                  actionText="Đặt lại bộ lọc"
                  onAction={() => {
                    setProductCategory("all");
                    setSearchQuery("");
                  }}
                />
              </div>
            ) : (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((item) => (
                  <NeuCard
                    key={item._id}
                    rounded="32"
                    hoverable
                    className="p-6 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Container with Inset Well */}
                      <Link to={`/products/${item._id}`} className="block">
                        <div className="relative overflow-hidden rounded-2xl neu-inset p-2 bg-[#E0E5EC] aspect-video">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover rounded-xl transition duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-4 left-4 rounded-full neu-extruded-sm bg-[#E0E5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D4852]">
                            {item.brand}
                          </span>
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="mt-5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wider text-[#6B7280] font-bold">
                            {item.category}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-[#D97706] font-bold neu-inset-sm px-2.5 py-0.5 rounded-full">
                            <Star className="h-3.5 w-3.5 fill-[#D97706]" /> {item.rating}
                          </div>
                        </div>

                        <Link to={`/products/${item._id}`} className="block">
                          <h3 className="mt-2 text-lg font-extrabold font-display text-[#3D4852] line-clamp-1 group-hover:text-[#6C63FF] transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="mt-1.5 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Specs pills */}
                      {item.specs && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {Object.entries(item.specs)
                            .slice(0, 2)
                            .map(([key, val]) => (
                              <span
                                key={key}
                                className="rounded-xl neu-inset-sm px-2.5 py-1 text-[11px] font-semibold text-[#6B7280] bg-[#E0E5EC]"
                              >
                                {key}: <strong className="text-[#3D4852]">{val}</strong>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Price and Actions */}
                    <div className="mt-6 flex items-center justify-between border-t border-[#D1D9E6]/70 pt-4 gap-2">
                      <div>
                        <div className="text-lg font-black text-[#6C63FF] font-display">
                          {formatVND(item.price)}
                        </div>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="text-xs text-[#9CA3AF] line-through font-medium">
                            {formatVND(item.originalPrice)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <NeuButton
                          variant="secondary"
                          size="icon"
                          onClick={(e) => handleQuickAddToCart(item, e)}
                          title="Thêm vào giỏ hàng"
                          aria-label="Thêm vào giỏ hàng"
                        >
                          <ShoppingCart className="h-4 w-4 text-[#6C63FF]" />
                        </NeuButton>

                        <NeuButton
                          variant="primary"
                          size="md"
                          onClick={() => handleOpenQuickBuy(item)}
                        >
                          Mua ngay
                        </NeuButton>
                      </div>
                    </div>
                  </NeuCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: CAMERA RENTALS */}
        {catalogTab === "rentals" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#D1D9E6]/80">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#3D4852]">
                  Dàn máy ảnh & máy quay cho thuê
                </h2>
                <p className="text-sm text-[#6B7280] mt-1 font-medium">
                  Kèm đầy đủ phụ kiện (2 Pin zin + Sạc nhanh + Thẻ nhớ V90 + Túi bảo vệ). Đặt giữ lịch trực tuyến.
                </p>
              </div>

              {/* Brand filters */}
              <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl neu-inset bg-[#E0E5EC]">
                {["all", "Sony", "Canon", "Fujifilm", "Blackmagic"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setCameraBrand(b)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      cameraBrand === b ? "neu-accent font-extrabold" : "text-[#6B7280] hover:text-[#3D4852]"
                    }`}
                  >
                    {b === "all" ? "Tất cả hãng" : b}
                  </button>
                ))}
              </div>
            </div>

            {/* CAMERA GRID */}
            {loadingCameras ? (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <NeuCard key={i} rounded="32" className="p-6 space-y-4">
                    <NeuSkeleton className="h-48 w-full" rounded="24" />
                    <NeuSkeleton className="h-6 w-3/4" />
                    <NeuSkeleton className="h-4 w-full" />
                    <NeuSkeleton className="h-10 w-full" rounded="16" />
                  </NeuCard>
                ))}
              </div>
            ) : cameras.length === 0 ? (
              <div className="my-10">
                <NeuEmptyState
                  icon={<Camera className="h-8 w-8" />}
                  title="Không tìm thấy máy ảnh"
                  description="Hiện không có máy ảnh nào phù hợp với bộ lọc hãng đã chọn."
                  actionText="Xem tất cả máy ảnh"
                  onAction={() => setCameraBrand("all")}
                />
              </div>
            ) : (
              <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {cameras.map((cam) => (
                  <NeuCard
                    key={cam._id}
                    rounded="32"
                    hoverable
                    className="p-6 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative overflow-hidden rounded-2xl neu-inset p-2 bg-[#E0E5EC] aspect-video">
                        <img
                          src={cam.image}
                          alt={cam.name}
                          className="h-full w-full object-cover rounded-xl transition duration-500 hover:scale-105"
                        />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <span className="rounded-full neu-extruded-sm bg-[#E0E5EC] px-3 py-1 text-[11px] font-extrabold text-[#3D4852]">
                            {cam.brand}
                          </span>
                          <NeuBadge variant="teal" className="text-[10px]">
                            Còn {cam.availableQuantity} máy
                          </NeuBadge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-5">
                        <h3 className="text-lg font-extrabold font-display text-[#3D4852]">
                          {cam.name}
                        </h3>
                        <p className="mt-1.5 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                          {cam.description}
                        </p>
                      </div>

                      {/* Specs */}
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="flex items-center justify-between rounded-xl neu-inset-sm px-3 py-1.5 bg-[#E0E5EC]">
                          <span className="text-[#6B7280] font-medium">Cảm biến:</span>
                          <span className="font-bold text-[#3D4852]">{cam.sensorType}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl neu-inset-sm px-3 py-1.5 bg-[#E0E5EC]">
                          <span className="text-[#6B7280] font-medium">Độ phân giải:</span>
                          <span className="font-bold text-[#3D4852]">{cam.maxResolution}</span>
                        </div>
                      </div>

                      {/* Accessories */}
                      <div className="mt-4">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280] block mb-2">
                          Phụ kiện đi kèm:
                        </span>
                        <ul className="space-y-1 text-xs text-[#6B7280]">
                          {cam.includedAccessories.slice(0, 3).map((acc, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#38B2AC]" />
                              <span>{acc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Pricing and Booking */}
                    <div className="mt-6 border-t border-[#D1D9E6]/70 pt-4">
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          <span className="text-xl font-extrabold text-[#38B2AC] font-display">
                            {formatVND(cam.dailyRate)}
                          </span>
                          <span className="text-xs text-[#6B7280]"> /ngày</span>
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          Cọc: <strong className="text-[#3D4852]">{formatVND(cam.depositAmount)}</strong>
                        </div>
                      </div>

                      <NeuButton
                        variant={cam.availableQuantity > 0 ? "teal" : "secondary"}
                        size="md"
                        disabled={cam.availableQuantity <= 0}
                        onClick={() => {
                          setSelectedCamera(cam);
                          setRentalPaymentPaid(false);
                          setRentalErrors({});
                        }}
                        className="w-full font-bold"
                      >
                        {cam.availableQuantity > 0 ? "Đặt thuê máy ảnh này →" : "Tạm hết máy"}
                      </NeuButton>
                    </div>
                  </NeuCard>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
      </main>

      {/* MODAL: MUA SẢN PHẨM CÔNG NGHỆ */}
      <NeuModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Xác nhận đặt mua sản phẩm"
        subtitle="Vui lòng kiểm tra kỹ thông tin đơn hàng, mã giảm giá và địa chỉ nhận hàng"
        maxWidth="xl"
        id="buy-product-modal"
      >
        {selectedProduct && (
          <form onSubmit={handleCreateOrder} className="space-y-5">
            {/* 1. PRODUCT PREVIEW & QUANTITY */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl neu-inset p-4 bg-[#E0E5EC]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="h-16 w-16 rounded-2xl object-cover shrink-0 neu-extruded"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-[#3D4852] line-clamp-1">{selectedProduct.name}</h4>
                  <p className="text-xs text-[#6C63FF] font-black mt-0.5">
                    Đơn giá: {formatVND(selectedProduct.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none border-[#D1D9E6]/60 pt-2 sm:pt-0">
                <span className="text-xs text-[#6B7280] font-bold sm:hidden">Số lượng:</span>
                <div className="flex items-center gap-1.5 neu-extruded-sm rounded-xl p-1 bg-[#E0E5EC]">
                  <button
                    type="button"
                    onClick={() => handleAdjustBuyQty(buyQty - 1)}
                    disabled={buyQty <= 1}
                    className="h-7 w-7 rounded-lg text-xs font-black hover:neu-inset-sm cursor-pointer flex items-center justify-center text-[#3D4852] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Giảm 1 sản phẩm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={selectedProduct?.stock || 99}
                    value={buyQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        handleAdjustBuyQty(val);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const maxStock = selectedProduct?.stock || 99;
                      if (isNaN(val) || val < 1) {
                        handleAdjustBuyQty(1);
                      } else if (val > maxStock) {
                        handleAdjustBuyQty(maxStock);
                      }
                    }}
                    className="w-12 text-center text-xs font-black text-[#3D4852] bg-transparent outline-none py-1 focus:bg-white/60 rounded-md transition"
                    title={`Tồn kho còn: ${selectedProduct?.stock || 0} sản phẩm`}
                  />
                  <button
                    type="button"
                    onClick={() => handleAdjustBuyQty(buyQty + 1)}
                    disabled={buyQty >= (selectedProduct?.stock || 99)}
                    className="h-7 w-7 rounded-lg text-xs font-black hover:neu-inset-sm cursor-pointer flex items-center justify-center text-[#3D4852] disabled:opacity-30 disabled:cursor-not-allowed"
                    title={buyQty >= (selectedProduct?.stock || 99) ? "Đã đạt tối đa số lượng tồn kho" : "Tăng 1 sản phẩm"}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 2. VOUCHER / PROMO CODE SECTION */}
            <div className="rounded-2xl neu-card p-4 space-y-3 bg-[#E0E5EC]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#6C63FF]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#3D4852]">
                    Mã ưu đãi / Khuyến mãi
                  </span>
                </div>
                {appliedVoucher && (
                  <NeuBadge variant="teal" className="text-[11px] py-0.5 px-2">
                    Đã áp dụng mã {appliedVoucher.code}
                  </NeuBadge>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                    placeholder="Nhập mã giảm giá (VD: TECHHUB200K)..."
                    className="w-full bg-[#E0E5EC] text-[#3D4852] font-bold rounded-2xl py-2.5 pl-4 pr-10 text-xs neu-input outline-none uppercase placeholder:normal-case"
                  />
                  {voucherInput && (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E53E3E] hover:opacity-80 p-1"
                      title="Xóa mã"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <NeuButton
                  type="button"
                  variant={appliedVoucher ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => handleApplyVoucher()}
                  loading={validatingVoucher}
                  disabled={validatingVoucher || !voucherInput.trim()}
                  className="shrink-0 text-xs font-bold"
                >
                  {appliedVoucher ? "Đổi mã" : "Áp dụng"}
                </NeuButton>
              </div>

              {voucherMessage && (
                <p
                  className={`text-xs font-bold flex items-center gap-1.5 ${
                    voucherMessage.type === "success" ? "text-[#38B2AC]" : "text-[#E53E3E]"
                  }`}
                >
                  {voucherMessage.type === "success" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <span className="shrink-0">⚠️</span>
                  )}
                  {voucherMessage.text}
                </p>
              )}

              {/* Quick voucher suggestions */}
              {availableVouchers.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-[#6B7280] mb-2 flex items-center gap-1">
                    <Gift className="h-3 w-3 text-[#6C63FF]" /> Mã giảm giá khả dụng:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {availableVouchers.map((v) => {
                      const isSelected = appliedVoucher?.code === v.code;
                      const isEligible = !v.minOrderValue || buySubtotal >= v.minOrderValue;

                      return (
                        <button
                          key={v._id}
                          type="button"
                          onClick={() => {
                            setVoucherInput(v.code);
                            handleApplyVoucher(v.code);
                          }}
                          className={`shrink-0 text-left p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                            isSelected
                              ? "neu-accent font-bold"
                              : isEligible
                              ? "neu-btn text-[#3D4852] hover:border-[#6C63FF]"
                              : "opacity-60 neu-inset-sm text-[#9CA3AF]"
                          }`}
                        >
                          <div className="font-mono font-extrabold text-[#6C63FF]">{v.code}</div>
                          <div className="text-[10px] text-[#6B7280] mt-0.5">
                            {v.discountType === "percent" ? `Giảm ${v.discountValue}%` : `Giảm ${formatVND(v.discountValue)}`}
                          </div>
                          {v.minOrderValue > 0 && (
                            <div className="text-[9px] text-[#9CA3AF]">Đơn từ {formatVND(v.minOrderValue)}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. LOYALTY POINTS SECTION */}
            <div className="rounded-2xl neu-card p-4 space-y-3 bg-[#E0E5EC]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F6AD55]" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#3D4852]">
                    Điểm thưởng thành viên
                  </span>
                </div>
                <span className="text-xs font-extrabold text-[#6C63FF] neu-inset-sm px-2.5 py-1 rounded-xl">
                  ★ {userPoints} điểm (~ {formatVND(userPoints * 10000)})
                </span>
              </div>

              {userPoints > 0 ? (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={pointsInput}
                        onChange={(e) => handlePointsInputChange(e.target.value)}
                        placeholder={`Tối đa có thể dùng: ${maxPointsCanUse} điểm`}
                        className="w-full bg-[#E0E5EC] text-[#3D4852] font-bold rounded-2xl py-2.5 pl-4 pr-14 text-xs neu-input outline-none"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-[#6B7280] pointer-events-none">
                        điểm
                      </span>
                    </div>

                    <NeuButton
                      type="button"
                      variant={isUseMaxPoints ? "secondary" : "teal"}
                      size="sm"
                      onClick={handleToggleMaxPoints}
                      disabled={maxPointsCanUse <= 0}
                      className="shrink-0 text-xs font-bold whitespace-nowrap"
                    >
                      {isUseMaxPoints ? "Hủy dùng" : "Dùng tối đa"}
                    </NeuButton>
                  </div>

                  {pointsToUse > 0 && (
                    <p className="text-xs font-bold text-[#38B2AC] flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5" />
                      Quy đổi giảm: -{formatVND(pointsDiscount)} (1 điểm = 10.000 VNĐ)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] font-medium leading-relaxed">
                  {user
                    ? "Bạn chưa có điểm thưởng. Mỗi 100.000 VNĐ thanh toán đơn này sẽ được tích lũy 1 điểm thưởng cho lần mua sau."
                    : "Đăng nhập tài khoản để tích lũy và đổi điểm thưởng giảm giá trực tiếp vào đơn hàng."}
                </p>
              )}
            </div>

            {/* 4. CUSTOMER INFO */}
            <div className="space-y-3">
              <NeuInput
                id="modal-buy-name"
                label="Họ tên người nhận *"
                type="text"
                required
                value={buyName}
                onChange={(e) => setBuyName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NeuInput
                  id="modal-buy-phone"
                  label="Số điện thoại giao hàng *"
                  type="tel"
                  required
                  value={buyPhone}
                  onChange={(e) => {
                    setBuyPhone(e.target.value);
                    if (buyErrors.phone) setBuyErrors({ ...buyErrors, phone: undefined });
                  }}
                  error={buyErrors.phone}
                  placeholder="0987654321"
                />

                <NeuInput
                  id="modal-buy-address"
                  label="Địa chỉ nhận hàng *"
                  type="text"
                  required
                  value={buyAddress}
                  onChange={(e) => {
                    setBuyAddress(e.target.value);
                    if (buyErrors.address) setBuyErrors({ ...buyErrors, address: undefined });
                  }}
                  error={buyErrors.address}
                  placeholder="Số nhà, đường, P/X, Q/H..."
                />
              </div>
            </div>

            {/* 5. PAYMENT METHOD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Phương thức thanh toán
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(["cod", "banking", "momo"] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => {
                      setBuyPaymentMethod(pm);
                      setBuyPaymentPaid(false);
                    }}
                    className={`rounded-2xl p-2.5 text-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                      buyPaymentMethod === pm
                        ? "neu-accent font-extrabold"
                        : "neu-btn text-[#6B7280]"
                    }`}
                  >
                    {pm === "cod" ? "COD (Khi nhận)" : pm === "banking" ? "Chuyển khoản" : "Ví MoMo"}
                  </button>
                ))}
              </div>

              {/* QR CODE PAYMENT (Chuyển khoản VietQR hoặc Ví MoMo) */}
              {(buyPaymentMethod === "banking" || buyPaymentMethod === "momo") && (
                <div className="pt-2">
                  <PaymentQRCard
                    method={buyPaymentMethod}
                    finalAmount={buyFinalTotal}
                    customerPhone={buyPhone}
                    onPaymentSuccess={() => setBuyPaymentPaid(true)}
                    onStatusChange={(status) => setBuyPaymentPaid(status === "PAID")}
                  />
                </div>
              )}
            </div>

            {/* 6. FINANCIAL BREAKDOWN & TOTAL CALCULATION */}
            <div className="rounded-2xl neu-inset p-4 bg-[#E0E5EC] space-y-2">
              <div className="flex justify-between items-center text-xs text-[#6B7280]">
                <span>Tạm tính ({buyQty} sản phẩm):</span>
                <span className="font-bold text-[#3D4852]">{formatVND(buySubtotal)}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between items-center text-xs text-[#38B2AC]">
                  <span className="font-bold">Mã giảm giá ({appliedVoucher?.code}):</span>
                  <span className="font-extrabold">- {formatVND(voucherDiscount)}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between items-center text-xs text-[#6C63FF]">
                  <span className="font-bold">Đổi {pointsToUse} điểm thưởng:</span>
                  <span className="font-extrabold">- {formatVND(pointsDiscount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#D1D9E6] flex justify-between items-center">
                <div>
                  <span className="text-xs text-[#6B7280] font-bold block">Tổng thanh toán:</span>
                  {calculatedEarnedPoints > 0 && (
                    <span className="text-[11px] text-[#6C63FF] font-extrabold inline-flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3" />
                      +{calculatedEarnedPoints} điểm sau đơn này
                    </span>
                  )}
                </div>
                <span className="text-xl font-black text-[#6C63FF] font-display">
                  {formatVND(buyFinalTotal)}
                </span>
              </div>
            </div>

            {/* Cảnh báo chờ thanh toán QR nếu chưa PAID */}
            {(buyPaymentMethod === "banking" || buyPaymentMethod === "momo") && !buyPaymentPaid && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[11px] text-center font-bold animate-fadeIn">
                ⚠️ Vui lòng quét mã QR thanh toán phía trên để hoàn tất (Hệ thống AI sẽ tự động mở khóa nút ngay khi nhận được tiền).
              </div>
            )}

            {/* 7. ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">
              <NeuButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setSelectedProduct(null)}
                className="flex-1"
              >
                Đóng
              </NeuButton>
              <NeuButton
                type="submit"
                variant="primary"
                size="md"
                disabled={ordering || ((buyPaymentMethod === "banking" || buyPaymentMethod === "momo") && !buyPaymentPaid)}
                loading={ordering}
                className={`flex-1 font-extrabold transition-all ${
                  buyPaymentPaid
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-400"
                    : (buyPaymentMethod === "banking" || buyPaymentMethod === "momo") && !buyPaymentPaid
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {buyPaymentPaid
                  ? "Đã thanh toán - Tạo đơn ngay"
                  : (buyPaymentMethod === "banking" || buyPaymentMethod === "momo")
                  ? "Chờ thanh toán QR..."
                  : "Tạo đơn hàng ngay"}
              </NeuButton>
            </div>
          </form>
        )}
      </NeuModal>

      {/* MODAL: ĐẶT THUÊ MÁY ẢNH */}
      <NeuModal
        isOpen={!!selectedCamera}
        onClose={() => setSelectedCamera(null)}
        title="Hợp đồng đặt thuê máy ảnh"
        subtitle="Hệ thống tự động tính ngày thuê và lập hợp đồng bàn giao máy"
        maxWidth="lg"
        id="rent-camera-modal"
      >
        {selectedCamera && (
          <form onSubmit={handleCreateBooking} className="space-y-4">
            {/* Camera header */}
            <div className="flex items-center gap-4 rounded-2xl neu-inset p-3 bg-[#E0E5EC]">
              <img
                src={selectedCamera.image}
                alt={selectedCamera.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h4 className="font-extrabold text-sm text-[#3D4852]">{selectedCamera.name}</h4>
                <p className="text-xs text-[#38B2AC] font-bold mt-0.5">
                  {formatVND(selectedCamera.dailyRate)} / ngày
                </p>
              </div>
            </div>

            {/* Rental Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Ngày nhận máy *
                </label>
                <input
                  type="date"
                  required
                  value={rentalStartDate}
                  onChange={(e) => setRentalStartDate(e.target.value)}
                  className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-xs text-[#3D4852] font-semibold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                  Ngày trả máy *
                </label>
                <input
                  type="date"
                  required
                  value={rentalEndDate}
                  onChange={(e) => setRentalEndDate(e.target.value)}
                  className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-xs text-[#3D4852] font-semibold outline-none"
                />
              </div>
            </div>

            {/* Customer ID / Phone */}
            <NeuInput
              id="modal-rent-idcard"
              label="Số Căn cước công dân (CCCD / CMND) *"
              type="text"
              required
              value={rentalIdCard}
              onChange={(e) => {
                setRentalIdCard(e.target.value);
                if (rentalErrors.idCard) setRentalErrors({ ...rentalErrors, idCard: undefined });
              }}
              error={rentalErrors.idCard}
              placeholder="079098xxxxxx (Dùng để lập hợp đồng bàn giao)"
            />

            <div className="grid grid-cols-2 gap-3">
              <NeuInput
                id="modal-rent-name"
                label="Họ và tên *"
                type="text"
                required
                value={rentalName}
                onChange={(e) => setRentalName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
              <NeuInput
                id="modal-rent-phone"
                label="Số điện thoại *"
                type="tel"
                required
                value={rentalPhone}
                onChange={(e) => {
                  setRentalPhone(e.target.value);
                  if (rentalErrors.phone) setRentalErrors({ ...rentalErrors, phone: undefined });
                }}
                error={rentalErrors.phone}
                placeholder="0987654321"
              />
            </div>

            <NeuInput
              id="modal-rent-notes"
              label="Ghi chú hoặc yêu cầu thêm ống kính"
              type="text"
              value={rentalNotes}
              onChange={(e) => setRentalNotes(e.target.value)}
              placeholder="Ví dụ: Cần thêm filter CPL, tripod chụp sự kiện..."
            />

            {/* Phương thức thanh toán cọc / thuê */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                Phương thức thanh toán cọc & tiền thuê
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(["cod", "banking", "momo"] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => {
                      setRentalPaymentMethod(pm);
                      setRentalPaymentPaid(false);
                    }}
                    className={`rounded-2xl p-2.5 text-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                      rentalPaymentMethod === pm
                        ? "neu-accent font-extrabold"
                        : "neu-btn text-[#6B7280]"
                    }`}
                  >
                    {pm === "cod" ? "Tại Showroom" : pm === "banking" ? "Chuyển khoản" : "Ví MoMo"}
                  </button>
                ))}
              </div>

              {/* QR Code thanh toán nếu chọn Chuyển khoản hoặc MoMo */}
              {(rentalPaymentMethod === "banking" || rentalPaymentMethod === "momo") && (
                <div className="pt-3">
                  <PaymentQRCard
                    method={rentalPaymentMethod}
                    finalAmount={totalRentalCost}
                    customerPhone={rentalPhone}
                    onPaymentSuccess={() => setRentalPaymentPaid(true)}
                    onStatusChange={(status) => setRentalPaymentPaid(status === "PAID")}
                  />
                </div>
              )}
            </div>

            {/* Summary Calculation */}
            <div className="rounded-2xl neu-inset p-4 bg-[#E0E5EC] space-y-2 text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Thời gian thuê:</span>
                <span className="text-[#3D4852] font-bold">{rentalDays} ngày</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Tiền thuê ({rentalDays} x {formatVND(rentalDailyRate)}):</span>
                <span className="text-[#3D4852] font-semibold">{formatVND(totalRentalFee)}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>Tiền cọc máy ảnh (Hoàn trả khi trả máy):</span>
                <span className="text-[#3D4852] font-semibold">{formatVND(depositAmount)}</span>
              </div>
              <div className="border-t border-[#D1D9E6] pt-2 flex justify-between font-extrabold text-sm">
                <span className="text-[#3D4852]">Tổng tạm tính:</span>
                <span className="text-[#38B2AC] font-display">{formatVND(totalRentalCost)}</span>
              </div>
            </div>

            {/* Cảnh báo chờ thanh toán QR cọc & tiền thuê nếu chưa PAID */}
            {(rentalPaymentMethod === "banking" || rentalPaymentMethod === "momo") && !rentalPaymentPaid && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[11px] text-center font-bold animate-fadeIn">
                ⚠️ Vui lòng quét mã QR thanh toán cọc & tiền thuê phía trên để hoàn tất giữ máy (Hệ thống AI sẽ tự động mở khóa nút ngay khi nhận được tiền).
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <NeuButton
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setSelectedCamera(null)}
                className="flex-1"
              >
                Hủy
              </NeuButton>
              <NeuButton
                type="submit"
                variant="teal"
                size="md"
                disabled={bookingLoading || ((rentalPaymentMethod === "banking" || rentalPaymentMethod === "momo") && !rentalPaymentPaid)}
                loading={bookingLoading}
                className={`flex-1 transition-all ${
                  rentalPaymentPaid
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border border-emerald-400 font-extrabold"
                    : (rentalPaymentMethod === "banking" || rentalPaymentMethod === "momo") && !rentalPaymentPaid
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {rentalPaymentPaid
                  ? "Đã thanh toán - Đặt giữ máy"
                  : (rentalPaymentMethod === "banking" || rentalPaymentMethod === "momo")
                  ? "Chờ thanh toán QR..."
                  : "Xác nhận đặt giữ máy"}
              </NeuButton>
            </div>
          </form>
        )}
      </NeuModal>

      {/* FOOTER */}
      <NeuFooter />
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Tag,
  ShoppingBag,
  Coins,
  Gift,
  Sparkles,
  X,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api, type Voucher } from "../services/api";
import SEO from "../components/SEO";
import {
  NeuNavbar,
  NeuFooter,
  NeuCard,
  NeuButton,
  NeuInput,
  NeuBadge,
  NeuIconWell,
  NeuEmptyState,
} from "../components/NeumorphicComponents";
import PaymentQRCard from "../components/PaymentQRCard";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const { user, refreshUser } = useAuth();

  // Form Fields & Realtime Validation
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [shippingAddress, setShippingAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking" | "momo">("cod");
  const [orderNotes, setOrderNotes] = useState("");

  // Voucher / Promo State
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Loyalty Points State
  const userPoints = user?.points || 0;
  const [pointsInput, setPointsInput] = useState<string>("");
  const [pointsToUse, setPointsToUse] = useState<number>(0);
  const [isUseMaxPoints, setIsUseMaxPoints] = useState<boolean>(false);

  // Field Errors (Realtime)
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>("");
  const [earnedPointsFinal, setEarnedPointsFinal] = useState<number>(0);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!shippingAddress && user.address) setShippingAddress(user.address);
    }
  }, [user, customerName, customerPhone, customerEmail, shippingAddress]);

  // Load active vouchers from API
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await api.getVouchers();
        if (res.success && res.data) {
          setAvailableVouchers(res.data);
        }
      } catch (err) {
        console.warn("Lỗi tải danh sách voucher:", err);
      }
    };
    fetchVouchers();
  }, []);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const validateForm = () => {
    const newErrors: { name?: string; phone?: string; address?: string } = {};

    if (!customerName.trim()) {
      newErrors.name = "Vui lòng nhập họ và tên người nhận";
    }

    if (!customerPhone.trim()) {
      newErrors.phone = "Vui lòng nhập số điện thoại giao hàng";
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(customerPhone.trim().replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không đúng định dạng (10 số, ví dụ 0912345678)";
    }

    if (!shippingAddress.trim()) {
      newErrors.address = "Vui lòng nhập địa chỉ nhận hàng chi tiết";
    } else if (shippingAddress.trim().length < 8) {
      newErrors.address = "Địa chỉ nhận hàng cần cụ thể hơn (số nhà, đường, quận/huyện)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Voucher apply handler
  const handleApplyVoucher = async (codeToApply?: string) => {
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    if (!code) return;

    try {
      setValidatingVoucher(true);
      setVoucherMessage(null);
      const res = await api.validateVoucher({ code, orderTotal: subtotal });
      if (res.success && res.data?.isValid) {
        setAppliedVoucher(res.data.voucher || null);
        setVoucherInput(code);
        setVoucherDiscount(res.data.discountAmount);
        setVoucherMessage({
          type: "success",
          text: `Áp dụng mã ${code} thành công: Giảm ${formatVND(res.data.discountAmount)}`,
        });
      } else {
        setVoucherMessage({
          type: "error",
          text: res.message || "Mã giảm giá không hợp lệ",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Mã giảm giá không hợp lệ hoặc không đủ điều kiện";
      setVoucherMessage({
        type: "error",
        text: msg,
      });
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput("");
    setVoucherDiscount(0);
    setVoucherMessage(null);
  };

  // Loyalty Points calculation: 1 pt = 10,000 VND
  const maxPointsCanUse = Math.min(
    userPoints,
    Math.floor(Math.max(0, subtotal - voucherDiscount) / 10000)
  );

  const handlePointsChange = (valStr: string) => {
    setIsUseMaxPoints(false);
    const cleanNum = valStr.replace(/[^0-9]/g, "");
    if (!cleanNum) {
      setPointsInput("");
      setPointsToUse(0);
      return;
    }
    const num = parseInt(cleanNum, 10);
    const capped = Math.min(num, maxPointsCanUse);
    setPointsInput(String(capped));
    setPointsToUse(capped);
  };

  const handleToggleMaxPoints = () => {
    if (isUseMaxPoints || pointsToUse > 0) {
      setIsUseMaxPoints(false);
      setPointsToUse(0);
      setPointsInput("");
    } else {
      setIsUseMaxPoints(true);
      setPointsToUse(maxPointsCanUse);
      setPointsInput(maxPointsCanUse > 0 ? String(maxPointsCanUse) : "");
    }
  };

  // Re-adjust pointsToUse if maxPointsCanUse decreases
  useEffect(() => {
    if (pointsToUse > maxPointsCanUse) {
      setPointsToUse(maxPointsCanUse);
      setPointsInput(maxPointsCanUse > 0 ? String(maxPointsCanUse) : "");
    }
  }, [maxPointsCanUse, pointsToUse]);

  const pointsDiscount = pointsToUse * 10000;
  const shippingFee = subtotal >= 2000000 ? 0 : 30000;
  const finalTotal = Math.max(0, subtotal - voucherDiscount - pointsDiscount) + shippingFee;
  const calculatedEarnedPoints = Math.floor(finalTotal / 100000);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (cart.length === 0) return;

    try {
      setLoading(true);
      const res = await api.createOrder({
        customerName,
        customerEmail: customerEmail || "guest@techhub.vn",
        customerPhone,
        shippingAddress,
        paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : voucherInput.trim().toUpperCase(),
        pointsToUse,
        notes: orderNotes,
        items: cart.map((item) => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
      });

      if (res.success && res.data) {
        setCreatedOrderId(res.data._id);
        setEarnedPointsFinal(res.data.pointsEarned || calculatedEarnedPoints);
        clearCart();
        // Immediately refresh user context to reflect updated points
        if (typeof refreshUser === "function") {
          await refreshUser();
        }
        setOrderSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đặt hàng thất bại. Vui lòng thử lại.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
        <SEO title="Đặt Hàng Thành Công" description="Cảm ơn bạn đã mua hàng tại TechHub. Đơn hàng của bạn đang được xử lý nhanh chóng." />
        <NeuNavbar />
        <main className="mx-auto max-w-2xl px-6 py-16 w-full">
          <NeuCard rounded="32" className="p-8 md:p-12 text-center">
            <div className="flex justify-center mb-6">
              <NeuIconWell size="xl" className="text-[#38B2AC]">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </NeuIconWell>
            </div>

            <NeuBadge variant="teal" className="mb-3">
              Đặt hàng thành công
            </NeuBadge>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#3D4852]">
              Cảm ơn bạn đã mua sắm tại TECHHUB!
            </h1>

            <p className="mt-3 text-sm text-[#6B7280] leading-relaxed max-w-md mx-auto">
              Đơn hàng <strong className="text-[#3D4852] font-mono">#{createdOrderId.slice(-6).toUpperCase()}</strong> đã được ghi nhận. Đội ngũ CSKH sẽ liên hệ xác nhận và tiến hành đóng gói giao hỏa tốc đến bạn.
            </p>

            {earnedPointsFinal > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl neu-inset text-xs font-bold text-[#6C63FF]">
                <Sparkles className="h-4 w-4" />
                <span>Bạn đã tích lũy thêm +{earnedPointsFinal} điểm thưởng vào tài khoản!</span>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/account" id="view-order-history-link">
                <NeuButton variant="primary" size="lg" className="w-full sm:w-auto">
                  Xem đơn hàng của bạn →
                </NeuButton>
              </Link>
              <Link to="/" id="continue-shopping-success-link">
                <NeuButton variant="secondary" size="lg" className="w-full sm:w-auto">
                  Tiếp tục khám phá sản phẩm
                </NeuButton>
              </Link>
            </div>
          </NeuCard>
        </main>
        <NeuFooter />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
        <SEO title="Giỏ Hàng Của Bạn" description="Xem và hoàn tất đặt mua các thiết bị công nghệ chính hãng tại TechHub." />
        <NeuNavbar />
        <main className="mx-auto max-w-7xl px-6 py-16 w-full">
          <NeuEmptyState
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Giỏ hàng của bạn đang trống"
            description="Bạn chưa thêm sản phẩm công nghệ nào vào giỏ. Hãy dạo qua danh mục sản phẩm nổi bật của chúng tôi để chọn món đồ yêu thích nhé!"
            actionText="Khám phá cửa hàng ngay"
            actionTo="/"
          />
        </main>
        <NeuFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-[#3D4852] font-sans selection:bg-[#6C63FF] selection:text-white flex flex-col justify-between">
      <SEO title={`Giỏ Hàng (${totalItems} món)`} description="Thanh toán đơn hàng thiết bị công nghệ chính hãng tiện lợi, an toàn tại TechHub." />
      <NeuNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10 w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#3D4852] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Tiếp tục mua sắm
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#3D4852]">
              Giỏ hàng của bạn ({totalItems} sản phẩm)
            </h1>
          </div>

          <NeuButton
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-xs font-bold text-[#E53E3E] self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" /> Xóa tất cả
          </NeuButton>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* CART ITEMS LIST */}
          <div className="lg:col-span-7 space-y-4">
            {cart.map(({ product, quantity }) => (
              <NeuCard
                key={product._id}
                rounded="24"
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 shrink-0 rounded-2xl neu-inset p-1.5 bg-[#E0E5EC] overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6C63FF]">
                      {product.brand}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#3D4852] line-clamp-1 font-display">
                      <Link to={`/products/${product._id}`} className="hover:text-[#6C63FF]">
                        {product.name}
                      </Link>
                    </h3>
                    <p className="text-xs text-[#6C63FF] font-black mt-1">
                      {formatVND(product.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center border-t sm:border-none border-[#D1D9E6]/60 pt-3 sm:pt-0">
                  {/* Quantity selector */}
                  <div className="flex items-center gap-2 neu-inset-sm rounded-xl p-1 bg-[#E0E5EC]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product._id, quantity - 1)}
                      className="h-7 w-7 rounded-lg text-xs font-extrabold hover:neu-inset-sm cursor-pointer flex items-center justify-center text-[#3D4852]"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#3D4852] px-2">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product._id, quantity + 1)}
                      className="h-7 w-7 rounded-lg text-xs font-extrabold hover:neu-inset-sm cursor-pointer flex items-center justify-center text-[#3D4852]"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-sm font-extrabold text-[#3D4852] font-display min-w-[100px] text-right">
                    {formatVND(product.price * quantity)}
                  </span>

                  <NeuButton
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(product._id)}
                    aria-label={`Xóa ${product.name}`}
                    className="text-[#9CA3AF] hover:text-[#E53E3E]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </NeuButton>
                </div>
              </NeuCard>
            ))}

            {/* Voucher / Mã Giảm Giá Card */}
            <NeuCard rounded="24" className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#3D4852] flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#6C63FF]" /> Mã ưu đãi & Khuyến mãi
                </h3>
                {appliedVoucher && (
                  <NeuBadge variant="teal">Đã áp dụng mã {appliedVoucher.code}</NeuBadge>
                )}
              </div>

              {appliedVoucher ? (
                <div className="p-3.5 rounded-2xl neu-inset bg-[#E0E5EC] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl neu-accent flex items-center justify-center font-black text-xs">
                      %
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-[#3D4852]">
                        {appliedVoucher.code}
                      </p>
                      <p className="text-[11px] text-[#38B2AC] font-bold">
                        Đã giảm {formatVND(voucherDiscount)}
                      </p>
                    </div>
                  </div>
                  <NeuButton
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveVoucher}
                    className="text-[#E53E3E] text-xs font-bold"
                  >
                    <X className="h-3.5 w-3.5" /> Hủy mã
                  </NeuButton>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyVoucher();
                  }}
                  className="flex gap-2"
                >
                  <div className="flex-1">
                    <NeuInput
                      id="cart-voucher-input"
                      type="text"
                      placeholder="Nhập mã voucher (VD: TECHHUB200K, SALE10)"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      icon={<Tag className="h-4 w-4" />}
                    />
                  </div>
                  <NeuButton
                    type="submit"
                    variant="secondary"
                    size="md"
                    disabled={validatingVoucher || !voucherInput.trim()}
                    loading={validatingVoucher}
                    className="shrink-0 font-bold"
                  >
                    Áp dụng
                  </NeuButton>
                </form>
              )}

              {voucherMessage && (
                <p
                  className={`text-xs font-bold ${
                    voucherMessage.type === "success" ? "text-[#38B2AC]" : "text-[#E53E3E]"
                  }`}
                >
                  {voucherMessage.text}
                </p>
              )}

              {/* Fast-select active vouchers */}
              {availableVouchers.length > 0 && (
                <div className="pt-2 border-t border-[#D1D9E6]/60">
                  <p className="text-[11px] font-bold text-[#6B7280] mb-2 uppercase tracking-wider">
                    Mã giảm giá đang có sẵn dành cho bạn:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableVouchers.map((v) => {
                      const isSelected = appliedVoucher?.code === v.code;
                      const isEligible = subtotal >= (v.minOrderValue || 0);

                      return (
                        <div
                          key={v._id || v.code}
                          className={`p-2.5 rounded-xl transition-all border ${
                            isSelected
                              ? "neu-inset border-[#38B2AC]/50"
                              : "neu-extruded-sm border-transparent hover:border-[#6C63FF]/30"
                          } flex items-center justify-between text-xs`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[#3D4852] font-mono">
                                {v.code}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-[#6C63FF]/10 text-[#6C63FF] text-[10px] font-bold">
                                {v.discountType === "percent"
                                  ? `Giảm ${v.discountValue}%`
                                  : `Giảm ${formatVND(v.discountValue)}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#6B7280] mt-0.5">
                              Đơn từ {formatVND(v.minOrderValue || 0)}
                            </p>
                          </div>

                          <NeuButton
                            type="button"
                            variant={isSelected ? "ghost" : "secondary"}
                            size="sm"
                            disabled={isSelected || validatingVoucher || !isEligible}
                            onClick={() => handleApplyVoucher(v.code)}
                            className="text-[11px] py-1 px-2.5 font-bold"
                          >
                            {isSelected ? "Đã dùng" : isEligible ? "Áp dụng" : "Chưa đủ"}
                          </NeuButton>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </NeuCard>

            {/* Loyalty Points / Điểm Tích Lũy Card */}
            <NeuCard rounded="24" className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#3D4852] flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#D97706]" /> Điểm tích lũy TechHub
                </h3>
                {user && (
                  <NeuBadge variant={user.membershipTier === "Platinum" ? "accent" : user.membershipTier === "Gold" ? "warning" : "default"}>
                    Hạng {user.membershipTier || "Silver"}
                  </NeuBadge>
                )}
              </div>

              {user ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl neu-inset bg-[#E0E5EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-[#6B7280]">Số dư điểm hiện tại:</span>
                      <p className="text-base font-black text-[#D97706]">
                        {userPoints} điểm{" "}
                        <span className="text-xs font-normal text-[#6B7280]">
                          (= {formatVND(userPoints * 10000)})
                        </span>
                      </p>
                    </div>

                    {maxPointsCanUse > 0 && (
                      <NeuButton
                        type="button"
                        variant={isUseMaxPoints ? "primary" : "secondary"}
                        size="sm"
                        onClick={handleToggleMaxPoints}
                        className="text-xs font-bold shrink-0"
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1 text-[#D97706]" />
                        {isUseMaxPoints ? "Bỏ dùng điểm" : `Dùng tối đa (${maxPointsCanUse} điểm)`}
                      </NeuButton>
                    )}
                  </div>

                  {userPoints > 0 ? (
                    <div>
                      <label className="block text-xs font-bold text-[#6B7280] mb-1.5">
                        Nhập số điểm muốn đổi (Tối đa: {maxPointsCanUse} điểm):
                      </label>
                      <div className="flex items-center gap-2">
                        <NeuInput
                          id="cart-points-input"
                          type="text"
                          placeholder="VD: 50"
                          value={pointsInput}
                          onChange={(e) => handlePointsChange(e.target.value)}
                          icon={<Coins className="h-4 w-4" />}
                          disabled={maxPointsCanUse <= 0}
                        />
                        {pointsToUse > 0 && (
                          <span className="text-xs font-extrabold text-[#38B2AC] whitespace-nowrap">
                            =-{formatVND(pointsDiscount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B7280] italic">
                      Bạn chưa có điểm tích lũy. Đặt hàng để nhận điểm thưởng ngay sau đơn này!
                    </p>
                  )}

                  <p className="text-[10px] text-[#6B7280] border-t border-[#D1D9E6]/60 pt-2 leading-relaxed">
                    💡 <strong>Quy tắc điểm:</strong> 1 điểm = 10.000 đ giảm trực tiếp. Mỗi 100.000 đ thanh toán tích lũy +1 điểm.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl neu-inset bg-[#E0E5EC] flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">
                    Đăng nhập để sử dụng và tích lũy điểm thưởng thành viên
                  </span>
                  <Link to="/login">
                    <NeuButton variant="secondary" size="sm" className="font-bold">
                      Đăng nhập
                    </NeuButton>
                  </Link>
                </div>
              )}
            </NeuCard>
          </div>

          {/* CHECKOUT FORM & SUMMARY */}
          <div className="lg:col-span-5 space-y-6">
            <NeuCard rounded="32" className="p-7">
              <h2 className="text-lg font-extrabold font-display text-[#3D4852] pb-3 border-b border-[#D1D9E6]/70">
                Thông tin giao hàng & thanh toán
              </h2>

              <form onSubmit={handleCheckout} className="mt-5 space-y-4">
                <NeuInput
                  id="checkout-name-input"
                  label="Họ và tên người nhận *"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  error={errors.name}
                  placeholder="Nguyễn Văn A"
                />

                <NeuInput
                  id="checkout-phone-input"
                  label="Số điện thoại giao hàng *"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  error={errors.phone}
                  placeholder="0912345678"
                />

                <NeuInput
                  id="checkout-address-input"
                  label="Địa chỉ giao hàng chi tiết *"
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => {
                    setShippingAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: undefined });
                  }}
                  error={errors.address}
                  placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                />

                <NeuInput
                  id="checkout-notes-input"
                  label="Ghi chú đơn hàng"
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                />

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                    Hình thức thanh toán
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "cod", label: "COD (Nhận hàng)" },
                      { id: "banking", label: "Chuyển khoản" },
                      { id: "momo", label: "Ví MoMo" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as "cod" | "banking" | "momo")}
                        className={`rounded-2xl p-2.5 text-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                          paymentMethod === m.id
                            ? "neu-accent font-extrabold"
                            : "neu-btn text-[#6B7280]"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR CODE PAYMENT (Chuyển khoản VietQR hoặc Ví MoMo) */}
                {(paymentMethod === "banking" || paymentMethod === "momo") && (
                  <PaymentQRCard
                    method={paymentMethod}
                    finalAmount={finalTotal}
                    customerPhone={customerPhone}
                  />
                )}

                {/* Cost Calculation Well */}
                <div className="rounded-2xl neu-inset p-4 bg-[#E0E5EC] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Tạm tính ({totalItems} món):</span>
                    <span className="text-[#3D4852] font-bold">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Phí vận chuyển:</span>
                    <span className="text-[#3D4852] font-semibold">
                      {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                    </span>
                  </div>

                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-[#38B2AC] font-bold">
                      <span>Giảm giá Voucher ({appliedVoucher?.code || voucherInput}):</span>
                      <span>-{formatVND(voucherDiscount)}</span>
                    </div>
                  )}

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-[#D97706] font-bold">
                      <span>Đổi điểm tích lũy ({pointsToUse} điểm):</span>
                      <span>-{formatVND(pointsDiscount)}</span>
                    </div>
                  )}

                  <div className="border-t border-[#D1D9E6] pt-2 flex justify-between font-extrabold text-base">
                    <span className="text-[#3D4852]">Tổng thanh toán:</span>
                    <span className="text-[#6C63FF] font-display">{formatVND(finalTotal)}</span>
                  </div>

                  {/* Estimated Loyalty Points Earned */}
                  {user && calculatedEarnedPoints > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#D1D9E6]/60 flex items-center justify-between text-[11px] text-[#D97706] font-bold">
                      <span className="flex items-center gap-1">
                        <Gift className="h-3.5 w-3.5" /> Điểm tích lũy dự kiến:
                      </span>
                      <span>+{calculatedEarnedPoints} điểm</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <NeuButton
                    id="checkout-submit-btn"
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    loading={loading}
                    className="w-full text-base font-extrabold shadow-lg"
                  >
                    <CreditCard className="h-5 w-5" /> Hoàn tất đặt đơn hàng ({formatVND(finalTotal)})
                  </NeuButton>
                </div>
              </form>
            </NeuCard>
          </div>
        </div>
      </main>

      <NeuFooter />
    </div>
  );
}

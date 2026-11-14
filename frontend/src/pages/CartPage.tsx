import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Tag,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
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

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart();
  const { user } = useAuth();

  // Form Fields & Realtime Validation
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [shippingAddress, setShippingAddress] = useState(user?.address || "");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "banking" | "momo">("cod");
  const [orderNotes, setOrderNotes] = useState("");

  // Promo Code
  const [promoInput, setPromoInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Field Errors (Realtime)
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>("");

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!shippingAddress && user.address) setShippingAddress(user.address);
    }
  }, [user, customerName, customerPhone, customerEmail, shippingAddress]);

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

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === "TECHHUB" || code === "GIAM10") {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount(discount);
      setPromoMessage({
        type: "success",
        text: `Áp dụng mã ${code} thành công: Giảm 10% (-${formatVND(discount)})`,
      });
    } else if (code === "FREESHIP") {
      setAppliedDiscount(30000);
      setPromoMessage({
        type: "success",
        text: "Áp dụng mã FREESHIP thành công: Miễn phí vận chuyển (-30.000 ₫)",
      });
    } else {
      setPromoMessage({
        type: "error",
        text: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
      });
    }
  };

  const shippingFee = subtotal >= 2000000 || appliedDiscount >= 30000 ? 0 : 30000;
  const finalTotal = Math.max(0, subtotal + shippingFee - appliedDiscount);

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
        clearCart();
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

            {/* Promo Code Card */}
            <NeuCard rounded="24" className="p-5">
              <form onSubmit={handleApplyPromo} className="flex gap-3">
                <div className="flex-1">
                  <NeuInput
                    id="cart-promo-input"
                    type="text"
                    placeholder="Nhập mã giảm giá (VD: TECHHUB, GIAM10)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    icon={<Tag className="h-4 w-4" />}
                  />
                </div>
                <NeuButton type="submit" variant="secondary" size="md" className="shrink-0">
                  Áp dụng
                </NeuButton>
              </form>
              {promoMessage && (
                <p
                  className={`mt-2 text-xs font-bold ${
                    promoMessage.type === "success" ? "text-[#38B2AC]" : "text-[#E53E3E]"
                  }`}
                >
                  {promoMessage.text}
                </p>
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

                {/* Cost Calculation Well */}
                <div className="rounded-2xl neu-inset p-4 bg-[#E0E5EC] space-y-2 text-xs">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Tạm tính ({totalItems} món):</span>
                    <span className="text-[#3D4852] font-bold">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Phí vận chuyển hỏa tốc:</span>
                    <span className="text-[#3D4852] font-semibold">
                      {shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
                    </span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-[#38B2AC] font-bold">
                      <span>Mã giảm giá:</span>
                      <span>-{formatVND(appliedDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-[#D1D9E6] pt-2 flex justify-between font-extrabold text-base">
                    <span className="text-[#3D4852]">Tổng thanh toán:</span>
                    <span className="text-[#6C63FF] font-display">{formatVND(finalTotal)}</span>
                  </div>
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

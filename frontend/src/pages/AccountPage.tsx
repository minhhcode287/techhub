import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Order, type Booking } from "../services/api";
import SEO from "../components/SEO";
import {
  User as UserIcon,
  LogOut,
  ShoppingBag,
  Camera,
  Calendar,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Save,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import {
  NeuNavbar,
  NeuFooter,
  NeuCard,
  NeuButton,
  NeuInput,
  NeuBadge,
  NeuModal,
  NeuSkeleton,
  NeuEmptyState,
} from "../components/NeumorphicComponents";

// Helper to mask email (e.g. de***@techhub.vn)
function maskEmail(emailStr?: string): string {
  if (!emailStr || !emailStr.includes("@")) return emailStr || "";
  const [localPart, domain] = emailStr.split("@");
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }
  return `${localPart.slice(0, 2)}***@${domain}`;
}

// Helper to mask phone number (e.g. 090****567)
function maskPhone(phoneStr?: string): string {
  if (!phoneStr) return "";
  const cleaned = phoneStr.trim();
  if (cleaned.length < 6) return cleaned;
  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-3);
  return `${prefix}****${suffix}`;
}

export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "rentals">("profile");

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; phone?: string }>({});

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Rentals State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // Cancel order modal
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      setName(user.name);
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user, navigate]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingOrders(true);
      setOrdersError(null);
      const res = await api.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng";
      setOrdersError(msg);
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingBookings(true);
      setBookingsError(null);
      const res = await api.getMyBookings();
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách lịch thuê";
      setBookingsError(msg);
    } finally {
      setLoadingBookings(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    } else if (activeTab === "rentals") {
      fetchBookings();
    }
  }, [activeTab, fetchOrders, fetchBookings]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      errs.name = "Họ tên không được để trống";
    }

    if (phone.trim() && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone.trim().replace(/\s/g, ""))) {
      errs.phone = "Số điện thoại không đúng định dạng 10 số";
    }

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    try {
      setUpdatingProfile(true);
      await updateProfile({ name: name.trim(), phone: phone.trim(), address: address.trim() });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      alert(msg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    try {
      setCancellingLoading(true);
      await api.cancelOrder(cancellingOrder._id);
      setCancellingOrder(null);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Hủy đơn hàng thất bại";
      alert(msg);
    } finally {
      setCancellingLoading(false);
    }
  };

  const getOrderStatusBadge = (status: Order["orderStatus"]) => {
    switch (status) {
      case "processing":
        return <NeuBadge variant="warning">Đang xử lý</NeuBadge>;
      case "shipped":
        return <NeuBadge variant="accent">Đang giao hàng</NeuBadge>;
      case "delivered":
        return <NeuBadge variant="teal">Đã giao hàng</NeuBadge>;
      case "cancelled":
        return <NeuBadge variant="danger">Đã hủy</NeuBadge>;
      default:
        return <NeuBadge variant="default">{status}</NeuBadge>;
    }
  };

  const getBookingStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return <NeuBadge variant="warning">Chờ duyệt</NeuBadge>;
      case "confirmed":
        return <NeuBadge variant="accent">Đã giữ máy</NeuBadge>;
      case "active":
        return <NeuBadge variant="teal">Đang thuê</NeuBadge>;
      case "completed":
        return <NeuBadge variant="teal">Đã trả máy</NeuBadge>;
      case "cancelled":
        return <NeuBadge variant="danger">Đã hủy</NeuBadge>;
      default:
        return <NeuBadge variant="default">{status}</NeuBadge>;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-[#3D4852] font-sans selection:bg-[#6C63FF] selection:text-white flex flex-col justify-between">
      <SEO title="Tài Khoản & Lịch Sử Đơn Hàng" description="Quản lý thông tin cá nhân, theo dõi trạng thái đơn hàng và lịch thuê máy ảnh tại TechHub." />
      <NeuNavbar />

      <main className="mx-auto max-w-7xl px-6 py-10 w-full">
        {/* User Greeting Card */}
        <NeuCard rounded="32" className="p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-18 w-18 items-center justify-center rounded-3xl neu-inset text-2xl font-black text-[#6C63FF] bg-[#E0E5EC]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold font-display text-[#3D4852]">
                    {user.name}
                  </h1>
                  {user.role === "admin" ? (
                    <NeuBadge variant="accent">Quản trị viên (Admin)</NeuBadge>
                  ) : user.role === "staff" ? (
                    <NeuBadge variant="teal">Nhân viên (Staff)</NeuBadge>
                  ) : (
                    <NeuBadge variant="default">Khách hàng</NeuBadge>
                  )}
                </div>
                <p className="text-xs text-[#6B7280] font-medium mt-1">{maskEmail(user.email)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {(user.role === "admin" || user.role === "staff") && (
                <NeuButton
                  id="account-management-btn"
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/management")}
                  className="font-bold"
                >
                  <ShieldCheck className="h-4 w-4" /> Đến trang Quản trị ({user.role === "admin" ? "Admin" : "Staff"})
                </NeuButton>
              )}

              <NeuButton
                id="account-logout-btn"
                variant="secondary"
                size="md"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="text-[#E53E3E] font-bold"
              >
                <LogOut className="h-4 w-4" /> Đăng xuất
              </NeuButton>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="mt-8 flex gap-2 border-t border-[#D1D9E6]/70 pt-6">
            <button
              onClick={() => setActiveTab("profile")}
              className={`rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === "profile" ? "neu-accent" : "neu-btn text-[#6B7280]"
              }`}
            >
              <UserIcon className="h-4 w-4" /> Thông tin tài khoản
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === "orders" ? "neu-accent" : "neu-btn text-[#6B7280]"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Đơn hàng đã mua
            </button>
            <button
              onClick={() => setActiveTab("rentals")}
              className={`rounded-2xl px-5 py-2.5 text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                activeTab === "rentals" ? "neu-accent" : "neu-btn text-[#6B7280]"
              }`}
            >
              <Camera className="h-4 w-4" /> Lịch thuê máy ảnh
            </button>
          </div>
        </NeuCard>

        {/* TAB 1: PROFILE MANAGEMENT */}
        {activeTab === "profile" && (
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8">
              <NeuCard rounded="32" className="p-8">
                <h2 className="text-xl font-extrabold font-display text-[#3D4852] pb-4 border-b border-[#D1D9E6]/70">
                  Cập nhật thông tin giao hàng & liên hệ
                </h2>

                {profileSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl neu-inset-sm p-3.5 text-xs font-bold text-[#38B2AC] bg-[#E0E5EC]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Cập nhật thông tin thành công!</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
                  <NeuInput
                    id="profile-name-input"
                    label="Họ và tên *"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (profileErrors.name) setProfileErrors({ ...profileErrors, name: undefined });
                    }}
                    error={profileErrors.name}
                    icon={<UserIcon className="h-4 w-4" />}
                  />

                  <NeuInput
                    id="profile-email-input"
                    label="Email đăng ký"
                    type="text"
                    readOnly
                    value={isEmailFocused ? user.email : maskEmail(user.email)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    helperText="Địa chỉ email tài khoản không thể thay đổi (được che bảo mật khi xem)."
                    icon={<Mail className="h-4 w-4" />}
                  />

                  <NeuInput
                    id="profile-phone-input"
                    label="Số điện thoại giao hàng"
                    type={isPhoneFocused ? "tel" : "text"}
                    value={isPhoneFocused ? phone : maskPhone(phone)}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: undefined });
                    }}
                    error={profileErrors.phone}
                    placeholder="0987654321"
                    helperText={isPhoneFocused ? undefined : "Số điện thoại được che bảo mật. Nhấp vào để xem và chỉnh sửa."}
                    icon={<Phone className="h-4 w-4" />}
                  />

                  <NeuInput
                    id="profile-address-input"
                    label="Địa chỉ mặc định nhận hàng"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố..."
                    icon={<MapPin className="h-4 w-4" />}
                  />

                  <div className="pt-4">
                    <NeuButton
                      id="save-profile-btn"
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={updatingProfile}
                      loading={updatingProfile}
                      className="font-bold"
                    >
                      <Save className="h-4 w-4" /> Lưu thông tin thay đổi
                    </NeuButton>
                  </div>
                </form>
              </NeuCard>
            </div>

            {/* Side Card: Quick stats */}
            <div className="md:col-span-4 space-y-6">
              <NeuCard rounded="32" className="p-6">
                <h3 className="text-base font-extrabold font-display text-[#3D4852] mb-4">
                  Đặc quyền thành viên
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 rounded-2xl neu-inset-sm p-3 bg-[#E0E5EC]">
                    <Package className="h-5 w-5 text-[#6C63FF]" />
                    <div>
                      <p className="font-bold text-[#3D4852]">Miễn phí vận chuyển</p>
                      <p className="text-[11px] text-[#6B7280]">Đơn hàng từ 2.000.000 ₫</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl neu-inset-sm p-3 bg-[#E0E5EC]">
                    <Camera className="h-5 w-5 text-[#38B2AC]" />
                    <div>
                      <p className="font-bold text-[#3D4852]">Hỗ trợ thủ tục thuê nhanh</p>
                      <p className="text-[11px] text-[#6B7280]">Duyệt cọc CCCD trong 5 phút</p>
                    </div>
                  </div>
                </div>
              </NeuCard>
            </div>
          </div>
        )}

        {/* TAB 2: ORDER HISTORY */}
        {activeTab === "orders" && (
          <div>
            {loadingOrders ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <NeuCard key={i} rounded="24" className="p-6">
                    <NeuSkeleton className="h-6 w-1/4 mb-3" />
                    <NeuSkeleton className="h-4 w-3/4 mb-2" />
                    <NeuSkeleton className="h-10 w-full" />
                  </NeuCard>
                ))}
              </div>
            ) : ordersError ? (
              <NeuCard rounded="32" className="p-8 text-center text-[#E53E3E]">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-bold">{ordersError}</p>
                <NeuButton variant="secondary" size="sm" onClick={fetchOrders} className="mt-4">
                  Thử lại
                </NeuButton>
              </NeuCard>
            ) : orders.length === 0 ? (
              <NeuEmptyState
                icon={<ShoppingBag className="h-8 w-8" />}
                title="Chưa có đơn hàng nào"
                description="Bạn chưa đặt mua thiết bị công nghệ nào tại TECHHUB. Hãy khám phá cửa hàng ngay!"
                actionText="Mua sắm ngay"
                actionTo="/"
              />
            ) : (
              <div className="space-y-6">
                {orders.map((ord) => (
                  <NeuCard key={ord._id} rounded="32" className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D1D9E6]/70 gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[#3D4852]">
                            #{ord._id.slice(-6).toUpperCase()}
                          </span>
                          {getOrderStatusBadge(ord.orderStatus)}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Ngày đặt: {new Date(ord.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#6B7280]">Tổng cộng: </span>
                        <span className="text-lg font-black text-[#6C63FF] font-display">
                          {formatVND(ord.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="mt-4 space-y-3">
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-2xl neu-inset-sm p-3 bg-[#E0E5EC]"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                            <div>
                              <p className="text-xs font-bold text-[#3D4852]">{item.name}</p>
                              <p className="text-[11px] text-[#6B7280]">
                                {formatVND(item.price)} x {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-[#3D4852]">
                            {formatVND(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address & Actions */}
                    <div className="mt-4 pt-3 border-t border-[#D1D9E6]/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6B7280]">
                      <div>
                        <strong>Địa chỉ nhận:</strong> {ord.shippingAddress} ({maskPhone(ord.customerPhone)})
                      </div>

                      {ord.orderStatus === "processing" && (
                        <NeuButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancellingOrder(ord)}
                          className="text-[#E53E3E] font-bold"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hủy đơn hàng
                        </NeuButton>
                      )}
                    </div>
                  </NeuCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CAMERA RENTAL BOOKINGS */}
        {activeTab === "rentals" && (
          <div>
            {loadingBookings ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <NeuCard key={i} rounded="24" className="p-6">
                    <NeuSkeleton className="h-6 w-1/4 mb-3" />
                    <NeuSkeleton className="h-4 w-3/4 mb-2" />
                    <NeuSkeleton className="h-10 w-full" />
                  </NeuCard>
                ))}
              </div>
            ) : bookingsError ? (
              <NeuCard rounded="32" className="p-8 text-center text-[#E53E3E]">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-bold">{bookingsError}</p>
                <NeuButton variant="secondary" size="sm" onClick={fetchBookings} className="mt-4">
                  Thử lại
                </NeuButton>
              </NeuCard>
            ) : bookings.length === 0 ? (
              <NeuEmptyState
                icon={<Camera className="h-8 w-8" />}
                title="Chưa có lịch thuê máy ảnh nào"
                description="Bạn chưa đặt giữ chỗ máy ảnh hoặc ống kính nào. Xem ngay danh sách thiết bị sẵn sàng phục vụ!"
                actionText="Khám phá dàn máy ảnh"
                actionTo="/rentals"
              />
            ) : (
              <div className="space-y-6">
                {bookings.map((b) => (
                  <NeuCard key={b._id} rounded="32" className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D1D9E6]/70 gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-[#3D4852]">
                            #{b._id.slice(-6).toUpperCase()}
                          </span>
                          {getBookingStatusBadge(b.status)}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-1">
                          Đặt lúc: {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#6B7280]">Tiền thuê ({b.totalDays} ngày): </span>
                        <span className="text-lg font-black text-[#38B2AC] font-display">
                          {formatVND(b.totalAmount || b.rentalFee)}
                        </span>
                      </div>
                    </div>

                    {/* Camera Info */}
                    <div className="mt-4 flex items-center gap-4 rounded-2xl neu-inset-sm p-3.5 bg-[#E0E5EC]">
                      <img
                        src={b.cameraImage || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80"}
                        alt={b.cameraName || "Máy ảnh"}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-extrabold text-sm text-[#3D4852]">
                          {b.cameraName || "Máy ảnh cho thuê"}
                        </h4>
                        <div className="mt-1 flex items-center gap-4 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-[#38B2AC]" />
                            {new Date(b.startDate).toLocaleDateString("vi-VN")} →{" "}
                            {new Date(b.endDate).toLocaleDateString("vi-VN")}
                          </span>
                          <span>Cọc: {formatVND(b.depositAmount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* CCCD / Contract info */}
                    <div className="mt-4 text-xs text-[#6B7280] flex justify-between items-center">
                      <div>
                        <strong>CCCD/CMND bàn giao:</strong> {b.idCardNumber} • <strong>Liên hệ:</strong>{" "}
                        {maskPhone(b.userPhone)}
                      </div>
                      <NeuBadge variant="teal">Đã xác thực giấy tờ</NeuBadge>
                    </div>
                  </NeuCard>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CONFIRM ORDER CANCELLATION MODAL */}
      <NeuModal
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        title="Xác nhận hủy đơn hàng"
        subtitle="Bạn có chắc chắn muốn hủy đơn hàng này không?"
        maxWidth="sm"
        id="cancel-order-modal"
      >
        <p className="text-xs text-[#6B7280] leading-relaxed">
          Đơn hàng <strong className="text-[#3D4852]">#{cancellingOrder?._id.slice(-6).toUpperCase()}</strong> sẽ bị hủy và các sản phẩm sẽ được hoàn trả về kho.
        </p>

        <div className="mt-6 flex gap-3">
          <NeuButton
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setCancellingOrder(null)}
            className="flex-1"
          >
            Giữ lại đơn
          </NeuButton>
          <NeuButton
            type="button"
            variant="danger"
            size="md"
            disabled={cancellingLoading}
            loading={cancellingLoading}
            onClick={handleCancelOrder}
            className="flex-1 font-bold"
          >
            Hủy đơn hàng
          </NeuButton>
        </div>
      </NeuModal>

      <NeuFooter />
    </div>
  );
}

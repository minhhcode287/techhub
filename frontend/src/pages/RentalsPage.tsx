import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { api, type RentalCamera } from "../services/api";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
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
  NeuErrorState,
} from "../components/NeumorphicComponents";

export default function RentalsPage() {
  const { user } = useAuth();

  const [cameras, setCameras] = useState<RentalCamera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Booking Modal State
  const [selectedCamera, setSelectedCamera] = useState<RentalCamera | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [idCardNumber, setIdCardNumber] = useState<string>("");
  const [userName, setUserName] = useState<string>(user?.name || "");
  const [userPhone, setUserPhone] = useState<string>(user?.phone || "");
  const [notes, setNotes] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    idCard?: string;
    phone?: string;
    name?: string;
    dates?: string;
  }>({});

  // Toast
  const [toast, setToast] = useState<{ message: string; bookingId?: string } | null>(null);

  const fetchCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getRentalCameras(brandFilter);
      if (res.success && res.data) {
        setCameras(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách máy ảnh cho thuê";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [brandFilter]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  useEffect(() => {
    if (user) {
      if (!userName) setUserName(user.name);
      if (!userPhone && user.phone) setUserPhone(user.phone);
    }
  }, [user, userName, userPhone]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const calculateRentalDays = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(days) ? 1 : days);
  };

  const validateBookingForm = () => {
    const errs: { idCard?: string; phone?: string; name?: string; dates?: string } = {};

    if (!userName.trim()) {
      errs.name = "Vui lòng nhập họ và tên người thuê";
    }

    if (!idCardNumber.trim()) {
      errs.idCard = "Vui lòng nhập số CCCD hoặc CMND để làm hợp đồng";
    } else if (idCardNumber.trim().length < 9) {
      errs.idCard = "Số CCCD/CMND không hợp lệ (ít nhất 9-12 số)";
    }

    if (!userPhone.trim()) {
      errs.phone = "Vui lòng nhập số điện thoại liên hệ";
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(userPhone.trim().replace(/\s/g, ""))) {
      errs.phone = "Số điện thoại không đúng định dạng";
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end <= start) {
      errs.dates = "Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera) return;
    if (!validateBookingForm()) return;

    try {
      setBookingLoading(true);
      const res = await api.createBooking({
        cameraId: selectedCamera._id,
        startDate,
        endDate,
        idCardNumber,
        userName,
        userEmail: user?.email || "customer@techhub.vn",
        userPhone,
        notes,
      });

      if (res.success && res.data) {
        setSelectedCamera(null);
        setToast({
          message: `Đã đặt giữ chỗ thành công máy ảnh "${selectedCamera.name}"!`,
          bookingId: res.data._id,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đặt thuê thất bại";
      alert(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cam.name.toLowerCase().includes(q) ||
      cam.brand.toLowerCase().includes(q) ||
      cam.sensorType.toLowerCase().includes(q)
    );
  });

  const rentalDays = calculateRentalDays();
  const rentalDailyRate = selectedCamera?.dailyRate || 0;
  const totalRentalFee = rentalDays * rentalDailyRate;
  const depositAmount = selectedCamera?.depositAmount || 0;
  const totalRentalCost = totalRentalFee + depositAmount;

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-[#3D4852] font-sans selection:bg-[#6C63FF] selection:text-white flex flex-col justify-between">
      {/* DYNAMIC SEO TAGS */}
      <SEO
        title="Dịch Vụ Thuê Máy Ảnh & Máy Quay Chuyên Nghiệp"
        description="Cho thuê máy ảnh Sony FX3, A7S III, Canon R5 C, Fujifilm, Blackmagic 6K Pro kèm pin, sạc, thẻ nhớ CFexpress tốc độ cao. Đặt lịch online nhanh chóng."
        image="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&auto=format&fit=crop&q=80"
        keywords="thuê máy ảnh, thuê máy quay, thuê sony a7s3, thuê sony fx3, thuê canon r5c, thuê lens máy ảnh"
      />

      <NeuNavbar />

      {/* TOAST ALERT */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl neu-extruded bg-[#E0E5EC] p-4 text-sm shadow-2xl animate-fadeIn">
          <NeuIconWell size="sm" className="text-[#38B2AC]">
            <CheckCircle2 className="h-4 w-4" />
          </NeuIconWell>
          <div>
            <p className="font-bold text-[#3D4852]">{toast.message}</p>
            <Link
              to="/account"
              className="mt-0.5 inline-block text-xs font-bold text-[#6C63FF] hover:underline"
            >
              Xem lịch thuê của bạn trong tài khoản →
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10 w-full">
        {/* HERO RENTALS BANNER */}
        <section className="rounded-[32px] neu-extruded p-8 md:p-12 mb-12 relative overflow-hidden bg-[#E0E5EC]">
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full neu-inset-deep opacity-30 pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full neu-inset-sm px-4 py-1.5 text-xs font-bold tracking-wider text-[#38B2AC] uppercase mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Dịch vụ cho thuê thiết bị điện ảnh & nhiếp ảnh
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-[#3D4852] leading-tight">
              Thuê máy ảnh & máy quay chuyên nghiệp.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-[#6B7280] leading-relaxed font-medium">
              Sony FX3, A7S III, Canon R5 C, Fujifilm X-H2S, Blackmagic 6K Pro... Đầy đủ phụ kiện tiêu chuẩn (2 Pin zin + Sạc kép + Thẻ CFexpress/SD V90 + Túi chống sốc). Giữ lịch trực tuyến chỉ trong 1 phút.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-2xl neu-inset-sm px-3.5 py-2 text-xs font-bold text-[#3D4852]">
                <ShieldCheck className="h-4 w-4 text-[#38B2AC]" /> Máy kiểm tra kỹ trước khi giao
              </div>
              <div className="flex items-center gap-2 rounded-2xl neu-inset-sm px-3.5 py-2 text-xs font-bold text-[#3D4852]">
                <Zap className="h-4 w-4 text-[#6C63FF]" /> Đổi trả bảo hành tức thì
              </div>
            </div>
          </div>
        </section>

        {/* CONTROLS & FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#D1D9E6]/80 mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#3D4852]">
              Danh sách thiết bị sẵn sàng phục vụ ({filteredCameras.length})
            </h2>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">
              Chọn thiết bị phù hợp với dự án chụp ảnh hoặc sản xuất video của bạn
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <NeuInput
                id="camera-search-input"
                type="text"
                placeholder="Tìm Sony, Canon, 4K, 8K..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Brand Filter Pills */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl neu-inset bg-[#E0E5EC]">
              {["all", "Sony", "Canon", "Fujifilm", "Blackmagic"].map((brand) => (
                <button
                  key={brand}
                  onClick={() => setBrandFilter(brand)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                    brandFilter === brand
                      ? "neu-accent font-extrabold"
                      : "text-[#6B7280] hover:text-[#3D4852]"
                  }`}
                >
                  {brand === "all" ? "Tất cả" : brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CAMERAS GRID */}
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <NeuCard key={idx} rounded="32" className="p-6 space-y-4">
                <NeuSkeleton className="h-48 w-full" rounded="24" />
                <NeuSkeleton className="h-6 w-3/4" />
                <NeuSkeleton className="h-4 w-full" />
                <NeuSkeleton className="h-10 w-full" rounded="16" />
              </NeuCard>
            ))}
          </div>
        ) : error ? (
          <NeuErrorState message={error} onRetry={fetchCameras} />
        ) : filteredCameras.length === 0 ? (
          <NeuEmptyState
            icon={<Camera className="h-8 w-8" />}
            title="Không tìm thấy máy ảnh phù hợp"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc lọc theo thương hiệu khác nhé."
            actionText="Xem tất cả thương hiệu"
            onAction={() => {
              setBrandFilter("all");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCameras.map((cam) => (
              <NeuCard
                key={cam._id}
                rounded="32"
                hoverable
                className="p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Camera Image Frame */}
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
                      {cam.availableQuantity > 0 ? (
                        <NeuBadge variant="teal" className="text-[10px]">
                          Còn {cam.availableQuantity} máy
                        </NeuBadge>
                      ) : (
                        <NeuBadge variant="danger" className="text-[10px]">
                          Tạm hết
                        </NeuBadge>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mt-5">
                    <h3 className="text-lg font-extrabold font-display text-[#3D4852]">
                      {cam.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                      {cam.description}
                    </p>
                  </div>

                  {/* Sensor & Resolution Specs */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-xl neu-inset-sm px-3 py-1.5 bg-[#E0E5EC]">
                      <span className="text-[#6B7280] font-medium">Cảm biến:</span>
                      <span className="font-bold text-[#3D4852]">{cam.sensorType}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl neu-inset-sm px-3 py-1.5 bg-[#E0E5EC]">
                      <span className="text-[#6B7280] font-medium">Quay video:</span>
                      <span className="font-bold text-[#3D4852]">{cam.maxResolution}</span>
                    </div>
                  </div>

                  {/* Included Accessories */}
                  <div className="mt-4">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-[#6B7280] block mb-2">
                      Phụ kiện trọn gói:
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

                {/* Price and Booking Action */}
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
                      setFieldErrors({});
                    }}
                    className="w-full font-bold"
                  >
                    {cam.availableQuantity > 0 ? (
                      <>
                        <Calendar className="h-4 w-4" /> Đặt thuê máy ảnh này
                      </>
                    ) : (
                      "Tạm hết máy"
                    )}
                  </NeuButton>
                </div>
              </NeuCard>
            ))}
          </div>
        )}
      </main>

      {/* BOOKING MODAL */}
      <NeuModal
        isOpen={!!selectedCamera}
        onClose={() => setSelectedCamera(null)}
        title="Hợp đồng đặt thuê máy ảnh"
        subtitle="Hệ thống tự động tính ngày thuê và lập hợp đồng bàn giao máy"
        maxWidth="lg"
        id="rental-booking-wizard-modal"
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
                  {formatVND(selectedCamera.dailyRate)} / ngày • Cọc: {formatVND(selectedCamera.depositAmount)}
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
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (fieldErrors.dates) setFieldErrors({ ...fieldErrors, dates: undefined });
                  }}
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
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (fieldErrors.dates) setFieldErrors({ ...fieldErrors, dates: undefined });
                  }}
                  className="w-full rounded-2xl neu-input px-3.5 py-2.5 text-xs text-[#3D4852] font-semibold outline-none"
                />
              </div>
            </div>

            {fieldErrors.dates && (
              <p className="text-xs font-bold text-[#E53E3E]">{fieldErrors.dates}</p>
            )}

            {/* Customer ID Card */}
            <NeuInput
              id="booking-id-card-input"
              label="Số Căn cước công dân (CCCD / CMND) *"
              type="text"
              required
              value={idCardNumber}
              onChange={(e) => {
                setIdCardNumber(e.target.value);
                if (fieldErrors.idCard) setFieldErrors({ ...fieldErrors, idCard: undefined });
              }}
              error={fieldErrors.idCard}
              placeholder="079098xxxxxx (Dùng để lập hợp đồng bàn giao)"
            />

            <div className="grid grid-cols-2 gap-3">
              <NeuInput
                id="booking-user-name-input"
                label="Họ và tên *"
                type="text"
                required
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                }}
                error={fieldErrors.name}
                placeholder="Nguyễn Văn A"
              />
              <NeuInput
                id="booking-user-phone-input"
                label="Số điện thoại *"
                type="tel"
                required
                value={userPhone}
                onChange={(e) => {
                  setUserPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                }}
                error={fieldErrors.phone}
                placeholder="0987654321"
              />
            </div>

            <NeuInput
              id="booking-notes-input"
              label="Ghi chú thêm"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ví dụ: Cần thêm lens 24-70mm GM, filter ND..."
            />

            {/* Summary Calculation Box */}
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
                disabled={bookingLoading}
                loading={bookingLoading}
                className="flex-1 font-bold"
              >
                Xác nhận đặt giữ máy
              </NeuButton>
            </div>
          </form>
        )}
      </NeuModal>

      <NeuFooter />
    </div>
  );
}

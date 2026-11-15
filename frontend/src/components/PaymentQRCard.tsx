import { useState, useEffect, useRef } from "react";
import {
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Smartphone,
  Landmark,
  Bot,
  Zap,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import { NeuBadge, NeuButton } from "./NeumorphicComponents";
import { api, type PaymentSession } from "../services/api";

export interface PaymentQRCardProps {
  method: "banking" | "momo";
  finalAmount: number;
  customerPhone?: string;
  orderCode?: string;
  className?: string;
  onPaymentSuccess?: (session: PaymentSession) => void;
  onStatusChange?: (status: "PENDING" | "PAID") => void;
}

/**
 * Phát âm thanh "Ting ting!" synthesizer mô phỏng chuông ngân giao dịch qua Web Audio API
 * Hoàn toàn tự sinh, không phụ thuộc file mp3 bên ngoài, hoạt động mượt mà offline
 */
const playTingTing = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Bell chime Note 1: C6 (1046.50 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1046.5, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Bell chime Note 2: E6 (1318.51 Hz) phát sau 120ms tạo hiệu ứng Ting-Ting ngân vang
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.65);
  } catch (e) {
    console.warn("[WebAudio] Failed to play Ting Ting sound:", e);
  }
};

export default function PaymentQRCard({
  method,
  finalAmount,
  customerPhone = "",
  orderCode,
  className = "",
  onPaymentSuccess,
  onStatusChange,
}: PaymentQRCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [momoImgError, setMomoImgError] = useState<boolean>(false);

  // Payment Session & Polling state
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationMsg, setSimulationMsg] = useState<string | null>(null);

  const amountToPay = Math.max(0, Math.round(finalAmount));
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onStatusChangeRef = useRef(onStatusChange);

  onPaymentSuccessRef.current = onPaymentSuccess;
  onStatusChangeRef.current = onStatusChange;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  // Khởi tạo Payment Session mỗi khi amountToPay hoặc method thay đổi
  useEffect(() => {
    let isCancelled = false;

    // Reset trạng thái khi tạo session mới
    setIsPaid(false);
    setSimulationMsg(null);
    onStatusChangeRef.current?.("PENDING");

    if (amountToPay <= 0) {
      setSession(null);
      return;
    }

    const initSession = async () => {
      setIsLoadingSession(true);
      try {
        const res = await api.createPaymentSession({
          amount: amountToPay,
          method,
          metadata: { customerPhone, orderCode },
        });

        if (!isCancelled && res.success && res.data) {
          setSession(res.data);
          if (res.data.status === "PAID") {
            setIsPaid(true);
            onPaymentSuccessRef.current?.(res.data);
            onStatusChangeRef.current?.("PAID");
          }
        }
      } catch (err) {
        console.warn("[PaymentQRCard] Create session error:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingSession(false);
        }
      }
    };

    initSession();

    return () => {
      isCancelled = true;
    };
  }, [amountToPay, method, customerPhone, orderCode]);

  // Polling tự động kiểm tra trạng thái mỗi 2 giây
  useEffect(() => {
    if (!session?.transactionCode || isPaid) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.getPaymentSessionStatus(session.transactionCode);
        if (res.success && res.data && res.data.status === "PAID") {
          setIsPaid(true);
          playTingTing();
          onPaymentSuccessRef.current?.(res.data);
          onStatusChangeRef.current?.("PAID");

          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (err) {
        // Im lặng để không làm phiền người dùng khi mạng chập chờn
        console.debug("[PaymentQRCard] Polling error:", err);
      }
    };

    // Chạy ngay 1 lần và lặp mỗi 2000ms
    pollingRef.current = setInterval(checkStatus, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [session?.transactionCode, isPaid]);

  // Hàm kích hoạt giả lập Webhook ngân hàng báo Ting Ting
  const handleSimulateWebhook = async () => {
    if (!session?.transactionCode) return;
    setIsSimulating(true);
    setSimulationMsg(null);

    try {
      const res = await api.simulatePaymentWebhook({
        transactionCode: session.transactionCode,
        amount: session.expectedAmount,
        content: `TECHHUB ${session.transactionCode} TEST SIMULATION`,
        referenceCode: `SIM-${Date.now().toString().slice(-6)}`,
      });

      if (res.success) {
        setIsPaid(true);
        playTingTing();
        setSimulationMsg("⚡ Ting Ting! Đã nhận chuyển khoản & tự động khớp lệnh thành công!");
        if (res.session) {
          onPaymentSuccessRef.current?.(res.session);
        }
        onStatusChangeRef.current?.("PAID");
      } else {
        setSimulationMsg(res.message || "Giả lập thất bại");
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setSimulationMsg(error.message || "Lỗi kết nối Webhook giả lập");
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const currentTransactionCode = session?.transactionCode || "Đang khởi tạo...";
  const vietQrUrl =
    session?.qrUrl ||
    `https://img.vietqr.io/image/ICB-102565426868-compact2.png?amount=${amountToPay}&addInfo=${encodeURIComponent(
      currentTransactionCode
    )}&accountName=${encodeURIComponent("NGUYEN NHAT MINH")}`;

  return (
    <div
      className={`rounded-2xl neu-inset p-4 md:p-5 bg-[#E0E5EC] space-y-4 border ${
        isPaid
          ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          : method === "banking"
          ? "border-[#38B2AC]/40"
          : "border-[#D53F8C]/40"
      } transition-all duration-300 ${className}`}
    >
      {/* 1. HEADER CARD */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#D1D9E6]">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-xl neu-extruded flex items-center justify-center ${
              isPaid
                ? "text-emerald-500"
                : method === "banking"
                ? "text-[#38B2AC]"
                : "text-[#D53F8C]"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="h-4 w-4 animate-bounce" />
            ) : method === "banking" ? (
              <Landmark className="h-4 w-4" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="text-xs font-black text-[#3D4852] uppercase tracking-wide flex items-center gap-1.5">
              {method === "banking"
                ? "Thanh toán Chuyển khoản VietQR"
                : "Thanh toán Ví Điện Tử MoMo"}
              {isPaid && (
                <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded-full uppercase">
                  Đã khớp lệnh
                </span>
              )}
            </p>
            <p className="text-[10px] text-[#6B7280] font-medium">
              Mã đối soát tự động:{" "}
              <span className="font-mono font-bold text-[#6C63FF]">
                {currentTransactionCode}
              </span>
            </p>
          </div>
        </div>

        {isPaid ? (
          <NeuBadge variant="teal" className="text-[10px] py-0.5 px-2 bg-emerald-500/10 text-emerald-600 font-extrabold flex items-center gap-1">
            <Check className="h-3 w-3" /> Đã thanh toán
          </NeuBadge>
        ) : (
          <NeuBadge
            variant={method === "banking" ? "teal" : "accent"}
            className="text-[10px] py-0.5 px-2"
          >
            {method === "banking" ? "VietinBank 24/7" : "MoMo Pay"}
          </NeuBadge>
        )}
      </div>

      {/* 2. SUCCESS NOTICE BANNER (WHEN PAID) */}
      {isPaid && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-800 flex items-center justify-between gap-3 shadow-inner animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Thanh toán thành công! (Ting Ting)
              </p>
              <p className="text-[11px] text-emerald-700 font-medium">
                Hệ thống AI đã đối soát & ghi nhận số tiền{" "}
                <strong>{formatVND(amountToPay)}</strong> cho mã{" "}
                <strong>{currentTransactionCode}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={playTingTing}
            title="Nghe lại âm thanh Ting Ting"
            className="h-8 w-8 rounded-lg bg-emerald-200/60 hover:bg-emerald-300 text-emerald-800 flex items-center justify-center shrink-0 transition"
          >
            <Volume2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. QR CODE & DETAILS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* QR Code Container */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="relative p-2.5 rounded-2xl bg-white shadow-md neu-extruded max-w-[210px] w-full aspect-square flex items-center justify-center overflow-hidden">
            {isLoadingSession ? (
              <div className="flex flex-col items-center justify-center gap-2 text-xs text-[#6B7280]">
                <div className="h-8 w-8 border-3 border-[#38B2AC] border-t-transparent rounded-full animate-spin" />
                <span>Đang sinh mã QR...</span>
              </div>
            ) : method === "banking" ? (
              <img
                src={vietQrUrl}
                alt="Mã VietQR TechHub"
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isPaid ? "opacity-40 grayscale" : "opacity-100"
                }`}
                loading="lazy"
              />
            ) : !momoImgError ? (
              <img
                src="/images/momo-qr.jpg"
                alt="Mã QR MoMo TechHub"
                className={`w-full h-full object-contain transition-opacity duration-300 ${
                  isPaid ? "opacity-40 grayscale" : "opacity-100"
                }`}
                onError={() => setMomoImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-3">
                <div className="h-12 w-12 rounded-2xl bg-[#A50064] text-white flex items-center justify-center font-black text-xl mb-2">
                  M
                </div>
                <span className="text-xs font-extrabold text-[#A50064]">Ví MoMo TechHub</span>
                <span className="text-[10px] text-[#6B7280] mt-1">Chuyển qua SĐT</span>
              </div>
            )}

            {/* Paid Watermark Overlay */}
            {isPaid && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] text-emerald-600 font-black animate-scaleIn">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 drop-shadow-sm mb-1" />
                <span className="text-xs uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full shadow">
                  Đã thanh toán
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#6B7280] font-bold mt-2 text-center flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-[#38B2AC]" /> Quét mã bằng app ngân hàng / MoMo
          </p>
        </div>

        {/* Account Details */}
        <div className="sm:col-span-7 space-y-2 text-xs text-[#3D4852]">
          {method === "banking" ? (
            <>
              <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-0.5">
                <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                  <span>Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-[#3D4852]">VietinBank</span>
                </div>
                <div className="text-[10px] text-[#6B7280]">Chi nhánh Sầm Sơn - Hội Sở</div>
              </div>

              <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-0.5">
                <span className="text-[11px] text-[#6B7280] block">Chủ tài khoản:</span>
                <span className="font-extrabold text-[#3D4852] uppercase text-xs tracking-wider block">
                  NGUYEN NHAT MINH
                </span>
              </div>

              <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#6B7280] block">Số tài khoản:</span>
                  <span className="font-mono font-black text-sm text-[#38B2AC] tracking-wider">
                    102565426868
                  </span>
                </div>
                <NeuButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard("102565426868", "stk")}
                  className="text-[11px] py-1 px-2.5 shrink-0"
                >
                  {copiedField === "stk" ? (
                    <span className="flex items-center gap-1 text-[#38B2AC] font-bold">
                      <Check className="h-3 w-3" /> Đã chép
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="h-3 w-3" /> Sao chép
                    </span>
                  )}
                </NeuButton>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-0.5">
                <span className="text-[11px] text-[#6B7280] block">Chủ tài khoản Ví MoMo:</span>
                <span className="font-extrabold text-[#3D4852] uppercase text-xs tracking-wider block">
                  NGUYEN NHAT MINH
                </span>
              </div>

              <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-[#6B7280] block">Số điện thoại / Ví MoMo:</span>
                  <span className="font-mono font-black text-sm text-[#D53F8C] tracking-wider">
                    0912345678
                  </span>
                </div>
                <NeuButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard("0912345678", "momoPhone")}
                  className="text-[11px] py-1 px-2.5 shrink-0"
                >
                  {copiedField === "momoPhone" ? (
                    <span className="flex items-center gap-1 text-[#38B2AC] font-bold">
                      <Check className="h-3 w-3" /> Đã chép
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="h-3 w-3" /> Sao chép
                    </span>
                  )}
                </NeuButton>
              </div>
            </>
          )}

          {/* SỐ TIỀN THANH TOÁN */}
          <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#6B7280] block">Số tiền cần chuyển:</span>
              <span className="font-black text-sm text-[#E53E3E] font-display">
                {formatVND(amountToPay)}
              </span>
            </div>
            <NeuButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(String(amountToPay), "amount")}
              className="text-[11px] py-1 px-2.5 shrink-0"
            >
              {copiedField === "amount" ? (
                <span className="flex items-center gap-1 text-[#38B2AC] font-bold">
                  <Check className="h-3 w-3" /> Đã chép
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Chép tiền
                </span>
              )}
            </NeuButton>
          </div>

          {/* NỘI DUNG CHUYỂN KHOẢN (MÃ ĐỐI SOÁT THxxxxxx) */}
          <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between border border-[#6C63FF]/30">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1 text-[11px] text-[#6B7280]">
                <span>Nội dung chuyển khoản:</span>
                <span className="text-[9px] bg-[#6C63FF]/10 text-[#6C63FF] font-bold px-1 rounded">
                  Bắt buộc
                </span>
              </div>
              <span className="font-mono font-black text-sm text-[#6C63FF] tracking-wider truncate block">
                {currentTransactionCode}
              </span>
            </div>
            <NeuButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(currentTransactionCode, "content")}
              className="text-[11px] py-1 px-2.5 shrink-0"
            >
              {copiedField === "content" ? (
                <span className="flex items-center gap-1 text-[#38B2AC] font-bold">
                  <Check className="h-3 w-3" /> Đã chép
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Sao chép
                </span>
              )}
            </NeuButton>
          </div>
        </div>
      </div>

      {/* 4. AI REAL-TIME SCANNER STATUS BAR */}
      <div className="p-3 rounded-xl neu-inset-sm bg-[#E8EDF5]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px]">
        <div className="flex items-center gap-2 text-[#3D4852]">
          <div className="relative flex items-center justify-center">
            <Bot className={`h-4 w-4 ${isPaid ? "text-emerald-500" : "text-[#6C63FF]"}`} />
            {!isPaid && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6C63FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6C63FF]"></span>
              </span>
            )}
          </div>
          <div>
            <span className="font-bold text-[#3D4852]">
              {isPaid
                ? "Hệ thống AI đã đối soát & khớp lệnh thành công!"
                : "🤖 Hệ thống AI đang tự động quét biến động số dư ngân hàng..."}
            </span>
            <p className="text-[10px] text-[#6B7280]">
              {isPaid
                ? "Mã đối soát đã xác nhận, giao dịch hợp lệ."
                : "Tự động lắng nghe chuyển khoản mỗi 2 giây, không cần chụp biên lai."}
            </p>
          </div>
        </div>

        {/* Nút Giả Lập Ngân Hàng Báo Ting Ting (Test Webhook) */}
        {!isPaid && session?.transactionCode && (
          <NeuButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSimulateWebhook}
            disabled={isSimulating}
            className="text-[10px] font-black py-1.5 px-3 bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300 text-amber-900 shadow-sm shrink-0 hover:from-amber-200 hover:to-amber-300 transition"
          >
            <Zap className={`h-3 w-3 text-amber-600 ${isSimulating ? "animate-spin" : ""}`} />
            {isSimulating ? "Đang gửi Webhook..." : "⚡ Giả lập Ngân hàng báo Ting Ting"}
          </NeuButton>
        )}
      </div>

      {simulationMsg && (
        <div className="text-[10px] text-center font-bold text-emerald-700 bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200 animate-fadeIn">
          {simulationMsg}
        </div>
      )}

      {/* 5. FOOTER NOTICE */}
      <div className="p-2.5 rounded-xl neu-inset-sm bg-[#E8EDF5]/40 flex items-start gap-2 text-[10px] text-[#6B7280]">
        <ShieldCheck className="h-3.5 w-3.5 text-[#38B2AC] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {isPaid
            ? "Đơn hàng đã được xác nhận thanh toán. Bạn chỉ cần nhấn nút xác nhận bên dưới để hoàn tất."
            : "Để hệ thống nhận diện tức thì, vui lòng không chỉnh sửa số tiền và nội dung chuyển khoản trong ứng dụng ngân hàng."}
        </p>
      </div>
    </div>
  );
}

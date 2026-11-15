import { useState } from "react";
import { Copy, Check, QrCode, ShieldCheck, Smartphone, Landmark } from "lucide-react";
import { NeuBadge, NeuButton } from "./NeumorphicComponents";

export interface PaymentQRCardProps {
  method: "banking" | "momo";
  finalAmount: number;
  customerPhone?: string;
  orderCode?: string;
  className?: string;
}

export default function PaymentQRCard({
  method,
  finalAmount,
  customerPhone = "",
  orderCode,
  className = "",
}: PaymentQRCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [momoImgError, setMomoImgError] = useState<boolean>(false);

  const cleanPhone = customerPhone.replace(/\D/g, "");
  const transferContent = `TECHHUB ${cleanPhone || orderCode || "DH"}`;
  const amountToPay = Math.max(0, Math.round(finalAmount));

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      // Fallback if clipboard API is restricted
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

  if (method === "banking") {
    const vietQrUrl = `https://img.vietqr.io/image/ICB-102565426868-compact2.png?amount=${amountToPay}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent("NGUYEN NHAT MINH")}`;

    return (
      <div
        className={`rounded-2xl neu-inset p-4 md:p-5 bg-[#E0E5EC] space-y-4 border border-[#38B2AC]/30 animate-fadeIn ${className}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#D1D9E6]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl neu-extruded flex items-center justify-center text-[#38B2AC]">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-black text-[#3D4852] uppercase tracking-wide">
                Thanh toán Chuyển khoản VietQR
              </p>
              <p className="text-[10px] text-[#6B7280] font-medium">
                Mã QR động tự động điền số tiền và nội dung chuyển khoản
              </p>
            </div>
          </div>
          <NeuBadge variant="teal" className="text-[10px] py-0.5 px-2">
            VietinBank 24/7
          </NeuBadge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* QR Code Container */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center">
            <div className="p-2.5 rounded-2xl bg-white shadow-md neu-extruded max-w-[210px] w-full aspect-square flex items-center justify-center overflow-hidden">
              <img
                src={vietQrUrl}
                alt="Mã VietQR TechHub"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <p className="text-[11px] text-[#6B7280] font-bold mt-2 text-center flex items-center gap-1">
              <QrCode className="h-3.5 w-3.5 text-[#38B2AC]" /> Quét mã bằng app ngân hàng
            </p>
          </div>

          {/* Account Details */}
          <div className="sm:col-span-7 space-y-2.5 text-xs text-[#3D4852]">
            <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-1">
              <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                <span>Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-[#3D4852]">VietinBank</span>
              </div>
              <div className="text-[10px] text-[#6B7280]">
                Chi nhánh Sầm Sơn - Hội Sở
              </div>
            </div>

            <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-1">
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

            <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-[#6B7280] block">Nội dung chuyển khoản:</span>
                <span className="font-mono font-black text-xs text-[#6C63FF] tracking-wider truncate block">
                  {transferContent}
                </span>
              </div>
              <NeuButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(transferContent, "content")}
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

        <div className="p-3 rounded-xl neu-inset-sm bg-[#E8EDF5]/60 flex items-start gap-2 text-[11px] text-[#6B7280]">
          <ShieldCheck className="h-4 w-4 text-[#38B2AC] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Đơn hàng sẽ được ghi nhận trạng thái <strong>Chờ xác nhận thanh toán</strong> ngay sau khi bấm đặt hàng. Sau khi nhận được chuyển khoản đúng nội dung, hệ thống sẽ tự động phê duyệt và đóng gói gửi đến bạn.
          </p>
        </div>
      </div>
    );
  }

  // MOMO PAYMENT
  return (
    <div
      className={`rounded-2xl neu-inset p-4 md:p-5 bg-[#E0E5EC] space-y-4 border border-[#D53F8C]/30 animate-fadeIn ${className}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#D1D9E6]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl neu-extruded flex items-center justify-center text-[#D53F8C]">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-[#3D4852] uppercase tracking-wide">
              Thanh toán Ví Điện Tử MoMo
            </p>
            <p className="text-[10px] text-[#6B7280] font-medium">
              Chuyển tiền qua mã QR MoMo hoặc số điện thoại ví
            </p>
          </div>
        </div>
        <NeuBadge variant="accent" className="text-[10px] py-0.5 px-2 bg-[#D53F8C]/10 text-[#D53F8C]">
          MoMo Pay
        </NeuBadge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* QR Code Container */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center">
          <div className="p-2.5 rounded-2xl bg-white shadow-md neu-extruded max-w-[210px] w-full aspect-square flex items-center justify-center overflow-hidden">
            {!momoImgError ? (
              <img
                src="/images/momo-qr.jpg"
                alt="Mã QR MoMo TechHub"
                className="w-full h-full object-contain"
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
          </div>
          <p className="text-[11px] text-[#6B7280] font-bold mt-2 text-center flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-[#D53F8C]" /> Quét bằng ứng dụng MoMo
          </p>
        </div>

        {/* MoMo Details */}
        <div className="sm:col-span-7 space-y-2.5 text-xs text-[#3D4852]">
          <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-1">
            <span className="text-[11px] text-[#6B7280] block">Chủ tài khoản Ví MoMo:</span>
            <span className="font-extrabold text-[#3D4852] uppercase text-xs tracking-wider block">
              NGUYEN NHAT MINH
            </span>
          </div>

          <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#6B7280] block">Số điện thoại / Ví MoMo:</span>
              <span className="font-mono font-black text-sm text-[#D53F8C] tracking-wider">
                0912345678 <span className="text-xs text-[#6B7280] font-normal">(hoặc quét QR)</span>
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

          <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#6B7280] block">Số tiền thanh toán:</span>
              <span className="font-black text-sm text-[#E53E3E] font-display">
                {formatVND(amountToPay)}
              </span>
            </div>
            <NeuButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(String(amountToPay), "momoAmount")}
              className="text-[11px] py-1 px-2.5 shrink-0"
            >
              {copiedField === "momoAmount" ? (
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

          <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] text-[#6B7280] block">Lời nhắn / Nội dung:</span>
              <span className="font-mono font-black text-xs text-[#6C63FF] tracking-wider truncate block">
                {transferContent}
              </span>
            </div>
            <NeuButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(transferContent, "momoContent")}
              className="text-[11px] py-1 px-2.5 shrink-0"
            >
              {copiedField === "momoContent" ? (
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

      <div className="p-3 rounded-xl neu-inset-sm bg-[#E8EDF5]/60 flex items-start gap-2 text-[11px] text-[#6B7280]">
        <ShieldCheck className="h-4 w-4 text-[#D53F8C] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Đơn hàng sẽ được ghi nhận trạng thái <strong>Chờ xác nhận thanh toán</strong> ngay sau khi bấm đặt hàng. Bạn vui lòng chụp lại biên lai giao dịch thành công để nhân viên hỗ trợ nhanh nhất khi cần.
        </p>
      </div>
    </div>
  );
}

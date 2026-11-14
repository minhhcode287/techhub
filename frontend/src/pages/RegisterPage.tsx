import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserPlus, AlertCircle, ArrowLeft, CheckCircle2, User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { NeuCard, NeuButton, NeuInput, NeuBadge, NeuIconWell } from "../components/NeumorphicComponents";
import SEO from "../components/SEO";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Realtime field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = () => {
    const errs: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errs.name = "Vui lòng nhập họ và tên của bạn";
    }

    if (!email.trim()) {
      errs.email = "Vui lòng nhập địa chỉ email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Email không hợp lệ (ví dụ: example@techhub.vn)";
    }

    if (phone.trim() && !/^(0[3|5|7|8|9])[0-9]{8}$/.test(phone.trim().replace(/\s/g, ""))) {
      errs.phone = "Số điện thoại không đúng định dạng (10 số, ví dụ 0912345678)";
    }

    if (!password) {
      errs.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      errs.password = "Mật khẩu phải chứa ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Vui lòng nhập lại mật khẩu";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không trùng khớp";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/account");
      }, 700);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E0E5EC] px-6 py-12 text-[#3D4852] selection:bg-[#6C63FF] selection:text-white">
      <SEO title="Đăng Ký Tài Khoản Mới" description="Tạo tài khoản TechHub để tận hưởng ưu đãi mua sắm thiết bị và đặt thuê máy ảnh nhanh chóng." />
      <div className="w-full max-w-md">
        <Link
          to="/"
          id="register-back-to-home"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] transition hover:text-[#3D4852]"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>

        <NeuCard rounded="32" className="p-8 md:p-10 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NeuIconWell size="md">
                <UserPlus className="h-5 w-5" />
              </NeuIconWell>
              <div>
                <h1 className="text-2xl font-extrabold font-display tracking-tight text-[#3D4852]">Tạo tài khoản</h1>
                <p className="text-xs text-[#6B7280] font-medium">Khách hàng mới</p>
              </div>
            </div>
            <NeuBadge variant="teal">Bảo mật</NeuBadge>
          </div>

          <p className="mt-4 text-sm text-[#6B7280] leading-relaxed">
            Đăng ký tài khoản TECHHUB để lưu giỏ hàng, theo dõi đơn hàng và giữ lịch thuê máy ảnh.
          </p>

          {error && (
            <div className="mt-5 flex items-center gap-2.5 rounded-2xl neu-inset-sm p-3.5 text-xs font-semibold text-[#E53E3E] bg-[#E0E5EC]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-5 flex items-center gap-2.5 rounded-2xl neu-inset-sm p-3.5 text-xs font-semibold text-[#38B2AC] bg-[#E0E5EC]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Đăng ký thành công! Đang tự động chuyển hướng...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <NeuInput
              id="register-name-input"
              label="Họ và tên *"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
              }}
              error={fieldErrors.name}
              placeholder="Nguyễn Văn A"
              icon={<User className="h-4 w-4" />}
            />

            <NeuInput
              id="register-email-input"
              label="Email *"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              error={fieldErrors.email}
              placeholder="example@techhub.vn"
              icon={<Mail className="h-4 w-4" />}
            />

            <NeuInput
              id="register-phone-input"
              label="Số điện thoại"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
              }}
              error={fieldErrors.phone}
              placeholder="0987654321 (Tùy chọn)"
              icon={<Phone className="h-4 w-4" />}
            />

            <div className="relative">
              <NeuInput
                id="register-password-input"
                label="Mật khẩu *"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                error={fieldErrors.password}
                placeholder="Ít nhất 6 ký tự"
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-9 text-[#6B7280] hover:text-[#3D4852] p-1 cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <NeuInput
              id="register-confirm-password-input"
              label="Xác nhận mật khẩu *"
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword)
                  setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
              }}
              error={fieldErrors.confirmPassword}
              placeholder="Nhập lại mật khẩu"
              icon={<Lock className="h-4 w-4" />}
            />

            <div className="pt-2">
              <NeuButton
                id="register-submit-button"
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                <UserPlus className="h-4 w-4" /> Đăng ký tài khoản
              </NeuButton>
            </div>
          </form>

          <div className="mt-8 border-t border-[#D1D9E6]/60 pt-6 text-center">
            <p className="text-xs text-[#6B7280]">Đã có tài khoản?</p>
            <Link
              to="/login"
              id="goto-login-link"
              className="mt-1.5 inline-block text-sm font-bold text-[#6C63FF] hover:underline"
            >
              Đăng nhập ngay →
            </Link>
          </div>
        </NeuCard>
      </div>
    </main>
  );
}

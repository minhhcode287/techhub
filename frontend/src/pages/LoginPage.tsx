import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogIn, AlertCircle, ArrowLeft, CheckCircle2, Lock, Mail, Zap, Eye, EyeOff } from "lucide-react";
import { NeuCard, NeuButton, NeuInput, NeuBadge, NeuIconWell } from "../components/NeumorphicComponents";
import SEO from "../components/SEO";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Real-time field errors
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  React.useEffect(() => {
    const notice = sessionStorage.getItem("techhub_auth_notice");
    if (notice) {
      setError(notice);
      sessionStorage.removeItem("techhub_auth_notice");
    }
  }, []);

  const validateForm = () => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = "Vui lòng nhập địa chỉ email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Email không đúng định dạng (ví dụ: customer@techhub.vn)";
    }

    if (!password) {
      errs.password = "Vui lòng nhập mật khẩu";
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
      await login(email.trim(), password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 600);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("customer@techhub.vn");
    setPassword("Test@123");
    setError(null);
    setFieldErrors({});
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#E0E5EC] px-6 py-12 text-[#3D4852] selection:bg-[#6C63FF] selection:text-white">
      <SEO title="Đăng Nhập Thành Viên" description="Đăng nhập tài khoản TechHub để quản lý mua sắm thiết bị và dịch vụ thuê máy ảnh." />
      <div className="w-full max-w-md">
        <Link
          to="/"
          id="back-to-home-link"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#6B7280] transition hover:text-[#3D4852]"
        >
          <ArrowLeft className="h-4 w-4" /> Về trang chủ
        </Link>

        <NeuCard rounded="32" className="p-8 md:p-10 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NeuIconWell size="md">
                <LogIn className="h-5 w-5" />
              </NeuIconWell>
              <div>
                <h1 className="text-2xl font-extrabold font-display tracking-tight text-[#3D4852]">Đăng nhập</h1>
                <p className="text-xs text-[#6B7280] font-medium">Tài khoản thành viên</p>
              </div>
            </div>
            <NeuBadge variant="accent">Thành viên</NeuBadge>
          </div>

          <p className="mt-4 text-sm text-[#6B7280] leading-relaxed">
            Đăng nhập vào hệ thống TECHHUB để quản lý đơn hàng và dịch vụ thuê máy ảnh.
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
              <span>Đăng nhập thành công! Đang chuyển hướng...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <NeuInput
              id="login-email-input"
              label="Email *"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              error={fieldErrors.email}
              placeholder="customer@techhub.vn"
              icon={<Mail className="h-4 w-4" />}
            />

            <div className="relative">
              <NeuInput
                id="login-password-input"
                label="Mật khẩu *"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                }}
                error={fieldErrors.password}
                placeholder="••••••••"
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

            <div className="pt-2 space-y-3">
              <NeuButton
                id="login-submit-button"
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                <LogIn className="h-4 w-4" /> Đăng nhập
              </NeuButton>

              <NeuButton
                id="fill-demo-account-button"
                type="button"
                variant="secondary"
                size="md"
                onClick={handleFillDemo}
                className="w-full text-xs font-semibold"
              >
                <Zap className="h-3.5 w-3.5 text-[#6C63FF]" /> Dùng thử tài khoản Demo có sẵn
              </NeuButton>
            </div>
          </form>

          <div className="mt-8 border-t border-[#D1D9E6]/60 pt-6 text-center">
            <p className="text-xs text-[#6B7280]">Chưa có tài khoản?</p>
            <Link
              to="/register"
              id="goto-register-link"
              className="mt-1.5 inline-block text-sm font-bold text-[#6C63FF] hover:underline"
            >
              Đăng ký tài khoản mới →
            </Link>
          </div>
        </NeuCard>
      </div>
    </main>
  );
}

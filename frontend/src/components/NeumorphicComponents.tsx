import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  X,
  Menu,
  Camera,
  ShoppingCart,
  User as UserIcon,
  Layers,
  AlertCircle,
  RefreshCw,
  Inbox,
  Home,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

/* -------------------------------------------------------------------------- */
/*                                NEU CARD                                    */
/* -------------------------------------------------------------------------- */
export interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  deepInset?: boolean;
  inset?: boolean;
  rounded?: "32" | "24" | "16" | "full";
  id?: string;
}

export function NeuCard({
  children,
  className = "",
  hoverable = false,
  deepInset = false,
  inset = false,
  rounded = "32",
  id,
  ...props
}: NeuCardProps) {
  const roundedClass =
    rounded === "32"
      ? "rounded-[32px]"
      : rounded === "24"
      ? "rounded-3xl"
      : rounded === "16"
      ? "rounded-2xl"
      : "rounded-full";

  const shadowClass = deepInset
    ? "neu-inset-deep"
    : inset
    ? "neu-inset"
    : hoverable
    ? "neu-extruded neu-extruded-hover"
    : "neu-extruded";

  return (
    <div
      id={id}
      className={`bg-[#E0E5EC] ${roundedClass} ${shadowClass} transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               NEU BUTTON                                   */
/* -------------------------------------------------------------------------- */
export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "teal" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isActive?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
}

export function NeuButton({
  children,
  variant = "secondary",
  size = "md",
  isActive = false,
  loading = false,
  className = "",
  disabled,
  id,
  ...props
}: NeuButtonProps) {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs font-semibold rounded-xl min-h-[36px]",
    md: "px-5 py-2.5 text-sm font-bold rounded-2xl min-h-[44px]",
    lg: "px-7 py-3.5 text-base font-bold rounded-2xl min-h-[48px]",
    icon: "p-2.5 rounded-2xl min-h-[44px] min-w-[44px] flex items-center justify-center",
  }[size];

  const getVariantClass = () => {
    if (isActive) {
      return "bg-[#E0E5EC] text-[#6C63FF] neu-inset font-bold";
    }
    if (variant === "primary") {
      return "neu-accent";
    }
    if (variant === "teal") {
      return "bg-[#38B2AC] text-white shadow-[6px_6px_14px_rgba(56,178,172,0.35),-6px_-6px_14px_rgba(255,255,255,0.6)] hover:bg-[#319795] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.25)]";
    }
    if (variant === "danger") {
      return "bg-[#E53E3E] text-white shadow-[6px_6px_14px_rgba(229,62,62,0.35),-6px_-6px_14px_rgba(255,255,255,0.6)] hover:bg-[#C53030] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.25)]";
    }
    if (variant === "ghost") {
      return "bg-transparent text-[#6B7280] hover:text-[#3D4852] hover:neu-inset-sm";
    }
    return "neu-btn";
  };

  const variantClass = getVariantClass();

  return (
    <button
      id={id}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${sizeClasses} ${variantClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                              NEU ICON WELL                                 */
/* -------------------------------------------------------------------------- */
export interface NeuIconWellProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  id?: string;
}

export function NeuIconWell({ children, size = "md", className = "", id }: NeuIconWellProps) {
  const sizeClasses = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-11 h-11 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl",
    xl: "w-18 h-18 rounded-3xl",
  }[size];

  return (
    <div
      id={id}
      className={`neu-inset-deep bg-[#E0E5EC] flex items-center justify-center shrink-0 text-[#6C63FF] ${sizeClasses} ${className}`}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                NEU INPUT                                   */
/* -------------------------------------------------------------------------- */
export interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  id?: string;
  icon?: React.ReactNode;
}

export function NeuInput({
  label,
  error,
  helperText,
  id,
  icon,
  className = "",
  ...props
}: NeuInputProps) {
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className={`block text-xs font-bold uppercase tracking-wider mb-2 transition-colors ${
            hasError ? "text-[#E53E3E]" : "text-[#6B7280]"
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div
            className={`absolute left-4 pointer-events-none flex items-center transition-colors ${
              hasError ? "text-[#E53E3E]" : "text-[#6B7280]"
            }`}
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          aria-invalid={hasError}
          aria-describedby={hasError && id ? `${id}-error` : undefined}
          className={`w-full bg-[#E0E5EC] text-[#3D4852] font-medium placeholder-[#9CA3AF] rounded-2xl py-3 px-4 text-sm transition-all duration-200 outline-none ${
            hasError
              ? "shadow-[inset_5px_5px_10px_rgba(229,62,62,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.7)] ring-1.5 ring-[#E53E3E]"
              : "neu-input"
          } ${icon ? "pl-11" : ""} ${className}`}
          {...props}
        />
        {hasError && (
          <div className="absolute right-4 text-[#E53E3E] pointer-events-none">
            <AlertCircle className="h-4 w-4" />
          </div>
        )}
      </div>
      {hasError ? (
        <p id={id ? `${id}-error` : undefined} className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[#E53E3E]">
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-[11px] text-[#6B7280] font-medium">{helperText}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                NEU BADGE                                   */
/* -------------------------------------------------------------------------- */
export interface NeuBadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "teal" | "warning" | "danger" | "inset";
  className?: string;
  id?: string;
}

export function NeuBadge({ children, variant = "default", className = "", id }: NeuBadgeProps) {
  const variantStyles = {
    default: "bg-[#E0E5EC] text-[#3D4852] neu-extruded-sm",
    accent: "bg-[#E0E5EC] text-[#6C63FF] neu-inset-sm font-bold",
    teal: "bg-[#E0E5EC] text-[#38B2AC] neu-inset-sm font-bold",
    warning: "bg-[#E0E5EC] text-[#D97706] neu-inset-sm font-bold",
    danger: "bg-[#E0E5EC] text-[#E53E3E] neu-inset-sm font-bold",
    inset: "bg-[#E0E5EC] text-[#6B7280] neu-inset-sm",
  }[variant];

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide select-none ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                                NEU MODAL                                   */
/* -------------------------------------------------------------------------- */
export interface NeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  id?: string;
}

export function NeuModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
  id,
}: NeuModalProps) {
  if (!isOpen) return null;

  const maxWClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth] || "max-w-3xl";

  return (
    <div
      id={id ? `${id}-backdrop` : "neu-modal-backdrop"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D4852]/40 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id={id}
        className={`w-full ${maxWClass} bg-[#E0E5EC] rounded-[32px] neu-extruded p-6 md:p-8 relative max-h-[90vh] overflow-y-auto transform transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#D1D9E6]/60">
          <div>
            <h3 className="text-xl font-extrabold text-[#3D4852] font-display">{title}</h3>
            {subtitle && <p className="text-xs text-[#6B7280] mt-1 font-medium">{subtitle}</p>}
          </div>
          <NeuButton
            size="icon"
            variant="secondary"
            onClick={onClose}
            aria-label="Đóng"
            className="text-[#6B7280] hover:text-[#3D4852] -mr-2 -mt-2"
          >
            <X className="h-4 w-4" />
          </NeuButton>
        </div>

        {/* Content */}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               NEU SKELETON                                 */
/* -------------------------------------------------------------------------- */
export interface NeuSkeletonProps {
  className?: string;
  rounded?: "16" | "24" | "32" | "full";
}

export function NeuSkeleton({ className = "h-6 w-full", rounded = "16" }: NeuSkeletonProps) {
  const roundedClass =
    rounded === "32"
      ? "rounded-[32px]"
      : rounded === "24"
      ? "rounded-3xl"
      : rounded === "16"
      ? "rounded-2xl"
      : "rounded-full";

  return (
    <div
      className={`bg-[#E0E5EC] neu-inset-sm animate-pulse ${roundedClass} ${className}`}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                              NEU EMPTY STATE                               */
/* -------------------------------------------------------------------------- */
export interface NeuEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionTo?: string;
  className?: string;
}

export function NeuEmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionTo,
  className = "",
}: NeuEmptyStateProps) {
  return (
    <NeuCard rounded="32" className={`p-10 md:p-14 text-center ${className}`}>
      <div className="flex justify-center mb-5">
        <NeuIconWell size="xl" className="text-[#6C63FF]">
          {icon || <Inbox className="h-8 w-8" />}
        </NeuIconWell>
      </div>
      <h3 className="text-xl font-extrabold font-display text-[#3D4852]">{title}</h3>
      <p className="mt-2 text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {(actionText && (onAction || actionTo)) && (
        <div className="mt-6 flex justify-center">
          {actionTo ? (
            <Link to={actionTo}>
              <NeuButton variant="primary" size="md">
                {actionText}
              </NeuButton>
            </Link>
          ) : (
            <NeuButton variant="primary" size="md" onClick={onAction}>
              {actionText}
            </NeuButton>
          )}
        </div>
      )}
    </NeuCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                              NEU ERROR STATE                               */
/* -------------------------------------------------------------------------- */
export interface NeuErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function NeuErrorState({
  title = "Đã xảy ra sự cố",
  message,
  onRetry,
  className = "",
}: NeuErrorStateProps) {
  return (
    <NeuCard rounded="32" className={`p-8 text-center max-w-lg mx-auto ${className}`}>
      <div className="flex justify-center mb-4">
        <NeuIconWell size="lg" className="text-[#E53E3E]">
          <AlertCircle className="h-7 w-7" />
        </NeuIconWell>
      </div>
      <h3 className="text-lg font-extrabold font-display text-[#3D4852]">{title}</h3>
      <p className="mt-2 text-xs text-[#E53E3E] font-medium leading-relaxed neu-inset-sm p-3 rounded-2xl bg-[#E0E5EC]">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <NeuButton variant="secondary" size="md" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" /> Thử lại
          </NeuButton>
        </div>
      )}
    </NeuCard>
  );
}

/* -------------------------------------------------------------------------- */
/*                               NEU NAVBAR                                   */
/* -------------------------------------------------------------------------- */
export function NeuNavbar() {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#E0E5EC]/95 backdrop-blur-md neu-extruded-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* BRAND LOGO */}
        <Link
          to="/"
          id="navbar-brand-logo"
          className="flex items-center gap-2.5 text-2xl font-extrabold font-display tracking-tight text-[#3D4852]"
        >
          <NeuIconWell size="md" className="text-[#6C63FF]">
            <Layers className="h-5 w-5" />
          </NeuIconWell>
          <span>
            TECH<span className="text-[#6C63FF]">HUB</span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center rounded-2xl neu-inset p-1.5 bg-[#E0E5EC] gap-1">
          <Link
            to="/"
            id="nav-home-link"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              isActive("/") && location.pathname === "/"
                ? "neu-accent font-extrabold"
                : "text-[#6B7280] hover:text-[#3D4852]"
            }`}
          >
            <Home className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <Link
            to="/rentals"
            id="nav-rentals-link"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              isActive("/rentals")
                ? "neu-accent font-extrabold"
                : "text-[#6B7280] hover:text-[#3D4852]"
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> Thuê máy ảnh
          </Link>
          <Link
            to="/cart"
            id="nav-cart-link"
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              isActive("/cart")
                ? "neu-accent font-extrabold"
                : "text-[#6B7280] hover:text-[#3D4852]"
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Giỏ hàng
            {totalItems > 0 && (
              <span className="ml-1 rounded-full bg-[#6C63FF] text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                {totalItems}
              </span>
            )}
          </Link>
          {user && (user.role === "admin" || user.role === "staff") && (
            <Link
              to="/management"
              id="nav-management-link"
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isActive("/management") || isActive("/admin") || isActive("/staff")
                  ? "neu-accent text-[#6C63FF]"
                  : "text-[#6C63FF] hover:text-[#5B54E0]"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Quản lý ({user.role === "admin" ? "Admin" : "Staff"})
            </Link>
          )}
        </nav>

        {/* USER & CART ACTIONS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Cart Icon Shortcut */}
          <Link to="/cart" id="nav-cart-btn" title="Giỏ hàng">
            <NeuButton
              variant={isActive("/cart") ? "primary" : "secondary"}
              size="icon"
              className="relative"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#6C63FF] text-[10px] font-black text-white shadow-md">
                  {totalItems}
                </span>
              )}
            </NeuButton>
          </Link>

          {/* User Account / Auth */}
          {user ? (
            <Link to="/account" id="nav-account-btn">
              <NeuButton
                variant={isActive("/account") ? "primary" : "secondary"}
                size="md"
                className="hidden sm:flex items-center gap-2"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C63FF] text-xs font-extrabold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-bold text-[#3D4852] max-w-[120px] truncate">{user.name}</span>
              </NeuButton>
              <NeuButton
                variant={isActive("/account") ? "primary" : "secondary"}
                size="icon"
                className="sm:hidden"
                aria-label="Tài khoản"
              >
                <UserIcon className="h-4 w-4" />
              </NeuButton>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" id="nav-login-btn">
                <NeuButton variant="secondary" size="md">
                  Đăng nhập
                </NeuButton>
              </Link>
              <Link to="/register" id="nav-register-btn">
                <NeuButton variant="primary" size="md">
                  Đăng ký
                </NeuButton>
              </Link>
            </div>
          )}

          {/* Hamburger Menu on Mobile */}
          <NeuButton
            id="mobile-menu-toggle-btn"
            variant="secondary"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Mở menu di động"
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </NeuButton>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-drawer"
          className="md:hidden border-t border-[#D1D9E6]/80 bg-[#E0E5EC] p-6 space-y-4 animate-fadeIn shadow-xl"
        >
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold ${
                location.pathname === "/" ? "neu-accent" : "neu-btn"
              }`}
            >
              <Home className="h-4 w-4" /> Trang chủ
            </Link>
            <Link
              to="/rentals"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold ${
                isActive("/rentals") ? "neu-accent" : "neu-btn"
              }`}
            >
              <Camera className="h-4 w-4" /> Thuê máy ảnh
            </Link>
            <Link
              to="/cart"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold ${
                isActive("/cart") ? "neu-accent" : "neu-btn"
              }`}
            >
              <ShoppingCart className="h-4 w-4" /> Giỏ hàng ({totalItems})
            </Link>
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold ${
                isActive("/account") ? "neu-accent" : "neu-btn"
              }`}
            >
              <UserIcon className="h-4 w-4" /> Tài khoản
            </Link>
            {user && (user.role === "admin" || user.role === "staff") && (
              <Link
                to="/management"
                onClick={() => setMobileMenuOpen(false)}
                className={`col-span-2 flex items-center justify-center gap-2.5 rounded-2xl p-3.5 text-xs font-extrabold text-[#6C63FF] ${
                  isActive("/management") || isActive("/admin") || isActive("/staff") ? "neu-accent" : "neu-btn"
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Quản trị ({user.role === "admin" ? "Admin" : "Staff"})
              </Link>
            )}
          </div>

          {!user && (
            <div className="pt-2 border-t border-[#D1D9E6]/80 flex gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1"
              >
                <NeuButton variant="secondary" size="md" className="w-full">
                  Đăng nhập
                </NeuButton>
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1"
              >
                <NeuButton variant="primary" size="md" className="w-full">
                  Đăng ký
                </NeuButton>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*                               NEU FOOTER                                   */
/* -------------------------------------------------------------------------- */
export function NeuFooter() {
  return (
    <footer className="border-t border-[#D1D9E6]/80 bg-[#E0E5EC] py-12 text-[#6B7280] text-xs">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-[#3D4852] text-sm font-display">
            <span className="h-2 w-2 rounded-full bg-[#6C63FF]" />
            TECHHUB • Store & Camera Rental
          </div>
          <p className="mt-1.5 text-[#6B7280]">
            Hệ thống bán lẻ thiết bị công nghệ & cho thuê máy ảnh chuyên nghiệp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 font-semibold">
          <Link to="/" className="hover:text-[#6C63FF] transition-colors">
            Trang chủ
          </Link>
          <Link to="/rentals" className="hover:text-[#6C63FF] transition-colors">
            Thuê máy ảnh
          </Link>
          <Link to="/cart" className="hover:text-[#6C63FF] transition-colors">
            Giỏ hàng
          </Link>
          <Link to="/account" className="hover:text-[#6C63FF] transition-colors">
            Tài khoản
          </Link>
          <Link to="/login" className="hover:text-[#6C63FF] transition-colors">
            Đăng nhập
          </Link>
        </div>
      </div>
    </footer>
  );
}

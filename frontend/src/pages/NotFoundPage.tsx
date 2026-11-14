import { Link } from "react-router-dom";
import { Home, HelpCircle } from "lucide-react";
import SEO from "../components/SEO";
import {
  NeuNavbar,
  NeuFooter,
  NeuCard,
  NeuButton,
  NeuBadge,
  NeuIconWell,
} from "../components/NeumorphicComponents";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#E0E5EC] text-[#3D4852] font-sans selection:bg-[#6C63FF] selection:text-white">
      <SEO title="404 - Không Tìm Thấy Trang" description="Trang bạn đang tìm kiếm không tồn tại trên hệ thống TechHub." />
      <NeuNavbar />

      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <NeuCard rounded="32" className="p-10 md:p-14 w-full">
          <div className="flex justify-center mb-6">
            <NeuIconWell size="xl" className="text-[#6C63FF]">
              <HelpCircle className="h-10 w-10 animate-pulse" />
            </NeuIconWell>
          </div>

          <NeuBadge variant="accent" className="mb-4">
            Lỗi 404
          </NeuBadge>

          <h1 className="text-4xl sm:text-5xl font-black font-display tracking-tight text-[#3D4852]">
            404
          </h1>

          <h2 className="mt-2 text-xl font-extrabold text-[#3D4852]">
            Không tìm thấy trang yêu cầu
          </h2>

          <p className="mt-3 text-sm text-[#6B7280] leading-relaxed">
            Đường dẫn bạn vừa truy cập không tồn tại hoặc đã được thay đổi địa chỉ.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" id="not-found-home-btn" className="w-full sm:w-auto">
              <NeuButton variant="primary" size="lg" className="w-full sm:w-auto">
                <Home className="h-4 w-4" /> Về trang chủ TECHHUB
              </NeuButton>
            </Link>
            <Link to="/rentals" id="not-found-rentals-btn" className="w-full sm:w-auto">
              <NeuButton variant="secondary" size="lg" className="w-full sm:w-auto">
                Xem dịch vụ thuê máy
              </NeuButton>
            </Link>
          </div>
        </NeuCard>
      </main>

      <NeuFooter />
    </div>
  );
}

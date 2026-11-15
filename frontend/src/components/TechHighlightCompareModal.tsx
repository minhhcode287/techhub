import { useState, useEffect } from "react";
import {
  X,
  Flame,
  CheckCircle2,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  ShoppingBag,
  CreditCard,
  Target,
  Sparkles,
} from "lucide-react";
import { NeuBadge, NeuButton } from "./NeumorphicComponents";
import { useCart } from "../context/CartContext";
import type { Product } from "../services/api";

export interface TechHighlightCompareModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBuyNow?: (product: Product) => void;
  allProducts?: Product[];
}

interface ComparedItem {
  id: string;
  rankBadge: string;
  rankColor: "teal" | "accent" | "warning" | "default";
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  image: string;
  targetUser: string;
  specs: {
    cpu: string;
    ram: string;
    storage: string;
    display: string;
    gpu: string;
    battery: string;
  };
  productRef?: Product;
}

const TOP_HIGHLIGHT_ITEMS: ComparedItem[] = [
  {
    id: "macbook-pro-16-m3-max",
    rankBadge: "#1 Bán Chạy Nhất",
    rankColor: "teal",
    name: "MacBook Pro 16 M3 Max",
    brand: "Apple",
    price: 89990000,
    originalPrice: 94990000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80",
    targetUser: "Render 3D/AI chuyên sâu, đạo diễn dựng phim 8K, lập trình viên cao cấp",
    specs: {
      cpu: "Apple M3 Max 16-Core (12 P-Core + 4 E-Core)",
      ram: "36GB Unified Memory (Băng thông 300GB/s)",
      storage: "1TB PCIe NVMe SSD siêu tốc",
      display: "16.2 inch Liquid Retina XDR 120Hz ProMotion (1600 nits đỉnh)",
      gpu: "40-Core GPU Metal 3, Ray Tracing phần cứng",
      battery: "Lên đến 22 giờ sử dụng liên tục (Pin 100Wh)",
    },
  },
  {
    id: "msi-raider-ge78-hx-14v",
    rankBadge: "#2 Quái Vật Gaming",
    rankColor: "accent",
    name: "MSI Raider GE78 HX 14V",
    brand: "MSI",
    price: 84990000,
    originalPrice: 89990000,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80",
    targetUser: "Game thủ chuyên nghiệp AAA, kiến trúc sư mô phỏng thực tế ảo VR",
    specs: {
      cpu: "Intel Core i9-14900HX (24 nhân / 32 luồng, Turbo 5.8GHz)",
      ram: "64GB DDR5 5600MHz (Hỗ trợ nâng cấp tối đa)",
      storage: "2TB NVMe PCIe Gen5 SSD thế hệ mới",
      display: "17.0 inch QHD+ (2560x1600) 240Hz 100% DCI-P3",
      gpu: "NVIDIA GeForce RTX 4090 16GB GDDR6 (175W Max TGP)",
      battery: "Pin 99.9Wh + Tản nhiệt buồng hơi Cooler Boost 5",
    },
  },
  {
    id: "lenovo-legion-pro-7i-gen-9",
    rankBadge: "#3 Gaming Cân Bằng",
    rankColor: "warning",
    name: "Lenovo Legion Pro 7i Gen 9",
    brand: "Lenovo",
    price: 74900000,
    originalPrice: 79900000,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80",
    targetUser: "Streamer, kỹ sư đồ họa & game thủ cần máy mát mẻ, bền bỉ",
    specs: {
      cpu: "Intel Core i9-14900HX 24-Core 5.8GHz",
      ram: "32GB DDR5 5600MHz kênh đôi",
      storage: "2TB PCIe 4.0 NVMe SSD",
      display: "16.0 inch WQXGA (2560x1600) 240Hz 500 nits 100% sRGB",
      gpu: "NVIDIA GeForce RTX 4090 16GB GDDR6 (175W)",
      battery: "Pin 99.9Wh sạc siêu nhanh Legion ColdFront 5.0",
    },
  },
  {
    id: "macbook-air-15-m3-2024",
    rankBadge: "#4 Doanh Nhân & Học Tập",
    rankColor: "teal",
    name: "MacBook Air 15 M3 2024",
    brand: "Apple",
    price: 32490000,
    originalPrice: 34990000,
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80",
    targetUser: "Doanh nhân, văn phòng, sinh viên cần máy siêu mỏng nhẹ pin trâu",
    specs: {
      cpu: "Apple M3 8-Core (4 P-Core + 4 E-Core)",
      ram: "16GB Unified Memory tối ưu đa nhiệm",
      storage: "512GB SSD tốc độ cao",
      display: "15.3 inch Liquid Retina 500 nits True Tone",
      gpu: "10-Core GPU thế hệ mới",
      battery: "Lên đến 18 giờ pin, trọng lượng siêu nhẹ 1.51kg",
    },
  },
];

export default function TechHighlightCompareModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onBuyNow,
  allProducts = [],
}: TechHighlightCompareModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const { addToCart } = useCart();
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleCloseModal = () => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Lắng nghe CustomEvent từ bất kỳ đâu (Navbar, Footer, Banner)
  useEffect(() => {
    const handleOpenEvent = () => {
      setInternalIsOpen(true);
    };

    window.addEventListener("techhub:open_compare_modal", handleOpenEvent);
    return () => {
      window.removeEventListener("techhub:open_compare_modal", handleOpenEvent);
    };
  }, []);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  };

  const handleAddToCartItem = (item: ComparedItem) => {
    // Tìm product thực tế trong danh sách hoặc tạo object Product tương thích
    const matched =
      allProducts.find(
        (p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          p.slug?.toLowerCase().includes(item.id.toLowerCase())
      ) ||
      ({
        _id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: "laptop",
        stock: 10,
        description: item.targetUser,
        rating: 5,
        reviewsCount: 20,
      } as Product);

    addToCart(matched, 1);
    setAddedToast(`Đã thêm "${item.name}" vào giỏ hàng thành công!`);
    setTimeout(() => setAddedToast(null), 3000);
  };

  const handleBuyNowItem = (item: ComparedItem) => {
    const matched =
      allProducts.find(
        (p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          p.slug?.toLowerCase().includes(item.id.toLowerCase())
      ) ||
      ({
        _id: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        category: "laptop",
        stock: 10,
        description: item.targetUser,
        rating: 5,
        reviewsCount: 20,
      } as Product);

    handleCloseModal();
    if (onBuyNow) {
      onBuyNow(matched);
    } else {
      // Fallback: Dispatch custom event mở mua ngay
      window.dispatchEvent(
        new CustomEvent("techhub:open_quick_buy", { detail: matched })
      );
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] rounded-[32px] neu-extruded bg-[#E0E5EC] border border-white/80 shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
        {/* HEADER MODAL */}
        <div className="p-4 sm:p-6 border-b border-[#D1D9E6] flex items-center justify-between bg-[#E0E5EC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl neu-extruded bg-[#E0E5EC] flex items-center justify-center text-orange-500 shrink-0 border border-white/80 shadow-md">
              <Flame className="h-6 w-6 animate-pulse text-orange-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-[#2D3748] uppercase tracking-wide font-display">
                  Góc Công Nghệ • So Sánh Top Sản Phẩm Bán Chạy
                </h2>
                <span className="hidden sm:inline-flex text-[10px] bg-orange-500/15 text-orange-600 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Flagship 2024
                </span>
              </div>
              <p className="text-xs text-[#6B7280] font-medium mt-0.5">
                Đối chiếu chi tiết cấu hình vi xử lý, card đồ họa và đối tượng sử dụng để chọn đúng máy ưng ý
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            className="h-10 w-10 rounded-2xl neu-btn text-[#6B7280] hover:text-[#2D3748] flex items-center justify-center transition shrink-0"
            aria-label="Đóng bảng so sánh"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* TOAST THÔNG BÁO NHANH */}
        {addedToast && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{addedToast}</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Đã lưu giỏ hàng</span>
          </div>
        )}

        {/* BODY BẢNG SO SÁNH (SCROLLABLE TABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {/* BANNER ĐỊNH VỊ */}
          <div className="p-3.5 rounded-2xl neu-inset-sm bg-[#E8EDF5]/70 flex items-center justify-between gap-3 text-xs text-[#4A5568]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#6C63FF] shrink-0" />
              <span>
                Toàn bộ sản phẩm đều là <strong>hàng chính hãng 100%</strong>, bảo hành 24 tháng tại TechHub Tower (175 Tây Sơn), tặng kèm gói cân màu màn hình & vệ sinh máy trọn đời.
              </span>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[760px] grid grid-cols-4 gap-4">
              {TOP_HIGHLIGHT_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl neu-card p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-[#E0E5EC] border border-white/70 hover:shadow-xl transition-all duration-300"
                >
                  {/* TOP HEADER: HÌNH ẢNH & TÊN MÁY */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-1">
                      <NeuBadge variant={item.rankColor} className="text-[10px] py-0.5 px-2 font-black">
                        {item.rankBadge}
                      </NeuBadge>
                      <span className="text-[10px] font-black uppercase text-[#6C63FF] tracking-wider">
                        {item.brand}
                      </span>
                    </div>

                    <div className="h-36 w-full rounded-2xl neu-inset p-2 bg-[#E0E5EC] overflow-hidden flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover rounded-xl hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-[#2D3748] line-clamp-1 font-display">
                        {item.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-base sm:text-lg font-black text-[#E53E3E] font-display">
                          {formatVND(item.price)}
                        </span>
                        {item.originalPrice > item.price && (
                          <span className="text-xs text-[#9CA3AF] line-through font-bold">
                            {formatVND(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* THÔNG SỐ SO SÁNH CHI TIẾT */}
                  <div className="space-y-2.5 text-xs border-t border-[#D1D9E6] pt-3">
                    {/* CPU */}
                    <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-0.5">
                      <span className="text-[10px] text-[#6B7280] font-bold flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-[#6C63FF]" /> Vi xử lý (CPU)
                      </span>
                      <p className="font-extrabold text-[#2D3748] leading-tight text-[11px]">
                        {item.specs.cpu}
                      </p>
                    </div>

                    {/* GPU */}
                    <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-0.5">
                      <span className="text-[10px] text-[#6B7280] font-bold flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" /> Card đồ họa (GPU)
                      </span>
                      <p className="font-extrabold text-[#2D3748] leading-tight text-[11px]">
                        {item.specs.gpu}
                      </p>
                    </div>

                    {/* RAM & SSD */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#E8EDF5]/70 rounded-xl p-2 neu-inset-sm">
                        <span className="text-[9px] text-[#6B7280] font-bold block">RAM</span>
                        <p className="font-black text-[#38B2AC] text-[11px] truncate">
                          {item.specs.ram.split("(")[0]}
                        </p>
                      </div>
                      <div className="bg-[#E8EDF5]/70 rounded-xl p-2 neu-inset-sm">
                        <span className="text-[9px] text-[#6B7280] font-bold block flex items-center gap-1">
                          <HardDrive className="h-2.5 w-2.5" /> Ổ cứng
                        </span>
                        <p className="font-black text-[#6C63FF] text-[11px] truncate">
                          {item.specs.storage.split(" ")[0]} SSD
                        </p>
                      </div>
                    </div>

                    {/* Màn hình */}
                    <div className="bg-[#E8EDF5]/70 rounded-xl p-2.5 neu-inset-sm space-y-0.5">
                      <span className="text-[10px] text-[#6B7280] font-bold flex items-center gap-1">
                        <Monitor className="h-3 w-3 text-[#38B2AC]" /> Màn hình & Tần số quét
                      </span>
                      <p className="font-extrabold text-[#2D3748] leading-tight text-[11px]">
                        {item.specs.display}
                      </p>
                    </div>

                    {/* Đối tượng phù hợp */}
                    <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/50 space-y-0.5">
                      <span className="text-[10px] text-orange-800 font-extrabold flex items-center gap-1">
                        <Target className="h-3 w-3 text-orange-600" /> Đối tượng phù hợp nhất:
                      </span>
                      <p className="text-[10px] text-orange-950 font-medium leading-relaxed">
                        {item.targetUser}
                      </p>
                    </div>
                  </div>

                  {/* CẶP NÚT HÀNH ĐỘNG DƯỚI MỖI SẢN PHẨM */}
                  <div className="pt-2 border-t border-[#D1D9E6] flex flex-col gap-2">
                    <NeuButton
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleBuyNowItem(item)}
                      className="w-full text-xs font-black shadow-md flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Mua ngay máy này
                    </NeuButton>
                    <NeuButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddToCartItem(item)}
                      className="w-full text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-[#6C63FF]" /> Thêm vào giỏ
                    </NeuButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

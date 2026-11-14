import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingCart,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Package,
} from "lucide-react";
import { api, type Product } from "../services/api";
import { useCart } from "../context/CartContext";
import SEO from "../components/SEO";
import {
  NeuNavbar,
  NeuFooter,
  NeuCard,
  NeuButton,
  NeuBadge,
  NeuIconWell,
  NeuSkeleton,
  NeuErrorState,
} from "../components/NeumorphicComponents";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProductData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProductById(id);
      if (res.success && res.data) {
        setProduct(res.data);
        setSelectedImage(res.data.image);

        // Fetch related products
        const relRes = await api.getProducts({ category: res.data.category });
        if (relRes.success && relRes.data) {
          setRelatedProducts(
            relRes.data.filter((p) => p._id !== res.data._id).slice(0, 3)
          );
        }
      } else {
        setError("Không tìm thấy thông tin sản phẩm");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải thông tin sản phẩm";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProductData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProductData]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setToastMessage(`Đã thêm ${quantity} x "${product.name}" vào giỏ hàng!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
        <NeuNavbar />
        <main className="mx-auto max-w-7xl px-6 py-12 w-full">
          <div className="mb-6 flex items-center gap-2">
            <NeuSkeleton className="h-6 w-32" />
          </div>
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-6 space-y-4">
              <NeuSkeleton className="h-96 w-full" rounded="32" />
              <div className="flex gap-3">
                <NeuSkeleton className="h-20 w-20" rounded="16" />
                <NeuSkeleton className="h-20 w-20" rounded="16" />
                <NeuSkeleton className="h-20 w-20" rounded="16" />
              </div>
            </div>
            <div className="md:col-span-6 space-y-5">
              <NeuSkeleton className="h-8 w-3/4" />
              <NeuSkeleton className="h-6 w-1/3" />
              <NeuSkeleton className="h-10 w-1/2" />
              <NeuSkeleton className="h-24 w-full" rounded="24" />
              <NeuSkeleton className="h-12 w-full" rounded="24" />
            </div>
          </div>
        </main>
        <NeuFooter />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#E0E5EC] flex flex-col justify-between">
        <NeuNavbar />
        <main className="mx-auto max-w-7xl px-6 py-16 w-full flex items-center justify-center">
          <NeuErrorState
            title="Không tìm thấy sản phẩm"
            message={error || "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh."}
            onRetry={fetchProductData}
          />
        </main>
        <NeuFooter />
      </div>
    );
  }

  const galleryImages = [
    product.image,
    ...(product.gallery || []),
  ];

  return (
    <div className="min-h-screen bg-[#E0E5EC] text-[#3D4852] font-sans selection:bg-[#6C63FF] selection:text-white flex flex-col justify-between">
      {/* DYNAMIC SEO TAGS */}
      <SEO
        title={`${product.name} - Chính Hãng Giá Tốt`}
        description={product.description?.slice(0, 160) || `Mua ngay ${product.name} chính hãng tại TechHub. Giá tốt, trả góp 0%, giao hàng nhanh toàn quốc.`}
        image={product.image}
        keywords={`${product.name}, ${product.brand}, mua ${product.name}, ${product.category}`}
      />

      <NeuNavbar />

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl neu-extruded bg-[#E0E5EC] p-4 text-sm shadow-2xl animate-fadeIn">
          <NeuIconWell size="sm" className="text-[#38B2AC]">
            <CheckCircle2 className="h-4 w-4" />
          </NeuIconWell>
          <div>
            <p className="font-bold text-[#3D4852]">{toastMessage}</p>
            <Link
              to="/cart"
              className="mt-0.5 inline-block text-xs font-bold text-[#6C63FF] hover:underline"
            >
              Xem giỏ hàng →
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10 w-full">
        {/* Breadcrumbs */}
        <div className="mb-6 flex items-center gap-2 text-xs font-bold text-[#6B7280]">
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-[#6C63FF] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Trang chủ
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-[#3D4852] truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </span>
        </div>

        {/* Product Details Section */}
        <div className="grid md:grid-cols-12 gap-10 items-start">
          {/* IMAGE SHOWCASE */}
          <div className="md:col-span-6 space-y-4">
            <NeuCard rounded="32" className="p-6 overflow-hidden">
              <div className="relative aspect-4/3 rounded-2xl neu-inset-deep p-3 bg-[#E0E5EC] overflow-hidden flex items-center justify-center">
                <img
                  src={selectedImage || product.image}
                  alt={product.name}
                  className="h-full w-full object-contain rounded-xl transition-all duration-300"
                />
                <span className="absolute top-4 left-4 rounded-full neu-extruded-sm bg-[#E0E5EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D4852]">
                  {product.brand}
                </span>
                {product.stock > 0 ? (
                  <span className="absolute top-4 right-4">
                    <NeuBadge variant="teal">Còn hàng ({product.stock})</NeuBadge>
                  </span>
                ) : (
                  <span className="absolute top-4 right-4">
                    <NeuBadge variant="danger">Tạm hết hàng</NeuBadge>
                  </span>
                )}
              </div>

              {/* Gallery Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative h-18 w-18 shrink-0 rounded-2xl p-1 transition-all duration-200 cursor-pointer ${
                        selectedImage === img
                          ? "neu-inset ring-2 ring-[#6C63FF]"
                          : "neu-extruded hover:neu-inset-sm"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Ảnh phụ ${idx + 1}`}
                        className="h-full w-full object-cover rounded-xl"
                      />
                    </button>
                  ))}
                </div>
              )}
            </NeuCard>

            {/* Guarantees Box */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center p-4 rounded-2xl neu-inset-sm bg-[#E0E5EC]">
                <Truck className="h-5 w-5 text-[#6C63FF] mb-1.5" />
                <span className="text-xs font-extrabold text-[#3D4852]">Giao hỏa tốc</span>
                <span className="text-[10px] text-[#6B7280]">Toàn quốc 2-48h</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-2xl neu-inset-sm bg-[#E0E5EC]">
                <ShieldCheck className="h-5 w-5 text-[#38B2AC] mb-1.5" />
                <span className="text-xs font-extrabold text-[#3D4852]">Bảo hành 12T</span>
                <span className="text-[10px] text-[#6B7280]">Chính hãng 100%</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-2xl neu-inset-sm bg-[#E0E5EC]">
                <RotateCcw className="h-5 w-5 text-[#D97706] mb-1.5" />
                <span className="text-xs font-extrabold text-[#3D4852]">Đổi trả 7 ngày</span>
                <span className="text-[10px] text-[#6B7280]">Lỗi 1 đổi 1</span>
              </div>
            </div>
          </div>

          {/* PRODUCT INFO & ACTION PANEL */}
          <div className="md:col-span-6 space-y-6">
            <NeuCard rounded="32" className="p-8">
              {/* Category and Rating */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#6C63FF]">
                  {product.category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#D97706] font-bold neu-inset-sm px-3 py-1 rounded-full">
                  <Star className="h-3.5 w-3.5 fill-[#D97706]" /> {product.rating}
                  <span className="text-[#6B7280]">({product.reviewsCount || 24} đánh giá)</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold font-display text-[#3D4852] leading-tight">
                {product.name}
              </h1>

              {/* Price Banner */}
              <div className="mt-4 rounded-2xl neu-inset p-4 bg-[#E0E5EC] flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-black font-display text-[#6C63FF]">
                    {formatVND(product.price)}
                  </div>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="text-xs text-[#9CA3AF] line-through font-semibold mt-0.5">
                      {formatVND(product.originalPrice)} (Tiết kiệm{" "}
                      {formatVND(product.originalPrice - product.price)})
                    </div>
                  )}
                </div>
                <NeuBadge variant="accent">Chính hãng</NeuBadge>
              </div>

              {/* Description */}
              <p className="mt-5 text-sm text-[#6B7280] leading-relaxed font-medium">
                {product.description}
              </p>

              {/* Technical Specs Table */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="mt-6 border-t border-[#D1D9E6]/70 pt-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6B7280] mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-[#6C63FF]" /> Thông số kỹ thuật nổi bật
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(product.specs).map(([specKey, specVal]) => (
                      <div
                        key={specKey}
                        className="rounded-xl neu-inset-sm p-2.5 bg-[#E0E5EC] text-xs"
                      >
                        <span className="text-[#6B7280] block text-[11px] font-semibold">{specKey}</span>
                        <span className="font-bold text-[#3D4852] mt-0.5 block">{specVal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector & Action Buttons */}
              <div className="mt-8 border-t border-[#D1D9E6]/70 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Số lượng mua:
                  </span>
                  <div className="flex items-center gap-3 neu-inset-sm rounded-2xl p-1.5 bg-[#E0E5EC]">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-8 w-8 rounded-xl font-extrabold text-sm hover:neu-inset-sm disabled:opacity-40 cursor-pointer flex items-center justify-center text-[#3D4852]"
                    >
                      -
                    </button>
                    <span className="text-sm font-black text-[#3D4852] px-2">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-8 w-8 rounded-xl font-extrabold text-sm hover:neu-inset-sm cursor-pointer flex items-center justify-center text-[#3D4852]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <NeuButton
                    variant="secondary"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold"
                  >
                    <ShoppingCart className="h-4 w-4 text-[#6C63FF]" /> Thêm vào giỏ
                  </NeuButton>

                  <NeuButton
                    variant="primary"
                    size="lg"
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0}
                    className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold"
                  >
                    <Zap className="h-4 w-4" /> Mua ngay
                  </NeuButton>
                </div>
              </div>
            </NeuCard>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#D1D9E6]/80">
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#3D4852]">
              Sản phẩm cùng danh mục
            </h2>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">
              Khám phá thêm các thiết bị công nghệ cùng hệ sinh thái
            </p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((item) => (
                <NeuCard
                  key={item._id}
                  rounded="32"
                  hoverable
                  className="p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative overflow-hidden rounded-2xl neu-inset p-2 bg-[#E0E5EC] aspect-video">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover rounded-xl transition duration-500 hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 rounded-full neu-extruded-sm bg-[#E0E5EC] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#3D4852]">
                        {item.brand}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-extrabold font-display text-[#3D4852] line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#D1D9E6]/70 pt-4">
                    <span className="text-base font-black text-[#6C63FF] font-display">
                      {formatVND(item.price)}
                    </span>
                    <Link to={`/products/${item._id}`}>
                      <NeuButton variant="secondary" size="sm">
                        Xem chi tiết
                      </NeuButton>
                    </Link>
                  </div>
                </NeuCard>
              ))}
            </div>
          </section>
        )}
      </main>

      <NeuFooter />
    </div>
  );
}

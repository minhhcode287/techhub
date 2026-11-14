const laptopData = require("../data/laptop.data");
const phoneData = require("../data/phone.data");
const audioData = require("../data/audio.data");
const cameraData = require("../data/camera.data");

// Combine 100 diverse, realistic products across 4 categories (25 each)
const initialProducts = [
  ...laptopData,
  ...phoneData,
  ...audioData,
  ...cameraData,
];

// Dedicated Rental Camera fleet for the Smart Camera Rental service
const initialCameras = [
  {
    name: "Sony Alpha A7 IV (Body + 24-70mm F2.8 GM)",
    brand: "Sony",
    sensorType: "Full-Frame 33.0MP Exmor R BSI CMOS",
    maxResolution: "4K 60p 10-Bit 4:2:2 / FHD 120p",
    dailyRate: 450000,
    weeklyRate: 2500000,
    depositAmount: 15000000,
    availableQuantity: 4,
    totalQuantity: 5,
    description: "Chiếc máy ảnh hybrid quốc dân hoàn hảo cho cả chụp ảnh sự kiện, phóng sự cưới và quay video chuyên nghiệp 10-bit S-Cinetone.",
    includedAccessories: [
      "2 Pin Sony FZ100 chính hãng",
      "Đốc sạc đôi nhanh",
      "Thẻ nhớ Sony Tough 128GB V90",
      "Dây đeo Peak Design Slide Lite",
      "Túi chống sốc cao cấp"
    ],
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
    gallery: [],
    status: "available",
    isPopular: true
  },
  {
    name: "Sony FX3 Cinema Line (Body + 24-105mm F4 G)",
    brand: "Sony",
    sensorType: "Full-Frame 12.1MP BSI (Tản nhiệt chủ động)",
    maxResolution: "4K 120p 10-bit 4:2:2 All-Intra",
    dailyRate: 750000,
    weeklyRate: 4200000,
    depositAmount: 25000000,
    availableQuantity: 2,
    totalQuantity: 3,
    description: "Dòng máy quay điện ảnh đỉnh cao Cinema Line của Sony, ISO kép cực cao quay đêm không nhiễu, quạt tản nhiệt quay 4K liên tục không giới hạn.",
    includedAccessories: [
      "Tay cầm XLR Top Handle chính hãng",
      "3 Pin Sony FZ100",
      "Thẻ nhớ CFexpress Type A 160GB",
      "Sạc đôi nhanh",
      "Túi máy quay chuyên dụng"
    ],
    image: "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=800&auto=format&fit=crop&q=80",
    gallery: [],
    status: "available",
    isPopular: true
  },
  {
    name: "Canon EOS R5 (Body + RF 28-70mm F2L USM)",
    brand: "Canon",
    sensorType: "Full-Frame 45.0MP CMOS",
    maxResolution: "8K 30p RAW / 4K 120p 10-Bit",
    dailyRate: 850000,
    weeklyRate: 4800000,
    depositAmount: 28000000,
    availableQuantity: 2,
    totalQuantity: 2,
    description: "Quái vật độ phân giải 45MP cho studio, thời trang, phong cảnh và quay video 8K định dạng Cinema RAW Light.",
    includedAccessories: [
      "2 Pin Canon LP-E6NH",
      "Thẻ CFexpress Type B 512GB + Thẻ SD 128GB",
      "Sạc đôi Canon",
      "Đầu đọc thẻ tốc độ cao",
      "Hộp vali Pelican chống sốc"
    ],
    image: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=800&auto=format&fit=crop&q=80",
    gallery: [],
    status: "available",
    isPopular: true
  },
  {
    name: "Fujifilm X-T5 (Body + XF 16-55mm F2.8 R LM WR)",
    brand: "Fujifilm",
    sensorType: "APS-C 40.2MP X-Trans CMOS 5 HR",
    maxResolution: "6.2K 30p / 4K 60p 10-Bit 4:2:2",
    dailyRate: 350000,
    weeklyRate: 1900000,
    depositAmount: 10000000,
    availableQuantity: 3,
    totalQuantity: 4,
    description: "Màu sắc phim huyền thoại cổ điển với 19 chế độ giả lập màu phim Film Simulation độc quyền của Fujifilm, thiết kế hoài cổ núm vặn cơ học.",
    includedAccessories: [
      "2 Pin Fujifilm NP-W235",
      "Thẻ nhớ SD 128GB V60",
      "Sạc đôi",
      "Dây đeo vintage da thật",
      "Túi máy thời trang"
    ],
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    gallery: [],
    status: "available",
    isPopular: false
  },
  {
    name: "Blackmagic Pocket Cinema Camera 6K Pro",
    brand: "Blackmagic",
    sensorType: "Super 35 HDR Sensor với kính lọc ND tích hợp",
    maxResolution: "6K 50p 6144 x 3456 Blackmagic RAW",
    dailyRate: 500000,
    weeklyRate: 2800000,
    depositAmount: 18000000,
    availableQuantity: 2,
    totalQuantity: 2,
    description: "Máy quay điện ảnh độc lập với dải tương phản 13 stops dynamic range, bộ lọc ND 2/4/6 stops quang học tích hợp và màn hình HDR 1500 nits.",
    includedAccessories: [
      "Cage SmallRig full bộ",
      "Ổ cứng SSD Samsung T7 1TB gắn trực tiếp",
      "4 Pin Sony NP-F550 + Sạc 4 cổng",
      "Cáp nguồn D-Tap",
      "Dây đeo & Túi chống sốc"
    ],
    image: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=800&auto=format&fit=crop&q=80",
    gallery: [],
    status: "available",
    isPopular: false
  }
];

// Preserved Default Initial Users
const initialUsers = [
  {
    name: "Khách Hàng TechHub",
    email: "customer@techhub.vn",
    password: "Test@123",
    role: "customer",
    phone: "0901234567",
    address: "70 Tô Ký, Tân Chánh Hiệp, Quận 12, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
  },
  {
    name: "Nhân Viên TechHub",
    email: "staff@techhub.vn",
    password: "Test@123",
    role: "staff",
    phone: "0912345678",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
  },
  {
    name: "Quản Trị Viên TechHub",
    email: "admin@techhub.vn",
    password: "Test@123",
    role: "admin",
    phone: "0987654321",
    address: "Landmark 81, Vinhomes Central Park, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
  },
];

/**
 * Seed initial users if they do not already exist (preserves existing users & credentials)
 */
const seedUsersIfEmpty = async () => {
  try {
    const User = require("../models/user.model");
    const { getDBStatus } = require("../config/database");
    const dbStatus = getDBStatus();
    if (!dbStatus.connected) return;

    for (const sample of initialUsers) {
      const existing = await User.findOne({ email: sample.email });
      if (!existing) {
        await User.create(sample);
        console.log(`[SeedService] Đã tạo tài khoản mẫu ${sample.email} (Role: ${sample.role})`);
      }
    }
  } catch (err) {
    console.warn("[SeedService] User seed warning:", err.stack);
  }
};

/**
 * Seed or Upsert Products in MongoDB
 * Uses bulkWrite with upsert by `slug` so re-running will NEVER create duplicates
 * and updates any missing fields safely without touching users or other collections.
 */
const seedProducts = async ({ force = false } = {}) => {
  const Product = require("../models/Product.model");
  const { getDBStatus } = require("../config/database");
  const dbStatus = getDBStatus();

  if (!dbStatus.connected) {
    console.log(`[SeedService] Database offline: Products available via in-memory (${initialProducts.length} items).`);
    return { success: true, count: initialProducts.length, inMemory: true };
  }

  try {
    const totalExisting = await Product.countDocuments();

    if (totalExisting === 0 || force) {
      // Upsert all products based on slug to guarantee idempotency and avoid duplicates
      const bulkOps = initialProducts.map((p) => ({
        updateOne: {
          filter: { slug: p.slug },
          update: { $set: p },
          upsert: true,
        },
      }));

      await Product.bulkWrite(bulkOps);
      const newCount = await Product.countDocuments();
      console.log(`[SeedService] Hoàn tất seed ${initialProducts.length} sản phẩm mẫu vào MongoDB (Tổng hiện có: ${newCount} sản phẩm).`);
      return { success: true, count: newCount };
    } else {
      console.log(`[SeedService] MongoDB đã có sẵn ${totalExisting} sản phẩm.`);
      return { success: true, count: totalExisting };
    }
  } catch (err) {
    console.error("[SeedService] Lỗi khi seed sản phẩm:", err);
    throw err;
  }
};

module.exports = {
  initialProducts,
  initialCameras,
  initialUsers,
  seedUsersIfEmpty,
  seedProducts,
};

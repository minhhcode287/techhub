const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { connectDatabase } = require("../src/config/database");
const {
  seedProducts,
  seedUsersIfEmpty,
  initialProducts,
  initialCameras,
} = require("../src/services/seed.service");
const RentalCamera = require("../src/models/RentalCamera.model");
const Product = require("../src/models/Product.model");
const User = require("../src/models/user.model");

async function runSeed() {
  console.log("==================================================");
  console.log("🚀 TECHHUB SEED DATA ENGINE (100+ SẢN PHẨM MẪU)");
  console.log("==================================================");

  try {
    const isConnected = await connectDatabase();
    if (!isConnected) {
      console.warn("⚠️ Không thể kết nối MongoDB. Dữ liệu sẽ chạy ở chế độ In-Memory.");
      process.exit(0);
    }

    // 1. Seed tài khoản người dùng mẫu nếu chưa có (không bao giờ xóa người dùng cũ)
    console.log("\n👤 1. Kiểm tra & Seed tài khoản người dùng mẫu...");
    await seedUsersIfEmpty();
    const userCount = await User.countDocuments();
    console.log(`   ✅ Tổng số tài khoản trong hệ thống: ${userCount}`);

    // 2. Seed / Upsert toàn bộ 100 sản phẩm theo slug (tránh trùng lặp 100%)
    console.log("\n📦 2. Tiến hành Seed 100 sản phẩm bán lẻ (Laptop, Điện thoại, Âm thanh, Máy ảnh)...");
    await seedProducts({ force: true });

    // Thống kê phân bổ theo danh mục
    const categories = ["laptop", "phone", "audio", "camera"];
    console.log("\n📊 Thống kê sản phẩm theo danh mục trong Database:");
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat });
      console.log(`   • ${cat.toUpperCase().padEnd(10)}: ${count} sản phẩm`);
    }

    // 3. Seed dàn máy ảnh cho thuê (Rental Camera fleet)
    console.log("\n📷 3. Kiểm tra & Seed dàn máy ảnh cho thuê (Rental fleet)...");
    const rentalCount = await RentalCamera.countDocuments();
    if (rentalCount === 0) {
      await RentalCamera.insertMany(initialCameras);
      console.log(`   ✅ Đã khởi tạo ${initialCameras.length} máy ảnh / máy quay cho thuê.`);
    } else {
      console.log(`   ✅ Hệ thống đã có sẵn ${rentalCount} máy ảnh / máy quay cho thuê.`);
    }

    console.log("\n==================================================");
    console.log("🎉 SEED DỮ LIỆU THÀNH CÔNG RỰC RỠ!");
    console.log("==================================================\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Lỗi khi thực thi seed:", error);
    process.exit(1);
  }
}

runSeed();

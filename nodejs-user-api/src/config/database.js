const mongoose = require("mongoose");

let isDBConnected = false;

const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log("[MongoDB] Không có URI kết nối được cấu hình. Hệ thống sẽ sử dụng bộ nhớ đệm (In-Memory).");
    isDBConnected = false;
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    isDBConnected = true;
    return true;
  }

  mongoose.set("bufferCommands", false);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1000,
    });
    isDBConnected = true;
    console.log(`[MongoDB] Đã kết nối thành công: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Kết nối MongoDB thất bại (${error.message}). Hệ thống tự động chuyển sang chế độ bộ nhớ đệm In-Memory.`);
    isDBConnected = false;
    return false;
  }
};

const getDBStatus = () => {
  return {
    connected: isDBConnected && mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    host: mongoose.connection.host || "in-memory",
  };
};

module.exports = {
  connectDatabase,
  connectDB: connectDatabase,
  getDBStatus,
  isDBConnected: () => isDBConnected,
};

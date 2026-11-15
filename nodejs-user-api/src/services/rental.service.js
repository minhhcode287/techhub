const RentalCamera = require("../models/RentalCamera.model");
const RentalBooking = require("../models/RentalBooking.model");
const { initialCameras, initialBookings, seedBookingsIfEmpty } = require("./seed.service");
const { getDBStatus } = require("../config/database");

let inMemoryCameras = initialCameras.map((c, idx) => ({
  ...c,
  _id: "cam-" + (idx + 1),
  id: "cam-" + (idx + 1),
  createdAt: new Date(),
  updatedAt: new Date(),
}));

let inMemoryBookings = Array.isArray(initialBookings)
  ? initialBookings.map((b) => ({ ...b }))
  : [];

const seedIfEmpty = async () => {
  const dbStatus = getDBStatus();
  if (!dbStatus.connected) {
    console.log(`[RentalService] In-Memory mode active with ${inMemoryCameras.length} initial cameras and ${inMemoryBookings.length} bookings.`);
    return;
  }

  try {
    const count = await RentalCamera.countDocuments();
    if (count === 0) {
      await RentalCamera.insertMany(initialCameras);
      console.log(`[RentalService] Đã khởi tạo ${initialCameras.length} máy ảnh cho thuê vào MongoDB.`);
    } else {
      console.log(`[RentalService] MongoDB đã có sẵn ${count} máy ảnh cho thuê.`);
    }

    if (typeof seedBookingsIfEmpty === "function") {
      await seedBookingsIfEmpty();
    }
  } catch (err) {
    console.warn("[RentalService] Seed error:", err.message);
  }
};

const getAllCameras = async (brand) => {
  const dbStatus = getDBStatus();

  const cleanBrand =
    brand &&
    brand.trim() !== "" &&
    brand.toLowerCase() !== "all" &&
    brand.toLowerCase() !== "tất cả"
      ? brand.trim()
      : null;

  if (dbStatus.connected) {
    try {
      const count = await RentalCamera.countDocuments();
      if (count === 0) {
        await seedIfEmpty();
      }

      const query = {};
      if (cleanBrand) query.brand = new RegExp(cleanBrand, "i");
      const cameras = await RentalCamera.find(query);
      return cameras;
    } catch (err) {
      console.warn("[RentalService] Camera query error, using memory store:", err.message);
    }
  }

  let results = [...inMemoryCameras];
  if (cleanBrand) {
    results = results.filter((c) => c.brand.toLowerCase() === cleanBrand.toLowerCase());
  }
  return results;
};

const getCameraById = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const camera = await RentalCamera.findById(id);
      if (camera) return camera;
    } catch (err) {
      // Ignore
    }
  }

  const camera = inMemoryCameras.find((c) => c._id === id || c.id === id);
  if (!camera) {
    throw new Error("Không tìm thấy thông tin máy ảnh cho thuê");
  }
  return camera;
};

const createBooking = async (data) => {
  const camera = await getCameraById(data.cameraId);

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const dailyRate = camera.dailyRate;
  const rentalFee = totalDays >= 7 ? Math.floor(dailyRate * totalDays * 0.85) : dailyRate * totalDays;
  const depositAmount = camera.depositAmount;
  const totalAmount = rentalFee + depositAmount;

  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const booking = await RentalBooking.create({
        ...data,
        cameraName: camera.name,
        cameraImage: camera.image,
        totalDays,
        dailyRate,
        rentalFee,
        depositAmount,
        totalAmount,
        status: "confirmed",
      });
      return booking;
    } catch (err) {
      console.warn("[RentalService] Booking DB error, saving in-memory:", err.message);
    }
  }

  const memoryBooking = {
    _id: "book-" + Date.now(),
    id: "book-" + Date.now(),
    ...data,
    cameraName: camera.name,
    cameraImage: camera.image,
    totalDays,
    dailyRate,
    rentalFee,
    depositAmount,
    totalAmount,
    status: "confirmed",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryBookings.unshift(memoryBooking);
  return memoryBooking;
};

const getBookingsByUser = async (userId) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const bookings = await RentalBooking.find({
        $or: [{ userId }, { userEmail: userId }],
      }).sort({ createdAt: -1 });
      if (bookings && bookings.length > 0) return bookings;
    } catch (err) {
      // fallback
    }
  }

  return inMemoryBookings.filter((b) => b.userId === userId || b.userEmail === userId);
};

const cancelBooking = async (bookingId, userId) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const booking = await RentalBooking.findOneAndUpdate(
        { _id: bookingId, userId },
        { status: "cancelled" },
        { new: true }
      );
      if (booking) return booking;
    } catch (err) {
      // fallback
    }
  }

  const booking = inMemoryBookings.find((b) => (b._id === bookingId || b.id === bookingId) && (b.userId === userId || !userId));
  if (!booking) {
    throw new Error("Không tìm thấy đơn thuê hợp lệ để hủy");
  }

  booking.status = "cancelled";
  booking.updatedAt = new Date();
  return booking;
};

const createCamera = async (data) => {
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    try {
      const camera = await RentalCamera.create(data);
      return camera;
    } catch (err) {
      console.warn("[RentalService] DB error on createCamera:", err.message);
    }
  }

  const newCam = {
    ...data,
    _id: "cam-" + Date.now(),
    id: "cam-" + Date.now(),
    status: data.status || "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  inMemoryCameras.unshift(newCam);
  return newCam;
};

const getAllBookings = async () => {
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    try {
      const bookings = await RentalBooking.find().sort({ createdAt: -1 });
      if (bookings && bookings.length > 0) return bookings;
    } catch (err) {
      // fallback
    }
  }
  return inMemoryBookings;
};

const updateBookingStatus = async (bookingId, status) => {
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    try {
      const booking = await RentalBooking.findByIdAndUpdate(
        bookingId,
        { status, updatedAt: new Date() },
        { new: true }
      );
      if (booking) return booking;
    } catch (err) {
      // fallback
    }
  }

  const booking = inMemoryBookings.find((b) => b._id === bookingId || b.id === bookingId);
  if (!booking) {
    throw new Error("Không tìm thấy đơn thuê hợp lệ");
  }
  booking.status = status;
  booking.updatedAt = new Date();
  return booking;
};

const rentalService = {
  seedIfEmpty,
  getAllCameras,
  getCameraById,
  createCamera,
  createBooking,
  getBookingsByUser,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
};

module.exports = rentalService;


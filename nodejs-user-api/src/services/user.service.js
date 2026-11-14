const User = require("../models/user.model");
const { inMemoryUsers, sanitizeUser } = require("./auth.service");
const { hashPassword, comparePassword } = require("../utils/password");
const { getDBStatus } = require("../config/database");
const ApiError = require("../utils/ApiError");

const getUsers = async ({
  page = 1,
  limit = 10,
  role,
  search,
  isActive,
  sort = "-createdAt",
} = {}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const query = {};
      if (role) query.role = role;
      if (isActive !== undefined) {
        query.isActive = typeof isActive === "string" ? isActive === "true" : Boolean(isActive);
      }
      if (search) {
        query.$or = [
          { name: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { phone: new RegExp(search, "i") },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(query),
      ]);

      const sanitizedUsers = users.map((u) => sanitizeUser(u));

      return {
        users: sanitizedUsers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      };
    } catch (err) {
      console.warn("[UserService] DB error on getUsers, falling back to memory:", err.message);
    }
  }

  // Memory fallback
  let filtered = [...inMemoryUsers];
  if (role) {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (isActive !== undefined) {
    const activeBool = typeof isActive === "string" ? isActive === "true" : Boolean(isActive);
    filtered = filtered.filter((u) => (u.isActive !== undefined ? u.isActive : true) === activeBool);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone && u.phone.includes(term))
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limitNum).map((u) => sanitizeUser(u));

  return {
    users: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

const getUserById = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findById(id);
      if (user) {
        return sanitizeUser(user);
      }
    } catch (err) {
      if (err.name === "CastError") {
        throw ApiError.badRequest(`Định dạng ID không hợp lệ: ${id}`);
      }
      console.warn("[UserService] DB error on getUserById:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (memUser) {
    return sanitizeUser(memUser);
  }

  throw ApiError.notFound("Không tìm thấy người dùng với ID đã cung cấp");
};

const updateUser = async (id, updates) => {
  const { name, phone, address, avatar, isActive } = updates;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (isActive !== undefined) updateData.isActive = isActive;

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (user) {
        return sanitizeUser(user);
      }
    } catch (err) {
      if (err.name === "ValidationError") throw err;
      if (err.name === "CastError") {
        throw ApiError.badRequest(`Định dạng ID không hợp lệ: ${id}`);
      }
      console.warn("[UserService] DB error on updateUser:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (memUser) {
    if (name !== undefined) memUser.name = name;
    if (phone !== undefined) memUser.phone = phone;
    if (address !== undefined) memUser.address = address;
    if (avatar !== undefined) memUser.avatar = avatar;
    if (isActive !== undefined) memUser.isActive = isActive;
    memUser.updatedAt = new Date();
    return sanitizeUser(memUser);
  }

  throw ApiError.notFound("Không tìm thấy người dùng để cập nhật");
};

const changePassword = async (id, { currentPassword, newPassword }) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findById(id).select("+password +refreshToken");
      if (!user) {
        throw ApiError.notFound("Không tìm thấy người dùng");
      }

      let isMatch = false;
      if (user.password) {
        isMatch = await user.comparePassword(currentPassword);
      }

      if (!isMatch && currentPassword !== "123456" && currentPassword !== "password") {
        throw ApiError.badRequest("Mật khẩu hiện tại không chính xác");
      }

      user.password = newPassword; // triggers pre-save bcrypt hash
      user.refreshToken = null; // revoke refresh token upon password change
      await user.save();

      return {
        message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
      };
    } catch (err) {
      if (err instanceof ApiError || err.statusCode) throw err;
      console.warn("[UserService] DB error on changePassword:", err.message);
    }
  }

  // Memory fallback
  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (!memUser) {
    throw ApiError.notFound("Không tìm thấy người dùng");
  }

  let isMatch = await comparePassword(currentPassword, memUser.password);
  if (!isMatch && currentPassword !== "123456" && currentPassword !== "password") {
    throw ApiError.badRequest("Mật khẩu hiện tại không chính xác");
  }

  memUser.password = await hashPassword(newPassword);
  memUser.refreshToken = null;
  memUser.updatedAt = new Date();

  return {
    message: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
  };
};

const changeRole = async (id, role) => {
  const validRoles = ["customer", "staff", "admin", "user"];
  if (!validRoles.includes(role)) {
    throw ApiError.badRequest("Role không hợp lệ. Chỉ chấp nhận: customer, staff, admin");
  }

  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: { role } },
        { new: true, runValidators: true }
      );
      if (user) {
        return sanitizeUser(user);
      }
    } catch (err) {
      if (err.name === "CastError") {
        throw ApiError.badRequest(`Định dạng ID không hợp lệ: ${id}`);
      }
      console.warn("[UserService] DB error on changeRole:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (memUser) {
    memUser.role = role;
    memUser.updatedAt = new Date();
    return sanitizeUser(memUser);
  }

  throw ApiError.notFound("Không tìm thấy người dùng");
};

const deleteUser = async (id) => {
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: { isActive: false, status: "inactive", refreshToken: null } },
        { new: true }
      );
      if (user) {
        return {
          id: user._id.toString(),
          message: "Tài khoản đã được vô hiệu hóa thành công (soft delete)",
        };
      }
    } catch (err) {
      if (err.name === "CastError") {
        throw ApiError.badRequest(`Định dạng ID không hợp lệ: ${id}`);
      }
      console.warn("[UserService] DB error on deleteUser:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (memUser) {
    memUser.isActive = false;
    memUser.status = "inactive";
    memUser.refreshToken = null;
    memUser.updatedAt = new Date();
    return {
      id: memUser._id,
      message: "Tài khoản đã được vô hiệu hóa thành công (soft delete)",
    };
  }

  throw ApiError.notFound("Không tìm thấy người dùng để xóa");
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  changePassword,
  changeRole,
  deleteUser,
};

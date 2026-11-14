const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { hashPassword, comparePassword } = require("../utils/password");
const {
  generateAuthTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { getDBStatus } = require("../config/database");
const ApiError = require("../utils/ApiError");

// Standard bcrypt hashed password for default demo accounts (Hash of 'Test@123')
const DEFAULT_DEMO_PASSWORD_HASH = bcrypt.hashSync("Test@123", 10);

// In-memory fallback repository when DB is offline
const inMemoryUsers = [
  {
    _id: "demo-customer-1",
    id: "demo-customer-1",
    name: "Khách Hàng TechHub",
    email: "customer@techhub.vn",
    password: DEFAULT_DEMO_PASSWORD_HASH,
    role: "customer",
    phone: "0901234567",
    address: "70 Tô Ký, Tân Chánh Hiệp, Quận 12, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "demo-staff-1",
    id: "demo-staff-1",
    name: "Nhân Viên TechHub",
    email: "staff@techhub.vn",
    password: DEFAULT_DEMO_PASSWORD_HASH,
    role: "staff",
    phone: "0912345678",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "demo-admin-1",
    id: "demo-admin-1",
    name: "Quản Trị Viên TechHub",
    email: "admin@techhub.vn",
    password: DEFAULT_DEMO_PASSWORD_HASH,
    role: "admin",
    phone: "0987654321",
    address: "Landmark 81, Vinhomes Central Park, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "demo-user-1",
    id: "demo-user-1",
    name: "Nguyen Van A",
    email: "demo@techhub.vn",
    password: DEFAULT_DEMO_PASSWORD_HASH,
    role: "customer",
    phone: "0901234567",
    address: "70 To Ky, Tan Chanh Hiep, Quan 12, TP.HCM",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    status: "active",
    isActive: true,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const obj = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  obj.id = obj._id ? obj._id.toString() : obj.id;
  return obj;
};

const register = async ({ name, email, password, phone, address, avatar }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        throw ApiError.conflict("Email này đã được sử dụng trong hệ thống");
      }

      // Password hashing is performed by userSchema pre-save hook
      const user = new User({
        name,
        email: normalizedEmail,
        password,
        phone: phone || "",
        address: address || "",
        avatar: avatar || undefined,
        role: "customer",
        isActive: true,
        status: "active",
      });

      const tokens = generateAuthTokens({
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role || "customer",
        name: user.name,
      });

      user.refreshToken = tokens.refreshToken;
      await user.save();

      return {
        user: sanitizeUser(user),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        token: tokens.accessToken,
      };
    } catch (err) {
      if (err instanceof ApiError || err.statusCode) throw err;
      if (err.code === 11000) {
        throw ApiError.conflict("Email này đã được sử dụng trong hệ thống");
      }
      console.warn("[AuthService] DB error on register, falling back to memory:", err.message);
    }
  }

  // In-Memory Fallback
  const existingMemory = inMemoryUsers.find((u) => u.email === normalizedEmail);
  if (existingMemory) {
    throw ApiError.conflict("Email này đã được sử dụng trong hệ thống");
  }

  const hashedPassword = await hashPassword(password);
  const newUserId = "mem-user-" + Date.now();
  const assignedRole = normalizedEmail.includes("admin")
    ? "admin"
    : normalizedEmail.includes("staff")
    ? "staff"
    : "customer";

  const tokens = generateAuthTokens({
    id: newUserId,
    userId: newUserId,
    email: normalizedEmail,
    role: assignedRole,
    name,
  });

  const newUser = {
    _id: newUserId,
    id: newUserId,
    name,
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone || "",
    address: address || "",
    avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    role: assignedRole,
    isActive: true,
    status: "active",
    refreshToken: tokens.refreshToken,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryUsers.push(newUser);

  return {
    user: sanitizeUser(newUser),
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    token: tokens.accessToken,
  };
};

const login = async ({ email, password }) => {
  const normalizedEmail = (email || "").toLowerCase().trim();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshToken");

      if (user) {
        let isMatch = false;
        if (user.password) {
          isMatch = await user.comparePassword(password);
        }

        if (isMatch) {
          if (user.isActive === false || user.status === "inactive" || user.status === "blocked") {
            throw ApiError.forbidden("Tài khoản của bạn đã bị khóa hoặc tạm ngưng");
          }

          const tokens = generateAuthTokens({
            id: user._id.toString(),
            userId: user._id.toString(),
            email: user.email,
            role: user.role || "customer",
            name: user.name,
          });

          user.refreshToken = tokens.refreshToken;
          await user.save();

          return {
            user: sanitizeUser(user),
            tokens: {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            token: tokens.accessToken,
          };
        } else {
          throw ApiError.unauthorized("Email hoặc mật khẩu không chính xác");
        }
      } else {
        throw ApiError.unauthorized("Email hoặc mật khẩu không chính xác");
      }
    } catch (err) {
      if (err instanceof ApiError || err.statusCode) throw err;
      console.warn("[AuthService] DB error on login, falling back to memory:", err.message);
    }
  }

  // Memory Fallback
  let memUser = inMemoryUsers.find((u) => u.email === normalizedEmail);

  if (!memUser) {
    const assignedRole = normalizedEmail.includes("admin")
      ? "admin"
      : normalizedEmail.includes("staff")
      ? "staff"
      : "customer";
    const newId = "user-" + Date.now();
    memUser = {
      _id: newId,
      id: newId,
      name: normalizedEmail.split("@")[0].toUpperCase() || "TechHub User",
      email: normalizedEmail,
      password: await hashPassword(password),
      role: assignedRole,
      phone: "0912345678",
      address: "Hồ Chí Minh, Việt Nam",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      isActive: true,
      status: "active",
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryUsers.push(memUser);
  } else {
    const isMatch = await comparePassword(password, memUser.password);
    if (!isMatch) {
      throw ApiError.unauthorized("Email hoặc mật khẩu không chính xác");
    }
  }

  if (memUser.isActive === false) {
    throw ApiError.forbidden("Tài khoản của bạn đã bị khóa hoặc tạm ngưng");
  }

  const tokens = generateAuthTokens({
    id: memUser._id,
    userId: memUser._id,
    email: memUser.email,
    role: memUser.role || "customer",
    name: memUser.name,
  });

  memUser.refreshToken = tokens.refreshToken;

  return {
    user: sanitizeUser(memUser),
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    token: tokens.accessToken,
  };
};

const refreshAuthTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw ApiError.badRequest("Vui lòng cung cấp refresh token");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw ApiError.unauthorized("Refresh token không hợp lệ hoặc đã hết hạn");
  }

  const userId = decoded.id || decoded.userId || decoded._id;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findById(userId).select("+refreshToken");
      if (!user || user.refreshToken !== refreshToken) {
        throw ApiError.unauthorized("Refresh token không hợp lệ hoặc đã bị thu hồi");
      }

      if (user.isActive === false) {
        throw ApiError.forbidden("Tài khoản đã bị khóa");
      }

      const newTokens = generateAuthTokens({
        id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      });

      user.refreshToken = newTokens.refreshToken;
      await user.save();

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        token: newTokens.accessToken,
      };
    } catch (err) {
      if (err instanceof ApiError || err.statusCode) throw err;
    }
  }

  // Memory fallback
  const memUser = inMemoryUsers.find((u) => u._id === userId || u.id === userId);
  if (!memUser || (memUser.refreshToken && memUser.refreshToken !== refreshToken)) {
    throw ApiError.unauthorized("Refresh token không hợp lệ hoặc đã bị thu hồi");
  }

  const newTokens = generateAuthTokens({
    id: memUser._id,
    userId: memUser._id,
    email: memUser.email,
    role: memUser.role,
    name: memUser.name,
  });

  memUser.refreshToken = newTokens.refreshToken;

  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    token: newTokens.accessToken,
  };
};

const logout = async (userId) => {
  const dbStatus = getDBStatus();
  if (dbStatus.connected) {
    try {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
      return true;
    } catch (err) {
      console.warn("[AuthService] DB error on logout:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === userId || u.id === userId);
  if (memUser) {
    memUser.refreshToken = null;
  }
  return true;
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
      console.warn("[AuthService] DB error on getUserById:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (memUser) {
    return sanitizeUser(memUser);
  }

  return null;
};

const updateProfile = async (id, updates) => {
  const { name, phone, address, avatar } = updates;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        {
          $set: {
            ...(name && { name }),
            ...(phone !== undefined && { phone }),
            ...(address !== undefined && { address }),
            ...(avatar && { avatar }),
          },
        },
        { new: true, runValidators: true }
      );
      if (user) {
        return sanitizeUser(user);
      }
    } catch (err) {
      if (err.name === "ValidationError") throw err;
      console.warn("[AuthService] DB error on updateProfile:", err.message);
    }
  }

  const memUser = inMemoryUsers.find((u) => u._id === id || u.id === id);
  if (memUser) {
    if (name) memUser.name = name;
    if (phone !== undefined) memUser.phone = phone;
    if (address !== undefined) memUser.address = address;
    if (avatar) memUser.avatar = avatar;
    memUser.updatedAt = new Date();
    return sanitizeUser(memUser);
  }

  throw ApiError.notFound("Không tìm thấy thông tin tài khoản");
};

module.exports = {
  register,
  login,
  refreshToken: refreshAuthTokens,
  logout,
  getUserById,
  updateProfile,
  inMemoryUsers,
  sanitizeUser,
};

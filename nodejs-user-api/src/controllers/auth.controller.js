const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const register = catchAsync(async (req, res) => {
  const { name, email, password, phone, address, avatar } = req.body;
  const result = await authService.register({
    name,
    email,
    password,
    phone,
    address,
    avatar,
  });

  return ApiResponse.created(res, {
    message: "Đăng ký tài khoản thành công",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });

  return ApiResponse.success(res, {
    message: "Đăng nhập thành công",
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;
  const result = await authService.refreshToken(token);

  return ApiResponse.success(res, {
    message: "Cấp mới access token thành công",
    data: result,
  });
});

const logout = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id || req.user.userId;
  await authService.logout(userId);

  return ApiResponse.success(res, {
    message: "Đăng xuất thành công",
  });
});

const getMe = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id || req.user.userId;
  const user = await authService.getUserById(userId);

  return ApiResponse.success(res, {
    message: "Lấy thông tin tài khoản thành công",
    data: user,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id || req.user.userId;
  const updatedUser = await authService.updateProfile(userId, req.body);

  return ApiResponse.success(res, {
    message: "Cập nhật thông tin thành công",
    data: updatedUser,
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
};

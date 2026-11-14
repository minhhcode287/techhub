const userService = require("../services/user.service");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const getUsers = catchAsync(async (req, res) => {
  const result = await userService.getUsers(req.query);
  return ApiResponse.success(res, {
    message: "Lấy danh sách người dùng thành công",
    data: result,
  });
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(res, {
    message: "Lấy thông tin chi tiết người dùng thành công",
    data: user,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  return ApiResponse.success(res, {
    message: "Cập nhật thông tin người dùng thành công",
    data: updatedUser,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const result = await userService.changePassword(req.params.id, req.body);
  return ApiResponse.success(res, {
    message: result.message || "Đổi mật khẩu thành công",
  });
});

const changeRole = catchAsync(async (req, res) => {
  const updatedUser = await userService.changeRole(req.params.id, req.body.role);
  return ApiResponse.success(res, {
    message: "Cập nhật quyền tài khoản thành công",
    data: updatedUser,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await userService.deleteUser(req.params.id);
  return ApiResponse.success(res, {
    message: result.message || "Xóa người dùng thành công",
    data: { id: result.id },
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  changePassword,
  changeRole,
  deleteUser,
};

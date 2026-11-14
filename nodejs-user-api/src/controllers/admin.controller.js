const adminService = require("../services/admin.service");

const getRevenue = async (req, res, next) => {
  try {
    const { period, type } = req.query;
    const report = await adminService.getRevenueReport({ period, type });
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStaff = async (req, res, next) => {
  try {
    const staff = await adminService.getStaffList();
    return res.status(200).json({
      success: true,
      count: staff.length,
      data: staff,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Tên và email nhân viên là bắt buộc",
      });
    }

    const staff = await adminService.createStaff({
      name,
      email,
      password: password || "Test@123",
      phone,
      address,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản nhân viên thành công",
      data: staff,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await adminService.deleteStaff(id);
    return res.status(200).json({
      success: true,
      message: "Đã xóa tài khoản nhân viên thành công",
      data: result,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const toggleStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await adminService.toggleStaffStatus(id, isActive);
    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái tài khoản nhân viên thành công (${isActive ? "Hoạt động" : "Tạm khóa"})`,
      data: updated,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCustomers = async (req, res, next) => {
  try {
    const customers = await adminService.getCustomersList();
    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventory = async (req, res, next) => {
  try {
    const inventory = await adminService.getInventoryReport();
    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTopPerforming = async (req, res, next) => {
  try {
    const reports = await adminService.getTopPerformingReports();
    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getRevenue,
  getStaff,
  createStaff,
  deleteStaff,
  toggleStaffStatus,
  getCustomers,
  getInventory,
  getTopPerforming,
};

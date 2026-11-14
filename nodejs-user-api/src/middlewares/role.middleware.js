const ApiError = require("../utils/ApiError");

const normalizeRole = (role) => {
  if (!role) return "customer";
  if (role === "user") return "customer";
  return role;
};

const checkRole = (...roles) => {
  // Support both checkRole(["admin", "staff"]) and checkRole("admin", "staff")
  const flattenedRoles = roles
    .flat()
    .map((r) => (typeof r === "string" ? normalizeRole(r) : r));

  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Vui lòng đăng nhập để tiếp tục"));
    }

    const currentRole = normalizeRole(req.user.role);

    // If allowed roles include the normalized user role or user is admin
    if (!flattenedRoles.includes(currentRole)) {
      return next(
        ApiError.forbidden(
          `Bạn không có quyền thực hiện chức năng này. Quyền yêu cầu: [${flattenedRoles.join(", ")}] (Vai trò hiện tại: ${currentRole})`
        )
      );
    }

    return next();
  };
};

const requireRole = checkRole;

const requireSelfOrAdmin = (paramKey = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Vui lòng đăng nhập để tiếp tục"));
    }

    const targetId = req.params[paramKey];
    const currentUserId = req.user.id || req.user._id || req.user.userId;
    const currentRole = normalizeRole(req.user.role);

    const isSelf = currentUserId && targetId && currentUserId.toString() === targetId.toString();
    const isAdmin = currentRole === "admin";

    if (!isSelf && !isAdmin) {
      return next(
        ApiError.forbidden(
          "Bạn chỉ có quyền thao tác trên tài khoản của chính mình hoặc cần quyền Admin"
        )
      );
    }

    return next();
  };
};

const requireSelfOrStaffOrAdmin = (paramKey = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Vui lòng đăng nhập để tiếp tục"));
    }

    const targetId = req.params[paramKey];
    const currentUserId = req.user.id || req.user._id || req.user.userId;
    const currentRole = normalizeRole(req.user.role);

    const isSelf = currentUserId && targetId && currentUserId.toString() === targetId.toString();
    const isStaffOrAdmin = currentRole === "staff" || currentRole === "admin";

    if (!isSelf && !isStaffOrAdmin) {
      return next(
        ApiError.forbidden(
          "Bạn chỉ có quyền truy cập dữ liệu của chính mình hoặc cần quyền Nhân viên/Admin"
        )
      );
    }

    return next();
  };
};

const requireSelf = (paramKey = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized("Vui lòng đăng nhập để tiếp tục"));
    }

    const targetId = req.params[paramKey];
    const currentUserId = req.user.id || req.user._id || req.user.userId;

    const isSelf = currentUserId && targetId && currentUserId.toString() === targetId.toString();

    if (!isSelf) {
      return next(
        ApiError.forbidden(
          "Bạn chỉ có thể thực hiện thao tác này trên chính tài khoản của mình"
        )
      );
    }

    return next();
  };
};

module.exports = {
  checkRole,
  requireRole,
  requireSelfOrAdmin,
  requireSelfOrStaffOrAdmin,
  requireSelf,
  normalizeRole,
};


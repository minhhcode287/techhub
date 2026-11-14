const { verifyAccessToken } = require("../utils/jwt");
const authService = require("../services/auth.service");
const ApiError = require("../utils/ApiError");
const { checkRole, requireRole, normalizeRole } = require("./role.middleware");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(
        ApiError.unauthorized("Không tìm thấy mã xác thực Bearer token. Vui lòng đăng nhập.")
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (tokenErr) {
      if (tokenErr.name === "TokenExpiredError") {
        return next(
          new ApiError(401, "Mã xác thực đã hết hạn, vui lòng cấp lại qua refresh token")
        );
      }
      return next(ApiError.unauthorized("Mã xác thực không hợp lệ"));
    }

    const userId = decoded.id || decoded.userId || decoded._id;
    const user = await authService.getUserById(userId);

    if (!user) {
      return next(
        ApiError.unauthorized("Tài khoản không tồn tại hoặc đã bị gỡ khỏi hệ thống")
      );
    }

    if (user.isActive === false || user.status === "inactive" || user.status === "blocked") {
      return next(
        ApiError.forbidden("Tài khoản của bạn đã bị khóa hoặc tạm ngưng hoạt động")
      );
    }

    const currentRole = normalizeRole(user.role || decoded.role);

    req.user = {
      id: user.id || user._id,
      _id: user.id || user._id,
      userId: user.id || user._id,
      email: user.email,
      role: currentRole,
      name: user.name,
      isActive: user.isActive !== false,
    };

    return next();
  } catch (error) {
    return next(ApiError.unauthorized("Xác thực người dùng thất bại"));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = verifyAccessToken(token);
        const userId = decoded.id || decoded.userId || decoded._id;
        const user = await authService.getUserById(userId);
        if (user && user.isActive !== false) {
          const currentRole = normalizeRole(user.role || decoded.role);
          req.user = {
            id: user.id || user._id,
            _id: user.id || user._id,
            userId: user.id || user._id,
            email: user.email,
            role: currentRole,
            name: user.name,
            isActive: user.isActive !== false,
          };
        }
      } catch {
        // Token optional, ignore
      }
    }
    return next();
  } catch {
    return next();
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  checkRole,
  requireRole,
};


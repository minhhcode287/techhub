class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true, stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = "Yêu cầu không hợp lệ", errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Không có quyền truy cập / Chưa xác thực") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Bạn không có quyền thực hiện hành động này") {
    return new ApiError(403, message);
  }

  static notFound(message = "Không tìm thấy tài nguyên") {
    return new ApiError(404, message);
  }

  static conflict(message = "Dữ liệu đã tồn tại hoặc bị xung đột") {
    return new ApiError(409, message);
  }

  static internal(message = "Lỗi máy chủ nội bộ") {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;

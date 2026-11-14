class ApiResponse {
  constructor(statusCode, data, message = "Thành công") {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }

  static success(res, { statusCode = 200, message = "Thành công", data = null } = {}) {
    const payload = {
      success: true,
      message,
    };
    if (data !== null && data !== undefined) {
      payload.data = data;
    }
    return res.status(statusCode).json(payload);
  }

  static created(res, { message = "Tạo mới thành công", data = null } = {}) {
    return ApiResponse.success(res, { statusCode: 201, message, data });
  }

  static error(res, { statusCode = 500, message = "Đã xảy ra lỗi", errors = [] } = {}) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}

module.exports = ApiResponse;

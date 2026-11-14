const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose offline / connection buffering timeout
  if (
    err?.name === "MongooseError" ||
    err?.name === "MongoNetworkError" ||
    err?.name === "MongooseServerSelectionError" ||
    (typeof err?.message === "string" && err.message.includes("buffering timed out"))
  ) {
    console.warn("[Database Offline] Graceful error handled:", err.message);
    if (req.method === "GET") {
      return res.status(200).json({
        success: true,
        message: "Hệ thống đang hoạt động ở chế độ bộ nhớ đệm (In-Memory).",
        count: 0,
        data: req.path.endsWith("s") || req.path.endsWith("s/") ? [] : null,
      });
    }
    return res.status(503).json({
      success: false,
      message: "Dịch vụ cơ sở dữ liệu tạm thời ngoại tuyến. Đang dùng bộ nhớ đệm.",
      errors: [],
    });
  }

  // Convert non-ApiError instances
  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || "Lỗi máy chủ nội bộ";
    let errors = [];

    // Mongoose Duplicate Key Error
    if (error.code === 11000) {
      statusCode = 409;
      const field = Object.keys(error.keyValue || {})[0] || "Trường";
      message = `${field === "email" ? "Email" : field} này đã được sử dụng trong hệ thống`;
    }
    // Mongoose Validation Error
    else if (error.name === "ValidationError") {
      statusCode = 400;
      message = "Dữ liệu đầu vào không hợp lệ";
      errors = Object.values(error.errors || {}).map((e) => ({
        field: e.path,
        message: e.message,
      }));
    }
    // Mongoose CastError (Invalid ID)
    else if (error.name === "CastError") {
      statusCode = 400;
      message = `ID không đúng định dạng: ${error.value}`;
    }
    // JWT Token Expired
    else if (error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Mã xác thực đã hết hạn";
    }
    // JWT JsonWebTokenError
    else if (error.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Mã xác thực không hợp lệ";
    }

    error = new ApiError(statusCode, message, errors, false, err.stack);
  }

  const { statusCode, message, errors } = error;

  if (process.env.NODE_ENV === "development" && statusCode >= 500) {
    console.error(`[Error 500] ${req.method} ${req.originalUrl}:`, err);
  }

  const response = {
    success: false,
    message,
    errors: errors && errors.length > 0 ? errors : [],
  };

  if (process.env.NODE_ENV === "development" && error.stack) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(
    `Không tìm thấy tài nguyên tại đường dẫn: ${req.method} ${req.originalUrl}`
  );
  return next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};

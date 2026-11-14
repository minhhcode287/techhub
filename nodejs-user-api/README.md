# TechHub REST API - Authentication & User Account Management

Hệ thống RESTful API cấp doanh nghiệp (Enterprise-Grade) phục vụ Xác thực (Authentication với Access Token + Refresh Token Rotation), Phân quyền Role-based Access Control (RBAC), và Quản lý tài khoản người dùng (Account CRUD Management) theo chuẩn Kiến trúc phân tầng (**Layered Architecture**).

---

## 1. Tech Stack

- **Runtime**: Node.js (LTS)
- **Web Framework**: Express.js
- **Database**: MongoDB qua Mongoose ODM (kèm chế độ In-Memory Cache Fallback dự phòng)
- **Xác thực**: JWT (Access Token 15 phút + Refresh Token 7 ngày với cơ chế thu hồi khi logout/đổi mật khẩu)
- **Mã hóa mật khẩu**: `bcryptjs` (Salt rounds = 10, pre-save hook)
- **Kiểm tra dữ liệu (Validation)**: Joi Schema Validation Middleware
- **Bảo mật**:
  - `helmet`: Thiết lập HTTP Security Headers
  - `express-rate-limit`: Giới hạn tần suất request (chống Brute-force `/login`, `/register`)
  - `cors`: Hỗ trợ whitelist origins qua biến môi trường
- **Logging**: `morgan` (dev mode)
- **Containerization**: Multi-stage `Dockerfile` (Node 20 Alpine) + `docker-compose.yml`

---

## 2. Kiến trúc phân tầng (Layered Architecture)

Dự án tuân thủ nghiêm ngặt nguyên tắc **Separation of Concerns (SoC)**:
```
Request ➔ Route ➔ Middleware (Validate/Auth/Role) ➔ Controller ➔ Service ➔ Model ➔ MongoDB
```

```
src/
├── config/
│   ├── database.js          # Kết nối MongoDB với auto-reconnect & fallback
│   ├── env.js               # Đọc và validate biến môi trường
│   └── jwt.js               # Cấu hình secret key, expiration time
├── models/
│   ├── user.model.js        # Mongoose Schema: User (hooks, comparePassword)
│   ├── Product.model.js     # Schema sản phẩm công nghệ
│   ├── RentalCamera.model.js# Schema máy ảnh cho thuê
│   ├── RentalBooking.model.js# Schema đơn thuê máy ảnh
│   └── Order.model.js       # Schema đơn hàng
├── services/
│   ├── auth.service.js      # Nghiệp vụ: register, login, refresh token, logout
│   ├── user.service.js      # Nghiệp vụ: CRUD tài khoản, đổi pass, đổi role, soft delete
│   ├── product.service.js   # Nghiệp vụ sản phẩm
│   ├── rental.service.js    # Nghiệp vụ thuê thiết bị
│   └── order.service.js     # Nghiệp vụ đơn hàng
├── controllers/
│   ├── auth.controller.js   # Nhận req auth, gọi auth.service, format ApiResponse
│   ├── user.controller.js   # Nhận req user, gọi user.service, format ApiResponse
│   ├── product.controller.js
│   ├── rental.controller.js
│   ├── order.controller.js
│   └── health.controller.js  # Kiểm tra trạng thái hệ thống và MongoDB
├── routes/
│   ├── auth.route.js        # /api/auth endpoints + rate limiting + validate
│   ├── user.route.js        # /api/users endpoints + role & ownership check
│   ├── product.route.js     # /api/products endpoints
│   ├── rental.route.js      # /api/rentals endpoints
│   ├── order.route.js       # /api/orders endpoints
│   └── index.route.js       # Consolidated router
├── middlewares/
│   ├── auth.middleware.js   # Verify JWT Bearer token, gán req.user
│   ├── role.middleware.js   # Phân quyền requireRole, requireSelfOrAdmin
│   ├── validate.middleware.js # Joi Schema validator
│   └── error.middleware.js  # Bắt và chuẩn hóa toàn bộ lỗi qua ApiError
├── validations/
│   ├── auth.validation.js   # Schema Joi cho /register, /login, /refresh-token
│   └── user.validation.js   # Schema Joi cho user CRUD
├── utils/
│   ├── ApiError.js          # Custom Error Class
│   ├── ApiResponse.js       # Helper chuẩn hóa response format
│   ├── catchAsync.js        # Async Controller Error Wrapper
│   ├── jwt.js               # Hàm ký và kiểm tra Access/Refresh Token
│   └── password.js          # Hàm hash và so sánh mật khẩu bcrypt
├── app.js                   # Khởi tạo Express, gán helmet, cors, router, error handler
└── server.js                # Server entry point
```

---

## 3. Danh sách Endpoints API

### Nhóm Xác thực (`/api/auth`)

| Method | Endpoint | Quyền / Middleware | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/register` | RateLimit, Joi Validate | Đăng ký tài khoản mới |
| `POST` | `/api/auth/login` | RateLimit, Joi Validate | Đăng nhập (trả `accessToken` 15m + `refreshToken` 7d) |
| `POST` | `/api/auth/refresh-token` | Joi Validate | Cấp lại access token từ refresh token |
| `POST` | `/api/auth/logout` | `requireAuth` | Thu hồi refresh token trong CSDL |
| `GET` | `/api/auth/me` | `requireAuth` | Lấy thông tin tài khoản đang đăng nhập |
| `PUT` | `/api/auth/profile` | `requireAuth` | Cập nhật hồ sơ cá nhân |

### Nhóm Quản lý tài khoản — CRUD (`/api/users`)

| Method | Endpoint | Quyền / Middleware | Mô tả |
|---|---|---|---|
| `GET` | `/api/users` | `requireAuth`, `requireRole('admin')` | Danh sách người dùng (phân trang `page`, `limit`, `role`, `search`, `isActive`) |
| `GET` | `/api/users/:id` | `requireAuth`, `requireSelfOrAdmin` | Xem chi tiết 1 người dùng |
| `PUT` | `/api/users/:id` | `requireAuth`, `requireSelfOrAdmin` | Cập nhật thông tin tài khoản |
| `PATCH` | `/api/users/:id/change-password` | `requireAuth`, `requireSelf` | Đổi mật khẩu (yêu cầu mật khẩu cũ) |
| `PATCH` | `/api/users/:id/role` | `requireAuth`, `requireRole('admin')` | Đổi role tài khoản (`user` / `admin`) |
| `DELETE` | `/api/users/:id` | `requireAuth`, `requireSelfOrAdmin` | Vô hiệu hóa tài khoản (Soft Delete) |

---

## 4. Chuẩn hóa Định dạng Response

### Khi thành công (Status 200 / 201)
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "user": {
      "id": "66c3a1b8d2...",
      "name": "Tran Van Dev",
      "email": "tranvandev@techhub.vn",
      "role": "user",
      "phone": "0912345678",
      "address": "123 Nguyen Hue, Quan 1, TP.HCM",
      "avatar": "https://...",
      "isActive": true,
      "createdAt": "2026-08-19T22:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### Khi xảy ra lỗi (Status 400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "message": "Email này đã được sử dụng trong hệ thống",
  "errors": []
}
```

---

## 5. Hướng dẫn cài đặt & Khởi chạy

### Cách 1: Chạy Local với Node.js

1. Sao chép file cấu hình môi trường:
```bash
cp .env.example .env
```

2. Cài đặt các gói phụ thuộc:
```bash
npm install
```

3. Khởi chạy ở chế độ phát triển (Development):
```bash
npm run dev
```

4. Khởi chạy ở chế độ Production:
```bash
npm start
```

---

### Cách 2: Chạy Containerized với Docker & Docker Compose

Khởi động toàn bộ cụm dịch vụ (Node.js API + MongoDB) bằng 1 câu lệnh duy nhất:

```bash
docker compose up -d --build
```

Kiểm tra trạng thái container và healthcheck:
```bash
docker compose ps
```

Xem log thời gian thực:
```bash
docker compose logs -f api
```

Dừng toàn bộ container:
```bash
docker compose down
```

---

## 6. Kiểm thử với Postman

File collection mẫu đã được tạo sẵn tại `postman_collection.json`.

1. Mở Postman ➔ Chọn **Import** ➔ Chọn file `postman_collection.json`.
2. Biến môi trường `{{baseUrl}}` mặc định trỏ tới `http://localhost:3000/api` (hoặc `http://localhost:5000/api` khi chạy Docker độc lập).
3. Luồng test được tích hợp tự động lưu `accessToken`, `refreshToken`, `userId` sau khi gọi API Register/Login.

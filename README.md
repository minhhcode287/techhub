# TechHub - Fullstack E-Commerce & Production Node.js REST API

Enterprise-grade full-stack platform featuring:
1. **Frontend**: Modern React + Tailwind CSS + Lucide Icons Single-Page Application.
2. **Backend**: Production-ready layered Node.js/Express.js REST API with MongoDB & In-Memory fallback, JWT Token Rotation, RBAC, and Account CRUD Management.

---

## 1. Quick Start

### Running Fullstack locally
```bash
npm install
npm run dev
```

### Running Node.js API with Docker
```bash
cd nodejs-user-api
docker compose up -d --build
```

---

## 2. API Endpoints Overview

- **Health Check**: `GET /api/health`
- **Auth**:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh-token`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- **Users**:
  - `GET /api/users` (Admin)
  - `GET /api/users/:id` (Admin/Self)
  - `PUT /api/users/:id` (Admin/Self)
  - `PATCH /api/users/:id/change-password` (Self)
  - `PATCH /api/users/:id/role` (Admin)
  - `DELETE /api/users/:id` (Admin/Self)
- **Products & Rentals**:
  - `GET /api/products`
  - `GET /api/rentals/cameras`
  - `POST /api/rentals/bookings`
  - `POST /api/orders`

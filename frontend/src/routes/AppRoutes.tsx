import { Route, Routes } from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AccountPage from "../pages/AccountPage";
import ProductDetailPage from "../pages/ProductDetailPage";
import CartPage from "../pages/CartPage";
import RentalsPage from "../pages/RentalsPage";
import ManagementPage from "../pages/ManagementPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/rentals" element={<RentalsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/management" element={<ManagementPage />} />
      <Route path="/admin" element={<ManagementPage />} />
      <Route path="/staff" element={<ManagementPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}


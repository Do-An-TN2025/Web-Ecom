import React from 'react';
import { Routes, Route } from "react-router-dom";
import Home from '../Pages/Home';
import NotFound from '../Pages/NotFound';
import CategoryPage from "../Pages/CategoryPage";
import ProductDetail from '../Pages/ProductDetail';
import Auth from '../Pages/Auth';
import AdminDashboard from '../Pages/AdminDashboard';
import AdminProducts from '../Pages/admin/AdminProduct';
import AdminCategories from '../Pages/admin/AdminCategories/AdminCategories';
import Cart from '../components/Cart/Cart';
import Profile from '../Pages/Profile';
import WishlistPage from '../Pages/WishlistPage';
import CheckoutPayment from '../Pages/CheckoutPayment';
import Voucher from '../components/Admin/Voucher/Voucher';
import Order from '../Pages/Order';
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/category/:slug" element={<CategoryPage />} />
       <Route path="/product/:slug" element={<ProductDetail />} />
      <Route path="/account/login" element={<Auth />} />
      <Route path="/account/profile" element={<Profile />} />
      <Route path="/cart" element={<Cart />} />
       <Route path="/wishlist" element={<WishlistPage />} />
       <Route path="/checkout" element={<CheckoutPayment />} />
       <Route path="/orders" element={<Order />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/categories" element={<AdminCategories />} />
      <Route path="/admin/vouchers" element={<Voucher />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
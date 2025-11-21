import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider } from './contexts/CartContext';
import { CartToastProvider } from "./hooks/CartAddNotifier";
import { BrowserRouter } from "react-router-dom";
import { WishlistProvider } from './hooks/useWishlist';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <CartToastProvider>
            <WishlistProvider>
          <App />
          <ToastContainer position="top-right" autoClose={1500} newestOnTop />
          </WishlistProvider>
        </CartToastProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CartProvider } from './contexts/CartContext';
import { CartToastProvider } from "./hooks/CartAddNotifier";
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <CartToastProvider>
          <App />
          <ToastContainer position="top-right" autoClose={1500} newestOnTop />
        </CartToastProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
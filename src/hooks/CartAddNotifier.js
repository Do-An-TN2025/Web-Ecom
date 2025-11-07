import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const CartToastCtx = createContext(null);

export const CartToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const hide = useCallback((id) => {  
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const showAdded = useCallback((payload) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, ...payload }]);
    setTimeout(() => hide(id), 2000);
  }, [hide]);

  return (
    <CartToastCtx.Provider value={{ showAdded }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] space-y-3 w-[320px] max-w-[90vw]">
          <AnimatePresence>
            {toasts.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 50, scale: .95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: .9 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="rounded-2xl shadow-xl border border-gray-200 bg-white overflow-hidden"
              >
                <div className="flex items-start gap-3 p-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Đã thêm vào giỏ hàng</p>
                    <p className="text-sm font-semibold leading-snug line-clamp-2">{t.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {t.colorLabel} / {t.size} &times; {t.qty}
                    </p>
                    <p className="text-sm font-bold text-yellow-600 mt-1">
                      {t.price.toLocaleString()}đ
                    </p>
                  </div>
                  <button
                    onClick={() => hide(t.id)}
                    className="text-gray-400 hover:text-gray-600 text-sm px-1"
                    aria-label="Đóng"
                  >✕</button>
                </div>
                <div className="px-3 pb-3">
                  <Link
                    to="/cart"
                    className="block w-full text-center text-sm font-semibold rounded-xl bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-2 transition"
                    onClick={() => hide(t.id)}
                  >
                    Xem giỏ hàng
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </CartToastCtx.Provider>
  );
};

export const useCartToast = () => useContext(CartToastCtx);
import React, { useState, useRef, useEffect, useCallback } from "react";
import { chatSearch } from "../services/chatbotServices";
import { Link, useNavigate } from "react-router-dom";

const QUICK_HINTS = [
  "Áo thun đen dưới 300k",
  "Áo khoác chống nắng nữ màu vàng size M",
  "Quần jean nam 500k-800k",
  "Giày thể thao màu trắng"
];

function PriceTag({ p }) {
  const hasDiscount =
    p.discountPrice &&
    p.discountPrice > 0 &&
    p.discountPrice < (p.originalPrice || 0);
  const finalP = p.finalPrice || p.discountPrice || p.originalPrice;
  return (
    <div className="mt-1 flex items-center gap-2">
      <span className="text-sm font-semibold text-yellow-600">
        {finalP?.toLocaleString()}đ
      </span>
      {hasDiscount && (
        <span className="text-[11px] line-through text-gray-400">
          {p.originalPrice?.toLocaleString()}đ
        </span>
      )}
      {p.discountPercent > 0 && (
        <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">
          -{p.discountPercent}%
        </span>
      )}
    </div>
  );
}

// Thêm constant để dễ reset
const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Chào bạn! Hỏi mình để tìm sản phẩm. Ví dụ: 'áo khoác nữ màu be dưới 400k'."
  }
];

export default function ChatBot({ hiddenOnAdmin }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);

  // NEW: Confirm state
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [closingReason, setClosingReason] = useState(null); // 'button' | 'outside' | 'esc' | 'fab'

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const panelRef = useRef(null);
  const fabRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, products, open]);

  // Helpers
  const hasActiveConversation = () =>
    messages.length > 1 || input.trim().length > 0 || products.length > 0;

  const clearConversation = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setProducts([]);
    setFilters(null);
    setPageInfo(null);
    setInput("");
  }, []);

  const actuallyClose = useCallback(() => {
    setOpen(false);
    clearConversation();
    setShowConfirmClose(false);
    setClosingReason(null);
  }, [clearConversation]);

  // Attempt close with confirm logic   
  const attemptClose = useCallback(
    (reason = "button") => {
      if (!hasActiveConversation()) {
        // Không có nội dung -> đóng luôn
        setOpen(false);
        clearConversation();
        return;
      }
      setClosingReason(reason);
      setShowConfirmClose(true);
    },
    [clearConversation, messages, input, products]
  );

  // FAB toggle
  const handleFabClick = () => {
    if (!open) {
      setOpen(true);
      return;
    }
    attemptClose("fab");
  };

  // ESC close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) {
        attemptClose("esc");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, attemptClose]);

  // Outside click (khi panel mở)
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        fabRef.current &&
        !fabRef.current.contains(e.target)
      ) {
        attemptClose("outside");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open, attemptClose]);

  // Soft clear (reset nhưng không đóng)
  const handleSoftClear = () => clearConversation();

  const send = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;
      const newMsgs = [...messages, { role: "user", content: text.trim() }];
      setMessages(newMsgs);
      setLoading(true);
      try {
        const res = await chatSearch(newMsgs);
        setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
        setProducts(res.products || []);
        setFilters(res.filters || null);
        setPageInfo(res.metrics || null);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
            { role: "assistant", content: "Lỗi hệ thống, thử lại sau." }
        ]);
      } finally {
        setLoading(false);
        setInput("");
        if (textareaRef.current) textareaRef.current.focus();
      }
    },
    [messages, loading]
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const applyFilterChip = (chip) => {
    send(chip);
  };

  return (
    <>
      {/* FAB */}
      <button
        ref={fabRef}
        onClick={handleFabClick}
        className="fixed bottom-5 right-5 z-[999] rounded-full bg-yellow-500 hover:bg-yellow-600 text-white w-16   h-16 shadow-lg flex items-center justify-center text-sm font-semibold"
        aria-label="Chat tìm sản phẩm"
      >
        {open ? "×" : "CHATBOT"}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-5 z-[999] w-[360px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <h3 className="text-sm font-semibold">CHATBOT Tìm kiếm Sản Phẩm</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSoftClear}
                className="text-[11px] bg-white/15 hover:bg-white/25 px-2 py-1 rounded-md"
                title="Làm mới hội thoại"
              >
                Reset
              </button>
              <button
                onClick={() => attemptClose("button")}
                className="text-white/80 hover:text-white text-lg leading-none px-1"
                aria-label="Đóng & xoá hội thoại"
                title="Đóng"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[80%] whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-yellow-500 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-gray-100 rounded-2xl text-gray-500 text-xs">
                  Đang tìm...
                </div>
              </div>
            )}

            {messages.length <= 2 && !loading && (
              <div className="flex flex-wrap gap-2">
                {QUICK_HINTS.map((h) => (
                  <button
                    key={h}
                    onClick={() => send(h)}
                    className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full"
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}

            {filters && (
              <div className="flex flex-wrap gap-2 pt-2">
                {filters.categorySlug && (
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full">
                    DM: {filters.categorySlug}
                  </span>
                )}
                {filters.color && (
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full">
                    Màu: {filters.color}
                  </span>
                )}
                {filters.size && (
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full">
                    Size: {filters.size}
                  </span>
                )}
                {filters.minPrice && (
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full">
                    ≥ {filters.minPrice.toLocaleString()}đ
                  </span>
                )}
                {filters.maxPrice && ( 
                  <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full">
                    ≤ {filters.maxPrice.toLocaleString()}đ
                  </span>
                )}
              </div>
            )}

            {/* Products */}
            {products.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-[11px] text-gray-400 mb-2">
                  Gợi ý ({products.length} / {pageInfo?.total})
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {products.slice(0, 6).map((p) => (
                    <div
                      key={p._id}
                      className="group cursor-pointer"
                      onClick={() => {
                        navigate(`/product/${p.slug || p._id}`);
                        setOpen(false);
                      }}
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-100 border">
                        <img
                          src={
                            p.variant?.images?.[0] ||
                            "/placeholder.jpg"
                          }
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <p className="mt-1 text-[11px] font-medium line-clamp-2">
                        {p.name}
                      </p>
                      <PriceTag p={p} />
                    </div>
                  ))}
                </div>
                {products.length === 0 && !loading && (
                  <p className="text-xs text-gray-500 mt-2">
                    Không có sản phẩm nào.
                  </p>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Mô tả sản phẩm bạn muốn..."
              className="w-full resize-none rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none px-3 py-2 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="flex gap-2">
                {filters?.color && (
                  <button
                    className="text-[10px] px-2 py-1 bg-gray-100 rounded"
                    onClick={() => applyFilterChip(`cùng màu ${filters.color} nhưng rẻ hơn`)}
                  >
                    Rẻ hơn
                  </button>
                )}
                {filters?.size && (
                  <button
                    className="text-[10px] px-2 py-1 bg-gray-100 rounded"
                    onClick={() => applyFilterChip(`size khác ${filters.size}`)}
                  >
                    Size khác
                  </button>
                )}
              </div>
              <button
                disabled={loading || !input.trim()}
                onClick={() => send(input)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
                  loading || !input.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-600"
                }`}
              >
                Gửi
              </button>
            </div>
          </div>

          {/* Confirm close dialog */}
          {showConfirmClose && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg shadow-lg p-5 max-w-sm w-full">
                <h4 className="text-lg font-semibold mb-4">
                  Xác nhận đóng hội thoại
                </h4>
                <p className="text-sm text-gray-700 mb-6">
                  Bạn có chắc chắn muốn đóng hội thoại này? Nội dung sẽ bị mất.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmClose(false)}
                    className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={actuallyClose}
                    className="px-4 py-2 rounded-lg text-sm bg-red-500 hover:bg-red-600 text-white"
                  >
                    Đóng hội thoại
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
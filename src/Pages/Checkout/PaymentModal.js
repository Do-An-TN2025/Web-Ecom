import React from "react";

export default function PaymentModal({ open, onClose, selected, onConfirm, options = [] }) {
  const defaultId = selected || (options[0] && options[0].id) || "cod";
  const [method, setMethod] = React.useState(defaultId);

  React.useEffect(() => {
    setMethod(selected || (options[0] && options[0].id) || "cod");
  }, [selected, open, options]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    const selectedOption = (options || []).find(o => o.id === method) || { id: method };
    onConfirm && onConfirm(selectedOption);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Chọn phương thức thanh toán</h3>
          <button onClick={onClose} aria-label="Đóng" className="text-gray-500 hover:bg-gray-100 rounded-full p-1">✕</button>
        </div>

        <div className="p-4 space-y-3">
          {(options || []).map(opt => {
            const active = method === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition border ${
                  active ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100 hover:shadow-sm"
                }`}
                aria-pressed={active}
              >
                <div className="flex-none">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border transition ${active ? "bg-yellow-500 border-yellow-500" : "bg-white border-gray-300"}`}>
                    {active ? (
                      <svg width="10" height="8" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.666 1L4.166 8L1 4.666" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : null}
                  </span>
                </div>

                <div className="flex-none w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-xl overflow-hidden">
                  {opt.iconUrl ? (
                    <img src={opt.iconUrl} alt={opt.id} className="w-8 h-8 object-contain" />
                  ) : opt.icon ? (
                    <span className="text-xl">{opt.icon}</span>
                  ) : null}
                </div>

                <div className="text-left flex-1">
                  <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.hint}</div>
                </div>

                <div className="text-gray-300">›</div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-4 border-t bg-white">
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md border text-sm">Hủy</button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-md bg-yellow-500 text-white font-medium"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
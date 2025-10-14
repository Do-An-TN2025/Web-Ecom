import React from "react";


export default function CouponModal({ open, onClose, onApply, subtotal = 0 }) {
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    if (!open) setCode("");
  }, [open]);

  if (!open) return null;

  const handleApply = () => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    onApply && onApply(c);
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Áp dụng mã giảm giá</h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Nhập mã giảm giá"
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button onClick={handleApply} className="bg-yellow-500 text-white px-4 py-2 rounded-lg">Áp dụng</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Bạn cũng có thể chọn mã có sẵn bên dưới.</p>
        </div>

        <div className="space-y-2">
          {SAMPLE_PROMOS.map(p => {
            const disabled = subtotal < p.min;
            return (
              <div key={p.code} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${disabled ? "bg-gray-50" : "bg-white"}`}>
                <div>
                  <div className="font-medium">{p.code} — {p.title}</div>
                  <div className="text-xs text-gray-500">Yêu cầu tối thiểu: {p.min.toLocaleString("vi-VN")}đ</div>
                </div>
                <div>
                  <button
                    disabled={disabled}
                    onClick={() => { onApply && onApply(p.code); onClose && onClose(); }}
                    className={`px-3 py-1 rounded-md ${disabled ? "bg-gray-200 text-gray-500" : "bg-yellow-500 text-white"}`}
                  >
                    {disabled ? "Không hợp lệ" : "Áp dụng"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">Đóng</button>
        </div>
      </div>
    </div>
  );
}
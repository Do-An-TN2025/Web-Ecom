// ...existing code...
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMeService, applyTokenFromStorage } from "../../services/AuthService";

const STORAGE_KEY = "checkout_shipping_v1";
const readSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const ShippingForm = React.forwardRef(function ShippingForm({ onChange }, ref) {
  const saved = readSaved();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(saved.fullName || "");
  const [email, setEmail] = useState(saved.email || "");
  const [phone, setPhone] = useState(saved.phone || "");
  const [addressLine1, setAddressLine1] = useState(saved.addressLine1 || "");
  const [note, setNote] = useState(saved.note || "");

  const [savedAddresses, setSavedAddresses] = useState(saved.addresses || []);
  const [selectedAddressId, setSelectedAddressId] = useState(saved.selectedAddressId || "");
  const [addressesOpen, setAddressesOpen] = useState(false);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fullName, email, phone, addressLine1, note, addresses: savedAddresses, selectedAddressId })
      );
    } catch {}
  }, [fullName, email, phone, addressLine1, note, savedAddresses, selectedAddressId]);

  useEffect(() => {
    onChange?.({ fullName, email, phone, addressLine1, note, savedAddresses, selectedAddressId });
  }, [fullName, email, phone, addressLine1, note, savedAddresses, selectedAddressId, onChange]);

  // click outside to close addresses panel
  useEffect(() => {
    const onDoc = (e) => {
      if (!addressesOpen) return;
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setAddressesOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [addressesOpen]);

  // when user selects an address from savedAddresses, populate fields
  useEffect(() => {
    if (!selectedAddressId) return;
    const addr = savedAddresses.find((a) => (a._id || a.id) === selectedAddressId);
    if (!addr) return;
    const receiver = addr.receiverName || addr.name || addr.fullName || "";
    const phoneFromAddr = addr.phone || addr.phoneNumber || "";
    const addrLine =
      addr.addressLine ||
      addr.addressLine1 ||
      [addr.street, addr.ward, addr.district, addr.city].filter(Boolean).join(", ") ||
      "";

    if (receiver) setFullName(receiver);
    if (phoneFromAddr) setPhone(phoneFromAddr);
    if (addrLine) setAddressLine1(addrLine);
  }, [selectedAddressId, savedAddresses]);

  // try to prefill from /users/me (if token present)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        applyTokenFromStorage();
        const res = await getMeService();
        if (!mounted || !res) return;
        const user = res.user || res || {};

        const nameFromApi =
          user.fullName ||
          user.name ||
          user.displayName ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim();

        if (!fullName && nameFromApi) setFullName(nameFromApi);
        if (!email && user.email) setEmail(user.email);
        if (!phone && user.phone) setPhone(user.phone);

        const addrList = Array.isArray(user.addresses) ? user.addresses : Array.isArray(user.address) ? user.address : [];
        if (addrList && addrList.length > 0) {
          setSavedAddresses(addrList);
          const def = addrList.find((a) => a.isDefault) || addrList[0];
          const defId = def._id || def.id || "";
          setSelectedAddressId(defId);

          const receiver = def.receiverName || def.name || def.fullName || "";
          const phoneFromAddr = def.phone || def.phoneNumber || "";
          const addrLine =
            def.addressLine ||
            def.addressLine1 ||
            [def.street, def.ward, def.district, def.city].filter(Boolean).join(", ") ||
            "";

          if (!fullName && receiver) setFullName(receiver);
          if (!phone && phoneFromAddr) setPhone(phoneFromAddr);
          if (!addressLine1 && addrLine) setAddressLine1(addrLine);
        }
      } catch (err) {
        console.debug("prefill getMe failed:", err);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const formatAddr = (a) =>
    a
      ? [a.addressLine || a.addressLine1, a.ward, a.district, a.city].filter(Boolean).join(", ")
      : "";

  // validation helper to be called by parent
  const validateAndGet = () => {
    if (!fullName?.trim()) {
      nameRef.current?.focus();
      return { valid: false };
    }
    if (!phone?.trim()) {
      phoneRef.current?.focus();
      return { valid: false };
    }

    const selectedAddr = savedAddresses.find((a) => (a._id || a.id) === selectedAddressId) || null;
    const finalAddress = (addressLine1 && addressLine1.trim()) || (selectedAddr && formatAddr(selectedAddr)) || "";

    if (!finalAddress) {
      // focus the manual input if it exists, otherwise focus phone
      addressRef.current?.focus();
      return { valid: false };
    }

    return {
      valid: true,
      data: {
        fullName: fullName.trim(),
        email: email?.trim() || "",
        phone: phone.trim(),
        addressLine1: finalAddress,
        note: note || "",
        addressId: selectedAddressId || undefined,
      },
    };
  };

  useImperativeHandle(ref, () => ({ validateAndGet }));

  const initials = (name = "") =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((s) => s[0]?.toUpperCase())
      .join("");

  const selectedAddr = savedAddresses.find((a) => (a._id || a.id) === selectedAddressId) || null;

  return (
    <section ref={containerRef} className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-none w-14 h-14 rounded-full bg-yellow-500 text-white flex items-center justify-center text-lg font-semibold">
          {initials(fullName) || "NN"}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">Thông tin giao hàng</h3>
          <p className="text-sm text-gray-500">Kiểm tra người nhận, chọn địa chỉ đã lưu hoặc nhập địa chỉ mới nếu chưa có.</p>
        </div>

        <div className="flex-none">
          <button
            onClick={() => navigate("/account/profile")}
            className="px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            type="button"
          >
            Quản lý địa chỉ
          </button>
        </div>
      </div>

      <div className="border-t -mx-6 mb-4" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Người nhận</span>
          <input
            ref={nameRef}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Họ và tên"
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-200 outline-none"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Email</span>
          <input
            ref={emailRef}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            type="email"
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-200 outline-none"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Số điện thoại</span>
          <input
            ref={phoneRef}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912345678"
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-200 outline-none"
          />
        </label>

        {/* single shipping address view + change button */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 mb-1">Địa chỉ giao hàng</span>

          {/* show selected saved address if exists, otherwise input */}
          {selectedAddr ? (
            <div className="flex items-start gap-3">
              <div className="flex-1 p-3 rounded-lg border border-gray-100 bg-white">
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{selectedAddr.receiverName || selectedAddr.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedAddr.phone}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatAddr(selectedAddr)}
                    </div>
                  </div>
                  <div className="text-right">
                    {selectedAddr.isDefault && <div className="text-xs text-yellow-600 font-medium">Mặc định</div>}
                  </div>
                </div>
              </div>

              <div className="flex-none">
                <button
                  type="button"
                  onClick={() => setAddressesOpen((s) => !s)}
                  className="px-3 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50 white-space-nowrap"
                >
                  Thay đổi
                </button>
              </div>
            </div>
          ) : (
            <input
              ref={addressRef}
              value={addressLine1}
              onChange={(e) => {
                setAddressLine1(e.target.value);
                if (selectedAddressId) setSelectedAddressId("");
              }}
              placeholder="Số nhà, tên đường, phường, quận, tỉnh/thành"
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-200 outline-none"
            />
          )}

          {/* expanded selector: choose one address, only visible when user wants to change */}
          {addressesOpen && (
            <div className="mt-3 p-3 rounded-lg border border-gray-100 bg-white shadow-sm max-h-56 overflow-auto">
              {savedAddresses && savedAddresses.length > 0 ? (
                savedAddresses.map((a) => {
                  const id = a._id || a.id;
                  const sel = id === selectedAddressId;
                  return (
                    <div
                      key={id}
                      role="button"
                      onClick={() => {
                        setSelectedAddressId(id);
                        setAddressesOpen(false);
                      }}
                      className={
                        "p-3 mb-2 rounded-md cursor-pointer " +
                        (sel ? "border-2 border-yellow-400 bg-yellow-50" : "border border-gray-100 bg-white")
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-gray-800">{a.receiverName || a.name}</div>
                          <div className="text-xs text-gray-500">{a.phone}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatAddr(a)}
                          </div>
                        </div>
                        <div className="text-right">
                          {a.isDefault && <div className="text-xs text-yellow-600 font-medium">Mặc định</div>}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">Không có địa chỉ đã lưu — nhập địa chỉ mới ở ô trên.</div>
              )}
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    setAddressesOpen(false);
                    navigate("/account/profile");
                  }}
                  className="text-xs text-gray-600 hover:underline"
                >
                  Quản lý / Thêm địa chỉ
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Ghi chú cho người giao (tuỳ chọn)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Gọi trước khi giao..."
              rows={3}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-200 outline-none resize-none"
            />
          </label>
        </div>
      </div>
    </section>
  );
});

export default ShippingForm;

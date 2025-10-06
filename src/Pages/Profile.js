import React, { useEffect, useState, useCallback } from "react";
import {
  applyTokenFromStorage,
  getMeService,
  updateMeService,
  getAddressesService,
  addAddressService,
  updateAddressService,
  deleteAddressService,
  setDefaultAddressService,
  logoutService
} from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Field = ({ label, children, hint, error }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">
      {label}
    </label>
    {children}
    {hint && !error && <p className="text-[10px] text-gray-400">{hint}</p>}
    {error && <p className="text-[10px] text-red-500">{error}</p>}
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");

  const [loadingUser, setLoadingUser] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    avatar: ""
  });
  const [formErrors, setFormErrors] = useState({});

  // Address
  const [addresses, setAddresses] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrForm, setAddrForm] = useState({
    receiverName: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
    ward: "",
    isDefault: false
  });
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrErrors, setAddrErrors] = useState({});

  const resetAddrForm = () => {
    setEditingAddressId(null);
    setAddrForm({
      receiverName: "",
      phone: "",
      addressLine: "",
      city: "",
      district: "",
      ward: "",
      isDefault: false
    });
    setAddrErrors({});
  };

  const validateProfile = () => {
    const err = {};
    if (!form.firstName.trim()) err.firstName = "Bắt buộc";
    if (!form.lastName.trim()) err.lastName = "Bắt buộc";
    if (form.phone && !/^[0-9+\s-]{8,15}$/.test(form.phone)) err.phone = "Sai định dạng";
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateAddress = () => {
    const e = {};
    if (!addrForm.receiverName.trim()) e.receiverName = "Bắt buộc";
    if (!addrForm.phone.trim()) e.phone = "Bắt buộc";
    if (!addrForm.addressLine.trim()) e.addressLine = "Bắt buộc";
    if (!addrForm.city.trim()) e.city = "Bắt buộc";
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const loadUser = useCallback(async () => {
    applyTokenFromStorage();
    try {
      setLoadingUser(true);
      const u = await getMeService();
      setUser(u);
      setForm({
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        phone: u.phone || "",
        gender: u.gender || "",
        dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
        avatar: u.avatar || ""
      });
    } catch (e) {
      if (e?.response?.status === 401) {
        logoutService();
        toast.warning("Phiên hết hạn");
        navigate("/account/login", { replace: true });
      } else toast.error("Không tải được hồ sơ");
    } finally {
      setLoadingUser(false);
    }
  }, [navigate]);

  const loadAddresses = useCallback(async () => {
    try {
      setLoadingAddr(true);
      const list = await getAddressesService();
      setAddresses(list);
    } catch {
      toast.error("Không tải được địa chỉ");
    } finally {
      setLoadingAddr(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    loadAddresses();
  }, [loadUser, loadAddresses]);

  const handleUserChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async () => {
    if (!validateProfile()) {
      toast.warn("Vui lòng kiểm tra thông tin");
      return;
    }
    setSavingUser(true);
    try {
      const updated = await updateMeService(form);
      setUser(updated);
      toast.success("Đã lưu");
    } catch {
      toast.error("Lưu thất bại");
    } finally {
      setSavingUser(false);
    }
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddrForm({ ...addr });
    setTab("addresses");
  };

  const handleAddrChange = (e) =>
    setAddrForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveAddress = async () => {
    if (!validateAddress()) {
      toast.warn("Thiếu thông tin địa chỉ");
      return;
    }
    setAddrSaving(true);
    try {
      let list;
      if (editingAddressId) {
        list = await updateAddressService(editingAddressId, addrForm);
        toast.success("Cập nhật địa chỉ");
      } else {
        list = await addAddressService(addrForm);
        toast.success("Đã thêm địa chỉ");
      }
      setAddresses(list);
      resetAddrForm();
    } catch {
      toast.error("Lưu địa chỉ thất bại");
    } finally {
      setAddrSaving(false);
    }
  };

  const removeAddress = async (id) => {
    if (!window.confirm("Xóa địa chỉ này?")) return;
    try {
      const list = await deleteAddressService(id);
      setAddresses(list);
      toast.success("Đã xóa");
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const setDefault = async (id) => {
    try {
      const list = await setDefaultAddressService(id);
      setAddresses(list);
      toast.success("Đã đặt mặc định");
    } catch {
      toast.error("Thất bại");
    }
  };

  const logout = () => {
    logoutService();
    toast.info("Đã đăng xuất");
    navigate("/account/login", { replace: true });
  };

  if (loadingUser && !user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
          </div>
          <div className="md:col-span-3 space-y-6">
            <div className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border p-5 flex flex-col items-center text-center shadow-sm">
            <div className="relative">
              <img
                src={
                  form.avatar ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(
                      `${form.firstName || ""} ${form.lastName || ""}`.trim() || "U"
                    )
                }
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border shadow-sm"
              />
            </div>
            <h2 className="mt-4 font-semibold text-gray-800 text-sm">
              {(form.firstName + " " + form.lastName).trim() || "Người dùng"}
            </h2>
            <p className="text-[11px] text-gray-500">{user?.email}</p>
            <button
              onClick={logout}
              className="mt-4 text-xs font-medium text-red-600 hover:underline"
            >
              Đăng xuất
            </button>
          </div>

            <div className="bg-white rounded-2xl border p-3 shadow-sm">
              <nav className="flex flex-col gap-1">
                {[
                  { id: "info", label: "Thông tin cá nhân" },
                  { id: "addresses", label: "Địa chỉ giao hàng" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`text-left px-4 py-2 rounded-xl text-sm font-medium transition ${
                      tab === t.id
                        ? "bg-yellow-500 text-white shadow"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="bg-white rounded-2xl border p-4 shadow-sm">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Cập nhật thông tin giúp đặt hàng nhanh và chính xác hơn.
              </p>
            </div>
        </aside>

        {/* Content */}
        <div className="md:col-span-3 space-y-8">
          {tab === "info" && (
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-800">
                  Thông tin cá nhân
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Hãy đảm bảo thông tin luôn chính xác.
                </p>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <Field label="Họ" error={formErrors.firstName}>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleUserChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </Field>
                <Field label="Tên" error={formErrors.lastName}>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleUserChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </Field>
                <Field
                  label="Số điện thoại"
                  hint="Dùng để liên hệ giao hàng"
                  error={formErrors.phone}
                >
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleUserChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </Field>
                <Field label="Giới tính">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleUserChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none bg-white"
                  >
                    <option value="">-- Chọn --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </Field>
                <Field label="Ngày sinh">
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleUserChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </Field>
                <Field label="Avatar (URL)">
                  <input
                    name="avatar"
                    value={form.avatar}
                    onChange={handleUserChange}
                    placeholder="https://..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />
                </Field>
                {form.avatar && (
                  <div className="md:col-span-2 flex items-center gap-4 pt-2">
                    <img
                      src={form.avatar}
                      alt="avatar preview"
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                    <p className="text-[11px] text-gray-500">
                      Ảnh xem trước avatar.
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={saveProfile}
                  disabled={savingUser}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold text-white transition ${
                    savingUser
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                >
                  {savingUser ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          )}

          {tab === "addresses" && (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Địa chỉ giao hàng
                    </h3>
                    <button
                      onClick={resetAddrForm}
                      className="text-xs font-medium text-yellow-600 hover:underline"
                    >
                      + Thêm mới
                    </button>
                  </div>

                  {loadingAddr && (
                    <div className="text-xs text-gray-500">Đang tải...</div>
                  )}
                  {!loadingAddr && addresses.length === 0 && (
                    <div className="text-xs text-gray-500">
                      Chưa có địa chỉ nào.
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((a) => (
                      <div
                        key={a._id}
                        className="group border rounded-xl bg-white p-4 shadow-sm hover:shadow transition relative"
                      >
                        {a.isDefault && (
                          <span className="absolute top-2 right-2 text-[10px] bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                        <p className="font-medium text-sm">
                          {a.receiverName}{" "}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {a.phone}
                        </p>
                        <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
                          {a.addressLine}, {a.ward}, {a.district}, {a.city}
                        </p>
                        <div className="flex gap-3 mt-3 text-[11px] font-medium">
                          {!a.isDefault && (
                            <button
                              onClick={() => setDefault(a._id)}
                              className="text-yellow-600 hover:underline"
                            >
                              Mặc định
                            </button>
                          )}
                          <button
                            onClick={() => startEditAddress(a)}
                            className="text-gray-600 hover:underline"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => removeAddress(a._id)}
                            className="text-red-600 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-sm">
                  <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b flex items-center justify-between">
                      <h4 className="font-semibold text-sm">
                        {editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ"}
                      </h4>
                      {editingAddressId && (
                        <button
                          onClick={resetAddrForm}
                          className="text-[11px] text-gray-500 hover:underline"
                        >
                          Hủy
                        </button>
                      )}
                    </div>
                    <div className="p-5 space-y-4">
                      <Field label="Người nhận" error={addrErrors.receiverName}>
                        <input
                          name="receiverName"
                          value={addrForm.receiverName}
                          onChange={handleAddrChange}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                      </Field>
                      <Field label="SĐT" error={addrErrors.phone}>
                        <input
                          name="phone"
                          value={addrForm.phone}
                          onChange={handleAddrChange}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                      </Field>
                      <Field label="Địa chỉ" error={addrErrors.addressLine}>
                        <input
                          name="addressLine"
                          value={addrForm.addressLine}
                          onChange={handleAddrChange}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                      </Field>
                      <Field label="Phường/Xã">
                        <input
                          name="ward"
                          value={addrForm.ward}
                          onChange={handleAddrChange}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                      </Field>
                      <Field label="Quận/Huyện">
                        <input
                          name="district"
                          value={addrForm.district}
                          onChange={handleAddrChange}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                      </Field>
                      <Field label="Tỉnh/Thành phố" error={addrErrors.city}>
                        <input
                          name="city"
                          value={addrForm.city}
                          onChange={handleAddrChange}
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                        />
                      </Field>
                      <label className="flex items-center gap-2 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={addrForm.isDefault}
                          onChange={(e) =>
                            setAddrForm((p) => ({
                              ...p,
                              isDefault: e.target.checked
                            }))
                          }
                        />
                        Đặt làm mặc định
                      </label>
                      <button
                        onClick={saveAddress}
                        disabled={addrSaving}
                        className={`w-full mt-2 rounded-lg py-2.5 text-sm font-semibold text-white transition ${
                          addrSaving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-yellow-500 hover:bg-yellow-600"
                        }`}
                      >
                        {addrSaving
                          ? "Đang lưu..."
                          : editingAddressId
                          ? "Cập nhật"
                          : "Thêm mới"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
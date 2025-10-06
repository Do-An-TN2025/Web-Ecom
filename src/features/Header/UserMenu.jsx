import { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import { User, LogOut, Settings, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../../hooks/useIsMobile"; // hook check mobile

export default function UserMenu() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile(); // 👈 check mobile

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/account/login");
  };

  // Nếu chưa đăng nhập
  if (!user) {
    return (
      <button
        onClick={() => navigate("/account/login")}
        className="p-2 rounded-full hover:bg-gray-100 transition"
      >
        <User className="w-7 h-7 text-gray-700" />
      </button>
    );
  }

  // Nếu là mobile → chỉ hiện icon avatar, click đi tới trang account
  if (isMobile) {
    return (
      <button
        onClick={() => navigate("/account")}
        className="p-1 rounded-full hover:bg-gray-100 transition"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt="user"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <User className="w-7 h-7 text-gray-700" />
        )}
      </button>
    );
  }

  // Nếu là desktop → hiện dropdown menu
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          {user.firstName}&nbsp;<span>{user.lastName}</span>
        </span>
        <Menu.Button className="p-2 rounded-full hover:bg-gray-100 transition flex items-center gap-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt="user"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-gray-700" />
          )}
        </Menu.Button>
      </div>
      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden border">
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => navigate("/account/profile")}
              className={`${
                active ? "bg-gray-100" : ""
              } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Thông tin tài khoản
            </button>
          )}
        </Menu.Item>

        <Menu.Item>
          {({ active }) => (
            <button
              onClick={() => navigate("/orders")}
              className={`${
                active ? "bg-gray-100" : ""
              } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
            >
              <Package className="w-4 h-4 mr-2" />
              Đơn hàng của tôi
            </button>
          )}
        </Menu.Item>

        {user.role === "admin" && (
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => navigate("/admin")}
                className={`${
                  active ? "bg-gray-100" : ""
                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Quản trị
              </button>
            )}
          </Menu.Item>
        )}

        <Menu.Item>
          {({ active }) => (
            <button
              onClick={handleLogout}
              className={`${
                active ? "bg-gray-100" : ""
              } flex items-center w-full px-4 py-2 text-sm text-red-600`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

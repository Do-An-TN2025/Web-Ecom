import React, { useState } from "react";

import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, 
  BarChart3, Tag, MessageSquare, Bell, FileText, Image, 
  ChevronRight,
  ChevronLeft
} from "lucide-react";

const menuItems = [
  { name: "Tổng quan", icon: <LayoutDashboard size={20} />, path: "/admin" },
  { name: "Danh mục", icon: <Tag size={20} />, path: "/admin/categories" },
  { name: "Sản phẩm", icon: <Package size={20} />, path: "/admin/products" },
  { name: "Đơn hàng", icon: <ShoppingCart size={20} />, path: "/admin/orders" },
  { name: "Khuyến Mãi", icon: <Users size={20} />, path: "/admin/vouchers" },
  { name: "Báo cáo", icon: <BarChart3 size={20} />, path: "/admin/reports" },
  { name: "Đánh giá", icon: <MessageSquare size={20} />, path: "/admin/reviews" },
  { name: "Banners", icon: <Image size={20} />, path: "/admin/banners" }, 
  { name: "Notifications", icon: <Bell size={20} />, path: "/admin/notifications" },
  { name: "Content", icon: <FileText size={20} />, path: "/admin/content" }, 
  { name: "Settings", icon: <Settings size={20} />, path: "/" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-gray-900 text-white h-screen flex flex-col transition-all duration-300 relative`}
    >
      {/* Header + Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!collapsed && <span className="text-xl font-bold">Admin Welcome</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-gray-700"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-2">
        {menuItems.map((item, i) => (
          <div key={i} className="relative group">
            <a
              href={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 transition"
            >
              {item.icon}
              {!collapsed && <span>{item.name}</span>}
            </a>

            {/* Tooltip khi collapsed */}
            {collapsed && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition">
                {item.name}
              </span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

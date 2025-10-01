import React from "react";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

const stats = [
  {
    name: "Total Products",
    value: "1,240",
    icon: <Package size={24} className="text-indigo-600" />,
  },
  {
    name: "Total Orders",
    value: "3,542",
    icon: <ShoppingCart size={24} className="text-green-600" />,
  },
  {
    name: "Total Users",
    value: "980",
    icon: <Users size={24} className="text-orange-600" />,
  },
  {
    name: "Revenue",
    value: "$45,200",
    icon: <DollarSign size={24} className="text-yellow-600" />,
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition"
        >
          <div className="p-3 bg-gray-100 rounded-lg">{stat.icon}</div>
          <div>
            <p className="text-gray-500 text-sm">{stat.name}</p>
            <h2 className="text-xl font-bold">{stat.value}</h2>
          </div>
        </div>
      ))}
    </div>
  );
}

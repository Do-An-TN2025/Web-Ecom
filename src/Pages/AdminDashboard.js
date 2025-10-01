import React from "react";
import AdminLayout from "../components/Admin/AdminLayout";
import StatsCards from "../components/Admin/StatsCards";

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <StatsCards />
    </AdminLayout>
  );
};

export default AdminDashboard;

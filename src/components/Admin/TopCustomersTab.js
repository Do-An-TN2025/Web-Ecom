import React from "react";
import { Card, Table, Typography } from "antd";

const { Text } = Typography;

const defaultColumns = [
  {
    title: "Khách hàng",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
  },
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    width: 220,
  },
  {
    title: "SĐT",
    dataIndex: "phone",
    key: "phone",
    width: 140,
  },
  {
    title: "Tổng chi",
    dataIndex: "totalSpent",
    key: "totalSpent",
    render: (v) => <Text strong>{typeof v === 'number' ? v.toLocaleString('vi-VN') + ' ₫' : v}</Text>,
    align: "right",
    width: 160,
  },
  {
    title: "Số đơn",
    dataIndex: "orders",
    key: "orders",
    width: 120,
  },
];

const TopCustomersTab = ({ customers = [], columns = defaultColumns }) => {
  return (
    <Card>
      <Table
        rowKey={(r) => r.userId || r._id}
        dataSource={customers}
        columns={columns}
        pagination={false}
        size="middle"
      />
    </Card>
  );
};

export default TopCustomersTab;

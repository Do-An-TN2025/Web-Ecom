import React from "react";
import { Card, Table } from "antd";

const TopProductsTab = ({ products = [], columns = [] }) => {
  return (
    <Card>
      <Table
        rowKey={(r) => r._id || `${r.productName}-${r.sku}`}
        dataSource={products}
        columns={columns}
        pagination={false}
        size="middle"
      />
    </Card>
  );
};

export default TopProductsTab;
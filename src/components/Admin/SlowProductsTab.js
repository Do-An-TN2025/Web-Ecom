import React from "react";
import { Card, Table, Image, Typography } from "antd";

const { Text } = Typography;

const defaultColumns = [
  {
    title: "Sản phẩm",
    dataIndex: "name",
    key: "name",
    render: (text, row) => (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {row.sampleImage ? (
          <Image src={row.sampleImage} width={48} height={48} preview={false} style={{ objectFit: 'cover', marginRight: 12 }} />
        ) : null}
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {row.slug ? <div style={{ color: '#888' }}>{row.slug}</div> : null}
        </div>
      </div>
    ),
  },
  {
    title: "Tồn kho",
    dataIndex: "totalStock",
    key: "totalStock",
    width: 120,
  },
  {
    title: "Đã bán",
    dataIndex: "qtySold",
    key: "qtySold",
    width: 120,
  },
  {
    title: "Score",
    dataIndex: "score",
    key: "score",
    width: 120,
    render: (v) => <Text>{typeof v === 'number' ? v.toFixed(2) : v}</Text>,
  },
];

const SlowProductsTab = ({ products = [], columns = defaultColumns }) => {
  return (
    <Card>
      <Table
        rowKey={(r) => r._id || `${r.name}-${r.slug}`}
        dataSource={products}
        columns={columns}
        pagination={false}
        size="middle"
      />
    </Card>
  );
};

export default SlowProductsTab;

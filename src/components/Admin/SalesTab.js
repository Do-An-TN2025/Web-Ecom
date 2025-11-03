import React from "react";
import { Card, Row, Col, Space, Select, Button, Text } from "antd";
import {
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const { Option } = Select;

const currencyFormatter = (v) =>
  typeof v === "number" ? v.toLocaleString("vi-VN") + " ₫" : v;

const SalesTab = ({ sales = { labels: [], data: [] }, period, range, setPeriod, setRange, reloadSales, loadingSales }) => {
  const chartData =
    (sales &&
      Array.isArray(sales.labels) &&
      sales.labels.map((lbl, i) => ({
        label: lbl,
        revenue: (sales.data && sales.data[i] && sales.data[i].revenue) || 0,
        orders: (sales.data && sales.data[i] && sales.data[i].orders) || 0,
      }))) ||
    [];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <b>Doanh thu & Số đơn theo thời gian</b>
        </Col>
        <Col>
          <Space>
            <Select value={period} onChange={(v) => setPeriod(v)} size="small" style={{ width: 100 }}>
              <Option value="day">Ngày</Option>
              <Option value="week">Tuần</Option>
              <Option value="month">Tháng</Option>
            </Select>

            <Select value={String(range)} onChange={(v) => { const n = parseInt(v, 10); setRange(n); }} size="small" style={{ width: 100 }}>
              <Option value="7">7</Option>
              <Option value="14">14</Option>
              <Option value="30">30</Option>
              <Option value="90">90</Option>
            </Select>

            <Button size="small" onClick={() => reloadSales(period, range)} loading={loadingSales}>
              Áp dụng
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000) | 0}k`} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value) => (typeof value === "number" ? currencyFormatter(value) : value)} />
              <Legend />
              <Bar yAxisId="left" dataKey="orders" barSize={20} name="Số đơn" fill="#1890ff" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#52c41a" name="Doanh thu" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
};

export default SalesTab;
import React from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Tag,
  Space,
  Button,
  Table,
  Tooltip,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  MoneyCollectOutlined,
  WalletOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

const currencyFormatter = (v) =>
  typeof v === "number" ? v.toLocaleString("vi-VN") + " ₫" : v;

// Bản đồ dịch trạng thái và màu tag
const STATUS_MAP = {
  pending: { label: "Đang chờ", color: "gold" },
  confirmed: { label: "Đã xác nhận", color: "blue" },
  paid: { label: "Đã thanh toán", color: "green" },
  shipped: { label: "Đã giao", color: "cyan" },
  cancelled: { label: "Đã hủy", color: "default" },
  refunded: { label: "Đã hoàn tiền", color: "magenta" },
};

const PAYMENT_MAP = {
  cod: { label: "Thanh toán khi nhận hàng", color: "default" },
  card: { label: "Thẻ/Tín dụng", color: "cyan" },
  momo: { label: "Momo", color: "magenta" },
  vnpay: { label: "VNPAY", color: "green" },
  bank_transfer: { label: "Chuyển khoản", color: "gold" },
  paypal: { label: "PayPal", color: "blue" },
};

const getStatusTag = (key) => {
  if (!key && key !== 0) return <Tag color="default">—</Tag>;
  const k = String(key).toLowerCase();
  const meta = STATUS_MAP[k];
  if (meta) return <Tag color={meta.color}>{meta.label}</Tag>;
  // Fallback: beautify key
  return <Tag color="default">{String(key).replace(/[_-]/g, " ")}</Tag>;
};

const getPaymentTag = (key) => {
  if (!key && key !== 0) return <Tag color="default">—</Tag>;
  const k = String(key).toLowerCase();
  const meta = PAYMENT_MAP[k] || PAYMENT_MAP[k.replace(/\s+/g, "_")];
  if (meta) return <Tag color={meta.color}>{meta.label}</Tag>;
  return <Tag color="gold">{String(key).replace(/[_-]/g, " ")}</Tag>;
};

// Mini sparkline component
const Spark = ({ data = [], color = "#1890ff" }) => {
  if (!Array.isArray(data) || data.length === 0) return null;
  const points = data.slice(-20).map((v, i) => ({ x: i, y: v || 0 }));
  return (
    <div style={{ width: 110, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points}>
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            fill={color}
            fillOpacity={0.12}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * overview: {
 *  totalOrders, totalRevenueAll, totalPaidRevenue, totalPaidOrders,
 *  statusCounts: { ... }, paymentCounts: { ... }, uniqueCustomers, recentOrders
 * }
 */
const OverviewTab = ({ overview = {}, onRefresh }) => {
  const {
    totalOrders = 0,
    totalRevenueAll = 0,
    totalPaidRevenue = 0,
    totalPaidOrders = 0,
    statusCounts = {},
    paymentCounts = {},
    uniqueCustomers = 0,
    recentOrders = [],
    sparkHistory = [], // optional array of numbers for sparklines
  } = overview;

  const sparkData = Array.isArray(sparkHistory) && sparkHistory.length ? sparkHistory : (recentOrders || []).map((r) => r.totalAmount || 0);

  const KPI = ({ title, value, hint, color, icon, trend }) => (
    <Card bordered={false} style={{ borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 14, color: "#666" }}>{title}</div>
            <div style={{ marginLeft: "auto" }}>
              <Tooltip title={hint || ""}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {icon}
                </div>
              </Tooltip>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <Statistic
              value={value}
              precision={0}
              valueStyle={{ fontSize: 20, fontWeight: 800, color: "#111" }}
              formatter={() => (typeof value === "number" ? currencyFormatter(value) : value)}
            />
          </div>

          {typeof trend === "number" ? (
            <div style={{ marginTop: 8, color: trend >= 0 ? "#3f8600" : "#cf1322", fontWeight: 600 }}>
              {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(trend).toFixed(1)}%
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Spark data={sparkData} color={color} />
        </div>
      </div>
    </Card>
  );

  // simple recentOrders table (if provided)
  const recentCols = [
    { title: "Mã đơn", dataIndex: "orderId", key: "orderId", render: (v) => <strong>{v}</strong> },
    { title: "Ngày", dataIndex: "date", key: "date" },
    { title: "Tổng (₫)", dataIndex: "total", key: "total", align: "right", render: (v) => <strong>{currencyFormatter(v)}</strong> },
    { title: "Trạng thái", dataIndex: "status", key: "status", render: (s) => getStatusTag(s) },
  ];

  // compute a tiny trend for display (last 3 vs previous 3)
  const computeTrend = (arr) => {
    if (!arr || arr.length < 6) return null;
    const last = arr.slice(-3).reduce((s, v) => s + (v || 0), 0) / 3;
    const prev = arr.slice(-6, -3).reduce((s, v) => s + (v || 0), 0) / 3;
    if (!prev) return null;
    return ((last - prev) / Math.abs(prev)) * 100;
  };
  const trend = computeTrend(sparkData);

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Space>
            <Button type="default" icon={<ReloadOutlined />} onClick={() => typeof onRefresh === "function" && onRefresh()}>
              Làm mới
            </Button>
          </Space>
        </Col>
        <Col style={{ color: "#888" }}>Cập nhật: {new Date().toLocaleString()}</Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <KPI
            title="Tổng đơn"
            value={totalOrders}
            hint="Số đơn đã tạo"
            color="#1890ff"
            icon={<ShoppingOutlined style={{ color: "#1890ff" }} />}
            trend={trend ?? 0}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <KPI
            title="Tổng doanh thu"
            value={totalRevenueAll}
            hint="Tổng giá trị đơn (tất cả trạng thái)"
            color="#096dd9"
            icon={<MoneyCollectOutlined style={{ color: "#096dd9" }} />}
            trend={trend ?? 0}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <KPI
            title="Doanh thu đã thanh toán"
            value={totalPaidRevenue}
            hint={`${totalPaidOrders} đơn đã thanh toán`}
            color="#2f9e44"
            icon={<WalletOutlined style={{ color: "#2f9e44" }} />}
            trend={trend ?? 0}
          />
        </Col>

        <Col xs={24} sm={12} md={6}>
          <KPI
            title="Khách hàng (unique)"
            value={uniqueCustomers}
            hint="Số khách hàng riêng biệt"
            color="#722ed1"
            icon={<UserOutlined style={{ color: "#722ed1" }} />}
            trend={trend ?? 0}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Trạng thái đơn hàng" bordered={false} style={{ borderRadius: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(statusCounts).length === 0 ? (
                <div style={{ color: "#888" }}>Không có dữ liệu trạng thái</div>
              ) : (
                Object.entries(statusCounts).map(([k, v]) => {
                  const meta = STATUS_MAP[String(k).toLowerCase()];
                  const label = meta ? meta.label : String(k).replace(/[_-]/g, " ");
                  const color = meta ? meta.color : "default";
                  return <Tag key={k} color={color} style={{ fontSize: 13 }}>{label}: <strong style={{ marginLeft: 8 }}>{v}</strong></Tag>;
                })
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phương thức thanh toán" bordered={false} style={{ borderRadius: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(paymentCounts).length === 0 ? (
                <div style={{ color: "#888" }}>Không có dữ liệu</div>
              ) : (
                Object.entries(paymentCounts).map(([k, v]) => {
                  const meta = PAYMENT_MAP[String(k).toLowerCase()] || PAYMENT_MAP[String(k).toLowerCase().replace(/\s+/g, "_")];
                  const label = meta ? meta.label : String(k).replace(/[_-]/g, " ");
                  const color = meta ? meta.color : "gold";
                  return <Tag key={k} color={color} style={{ fontSize: 13 }}>{label}: <strong style={{ marginLeft: 8 }}>{v}</strong></Tag>;
                })
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Đơn hàng gần đây" bordered={false} style={{ borderRadius: 10 }}>
            <Table
              dataSource={(recentOrders || []).map((r, i) => ({
                key: r._id || i,
                orderId: r.code || r._id || `#${i + 1}`,
                date: r.date || r.createdAt ? new Date(r.date || r.createdAt).toLocaleString() : "-",
                total: r.totalAmount || r.total || 0,
                status: r.status || "—",
              }))}
              columns={recentCols}
              pagination={{ pageSize: 6 }}
              size="small"
              locale={{ emptyText: "Không có đơn hàng" }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OverviewTab;
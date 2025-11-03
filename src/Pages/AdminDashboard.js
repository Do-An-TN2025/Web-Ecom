import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../components/Admin/AdminLayout";
import {
  Row,
  Col,
  Card,
  Statistic,
  Select,
  Button,
  Table,
  Spin,
  Space,
  Typography,
  Tabs,
} from "antd";
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from "@ant-design/icons";
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
import {
  getAdminOverview,
  getSalesByPeriod,
  getTopProducts,
  getRevenueForecast,
} from "../services/revenueService";
import OverviewTab from "../components/Admin/OverviewTab";
import SalesTab from "../components/Admin/SalesTab";
import ForecastTab from "../components/Admin/ForecastTab";
import TopProductsTab from "../components/Admin/TopProductsTab";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const currencyFormatter = (v) =>
  typeof v === "number" ? v.toLocaleString("vi-VN") + " ₫" : v;

const AdminDashboard = () => {
  const [overview, setOverview] = useState({});
  const [sales, setSales] = useState({ labels: [], data: [] });
  const [topProducts, setTopProducts] = useState([]);
  const [forecast, setForecast] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [error, setError] = useState(null);

  // UI filters
  const [period, setPeriod] = useState("day");
  const [range, setRange] = useState(30);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, salesData, top, fc] = await Promise.all([
        getAdminOverview(),
        getSalesByPeriod({ period, range }),
        getTopProducts({ limit: 8, periodDays: 90 }),
        getRevenueForecast({ period: "day", limit: 1 }),
      ]);
      setOverview(ov || {});
      setSales(salesData || { labels: [], data: [] });
      setTopProducts((top && top.data) || top || []);
      setForecast(fc || null);
    } catch (err) {
      console.error("Admin dashboard load error", err);
      setError(err?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [period, range]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload sales when filters change
  const reloadSales = async (p = period, r = range) => {
    setLoadingSales(true);
    try {
      const salesData = await getSalesByPeriod({ period: p, range: r });
      setSales(salesData || { labels: [], data: [] });
    } catch (err) {
      console.error("Sales reload error", err);
    } finally {
      setLoadingSales(false);
    }
  };

  // columns for top products table
  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "name",
      ellipsis: true,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      width: 120,
    },
    {
      title: "Số lượng",
      dataIndex: "qtySold",
      key: "qty",
      width: 120,
    },
    {
      title: "Doanh thu",
      dataIndex: "revenue",
      key: "revenue",
      render: (v) => <Text strong>{currencyFormatter(v)}</Text>,
      align: "right",
      width: 160,
    },
  ];

  // transform sales for recharts: array of { label, revenue, orders }
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
    <AdminLayout>
      <div style={{ padding: 24 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 18 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Admin Dashboard
            </Title>
            <Text type="secondary">Tổng quan hoạt động cửa hàng</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => loadAll()}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Card type="inner" style={{ marginBottom: 12 }}>
            <Text type="danger">{error}</Text>
          </Card>
        ) : (
          <>
            <Card>
              <Tabs defaultActiveKey="overview" type="card">
                <TabPane tab="Tổng quan" key="overview">
                  <div style={{ padding: 20 }}>
                    <OverviewTab overview={overview} />
                  </div>
                </TabPane>

                <TabPane tab="Doanh thu" key="sales">
                  <div style={{ padding: 20 }}>
                    <SalesTab
                      sales={sales}
                      period={period}
                      range={range}
                      setPeriod={setPeriod}
                      setRange={setRange}
                      reloadSales={reloadSales}
                      loadingSales={loadingSales}
                    />
                  </div>
                </TabPane>

                <TabPane tab="Dự báo" key="forecast">
                  <div style={{ padding: 20 }}>
                    <ForecastTab forecast={forecast} onRefresh={loadAll} />
                  </div>
                </TabPane>

                <TabPane tab="Sản phẩm bán chạy" key="top-products">
                  <div style={{ padding: 20 }}>
                    <TopProductsTab products={topProducts} columns={[]} />
                  </div>
                </TabPane>
              </Tabs>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

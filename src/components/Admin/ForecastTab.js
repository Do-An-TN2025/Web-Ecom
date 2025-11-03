import React, { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Button,
  Space,
  Select,
  message,
  Divider,
  Tag,
} from "antd";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
  Line,
  Area,
  CartesianGrid,
  ReferenceLine,
  defs,
  linearGradient,
} from "recharts";

const { Text } = Typography;
const { Option } = Select;

const currencyFormatter = (v) =>
  typeof v === "number" ? v.toLocaleString("vi-VN") + " ₫" : v;

/**
 * Ghi chú:
 * - Phiên bản này tinh gọn UI, dùng màu sắc, spacing và custom tooltip để nhìn chuyên nghiệp hơn.
 * - Tập trung vào "Dự đoán doanh thu tương lai" — bảng Top và danh sách chi tiết.
 */

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const history = payload.find((p) => p.dataKey === "history")?.value;
  const forecast = payload.find((p) => p.dataKey === "forecast")?.value;
  return (
    <div style={{ background: "#fff", padding: 10, borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      {history != null && <div style={{ marginTop: 6 }}><Text type="secondary">Hiện tại: </Text><Text strong>{currencyFormatter(history)}</Text></div>}
      {forecast != null && <div style={{ marginTop: 6 }}><Text type="secondary">Dự báo: </Text><Text strong style={{ color: "#2f9e44" }}>{currencyFormatter(Math.round(forecast))}</Text></div>}
    </div>
  );
};

const ForecastTab = ({ forecast, onRefresh }) => {
  const [groupBy, setGroupBy] = useState("day"); // day|month|year
  const TOP_N = 8;

  const buildSeries = useMemo(() => {
    if (!forecast) return [];
    const hLabels = forecast.history?.labels || [];
    const hVals = forecast.history?.values || [];
    const fLabels = forecast.forecast?.labels || [];
    const fVals = forecast.forecast?.values || [];

    const out = [];
    for (let i = 0; i < hLabels.length; i++) {
      out.push({ label: hLabels[i], history: Math.round(hVals[i] || 0), forecast: null });
    }
    for (let i = 0; i < fLabels.length; i++) {
      out.push({ label: fLabels[i], history: null, forecast: Math.round(fVals[i] || 0) });
    }
    return out;
  }, [forecast]);

  const forecastStart = useMemo(() => forecast?.forecast?.labels?.[0] || null, [forecast]);

  const stats = useMemo(() => {
    if (!forecast) return {};
    const h = forecast.history?.values || [];
    const f = forecast.forecast?.values || [];
    const lastActual = [...h].reverse().find((v) => v != null) ?? 0;
    const nextForecast = Math.round(f[0] ?? 0);
    const avgForecast = Math.round(f.length ? f.reduce((s, x) => s + x, 0) / f.length : 0);
    return { lastActual: Math.round(lastActual), nextForecast, avgForecast };
  }, [forecast]);

  const groupKey = (isoDate, by) => {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    if (by === "year") return `${y}`;
    if (by === "month") return `${y}-${m}`;
    return `${y}-${m}-${day}`;
  };

  const topGroups = useMemo(() => {
    if (!forecast) return [];
    const labels = forecast.forecast?.labels || [];
    const values = forecast.forecast?.values || [];
    const map = new Map();
    for (let i = 0; i < labels.length; i++) {
      const key = groupKey(labels[i], groupBy);
      map.set(key, (map.get(key) || 0) + Math.round(values[i] || 0));
    }
    const arr = Array.from(map.entries()).map(([k, v]) => ({ period: k, value: v }));
    return arr.sort((a, b) => b.value - a.value).slice(0, TOP_N);
  }, [forecast, groupBy]);

  const forecastTable = useMemo(() => {
    if (!forecast) return [];
    const labels = forecast.forecast?.labels || [];
    const values = forecast.forecast?.values || [];
    const lastActual = stats.lastActual ?? 0;
    return labels.map((d, i) => {
      const val = Math.round(values[i] ?? 0);
      const delta = lastActual ? ((val - lastActual) / Math.abs(lastActual)) * 100 : null;
      return { key: i, date: d, value: val, delta };
    });
  }, [forecast, stats.lastActual]);

  const exportCSV = () => {
    if (!forecast) return message.warning("Không có dữ liệu forecast để xuất");
    const rows = [["label", "history", "forecast"]];
    for (const r of buildSeries) {
      rows.push([`"${r.label}"`, r.history ?? "", r.forecast ?? ""].join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forecast_${forecast._id ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("Đã tải xuống CSV");
  };

  if (!forecast) {
    return (
      <Card>
        <Text type="secondary">Không có forecast</Text>
      </Card>
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: "#fafafa" }}>
            <Statistic
              title="Actual mới nhất"
              value={stats.lastActual || 0}
              precision={0}
              valueStyle={{ color: "#111", fontWeight: 700 }}
              formatter={(v) => currencyFormatter(v)}
            />
            <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>Dữ liệu thực tế gần nhất</div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: "#fafafa" }}>
            <Statistic
              title="Dự báo tiếp theo (t+1)"
              value={stats.nextForecast || 0}
              precision={0}
              valueStyle={{ color: "#2f9e44", fontWeight: 700 }}
              formatter={(v) => currencyFormatter(v)}
            />
            <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>Horizon: {forecast.horizon ?? "—"} ngày</div>
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ background: "#fafafa" }}>
            <Statistic
              title="Trung bình dự báo"
              value={stats.avgForecast || 0}
              precision={0}
              valueStyle={{ color: "#096dd9", fontWeight: 700 }}
              formatter={(v) => currencyFormatter(v)}
            />
            <div style={{ marginTop: 6, color: "#888", fontSize: 12 }}>Trung bình trong khoảng dự báo</div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} bodyStyle={{ padding: 14 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text strong style={{ fontSize: 15 }}>Dự đoán doanh thu tương lai</Text>
            <div style={{ color: "#888" }}>So sánh dữ liệu thực tế (màu xanh dương) và dự báo (màu xanh lá)</div>
          </Col>

          <Col>
            <Space>
              <Select value={groupBy} onChange={setGroupBy} size="middle" style={{ width: 130 }}>
                <Option value="day">Nhóm: Ngày</Option>
                <Option value="month">Nhóm: Tháng</Option>
                <Option value="year">Nhóm: Năm</Option>
              </Select>
              <Button onClick={exportCSV} type="default">Xuất CSV</Button>
              <Button
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(JSON.stringify(forecast, null, 2))
                    .then(() => message.success("Đã sao chép JSON"))
                    .catch(() => message.error("Sao chép thất bại"));
                }}
              >
                Sao chép JSON
              </Button>
              <Button onClick={() => typeof onRefresh === "function" && onRefresh()}>Làm mới</Button>
            </Space>
          </Col>
        </Row>

        <div style={{ height: 420, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={buildSeries}>
              <defs>
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52c41a" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#52c41a" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={20} />
              <YAxis tickFormatter={(v) => `${(v / 1000) | 0}k`} />
              <ReTooltip content={<ChartTooltip />} />
              <Legend />
              {forecastStart && (
                <ReferenceLine
                  x={forecastStart}
                  stroke="#ff4d4f"
                  strokeDasharray="4 4"
                  label={{ value: "Bắt đầu dự báo", position: "top", fill: "#ff4d4f" }}
                />
              )}
              <Line type="monotone" name="Hiện tại" dataKey="history" stroke="#1890ff" dot={false} strokeWidth={2} />
              <Area type="monotone" name="Tương lai" dataKey="forecast" fill="url(#gradForecast)" stroke="#52c41a" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={`Top ${TOP_N} ${groupBy === "day" ? "ngày" : groupBy === "month" ? "tháng" : "năm"} có dự báo cao nhất`} bodyStyle={{ padding: 12 }}>
            <Table
              dataSource={topGroups.map((r, i) => ({ key: i, period: r.period, value: r.value }))}
              columns={[
                {
                  title: groupBy === "day" ? "Ngày" : groupBy === "month" ? "Tháng" : "Năm",
                  dataIndex: "period",
                  key: "period",
                },
                {
                  title: "Dự báo (₫)",
                  dataIndex: "value",
                  key: "value",
                  align: "right",
                  render: (v) => <Text strong>{currencyFormatter(v)}</Text>,
                },
              ]}
              pagination={false}
              size="small"
              locale={{ emptyText: "Không có dữ liệu" }}
            />
            <Divider style={{ margin: "12px 0" }} />
            <div style={{ textAlign: "right", color: "#888", fontSize: 12 }}>
              Tổng ngày dự báo: <Tag color="blue">{forecast.forecast?.labels?.length ?? 0}</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Danh sách dự báo (chi tiết)" bodyStyle={{ padding: 12 }}>
            <Table
              dataSource={forecastTable}
              columns={[
                { title: "Ngày", dataIndex: "date", key: "date" },
                { title: "Dự báo (₫)", dataIndex: "value", key: "value", align: "right", render: (v) => <Text strong>{currencyFormatter(v)}</Text> },
                {
                  title: "Chênh lệch so với Actual cuối",
                  dataIndex: "delta",
                  key: "delta",
                  align: "right",
                  render: (d) =>
                    d == null ? (
                      <Text type="secondary">—</Text>
                    ) : d > 0 ? (
                      <Text style={{ color: "#cf1322" }}>{`+${d.toFixed(1)}%`}</Text>
                    ) : (
                      <Text style={{ color: "#237804" }}>{`${d.toFixed(1)}%`}</Text>
                    ),
                },
              ]}
              pagination={{ pageSize: 10 }}
              size="small"
              locale={{ emptyText: "Không có dữ liệu" }}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ForecastTab;
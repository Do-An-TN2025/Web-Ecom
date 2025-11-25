import React, { useEffect, useState, useCallback } from 'react'
import AdminLayout from './AdminLayout'
import { Table, Tag, Button, Space, Popconfirm, message, Spin } from 'antd'
import { getOrderReportsAdmin, approveOrderReport } from '../../services/orderService'
import { getOrderStatusLabel, getOrderStatusTagColor } from '../../helpers/orderStatus'

const Reported = () => {
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState([])

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      const data = await getOrderReportsAdmin({ limit: 100 }, token)
      // assume API returns { data: [...], total } or an array
      const rows = Array.isArray(data) ? data : data?.data || []
      setReports(rows)
    } catch (err) {
      console.error('load reports', err)
      message.error((err && err.message) || 'Không thể tải báo cáo')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleApprove = async (reportId) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      if (!token) throw new Error('Bạn cần đăng nhập với tài khoản admin')
      await approveOrderReport(reportId, {}, token)
      message.success('Đã duyệt yêu cầu hủy')
      // refresh
      loadReports()
    } catch (err) {
      console.error('approve report', err)
      message.error((err && err.message) || 'Không thể duyệt yêu cầu')
    }
  }

  const columns = [
    {
      title: 'Order',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (val, row) => row?.orderId?.orderCode || row?.orderId || '-',
    },
    {
      title: 'Người yêu cầu',
      dataIndex: 'userId',
      key: 'userId',
      render: (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : 'Khách vãng lai'),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      render: (r) => <div style={{ maxWidth: 420, whiteSpace: 'pre-wrap' }}>{r}</div>
    },
    {
      title: 'Trạng thái hiện tại',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={getOrderStatusTagColor(s)}>{getOrderStatusLabel(s)}</Tag>
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: v => v ? new Date(v).toLocaleString('vi-VN') : '-' 
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      render: (text, record) => (
        <Space>
          <Popconfirm
            title="Bạn có chắc muốn duyệt yêu cầu này?"
            onConfirm={() => handleApprove(record._id)}
            okText="Duyệt"
            cancelText="Hủy"
          >
            <Button type="primary">Duyệt</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <AdminLayout>
      <div style={{ padding: 16 }}>
        <h2 style={{ marginBottom: 12 }}>Yêu cầu hủy đơn</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
        ) : (
          <Table
            rowKey={r => r._id}
            dataSource={reports}
            columns={columns}
            pagination={{ pageSize: 20 }}
          />
        )}
      </div>
    </AdminLayout>
  )
}

export default Reported
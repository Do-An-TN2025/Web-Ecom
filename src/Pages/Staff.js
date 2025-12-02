import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import { listStaffs, createStaffByAdmin, updateStaff, deleteStaff } from '../services/staffService';
import { Table, Button, Modal, Form, Input, Select, Popconfirm, Switch, Space, Tag, notification, Spin } from 'antd';

const { Option } = Select;

export default function Staff() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20 });
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetch = async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const res = await listStaffs({ page, limit });
      setData(res.data || []);
      setMeta(res.meta || { total: 0, page, limit });
    } catch (err) {
      console.error('fetch staffs failed', err);
      notification.error({ message: 'Lỗi', description: 'Không thể tải danh sách nhân viên' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(meta.page, meta.limit); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: record.phone || '',
      role: record.role,
      status: record.status === 'active'
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteStaff(id);
      notification.success({ message: 'Thành công', description: 'User đã bị hủy kích hoạt' });
      fetch(meta.page, meta.limit);
    } catch (err) {
      console.error('delete failed', err);
      notification.error({ message: 'Lỗi', description: 'Xóa thất bại' });
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        status: values.status ? 'active' : 'inactive'
      };
      if (values.password) payload.password = values.password;

      if (editing) {
        await updateStaff(editing._id, payload);
        notification.success({ message: 'Cập nhật thành công' });
      } else {
        await createStaffByAdmin(payload);
        notification.success({ message: 'Tạo nhân viên thành công' });
      }
      setModalOpen(false);
      fetch(meta.page, meta.limit);
    } catch (err) {
      console.error('save failed', err);
      notification.error({ message: 'Lỗi', description: err?.response?.data?.message || 'Lưu thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'firstName',
      key: 'name',
      render: (_, record) => (<div className="font-medium">{record.firstName} {record.lastName}</div>)
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Role', dataIndex: 'role', key: 'role', render: r => (
        <Tag color={r === 'admin' ? 'gold' : 'blue'}>{r}</Tag>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', render: s => (
        <span className={s === 'active' ? 'text-green-600' : 'text-gray-500'}>{s}</span>
      )
    },
    { title: 'Tạo lúc', dataIndex: 'createdAt', key: 'createdAt', render: d => d ? new Date(d).toLocaleString() : '-' },
    {
      title: 'Hành động', key: 'actions', render: (_, record) => {
        if (record.role === 'admin') return null;
        return (
          <Space>
            <Button size="small" onClick={() => openEdit(record)}>Sửa</Button>
            <Popconfirm title="Bạn có chắc muốn hủy kích hoạt người dùng này?" onConfirm={() => handleDelete(record._id)} okText="Có" cancelText="Hủy">
              <Button size="small" danger>Hủy kích hoạt</Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Quản lý Staff</h2>
          <div>
            <Button type="primary" onClick={openCreate}>Tạo nhân viên</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Spin /></div>
          ) : (
            <Table
              rowKey={(r) => r._id}
              dataSource={data}
              columns={columns}
              pagination={{
                current: meta.page,
                pageSize: meta.limit,
                total: meta.total,
                onChange: (p, pageSize) => fetch(p, pageSize)
              }}
            />
          )}
        </div>

        <Modal
          title={editing ? 'Sửa nhân viên' : 'Tạo nhân viên'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => form.submit()}
          okText="Lưu"
          cancelText="Hủy"
          confirmLoading={saving}
          width={720}
        >
          <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={{ role: 'staff', status: true }}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="firstName" label="Họ" rules={[{ required: true, message: 'Nhập họ' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label="Tên" rules={[{ required: true, message: 'Nhập tên' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="Số điện thoại">
                <Input />
              </Form.Item>
              <Form.Item name="role" label="Quyền" rules={[{ required: true }]}>
                <Select>
                  <Option value="staff">Staff</Option>
                  <Option value="admin">Admin</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Kích hoạt" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="password" label="Mật khẩu" rules={editing ? [] : [{ required: true, message: 'Nhập mật khẩu' }]}>
                <Input.Password placeholder={editing ? 'Để trống nếu không đổi' : ''} />
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
const STATUS_META = {
  pending: { label: 'Chờ xử lý', textClass: 'text-yellow-700', tagColor: 'gold', dotClass: 'bg-yellow-700' },
  confirmed: { label: 'Đã xác nhận', textClass: 'text-blue-700', tagColor: 'blue', dotClass: 'bg-blue-700' },
  paid: { label: 'Đã thanh toán', textClass: 'text-green-700', tagColor: 'green', dotClass: 'bg-green-700' },
  processing: { label: 'Đang xử lý', textClass: 'text-orange-700', tagColor: 'orange', dotClass: 'bg-orange-700' },
  shipping: { label: 'Đang giao', textClass: 'text-indigo-700', tagColor: 'cyan', dotClass: 'bg-indigo-700' },
  shipped: { label: 'Đã gửi', textClass: 'text-indigo-700', tagColor: 'cyan', dotClass: 'bg-indigo-700' },
  delivered: { label: 'Đã giao', textClass: 'text-green-700', tagColor: 'green', dotClass: 'bg-green-700' },
  completed: { label: 'Hoàn thành', textClass: 'text-green-700', tagColor: 'green', dotClass: 'bg-green-700' },
  cancelled: { label: 'Đã hủy', textClass: 'text-red-700', tagColor: 'default', dotClass: 'bg-red-700' },
  refunded: { label: 'Hoàn tiền', textClass: 'text-purple-700', tagColor: 'magenta', dotClass: 'bg-purple-700' },
  reported: { label: 'Đang chờ hủy', textClass: 'text-yellow-800', tagColor: 'gold', dotClass: 'bg-yellow-800' },
};

export function getOrderStatusMeta(status) {
  const k = (status || '').toString().toLowerCase();
  return STATUS_META[k] || null;
}

export function getOrderStatusLabel(status) {
  const meta = getOrderStatusMeta(status);
  if (meta) return meta.label;
  if (status === undefined || status === null) return '—';
  return String(status).replace(/[_-]/g, ' ');
}

export function getOrderStatusTagColor(status) {
  const meta = getOrderStatusMeta(status);
  return (meta && meta.tagColor) || 'default';
}

export function getOrderStatusTextClass(status) {
  const meta = getOrderStatusMeta(status);
  return (meta && meta.textClass) || 'text-gray-700';
}

export function getOrderStatusDotClass(status) {
  const meta = getOrderStatusMeta(status);
  return (meta && meta.dotClass) || 'bg-gray-400';
}

export default {
  getOrderStatusLabel,
  getOrderStatusTagColor,
  getOrderStatusTextClass,
  getOrderStatusDotClass,
  getOrderStatusMeta,
};

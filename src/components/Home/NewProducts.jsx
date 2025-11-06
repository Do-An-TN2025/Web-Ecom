import React, { useEffect, useState } from 'react';
import { getNewProducts } from '../../services/productService';

function GridCard({ p }) {
  return (
    <div className="bg-white border rounded-lg p-3">
      <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
        <img src={p.images?.[0] || '/placeholder.jpg'} alt={p.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="mt-3 text-sm font-medium line-clamp-2">{p.name}</h3>
      <div className="mt-2 text-yellow-600 font-bold">{(p.finalPrice || 0).toLocaleString('vi-VN')}đ</div>
    </div>
  );
}

export default function NewProducts({ limit = 8 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getNewProducts({ limit })
      .then(res => { if (!mounted) return; setItems(res.products || []); })
      .catch(err => console.error('new products', err))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [limit]);

  if (loading) return <div className="py-6">Đang tải sản phẩm mới...</div>;
  if (!items.length) return null;

  return (
    <section className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Hàng mới</h2>
        <a className="text-sm text-yellow-600 hover:underline">Xem tất cả</a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(p => <GridCard key={p._id} p={p} />)}
      </div>
    </section>
  );
}

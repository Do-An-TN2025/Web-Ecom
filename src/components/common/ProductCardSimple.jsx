import React, { useState } from 'react';
import { useCartToast } from '../../hooks/CartAddNotifier';

export default function ProductCardSimple({ product, onAdd }) {
  const [adding, setAdding] = useState(false);
  const toast = useCartToast();

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await onAdd();
      try {
        toast?.showAdded?.({
          image: (product.images && product.images[0]) || '/placeholder.jpg',
          name: product.name,
          price: product.finalPrice || product.price || 0,
          qty: 1,
          colorLabel: product.color || '',
          size: product.size || '',
        });
      } catch (e) {
        // ignore toast failures
      }
    } catch (err) {
      // swallow, caller handles error  
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 m-2 flex flex-col transform hover:shadow-lg hover:-translate-y-1 transition-all duration-200" style={{ minWidth: 0 }}>
      <div className="relative w-full h-44 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
        <img src={(product.images && product.images[0]) || '/placeholder.jpg'} alt={product.name} className="w-full h-full object-cover" />
      </div>
      <h3 className="mt-3 text-sm font-medium line-clamp-2 text-gray-800">{product.name}</h3>
      <div className="mt-2 text-yellow-600 font-bold">{(product.finalPrice || 0).toLocaleString('vi-VN')}đ</div>

      <div className="mt-3">
        <button
          onClick={handleAdd}
          disabled={adding}
          aria-label={`Thêm ${product.name} vào giỏ`}
          className={`w-full text-center py-2 rounded-lg font-semibold transition disabled:opacity-60 ${adding ? 'bg-gray-300 text-gray-700' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}>
          {adding ? 'Đang thêm...' : 'Thêm'}
        </button>
      </div>
    </div>
  );
}

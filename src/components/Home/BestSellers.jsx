import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ShoppingCart, TrendingUp, Star } from 'lucide-react';
import { getBestSellers } from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useCartToast } from '../../hooks/CartAddNotifier';

function ProductCard({ product, onAdd, index }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await onAdd();
    } catch (err) {
      console.error('Add failed', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div 
      className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
      }}
    >
      {/* Trending Badge */}
      <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
        <TrendingUp size={12} />
        <span>HOT</span>
      </div>

      {/* Image Container */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-yellow-500 rounded-full animate-spin"></div>
          </div>
        )}
        <img 
          src={product.images?.[0] || '/placeholder.jpg'} 
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Overlay with Add Button */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={18} />
            {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </button>
        </div>

        {/* Rating & Sold Badge */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex flex-col items-end gap-0.5 shadow-lg">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-gray-800">{product.rating || 4.5}</span>
          </div>
          <span className="text-[10px] text-gray-500">Đã bán {product.soldQuantity || 0}</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-10 mb-2 group-hover:text-yellow-600 transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-yellow-600">
              {(product.finalPrice || 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
          
          {/* Quick Add Icon */}
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-10 h-10 bg-yellow-50 hover:bg-yellow-500 text-yellow-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Thêm ${product.name} vào giỏ`}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div className={`h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 transition-all duration-300 ${
        isHovered ? 'w-full' : 'w-0'
      }`}></div>
    </div>
  );
}

export default function BestSellers({ limit = 8, days = 90, autoPlay = true }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);
  const autoplayRef = useRef(null);
  const { addItem } = useCart();
  const toast = useCartToast();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getBestSellers({ limit, days })
      .then((res) => { if (!mounted) return; setItems(res.products || []); })
      .catch((err) => console.error('best sellers fetch', err))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [limit, days]);

  // Responsive items per page
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w >= 1280) setItemsPerPage(4);
      else if (w >= 1024) setItemsPerPage(3);
      else if (w >= 640) setItemsPerPage(2);
      else setItemsPerPage(1);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const maxIndex = Math.max(0, Math.ceil(items.length / itemsPerPage) - 1);

  const go = useCallback((to) => {
    const clamped = Math.max(0, Math.min(maxIndex, to));
    setIndex(clamped);
  }, [maxIndex]);

  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || items.length <= itemsPerPage) return;
    autoplayRef.current = setInterval(() => {
      setIndex(i => (i >= maxIndex ? 0 : i + 1));
    }, 4500);
    return () => clearInterval(autoplayRef.current);
  }, [autoPlay, items.length, itemsPerPage, maxIndex]);

  const handleMouseEnter = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  const handleMouseLeave = () => {
    if (!autoPlay || items.length <= itemsPerPage) return;
    autoplayRef.current = setInterval(() => setIndex(i => (i >= maxIndex ? 0 : i + 1)), 4500);
  };

  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        key: `${product._id}`,
        productId: product._id,
        qty: 1,
        quantity: 1,
        price: product.finalPrice || 0,
        finalPrice: product.finalPrice || 0,
        name: product.name,
        image: (product.images && product.images[0]) || '/placeholder.jpg',
        product: { _id: product._id, title: product.name, slug: product.slug },
      };
      await addItem(cartItem);
      
      // Show toast
      try {
        toast?.showAdded?.({
          image: (product.images && product.images[0]) || '/placeholder.jpg',
          name: product.name,
          price: product.finalPrice || 0,
          qty: 1,
          colorLabel: product.color || '',
          size: product.size || '',
        });
      } catch (e) {
        // ignore toast failures
      }
    } catch (err) {
      console.error('add to cart failed', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 font-medium">Đang tải sản phẩm bán chạy...</span>
        </div>
      </div>
    );
  }

  if (!items.length) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Sản phẩm bán chạy</h2>
              <p className="text-sm text-gray-500 mt-1">Top {limit} sản phẩm được yêu thích nhất</p>
            </div>
          </div>
        
        </div>

        {/* Carousel */}
        <div 
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave}
          className="relative"
        >
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {Array.from({ length: Math.ceil(items.length / itemsPerPage) }).map((_, slideIdx) => {
                const start = slideIdx * itemsPerPage;
                const slice = items.slice(start, start + itemsPerPage);
                return (
                  <div 
                    key={slideIdx} 
                    className="flex-shrink-0 w-full"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                      {slice.map((product, idx) => (
                        <ProductCard
                          key={product._id}
                          product={product}
                          index={idx}
                          onAdd={() => handleAddToCart(product)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          {maxIndex > 0 && (
            <>
              <button
                onClick={prev}
                disabled={index === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 bg-white hover:bg-yellow-500 disabled:bg-gray-100 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group disabled:cursor-not-allowed"
                aria-label="Previous"
              >
                <svg 
                  className="w-6 h-6 text-gray-800 group-hover:text-white group-disabled:text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={next}
                disabled={index === maxIndex}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 bg-white hover:bg-yellow-500 disabled:bg-gray-100 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 group disabled:cursor-not-allowed"
                aria-label="Next"
              >
                <svg 
                  className="w-6 h-6 text-gray-800 group-hover:text-white group-disabled:text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots */}
        {maxIndex > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(items.length / itemsPerPage) }).map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === index 
                    ? 'w-8 h-3 bg-gradient-to-r from-yellow-400 to-orange-500' 
                    : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

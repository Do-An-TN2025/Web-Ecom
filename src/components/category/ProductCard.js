const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <img 
        src={product?.images[0]} 
        alt={product.name}
        className="w-full h-64 object-cover rounded-md"
      />
      <h3 className="mt-4 font-semibold text-lg">{product.name}</h3>
      <div className="mt-2">
        {product.onSale ? (
          <>
            <span className="text-red-600 font-bold">
              ${product.discountPrice}
            </span>
            <span className="ml-2 text-gray-400 line-through">
              ${product.price}
            </span>
          </>
        ) : (
          <span className="font-bold">${product.price}</span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        {product.availableColors.map(color => (
          <div 
            key={color}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductCard;
const CategoryHeader = ({ category }) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{category?.name}</h1>
    </div>
  );
};

export default CategoryHeader;
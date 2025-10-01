const Breadcrumb = ({ category }) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 border-t py-4">
      <a href="/" className="hover:text-yellow-600">Trang chủ</a>
      <span>/</span>
      {category && (
        <>
          <span className="text-gray-900">{category.name}</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumb;
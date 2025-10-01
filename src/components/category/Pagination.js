import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  return (
    <div className="mt-8 flex justify-center gap-2">
      {[...Array(pagination.totalPages)].map((_, i) => (
        <button
          key={i}
          className={`px-4 py-2 rounded ${
            pagination.currentPage === i + 1
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
};

export default Pagination;
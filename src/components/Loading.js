import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
      <span className="ml-4 text-2xl font-semibold text-yellow-600">Chờ xíu nhé</span>
    </div>
  );
}
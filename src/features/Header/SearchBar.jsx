import { useState } from "react";
import { useIsMobile } from "../../hooks/useIsMobile"; 
import { Search, X } from "lucide-react";

export default function SearchBar({ onSearch, onFocus }) {
  const [term, setTerm] = useState("");
  const [showInput, setShowInput] = useState(false);
  const isMobile = useIsMobile();

  const handleChange = (e) => {
    const value = e.target.value;
    setTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setTerm("");
    onSearch("");
  };

  // Trường hợp mobile chỉ hiện icon
  if (isMobile && !showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <Search className="w-6 h-6 text-gray-700" />
      </button>
    );
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={term}
        onFocus={onFocus}
        onChange={handleChange}
        placeholder="Tìm sản phẩm..."
        className="w-full border border-gray-300 rounded-lg py-2 px-4 pr-10 focus:ring-2 focus:ring-gray-200 focus:outline-none"
        autoFocus={isMobile}
      />
      {term && (
        <button
          onClick={handleClear}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {isMobile && (
        <button
          onClick={() => setShowInput(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

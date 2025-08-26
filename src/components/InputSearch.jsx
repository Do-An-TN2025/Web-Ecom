import { Search } from "lucide-react";

const InputSearch = ({ placeholder = "Tìm kiếm...", onChange, value, className = "" }) => {
  return (
    <div className={`relative w-[200px] ${className}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-full border border-gray-300 px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
    </div>
  );
};

export default InputSearch;

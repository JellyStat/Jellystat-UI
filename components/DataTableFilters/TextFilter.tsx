import React, { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import FilterItem from "./FilterItem";
import { useDebounce } from "@/lib/hooks/useDebounce";

export default function TextFilter({
  keyName,
  value,
  onChange,
}: {
  keyName: string;
  value: string;
  onChange: (value: FilterItem | null) => void;
}) {
  const [query, setQuery] = useState(value);
  const debounced = useDebounce(query, 200);

  useEffect(() => {
    if (debounced.trim() === value.trim()) return; 
    
    if (debounced.trim() === "") {
      onChange(null);
    } else {
      onChange(new FilterItem(keyName, debounced.trim()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="relative flex items-center w-full group">
      {/* Left Search Icon */}
      <div className="absolute left-2.5 text-gray-500 group-focus-within:text-brand-cyan transition-colors pointer-events-none">
        <Search size={14} />
      </div>
      
      {/* Tailwind Input */}
      <input
        type="text"
        placeholder="Filter..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-surface/80 border border-transparent hover:border-border focus:border-brand-cyan rounded py-1.5 pl-8 pr-8 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all shadow-inner"
      />
      
      {/* Right Clear Icon (Only visible when there is text) */}
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-2 text-gray-500 hover:text-brand-rose transition-colors focus:outline-none"
          title="Clear filter"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
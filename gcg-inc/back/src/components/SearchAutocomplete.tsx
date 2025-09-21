import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, TrendingUp, X } from "lucide-react";

interface SearchSuggestion {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  basePrice: number;
  images?: Array<{ url: string; isPrimary?: boolean }>;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const POPULAR_SEARCHES = [
  'aviator sunglasses',
  'prescription glasses',
  'reading glasses',
  'luxury frames',
  'limited edition',
  'new arrivals'
];

const TRENDING_SEARCHES = [
  'vintage frames',
  'oversized sunglasses',
  'titanium frames',
  'polarized lenses'
];

export default function SearchAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search for eyewear, brands, styles..." 
}: SearchAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setSelectedIndex(-1);
    
    if (!value.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    timer.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/products/search?q=${encodeURIComponent(value)}&limit=6`
        );
        const data = await response.json();
        console.log('Search API response:', data);
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value]);

  const handleSearch = (searchTerm: string) => {
    onChange(searchTerm);
    
    // Add to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    const totalItems = suggestions.length + (value ? 0 : recentSearches.length + TRENDING_SEARCHES.length);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (suggestions.length > 0 && selectedIndex < suggestions.length) {
            // Navigate to product
            window.location.href = `/product/${suggestions[selectedIndex]._id}`;
          } else if (!value) {
            const allSuggestions = [...recentSearches, ...TRENDING_SEARCHES];
            const selectedTerm = allSuggestions[selectedIndex - suggestions.length];
            if (selectedTerm) handleSearch(selectedTerm);
          }
        } else {
          handleSearch(value);
        }
        break;
      case 'Escape':
        setOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const displaySuggestions = useMemo(() => {
    if (value && suggestions.length > 0) {
      return suggestions;
    }
    return [];
  }, [value, suggestions]);

  const showEmptyState = open && !value;
  const showNoResults = open && value && !loading && suggestions.length === 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dark/40" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-full border border-white/20 bg-white/10 py-3 pl-12 pr-12 text-dark placeholder:text-dark/50 backdrop-blur-sm focus:border-white/40 focus:bg-white/20 focus:outline-none transition-all"
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {value && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-2xl"
          >
            {/* Product Suggestions */}
            {displaySuggestions.length > 0 && (
              <div className="border-b border-white/10">
                <div className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-white/60">
                  Products
                </div>
                {displaySuggestions.map((suggestion, index) => {
                  const image = suggestion.images?.find(img => img.isPrimary)?.url || 
                    suggestion.images?.[0]?.url ||
                    `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100&h=100&fit=crop&sig=${suggestion._id}`;
                  
                  return (
                    <Link
                      key={suggestion._id}
                      to={`/product/${suggestion._id}`}
                      className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                        selectedIndex === index 
                          ? 'bg-white/10' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <img
                        src={image}
                        alt={suggestion.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {suggestion.name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          {suggestion.brand && (
                            <span className="uppercase tracking-wider">{suggestion.brand}</span>
                          )}
                          <span>•</span>
                          <span>{suggestion.category}</span>
                        </div>
                      </div>
                      <div className="text-lg font-light text-white">
                        ${suggestion.basePrice?.toFixed(2) || 'N/A'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {showNoResults && (
              <div className="px-4 py-8 text-center">
                <div className="text-white/60 mb-2">No products found for "{value}"</div>
                <div className="text-sm text-white/40">
                  Try different keywords or browse our collections
                </div>
              </div>
            )}

            {/* Empty State - Recent & Trending */}
            {showEmptyState && (
              <>
                {recentSearches.length > 0 && (
                  <div className="border-b border-white/10">
                    <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider text-white/60">
                      <Clock className="h-3 w-3" />
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className={`block w-full px-4 py-2 text-left transition-colors ${
                          selectedIndex === suggestions.length + index
                            ? 'bg-white/10'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <span className="text-white/80">{search}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 px-4 py-3 text-xs font-medium uppercase tracking-wider text-white/60">
                    <TrendingUp className="h-3 w-3" />
                    Trending Searches
                  </div>
                  {TRENDING_SEARCHES.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className={`block w-full px-4 py-2 text-left transition-colors ${
                        selectedIndex === suggestions.length + recentSearches.length + index
                          ? 'bg-white/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="text-white/80">{search}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



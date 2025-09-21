import { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Grid, List, SlidersHorizontal, X } from "lucide-react";
import { SimplePersistentCTAs } from "../components/PersistentCTAs";
import FiltersPanel, { type Filters } from "../components/FiltersPanel";
import ProductGrid, { type ProductItem } from "../components/ProductGrid";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { useTheme } from "../contexts/ThemeContext";

type ViewMode = 'grid' | 'list';

const collectionBanners = {
  sunglasses: {
    title: 'Sunglasses Collection',
    subtitle: 'Premium protection meets timeless style',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=1920&h=400&fit=crop',
    description: 'Discover our curated selection of luxury sunglasses, crafted for those who appreciate exceptional quality and distinctive design.'
  },
  optical: {
    title: 'Optical Collection',
    subtitle: 'Clear vision, refined elegance',
    image: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1920&h=400&fit=crop',
    description: 'Sophisticated optical frames that seamlessly blend functionality with high fashion aesthetics.'
  },
  'new-arrivals': {
    title: 'New Arrivals',
    subtitle: 'The latest in luxury eyewear',
    image: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=1920&h=400&fit=crop',
    description: 'Be the first to experience our newest designs, featuring cutting-edge materials and contemporary styling.'
  },
  heritage: {
    title: 'Heritage Collection',
    subtitle: 'Timeless classics, reimagined',
    image: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=1920&h=400&fit=crop',
    description: 'Celebrating decades of craftsmanship with designs that honor our rich heritage while embracing modern innovation.'
  },
  'limited-edition': {
    title: 'Limited Edition',
    subtitle: 'Exclusive designs for discerning collectors',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=400&fit=crop',
    description: 'Rare and exceptional pieces, available for a limited time to our most valued clientele.'
  }
};

export default function CollectionsPage() {
  const { theme } = useTheme();
  const { collection } = useParams();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({ 
    sort: searchParams.get('sort') || 'featured',
    category: collection || searchParams.get('category') || undefined,
    q: searchParams.get('q') || undefined
  });
  const [items, setItems] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const pageSize = 12;

  const collectionInfo = useMemo(() => {
    return collection ? collectionBanners[collection as keyof typeof collectionBanners] : null;
  }, [collection]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === false) return;
      params.set(k, String(v));
    });
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    
    fetch(`http://localhost:3000/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.items)) {
          setItems(data.items);
          setTotal(data.total ?? data.items.length);
        } else if (Array.isArray(data)) {
          setItems(data);
          setTotal(data.length);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'sort') return false;
      return value !== undefined && value !== '' && value !== false;
    }).length;
  }, [filters]);

  return (
    <div className={`${theme === 'dark' ? 'bg-dark/90 text-white' : 'bg-white text-black'} min-h-screen`}>
      {/* Collection Banner */}
      {collectionInfo && (
        <section className="relative h-96 w-full overflow-hidden">
          <img
            src={collectionInfo.image}
            alt={collectionInfo.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-4xl px-6">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl font-extralight tracking-tight mb-4"
              >
                {collectionInfo.title}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl font-light text-white/90 mb-6"
              >
                {collectionInfo.subtitle}
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-white/70 max-w-2xl mx-auto"
              >
                {collectionInfo.description}
              </motion.p>
            </div>
          </div>
        </section>
      )}
      <SimplePersistentCTAs />
      <main className="mx-auto max-w-7xl px-6 py-20">
        {/* Refined Header Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-extralight tracking-tight text-dark mb-4">
              {collection ? collectionInfo?.title || `${collection.charAt(0).toUpperCase() + collection.slice(1)} Collection` : 'All Products'}
            </h2>
            <p className="text-dark/70 max-w-2xl">
              {collection ? collectionInfo?.description || 'Discover our curated selection of premium eyewear.' : 'Browse our complete collection of luxury eyewear and accessories.'}
            </p>
          </motion.div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 max-w-md">
            <SearchAutocomplete 
              value={filters.q || ''} 
              onChange={(v) => setFilters((f) => ({ ...f, q: v }))}
              placeholder="Search luxury eyewear..."
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="hidden lg:flex rounded-lg border border-white/20 bg-white/5 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded p-2 transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded p-2 transition-colors ${
                  viewMode === 'list' ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 hover:bg-white/10"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-white text-black px-2 py-1 text-xs font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Results Count */}
            <div className="text-sm text-white/60 font-light tracking-wide">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                  Loading collection...
                </div>
              ) : (
                `${total.toLocaleString()} ${total === 1 ? 'piece' : 'pieces'} available`
              )}
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-12">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 backdrop-blur-sm">
                <FiltersPanel 
                  value={filters} 
                  onChange={(f) => { setFilters(f); setPage(1); }}
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div>
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="group">
                      <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-2xl mb-4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-white/10 rounded animate-pulse" />
                        <div className="h-6 bg-white/10 rounded w-24 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : items.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20"
                >
                  <div className="text-6xl text-white/10 mb-4">👓</div>
                  <h3 className="text-2xl font-light text-white/80 mb-2">No products found</h3>
                  <p className="text-white/60">Try adjusting your filters or search terms</p>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ProductGrid items={items} viewMode={viewMode} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination */}
            {total > pageSize && (
              <div className="mt-16 flex items-center justify-center gap-4">
                <button 
                  disabled={page === 1 || loading} 
                  onClick={() => setPage((p) => Math.max(1, p - 1))} 
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-3 font-light transition-all hover:bg-white/10 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.ceil(total / pageSize))].slice(Math.max(0, page - 3), page + 2).map((_, i) => {
                    const pageNum = Math.max(0, page - 3) + i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-12 w-12 rounded-full font-light transition-all ${
                          pageNum === page 
                            ? 'bg-white text-black shadow-lg' 
                            : 'border border-white/20 hover:bg-white/10 hover:border-white/40'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button 
                  disabled={page >= Math.ceil(total / pageSize) || loading} 
                  onClick={() => setPage((p) => p + 1)} 
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-3 font-light transition-all hover:bg-white/10 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="h-full w-80 bg-black border-r border-white/10 p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <FiltersPanel 
                value={filters} 
                onChange={(f) => { 
                  setFilters(f); 
                  setPage(1); 
                  setShowMobileFilters(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



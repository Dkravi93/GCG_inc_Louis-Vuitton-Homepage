import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Filter } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { CustomListbox } from "./CustomListbox";

export interface Filters {
  q?: string;
  category?: string;
  material?: string;
  gender?: string;
  style?: string;
  color?: string;
  featured?: boolean;
  onSale?: boolean;
  limitedEdition?: boolean;
  sort?: string;
}

interface FilterSection {
  title: string;
  key: keyof Filters;
  type: 'select' | 'checkbox';
  options?: { value: string; label: string }[];
}

const filterSections: FilterSection[] = [
  {
    title: 'Category',
    key: 'category',
    type: 'select',
    options: [
      { value: '', label: 'All Categories' },
      { value: 'sunglasses', label: 'Sunglasses' },
      { value: 'optical', label: 'Optical' },
      { value: 'accessories', label: 'Accessories' },
    ]
  },
  {
    title: 'Material',
    key: 'material',
    type: 'select',
    options: [
      { value: '', label: 'All Materials' },
      { value: 'acetate', label: 'Acetate' },
      { value: 'metal', label: 'Metal' },
      { value: 'titanium', label: 'Titanium' },
      { value: 'carbon-fiber', label: 'Carbon Fiber' },
    ]
  },
  {
    title: 'Gender',
    key: 'gender',
    type: 'select',
    options: [
      { value: '', label: 'All Genders' },
      { value: 'men', label: 'Men' },
      { value: 'women', label: 'Women' },
      { value: 'unisex', label: 'Unisex' },
    ]
  },
  {
    title: 'Style',
    key: 'style',
    type: 'select',
    options: [
      { value: '', label: 'All Styles' },
      { value: 'aviator', label: 'Aviator' },
      { value: 'wayfarer', label: 'Wayfarer' },
      { value: 'round', label: 'Round' },
      { value: 'cat-eye', label: 'Cat Eye' },
      { value: 'rectangular', label: 'Rectangular' },
    ]
  },
  {
    title: 'Color',
    key: 'color',
    type: 'select',
    options: [
      { value: '', label: 'All Colors' },
      { value: 'black', label: 'Black' },
      { value: 'brown', label: 'Brown' },
      { value: 'gold', label: 'Gold' },
      { value: 'silver', label: 'Silver' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
    ]
  },
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function FiltersPanel({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const [local, setLocal] = useState<Filters>(value);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['sort']));
  const { theme } = useTheme();
  
  useEffect(() => setLocal(value), [value]);

  function set<K extends keyof Filters>(key: K, val: Filters[K]) {
    const next = { ...local, [key]: val };
    setLocal(next);
    onChange(next);
  }

  function toggleSection(section: string) {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(section)) {
      newOpenSections.delete(section);
    } else {
      newOpenSections.add(section);
    }
    setOpenSections(newOpenSections);
  }

  function clearAllFilters() {
    const cleared: Filters = { sort: local.sort || 'featured' };
    setLocal(cleared);
    onChange(cleared);
  }

  const hasActiveFilters = Object.entries(local).some(([key, value]) => {
    if (key === 'sort' || key === 'q') return false;
    return value !== undefined && value !== '' && value !== false;
  });

  return (
    <aside className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-dark/60" />
          <h3 className="text-sm font-medium tracking-wide text-dark">FILTERS</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-dark/60 hover:text-dark underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('sort')}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-dark"
        >
          Sort by
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${
              openSections.has('sort') ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        <motion.div
          initial={false}
          animate={{ height: openSections.has('sort') ? 'auto' : 0 }}
          className={`${openSections.has('sort') ? 'overflow-visible' : 'overflow-hidden'}`}
        >
          <CustomListbox
              value={local.sort || 'featured'}
              onChange={(value) => set('sort', value || undefined)}
              options={sortOptions}
              className="w-full"
            />
        </motion.div>
      </div>

      {/* Filter Sections */}
      {filterSections.map((section) => (
        <div key={section.key} className="space-y-3">
          <button
            onClick={() => toggleSection(section.key)}
            className="flex w-full items-center justify-between text-left text-sm font-medium text-dark"
          >
            {section.title}
            <ChevronDown 
              className={`h-4 w-4 transition-transform ${
                openSections.has(section.key) ? 'rotate-180' : ''
              }`} 
            />
          </button>
          
          <motion.div
            initial={false}
            animate={{ height: openSections.has(section.key) ? 'auto' : 0 }}
            className={`${openSections.has(section.key) ? 'overflow-visible' : 'overflow-hidden'}`}
          >
            {section.type === 'select' && section.options && (
              <CustomListbox
                value={String(local[section.key] || '')}
                onChange={(value) => set(section.key, value || undefined)}
                options={section.options}
                className="w-full"
              />
            )}
          </motion.div> 
        </div>
      ))}

      {/* Special Filters */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('special')}
          className="flex w-full items-center justify-between text-left text-sm font-medium text-dark"
        >
          Special Collections
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${
              openSections.has('special') ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        <motion.div
          initial={false}
          animate={{ height: openSections.has('special') ? 'auto' : 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-sm text-dark/90 cursor-pointer hover:text-dark transition-colors">
              <input 
                type="checkbox" 
                checked={!!local.featured} 
                onChange={(e) => set('featured', e.target.checked)}
                className="rounded border-dark/20 bg-dark/5 text-dark focus:ring-dark/20 focus:ring-offset-0"
              />
              Featured Items
            </label>
            <label className="flex items-center gap-3 text-sm text-dark/90 cursor-pointer hover:text-dark transition-colors">
              <input 
                type="checkbox" 
                checked={!!local.onSale} 
                onChange={(e) => set('onSale', e.target.checked)}
                className="rounded border-dark/20 bg-dark/5 text-dark focus:ring-dark/20 focus:ring-offset-0"
              />
              On Sale
            </label>
            <label className="flex items-center gap-3 text-sm text-dark/90 cursor-pointer hover:text-dark transition-colors">
              <input 
                type="checkbox" 
                checked={!!local.limitedEdition} 
                onChange={(e) => set('limitedEdition', e.target.checked)}
                className="rounded border-dark/20 bg-dark/5 text-dark focus:ring-dark/20 focus:ring-offset-0"
              />
              Limited Edition
            </label>
          </div>
        </motion.div>
      </div>
    </aside>
  );
}

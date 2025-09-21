import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star, Eye } from "lucide-react";
import { useState } from "react";
import { useSetAtom } from "jotai";
import { addToCartAtom } from "../store/cart";


export interface ProductItem { 
  _id: string; 
  name: string; 
  basePrice: number;
  category: string;
  brand?: string;
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  featured?: boolean;
  onSale?: boolean;
  limitedEdition?: boolean;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  variants?: Array<{
    sku: string;
    color: string;
    size: string;
    stock: number;
  }>;
}

type ViewMode = 'grid' | 'list';

interface ProductGridProps {
  items: ProductItem[];
  viewMode?: ViewMode;
}

function ProductCard({ product, isListView = false }: { product: ProductItem; isListView?: boolean }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const addToCart = useSetAtom(addToCartAtom);

    const handleAddToCart = () => {
    if (!product || !inStock) return;
    
    addToCart({ 
      id: product._id, 
      name: product.name, 
      price: product.discount?.value || discountedPrice,
      quantity,
      variants: product?.variants?.map(v => v.sku) || [],
    });
  };

  
  const primaryImage = product.images?.find(img => img.isPrimary)?.url || 
    product.images?.[0]?.url || 
    `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop&sig=${product._id}`;
  
  const secondaryImage = product.images?.[1]?.url || 
    `https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&h=600&fit=crop&sig=${product._id}2`;
  
  const discountedPrice = product.discount
    ? product.discount.type === 'percentage'
      ? product.basePrice * (1 - product.discount.value / 100)
      : product.basePrice - product.discount.value
    : product.basePrice;
  
  const availableColors = product.variants?.reduce((colors, variant) => {
    if (!colors.includes(variant.color)) {
      colors.push(variant.color);
    }
    return colors;
  }, [] as string[]) || [];
  
  const inStock = product.variants?.some(v => v.stock > 0) ?? true;

  if (isListView) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group flex gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition-colors"
      >
        <div className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden">
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.limitedEdition && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 text-xs font-medium text-black">
              Limited
            </div>
          )}
          {product.onSale && product.discount && (
            <div className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
              -{product.discount.type === 'percentage' ? `${product.discount.value}%` : `$${product.discount.value}`}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              {product.brand && (
                <div className="text-sm text-white/60 uppercase tracking-wider mb-1">
                  {product.brand}
                </div>
              )}
              <Link 
                to={`/product/${product._id}`}
                className="text-xl font-light hover:text-white/80 transition-colors"
              >
                {product.name}
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              <Link
                to={`/product/${product._id}`}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          </div>
          
          <div className="text-sm text-white/60 mb-3">{product.category}</div>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-3">
              {product.onSale && product.discount ? (
                <>
                  <span className="text-2xl font-light">${discountedPrice.toFixed(2)}</span>
                  <span className="text-lg text-white/50 line-through">${product.basePrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-2xl font-light">${product.basePrice.toFixed(2)}</span>
              )}
            </div>
            
            {availableColors.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/60 mr-2">{availableColors.length} colors</span>
                {availableColors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                ))}
                {availableColors.length > 3 && (
                  <span className="text-xs text-white/60 ml-1">+{availableColors.length - 3}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              {inStock ? 'In Stock' : 'Out of Stock'}
            </div>
            
            <button 
              className="rounded-full bg-white px-6 py-2 text-sm font-medium text-black cursor-pointer transition-colors hover:bg-white/90 disabled:opacity-50"
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Link to={`/product/${product._id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-lg">
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
            onMouseEnter={() => setCurrentImageIndex(1)}
            onMouseLeave={() => setCurrentImageIndex(0)}
          />
          
          {/* Hover Secondary Image */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} - alternate view`}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                currentImageIndex === 1 ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            />
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Product Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.featured && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-white border border-white/10">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Featured
              </div>
            )}
            {product.limitedEdition && (
              <div className="rounded-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-black shadow-lg">
                Limited Edition
              </div>
            )}
            {product.onSale && product.discount && (
              <div className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                -{product.discount.type === 'percentage' ? `${product.discount.value}%` : `$${product.discount.value}`}
              </div>
            )}
          </div>
          
          {/* Quick Actions */}
          <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsWishlisted(!isWishlisted);
              }}
              className="rounded-full bg-black/60 backdrop-blur-sm p-2.5 text-white hover:bg-black/80 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-110"
              aria-label="Add to wishlist"
            >
              <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                // Add to cart logic here
              }}
              className="rounded-full bg-black/60 backdrop-blur-sm p-2.5 text-white hover:bg-black/80 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-110"
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>
          
          {/* Stock Status */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="rounded-lg bg-white/10 backdrop-blur px-4 py-2 text-sm font-medium">
                Out of Stock
              </div>
            </div>
          )}
        </div>
      </Link>
      
      {/* Product Info */}
      <div className="mt-6 space-y-3">
        {product.brand && (
          <div className="text-sm text-white/50 uppercase tracking-[0.2em] font-light">
            {product.brand}
          </div>
        )}
        
        <Link 
          to={`/product/${product._id}`}
          className="block text-lg font-light hover:text-white/80 transition-colors leading-tight"
        >
          {product.name}
        </Link>
        
        <div className="text-sm text-white/50 capitalize tracking-wide">{product.category}</div>
        
        {/* Colors */}
        {availableColors.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {availableColors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full border-2 border-white/20 hover:border-white/50 hover:scale-110 transition-all cursor-pointer shadow-sm"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
            </div>
            {availableColors.length > 4 && (
              <span className="text-xs text-white/50 font-light">+{availableColors.length - 4} more</span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-3 pt-1">
          {product.onSale && product.discount ? (
            <>
              <span className="text-2xl font-extralight tracking-tight">${discountedPrice.toFixed(2)}</span>
              <span className="text-base text-white/40 line-through font-light">${product.basePrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-2xl font-extralight tracking-tight">${product?.basePrice && product?.basePrice.toFixed(2)? product?.basePrice.toFixed(2) : 'N/A'}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductGrid({ items, viewMode = 'grid' }: ProductGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {items.map((product) => (
          <ProductCard key={product._id} product={product} isListView={true} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {items.map((product, index) => (
        <motion.div
          key={product._id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}

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
        className="group flex gap-6 rounded-2xl border border-border bg-card p-6 hover:shadow-lg transition-all"
      >
        <div className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden bg-muted">
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.limitedEdition && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 text-xs font-medium text-black shadow-sm">
              Limited
            </div>
          )}
          {product.onSale && product.discount && (
            <div className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground shadow-sm">
              -{product.discount.type === 'percentage' ? `${product.discount.value}%` : `$${product.discount.value}`}
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              {product.brand && (
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  {product.brand}
                </div>
              )}
              <Link 
                to={`/product/${product._id}`}
                className="text-xl font-light hover:text-primary transition-colors"
              >
                {product.name}
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="rounded-full border border-border bg-background p-2 hover:bg-muted transition-colors"
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
              <Link
                to={`/product/${product._id}`}
                className="rounded-full border border-border bg-background p-2 hover:bg-muted transition-colors"
                title="View details"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mb-3 capitalize">{product.category}</div>
          
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-3">
              {product.onSale && product.discount ? (
                <>
                  <span className="text-2xl font-light">${discountedPrice.toFixed(2)}</span>
                  <span className="text-lg text-muted-foreground/50 line-through">${product.basePrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-2xl font-light">${product.basePrice.toFixed(2)}</span>
              )}
            </div>
            
            {availableColors.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">{availableColors.length} colors</span>
                {availableColors.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                ))}
                {availableColors.length > 3 && (
                  <span className="text-xs text-muted-foreground ml-1">+{availableColors.length - 3}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className={`text-sm ${inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {inStock ? 'In Stock' : 'Out of Stock'}
            </div>
            
            <button 
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
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
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted border border-border shadow-sm transition-all hover:shadow-md">
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
              <div className="rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground shadow-lg">
                -{product.discount.type === 'percentage' ? `${product.discount.value}%` : `$${product.discount.value}`}
              </div>
            )}
          </div>
          
          {/* Hover Actions */}
          <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-10 flex flex-col gap-2">
             <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              className="w-full rounded-full bg-primary/95 backdrop-blur-md py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary transition-all active:scale-[0.98] border border-primary/10 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
          </div>

          {/* Top Right Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsWishlisted(!isWishlisted);
              }}
              className="rounded-full bg-background/80 backdrop-blur-md p-2.5 text-foreground hover:bg-background transition-all border border-border/50 shadow-sm hover:scale-105"
            >
              <Heart className={`h-4 w-4 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
            <Link
              to={`/product/${product._id}`}
              className="rounded-full bg-background/80 backdrop-blur-md p-2.5 text-foreground hover:bg-background transition-all border border-border/50 shadow-sm hover:scale-105"
            >
               <Eye className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
          
          {/* Stock Status */}
          {!inStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <div className="rounded-lg bg-card/90 border border-border backdrop-blur px-4 py-2 text-sm font-medium text-foreground">
                Out of Stock
              </div>
            </div>
          )}
        </div>
      </Link>
      
      {/* Product Info */}
      <div className="mt-4 space-y-2">
        {product.brand && (
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            {product.brand}
          </div>
        )}
        
        <Link 
          to={`/product/${product._id}`}
          className="block text-lg font-medium text-foreground hover:text-primary transition-colors leading-tight"
        >
          {product.name}
        </Link>
        
        <div className="text-sm text-muted-foreground capitalize">{product.category}</div>
        
        {/* Colors */}
        {availableColors.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex items-center -space-x-1.5">
              {availableColors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-5 h-5 rounded-full border border-background shadow-sm ring-1 ring-border/50"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
            </div>
            {availableColors.length > 4 && (
              <span className="text-xs text-muted-foreground font-medium">+{availableColors.length - 4}</span>
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          {product.onSale && product.discount ? (
            <>
              <span className="text-lg font-semibold tracking-tight text-foreground">${discountedPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">${product.basePrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-lg font-semibold tracking-tight text-foreground">${product?.basePrice && product?.basePrice.toFixed(2)? product?.basePrice.toFixed(2) : 'N/A'}</span>
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

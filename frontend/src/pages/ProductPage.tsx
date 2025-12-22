import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSetAtom } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Star, ArrowLeft, Truck, Shield, RotateCcw, Share2, Minus, Plus } from "lucide-react";
import { addToCartAtom } from "../store/cart";
import SEO from "../components/SEO";
import PersistentCTAs from "../components/PersistentCTAs";

interface ProductImage {
  url: string;
  alt: string;
  isPrimary?: boolean;
}

interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  price?: number;
  images?: string[];
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  basePrice: number;
  category: string;
  material?: string;
  style?: string;
  color?: string;
  brand?: string;
  featured?: boolean;
  onSale?: boolean;
  limitedEdition?: boolean;
  images?: ProductImage[];
  variants?: ProductVariant[];
  tags?: string[];
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  metadata?: {
    dimensions?: string;
    weight?: string;
    origin?: string;
    care?: string;
  };
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [zoomEnabled, setZoomEnabled] = useState(false);
  const addToCart = useSetAtom(addToCartAtom);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`http://localhost:3000/api/products/${id}`)
      .then((r) => r.json())
      .then(data => {
        setProduct(data);
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch((error) => {
        console.error('Error fetching product:', error);
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const images = product?.images || [
    {
      url: `https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop&sig=${id}`,
      alt: product?.name || 'Product image',
      isPrimary: true
    },
    {
      url: `https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&h=800&fit=crop&sig=${id}2`,
      alt: `${product?.name || 'Product'} - alternate view`
    },
    {
      url: `https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&h=800&fit=crop&sig=${id}3`,
      alt: `${product?.name || 'Product'} - detail view`
    }
  ];

  const discountedPrice = product && product.discount
    ? product.discount.type === 'percentage'
      ? product.basePrice * (1 - product.discount.value / 100)
      : product.basePrice - product.discount.value
    : product?.basePrice || 0;

  const availableColors = product?.variants?.reduce((colors, variant) => {
    if (!colors.includes(variant.color)) {
      colors.push(variant.color);
    }
    return colors;
  }, [] as string[]) || [];

  const inStock = selectedVariant?.stock && selectedVariant.stock > 0;
  const maxQuantity = selectedVariant?.stock || 1;

  const handleAddToCart = () => {
    if (!product || !inStock) return;
    
    addToCart({ 
      id: product._id, 
      name: product.name, 
      price: selectedVariant?.price || discountedPrice,
      quantity,
      variants: selectedVariant?.sku ? [selectedVariant.sku] : []
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href
      });
    } catch {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="max-h-screen bg-black">
        <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl px-6 py-20">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="h-4 w-24 bg-white/10 rounded mb-4"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <div className="aspect-square bg-white/10 rounded-2xl mb-4"></div>
                <div className="flex gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-white/10 rounded-xl"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 w-3/4 bg-white/10 rounded"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                <div className="h-6 w-1/4 bg-white/10 rounded"></div>
                <div className="h-12 w-full bg-white/10 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👓</div>
          <h2 className="text-2xl font-light mb-2">Product not found</h2>
          <p className=" mb-8">The product you're looking for doesn't exist.</p>
          <Link 
            to="/collections" 
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${product.name} | Luxury Eyewear`}
        description={product.description || `Discover the ${product.name} - premium ${product.category} from ${product.brand || 'our luxury collection'}.`}
        image={images[0]?.url}
      />
      
      <div className="min-h-screen">
        {/* Breadcrumb & Back Navigation */}
        <div className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl px-6 py-8  mt-16">
          <div className="flex items-center gap-4 text-sm">
            <Link to="/collections" className="flex items-center gap-2 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Collections
            </Link>
            <span>/</span>
            <span className="capitalize">{product.category}</span>
            <span>/</span>
            <span className="">{product.name}</span>
          </div>
        </div>

        <main className="mx-auto max-w-[90%] 2xl:max-w-screen-2xl px-6 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Product Images */}
            <div>
              <div className="relative aspect-square mb-6 group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800"
                  >
                    <img
                      src={images[activeImageIndex]?.url}
                      alt={images[activeImageIndex]?.alt}
                      className={`h-full w-full object-cover transition-transform duration-700 ${
                        zoomEnabled ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-105'
                      }`}
                      onClick={() => setZoomEnabled(!zoomEnabled)}
                    />
                  </motion.div>
                </AnimatePresence>
                
                {/* Product Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.featured && (
                    <div className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 text-xs font-medium border border-white/10">
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
                    <div className="rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1.5 text-xs font-semibold shadow-lg">
                      -{product.discount.type === 'percentage' ? `${product.discount.value}%` : `$${product.discount.value}`}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex flex-col gap-3">
                  <button
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="rounded-full bg-black/60 backdrop-blur-sm p-3 hover:bg-black/80 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-110"
                    aria-label="Add to wishlist"
                  >
                    <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="rounded-full bg-black/60 backdrop-blur-sm p-3 hover:bg-black/80 transition-all duration-200 border border-white/10 hover:border-white/20 hover:scale-110"
                    aria-label="Share product"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative flex-shrink-0 aspect-square w-20 h-20 rounded-xl overflow-hidden transition-all duration-200 ${
                      index === activeImageIndex 
                        ? 'ring-2 ring-white shadow-lg scale-105' 
                        : 'hover:scale-105 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-8">
              {/* Brand & Title */}
              <div>
                {product.brand && (
                  <div className="text-sm uppercase tracking-[0.2em] font-light mb-3">
                    {product.brand}
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-extralight leading-tight mb-4">
                  {product.name}
                </h1>
                <div className="capitalize tracking-wide">{product.category}</div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                {product.onSale && product.discount ? (
                  <>
                    <span className="text-3xl font-extralight tracking-tight">${discountedPrice.toFixed(2)}</span>
                    <span className="text-xl line-through font-light">${product.basePrice.toFixed(2)}</span>
                  </>
                ) : (
                  <span className="text-3xl font-extralight tracking-tight">${product.basePrice.toFixed(2)}</span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="leading-relaxed">
                  {product.description}
                </div>
              )}

              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-wider mb-4">Available Colors</h3>
                  <div className="flex items-center gap-3">
                    {availableColors.map((color, index) => (
                      <button
                        key={index}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-all ${
                          selectedVariant?.color === color 
                            ? 'border-white shadow-lg scale-110' 
                            : 'border-white/20 hover:border-white/40'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                        onClick={() => {
                          const variant = product.variants?.find(v => v.color === color);
                          if (variant) setSelectedVariant(variant);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <h3 className="text-sm font-medium uppercase tracking-wider mb-4">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-white/20 rounded-full">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-white/10 transition-colors rounded-l-full"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-3 min-w-[60px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="p-3 hover:bg-white/10 transition-colors rounded-r-full"
                      disabled={quantity >= maxQuantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedVariant && (
                    <div className="text-sm">
                      {selectedVariant.stock} in stock
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="w-full border flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-full font-medium text-lg transition-all hover:bg-white/90 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
                
                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs">Free Shipping</div>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs">Warranty</div>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-xs">Easy Returns</div>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-6">
                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-lg font-light mb-4">Product Details</h3>
                  <div className="space-y-3">
                    {product.material && (
                      <div className="flex justify-between">
                        <span>Material:</span>
                        <span className="capitalize">{product.material}</span>
                      </div>
                    )}
                    {product.style && (
                      <div className="flex justify-between">
                        <span className="">Style:</span>
                        <span className="capitalize">{product.style}</span>
                      </div>
                    )}
                    {product.metadata?.dimensions && (
                      <div className="flex justify-between">
                        <span className="">Dimensions:</span>
                        <span>{product.metadata.dimensions}</span>
                      </div>
                    )}
                    {product.metadata?.weight && (
                      <div className="flex justify-between">
                        <span className="">Weight:</span>
                        <span>{product.metadata.weight}</span>
                      </div>
                    )}
                    {product.metadata?.origin && (
                      <div className="flex justify-between">
                        <span className="">Made in:</span>
                        <span>{product.metadata.origin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-light mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Care Instructions */}
                {product.metadata?.care && (
                  <div>
                    <h3 className="text-lg font-light mb-4">Care Instructions</h3>
                    <p className="">{product.metadata.care}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        
        {/* Persistent CTAs */}
        <PersistentCTAs 
          productId={product._id}
          productName={product.name}
          productPrice={selectedVariant?.price || discountedPrice}
          isInStock={!!inStock}
          onAddToCart={handleAddToCart}
        />
      </div>
    </>
  );
}



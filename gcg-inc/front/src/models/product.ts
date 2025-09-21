import { Schema, model, Document, Model } from 'mongoose';

// Type Definitions
export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  price?: number; // Optional override of base price
  images?: string[]; // Optional variant-specific images
}

export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  variants?: string[]; // Array of variant SKUs this image is associated with
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  startDate?: Date;
  endDate?: Date;
  minQuantity?: number;
  maxQuantity?: number;
}

interface IProductModel extends Model<ProductDocument> {
  findByVariantSku(sku: string): Promise<ProductDocument | null>;
  updateVariantStock(sku: string, quantity: number): Promise<ProductDocument>;
}

export interface ProductDocument extends Document {
  id?: string;
  name: string;
  description?: string;
  basePrice: number;
  category: string;
  material?: string;
  gender?: 'men' | 'women' | 'unisex';
  style?: string;
  brand?: string;
  featured?: boolean;
  onSale?: boolean;
  limitedEdition?: boolean;
  hidden?: boolean;
  launchAt?: Date;
  discontinuedAt?: Date;
  tags?: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  collections?: Schema.Types.ObjectId[];
  discount?: Discount;
  metadata?: {
    [key: string]: any;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const productVariantSchema = new Schema({
  sku: { type: String, required: true, unique: true, index: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  price: Number,
  images: [String],
}, { _id: false });

const productImageSchema = new Schema({
  url: { type: String, required: true },
  alt: String,
  isPrimary: { type: Boolean, default: false },
  variants: [String], // References variant SKUs
}, { _id: false });

const discountSchema = new Schema({
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  startDate: Date,
  endDate: Date,
  minQuantity: Number,
  maxQuantity: Number,
}, { _id: false });

const productSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    description: String,
    basePrice: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    material: { type: String, index: true },
    gender: { type: String, enum: ['men', 'women', 'unisex'], index: true },
    style: { type: String, index: true },
    brand: { type: String, index: true },
    featured: { type: Boolean, default: false, index: true },
    onSale: { type: Boolean, default: false, index: true },
    limitedEdition: { type: Boolean, default: false, index: true },
    hidden: { type: Boolean, default: false, index: true },
    launchAt: { type: Date, index: true },
    discontinuedAt: Date,
    tags: [{ type: String }],
    images: [productImageSchema],
    variants: [productVariantSchema],
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection', index: true }],
    discount: discountSchema,
    metadata: { type: Map, of: Schema.Types.Mixed },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function (this: ProductDocument) {
  const variantsArray = Array.isArray(this.variants) ? this.variants : [];
  return variantsArray.some((variant) => variant.stock > 0);
});


// Virtual for total stock across all variants
productSchema.virtual('totalStock').get(function(this: ProductDocument) {
  const variantsArray = Array.isArray(this.variants) ? this.variants : [];
  return variantsArray.reduce((total, variant) => total + variant.stock, 0);
});

// Virtual for lowest variant price
productSchema.virtual('lowestPrice').get(function(this: ProductDocument) {
  const variantsArray = Array.isArray(this.variants) ? this.variants : [];
  const variantPrices = variantsArray
    .map(v => v.price || this.basePrice)
    .filter(price => price > 0);
  return Math.min(...variantPrices, this.basePrice);
});

// Virtual for highest variant price
productSchema.virtual('highestPrice').get(function(this: ProductDocument) {
  const variantsArray = Array.isArray(this.variants) ? this.variants : [];
  const variantPrices = variantsArray
    .map(v => v.price || this.basePrice)
    .filter(price => price > 0);
  return Math.max(...variantPrices, this.basePrice);
});

// Index for text search
productSchema.index(
  { 
    name: 'text', 
    description: 'text', 
    'variants.sku': 'text',
    tags: 'text',
    brand: 'text'
  }, 
  {
    weights: {
      name: 10,
      'variants.sku': 5,
      brand: 3,
      description: 1,
      tags: 1
    }
  }
);

// Compound indexes for common queries
productSchema.index({ category: 1, gender: 1 });
productSchema.index({ onSale: 1, hidden: 1 });
productSchema.index({ featured: 1, hidden: 1 });
productSchema.index({ 'variants.color': 1, 'variants.size': 1 });
productSchema.index({ 'variants.stock': 1 });

// Static methods
productSchema.statics.findByVariantSku = function(sku: string) {
  return this.findOne({ 'variants.sku': sku });
};

productSchema.statics.updateVariantStock = async function(sku: string, quantity: number) {
  const product = await this.findOne({ 'variants.sku': sku });
  if (!product) throw new Error('Product variant not found');

  const   variant = product.variants.find((v: ProductVariant) => v.sku === sku);
  if (!variant) throw new Error('Variant not found');

  if (variant.stock + quantity < 0) {
    throw new Error('Insufficient stock');
  }

  variant.stock += quantity;
  return product.save();
};

export const ProductModel = model<ProductDocument, IProductModel>('Product', productSchema);
export { ProductModel as Product }; // For backward compatibility

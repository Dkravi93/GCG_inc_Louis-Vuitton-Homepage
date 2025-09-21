import mongoose from 'mongoose';

export interface ICollection {
  name: string;
  description: string;
  image: string;
  banner?: string;
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  startDate?: Date;
  endDate?: Date;
  metadata: {
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new mongoose.Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Collection description is required'],
    },
    image: {
      type: String,
      required: [true, 'Collection image is required'],
    },
    banner: {
      type: String,
    },
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    startDate: Date,
    endDate: Date,
    metadata: {
      seoTitle: String,
      seoDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
collectionSchema.index({ name: 'text', 'metadata.keywords': 'text' });
collectionSchema.index({ isActive: 1, isFeatured: 1 });
collectionSchema.index({ displayOrder: 1 });

// Virtual for collection URL
collectionSchema.virtual('url').get(function() {
  return `/collections/${this._id}`;
});

// Validate end date is after start date
collectionSchema.pre('save', function(next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

export const Collection = mongoose.model<ICollection>('Collection', collectionSchema);
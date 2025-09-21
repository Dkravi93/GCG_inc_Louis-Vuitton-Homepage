import mongoose from 'mongoose';

export interface IOrder {
  user: mongoose.Types.ObjectId;
  items: {
    product: mongoose.Types.ObjectId;
    variant: {
      color: string;
      size: string;
      sku: string;
    };
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment: {
    method: 'credit_card' | 'debit_card' | 'paypal' | 'upi' | 'net_banking' | 'wallet';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    payuPaymentId?: string;
    payuOrderId?: string;
    gateway?: 'payu';
    gatewayResponse?: any;
  };
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      variant: {
        color: String,
        size: String,
        sku: String,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
      },
      price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
      },
    }],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    billingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ['credit_card', 'debit_card', 'paypal', 'upi', 'net_banking', 'wallet'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: String,
      payuPaymentId: String,
      payuOrderId: String,
      gateway: {
        type: String,
        enum: ['payu'],
        default: 'payu'
      },
      gatewayResponse: mongoose.Schema.Types.Mixed,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

// Virtual for order number (formatted ID)
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
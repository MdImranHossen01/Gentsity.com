import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISizeStock {
  size: string;
  stock: number;
}

export interface IComboProduct extends Document {
  category: 'polo' | 'pajama' | 'sneakers';
  name: string;
  productKind: 'single' | 'combo';
  price: number;
  salePrice?: number;
  colorName?: string;
  colorHex?: string;
  imageUrl?: string;
  sizeStock: ISizeStock[];
  isActive: boolean;
  sortOrder: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SizeStockSchema = new Schema(
  {
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

const ComboProductSchema: Schema<IComboProduct> = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ['polo', 'pajama', 'sneakers'],
      index: true,
    },
    name: { type: String, required: true },
    productKind: {
      type: String,
      enum: ['single', 'combo'],
      default: 'combo',
    },
    price: { type: Number, required: true, default: 0 },
    salePrice: { type: Number },
    colorName: { type: String },
    colorHex: { type: String },
    imageUrl: { type: String },
    sizeStock: [SizeStockSchema],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    description: { type: String },
  },
  { timestamps: true }
);

const ComboProduct: Model<IComboProduct> =
  mongoose.models.ComboProduct ||
  mongoose.model<IComboProduct>('ComboProduct', ComboProductSchema);

export default ComboProduct;

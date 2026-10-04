import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOfferSettings extends Document {
  combo_price: number;
  combo_qty: number;
  polo_free_delivery: 'on' | 'off';
  polo_delivery_charge_dhaka: number;
  polo_delivery_charge_outside: number;
  pajama_free_delivery: 'on' | 'off';
  pajama_delivery_charge_dhaka: number;
  pajama_delivery_charge_outside: number;
  sneakers_free_delivery: 'on' | 'off';
  sneakers_delivery_charge_dhaka: number;
  sneakers_delivery_charge_outside: number;
  whatsapp_number: string;
  whatsapp_message: string;
  updatedAt: Date;
}

const OfferSettingsSchema: Schema<IOfferSettings> = new Schema(
  {
    combo_price: { type: Number, default: 999 },
    combo_qty: { type: Number, default: 5 },
    polo_free_delivery: { type: String, enum: ['on', 'off'], default: 'on' },
    polo_delivery_charge_dhaka: { type: Number, default: 80 },
    polo_delivery_charge_outside: { type: Number, default: 150 },
    pajama_free_delivery: { type: String, enum: ['on', 'off'], default: 'off' },
    pajama_delivery_charge_dhaka: { type: Number, default: 70 },
    pajama_delivery_charge_outside: { type: Number, default: 120 },
    sneakers_free_delivery: { type: String, enum: ['on', 'off'], default: 'off' },
    sneakers_delivery_charge_dhaka: { type: Number, default: 80 },
    sneakers_delivery_charge_outside: { type: Number, default: 130 },
    whatsapp_number: { type: String, default: '8801700000000' },
    whatsapp_message: { type: String, default: 'হ্যালো Gentsity, আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।' },
  },
  { timestamps: true }
);

const OfferSettings: Model<IOfferSettings> =
  mongoose.models.OfferSettings ||
  mongoose.model<IOfferSettings>('OfferSettings', OfferSettingsSchema);

export default OfferSettings;

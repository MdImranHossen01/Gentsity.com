/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import ComboProduct from '@/models/ComboProduct';
import Product from '@/models/Product';
import mongoose from 'mongoose';

// Generates short unique ID like GEN-123456
function generateShortId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `GEN-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const { fullName, phone, address, items, totalAmount, deliveryCharge = 0, offerType = 'combo' } = body;

    // 1. Validation
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ message: 'আপনার নাম প্রদান করুন।' }, { status: 400 });
    }
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      return NextResponse.json({ message: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' }, { status: 400 });
    }
    if (!address || address.trim().length < 5) {
      return NextResponse.json({ message: 'আপনার সম্পূর্ণ ঠিকানা প্রদান করুন।' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'কমপক্ষে একটি প্রোডাক্ট সিলেক্ট করুন।' }, { status: 400 });
    }

    // 2. Anti-spam check: prevent duplicate order with same phone within 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existingRecent = await Order.findOne({
      'shippingAddress.phone': cleanPhone,
      createdAt: { $gte: fifteenMinsAgo }
    });
    if (existingRecent) {
      return NextResponse.json({
        message: 'আপনি ইতিমধ্যে একটি অর্ডার করেছেন। ১৫ মিনিট পর আবার অর্ডার করতে পারবেন।'
      }, { status: 429 });
    }

    // 3. Fallback product ID for Order schema requirement
    let fallbackProduct = await Product.findOne({ isPublished: true }).select('_id');
    if (!fallbackProduct) {
      fallbackProduct = await Product.create({
        name: 'Gentsity Combo Offer',
        slug: `gentsity-combo-offer-${Date.now()}`,
        description: 'Special Landing Page Combo Offer',
        price: totalAmount || 999,
        sku: `GEN-COMBO-${Date.now()}`,
        stock: 9999,
        isPublished: true,
      });
    }

    // 4. Format items and deduct stock
    const orderItems = [];
    for (const it of items) {
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const price = Number(it.price) || 0;
      
      // Stock deduction if comboId is given
      if (it.comboId && mongoose.Types.ObjectId.isValid(it.comboId)) {
        try {
          const combo = await ComboProduct.findById(it.comboId);
          if (combo && combo.sizeStock) {
            const stockEntry = combo.sizeStock.find((s: any) => s.size === it.size);
            if (stockEntry) {
              stockEntry.stock = Math.max(0, stockEntry.stock - quantity);
              await combo.save();
            }
          }
        } catch (stockErr) {
          console.warn('Could not decrement combo stock:', stockErr);
        }
      }

      orderItems.push({
        product: fallbackProduct._id,
        name: it.name || `${offerType} item`,
        quantity,
        price,
        image: it.image || '',
        color: it.color || '',
        size: it.size || '',
      });
    }

    // 5. Create Order
    let shortId = generateShortId();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      attempts++;
      const existing = await Order.findOne({ shortId });
      if (!existing) {
        isUnique = true;
      } else {
        shortId = generateShortId();
      }
    }

    const calculatedTotal = Number(totalAmount) || (orderItems.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0) + Number(deliveryCharge));

    const order = await Order.create({
      shortId,
      items: orderItems,
      totalAmount: calculatedTotal,
      deliveryCharge: Number(deliveryCharge) || 0,
      shippingAddress: {
        fullName: fullName.trim(),
        phone: cleanPhone,
        street: address.trim(),
        city: 'Bangladesh',
        state: 'Bangladesh',
        division: 'Bangladesh',
        zipCode: '0000',
        country: 'Bangladesh',
      },
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      status: 'Order Placed',
      internalNote: `Landing Page Combo: ${offerType}`,
    });

    return NextResponse.json({
      success: true,
      orderNo: order.shortId,
      orderId: order._id,
      total: order.totalAmount,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error placing combo order:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
  }
}

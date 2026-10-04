require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://hkstwbnugbbaypnhpqyy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pGa5LmogmBTzzT76H_j6pA_cbm7AEL2';

const imageDir = path.join(__dirname, '../public/images/combos');
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

async function getSignedUrl(storagePath) {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/products/${storagePath}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ expiresIn: 3600 })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
  } catch (err) {
    return null;
  }
}

async function downloadImage(storagePath, fallbackName) {
  if (!storagePath) return '';
  const safeFilename = (storagePath.replace(/\//g, '_')).replace(/[^a-zA-Z0-9._-]/g, '');
  const localFilePath = path.join(imageDir, safeFilename);
  const publicUrl = `/images/combos/${safeFilename}`;

  if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).size > 500) {
    return publicUrl;
  }

  const signedUrl = await getSignedUrl(storagePath);
  if (!signedUrl) return '';

  try {
    const res = await fetch(signedUrl);
    if (!res.ok) return '';
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(localFilePath, Buffer.from(arrayBuffer));
    return publicUrl;
  } catch (err) {
    console.warn('Failed to download image:', storagePath, err.message);
    return '';
  }
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY
  };

  // 1. Fetch Supabase Data
  console.log('Fetching Supabase products...');
  const poloRes = await fetch(`${SUPABASE_URL}/rest/v1/product_variants?product_type=eq.polo&select=*`, { headers });
  const poloVariants = await poloRes.json();

  const pajamaRes = await fetch(`${SUPABASE_URL}/rest/v1/pajama_products?select=*,pajama_product_stock(*)`, { headers });
  const pajamaProducts = await pajamaRes.json();

  console.log(`Fetched ${poloVariants.length} Polo variants, ${pajamaProducts.length} Pajama/Sneakers products.`);

  const ComboProduct = mongoose.models.ComboProduct || mongoose.model('ComboProduct', new mongoose.Schema({
    category: String,
    name: String,
    productKind: String,
    price: Number,
    salePrice: Number,
    colorName: String,
    colorHex: String,
    imageUrl: String,
    sizeStock: [{ size: String, stock: Number }],
    isActive: Boolean,
    sortOrder: Number,
    description: String,
  }, { timestamps: true }));

  const OfferSettings = mongoose.models.OfferSettings || mongoose.model('OfferSettings', new mongoose.Schema({
    combo_price: Number,
    combo_qty: Number,
    polo_free_delivery: String,
    polo_delivery_charge_dhaka: Number,
    polo_delivery_charge_outside: Number,
    pajama_free_delivery: String,
    pajama_delivery_charge_dhaka: Number,
    pajama_delivery_charge_outside: Number,
    sneakers_free_delivery: String,
    sneakers_delivery_charge_dhaka: Number,
    sneakers_delivery_charge_outside: Number,
    whatsapp_number: String,
    whatsapp_message: String,
  }, { timestamps: true }));

  // 2. Seed Settings
  console.log('Saving OfferSettings...');
  await OfferSettings.deleteMany({});
  await OfferSettings.create({
    combo_price: 999,
    combo_qty: 5,
    polo_free_delivery: 'on',
    polo_delivery_charge_dhaka: 80,
    polo_delivery_charge_outside: 150,
    pajama_free_delivery: 'off',
    pajama_delivery_charge_dhaka: 70,
    pajama_delivery_charge_outside: 120,
    sneakers_free_delivery: 'off',
    sneakers_delivery_charge_dhaka: 80,
    sneakers_delivery_charge_outside: 130,
    whatsapp_number: '8801700000000',
    whatsapp_message: 'হ্যালো Gentsity, আমি একটি প্রোডাক্ট সম্পর্কে জানতে চাই।',
  });

  // 3. Clear existing combos to replace with authentic seed data
  await ComboProduct.deleteMany({});
  console.log('Cleared existing ComboProduct collection.');

  // 4. Seed Polo Variants
  console.log('Seeding Polo variants...');
  let poloInserted = 0;
  for (const v of poloVariants) {
    let localImg = '';
    if (v.image_url) {
      localImg = await downloadImage(v.image_url);
    }

    await ComboProduct.create({
      category: 'polo',
      name: v.color_name || `পোলো শার্ট (${v.size})`,
      productKind: 'combo',
      price: 999,
      colorName: v.color_name || '',
      colorHex: v.color_hex || '#000000',
      imageUrl: localImg,
      sizeStock: [{ size: v.size, stock: v.stock || 10 }],
      isActive: v.is_active !== false,
      sortOrder: v.sort_order || 0,
    });
    poloInserted++;
    if (poloInserted % 15 === 0) {
      console.log(`Downloaded & seeded ${poloInserted}/${poloVariants.length} Polo variants...`);
    }
  }

  // 5. Seed Pajama & Sneakers
  console.log('Seeding Pajama & Sneakers products...');
  for (const p of pajamaProducts) {
    let localImg = '';
    if (p.image_url) {
      localImg = await downloadImage(p.image_url);
    }

    const category = p.page === 'sneakers' ? 'sneakers' : 'pajama';
    const sizeStock = (p.pajama_product_stock || []).map(s => ({
      size: s.size,
      stock: s.stock || 50
    }));

    await ComboProduct.create({
      category,
      name: p.name,
      productKind: p.product_kind || 'single',
      price: p.price || (category === 'sneakers' ? 1250 : 990),
      imageUrl: localImg,
      sizeStock,
      isActive: p.is_active !== false,
      sortOrder: p.sort_order || 0,
    });
    console.log(`Seeded [${category}] ${p.name}`);
  }

  console.log('DONE! All products and settings seeded successfully into MongoDB.');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read .env.local file to get MONGODB_URI
const envPath = path.join(__dirname, '../.env.local');
let mongodbUri = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  if (match && match[1]) {
    mongodbUri = match[1].trim().replace(/['"]/g, '');
  }
}

if (!mongodbUri) {
  mongodbUri = 'mongodb+srv://gentsity:xI2QuBaFZsYQ5vRD@cluster0.e5n1hnl.mongodb.net/gentsity';
}

console.log('Connecting to MongoDB...');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
});
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  purchasePrice: { type: Number },
  discountRate: { type: Number },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, required: true, default: 0 },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  tags: [{ type: String }],
  images: [{ type: String }],
  attributes: [
    {
      key: { type: String },
      value: { type: String },
    },
  ],
  isFeatured: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const productsData = [
  // ==================== Category 1: T-Shirt ====================
  {
    name: 'Crewneck White Cotton T-Shirt',
    slug: 'crewneck-white-cotton-tshirt',
    description: 'A premium-grade, ultra-soft classic crewneck t-shirt made from 100% organic combed cotton. Features double-needle stitching on the neckline and sleeves for maximum durability, breathability, and everyday comfort.',
    price: 690,
    salePrice: 490,
    discountRate: 29,
    purchasePrice: 250,
    stock: 120,
    sku: 'GS-TS-W01',
    categorySlug: 't-shirt',
    images: ['/assets/images/products/crewneck-white-cotton-tshirt.webp'],
    tags: ['white t-shirt', 'crewneck', 'cotton t-shirt', 'casual wear'],
    attributes: [{ key: 'Color', value: 'White' }, { key: 'Material', value: '100% Combed Cotton' }, { key: 'GSM', value: '180' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'Classic Black Cotton T-Shirt',
    slug: 'classic-black-cotton-tshirt',
    description: 'Essential solid black crewneck t-shirt. Tailored from pre-shrunk, breathable 100% cotton fabric. Maintains its deep black shade and structured fit even after multiple washes.',
    price: 690,
    purchasePrice: 250,
    stock: 150,
    sku: 'GS-TS-B02',
    categorySlug: 't-shirt',
    images: ['/assets/images/products/classic-black-cotton-tshirt.webp'],
    tags: ['black t-shirt', 'classic t-shirt', 'basic tee'],
    attributes: [{ key: 'Color', value: 'Black' }, { key: 'Material', value: '100% Combed Cotton' }, { key: 'GSM', value: '180' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: false
  },
  {
    name: 'Olive Green Streetwear T-Shirt',
    slug: 'olive-green-streetwear-tshirt',
    description: 'An oversized, modern streetwear t-shirt in a stylish olive green shade. Features dropped shoulders, a relaxed fit, and a heavy-knit finish ideal for modern urban fashion lovers.',
    price: 850,
    salePrice: 650,
    discountRate: 23,
    purchasePrice: 300,
    stock: 90,
    sku: 'GS-TS-G03',
    categorySlug: 't-shirt',
    images: ['/assets/images/products/olive-green-streetwear-tshirt.webp'],
    tags: ['streetwear', 'olive green', 'oversized t-shirt', 'trendy'],
    attributes: [{ key: 'Color', value: 'Olive Green' }, { key: 'Style', value: 'Oversized Fit' }, { key: 'GSM', value: '220' }],
    isFeatured: false,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'Charcoal Grey Heather T-Shirt',
    slug: 'charcoal-grey-heather-tshirt',
    description: 'Crafted from premium heathered cotton-poly blend, this charcoal grey t-shirt offers a textured look and athletic feel. Lightweight, moisture-wicking, and perfect for active routines.',
    price: 750,
    purchasePrice: 280,
    stock: 100,
    sku: 'GS-TS-H04',
    categorySlug: 't-shirt',
    images: ['/assets/images/products/charcoal-grey-heather-tshirt.webp'],
    tags: ['charcoal grey', 'heather tee', 'sportswear', 'lightweight'],
    attributes: [{ key: 'Color', value: 'Charcoal Grey Heather' }, { key: 'Material', value: '80% Cotton / 20% Polyester' }, { key: 'GSM', value: '170' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Navy Blue Slim Fit T-Shirt',
    slug: 'navy-blue-slim-fit-tshirt',
    description: 'A body-hugging, slim-fit t-shirt in deep navy blue. Engineered from high-stretch combed cotton to accentuate your build while offering supreme softness.',
    price: 700,
    salePrice: 550,
    discountRate: 21,
    purchasePrice: 260,
    stock: 110,
    sku: 'GS-TS-N05',
    categorySlug: 't-shirt',
    images: ['/assets/images/products/navy-blue-slim-fit-tshirt.webp'],
    tags: ['navy blue', 'slim fit', 'stretch tee', 'premium cotton'],
    attributes: [{ key: 'Color', value: 'Navy Blue' }, { key: 'Fit', value: 'Slim Fit' }, { key: 'GSM', value: '180' }],
    isFeatured: true,
    isNewArrival: false,
    isFlashSale: true
  },

  // ==================== Category 2: Polo-Shirt ====================
  {
    name: 'Royal Blue Pique Polo',
    slug: 'royal-blue-pique-polo',
    description: 'Classic fit polo shirt featuring high-quality royal blue pique knit fabric. Accented with a structured collar, ribbed armbands, and a two-button placket. Perfect for smart-casual wear.',
    price: 1100,
    salePrice: 890,
    discountRate: 19,
    purchasePrice: 450,
    stock: 80,
    sku: 'GS-PS-B06',
    categorySlug: 'polo-shirt',
    images: ['/assets/images/products/royal-blue-pique-polo.webp'],
    tags: ['polo shirt', 'royal blue', 'pique knit', 'smart casual'],
    attributes: [{ key: 'Color', value: 'Royal Blue' }, { key: 'Material', value: '100% Pique Cotton' }, { key: 'GSM', value: '220' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'Burgundy Classic Polo',
    slug: 'burgundy-classic-polo',
    description: 'Indulge in understated luxury with this deep burgundy classic polo. Made from double-lacoste premium cotton, offering a soft hand feel and excellent structural shape.',
    price: 1200,
    purchasePrice: 500,
    stock: 95,
    sku: 'GS-PS-R07',
    categorySlug: 'polo-shirt',
    images: ['/assets/images/products/burgundy-classic-polo.webp'],
    tags: ['burgundy polo', 'classic fit', 'lacoste fabric', 'premium polo'],
    attributes: [{ key: 'Color', value: 'Burgundy' }, { key: 'Material', value: '100% Double-Lacoste Cotton' }, { key: 'GSM', value: '230' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: false
  },
  {
    name: 'Forest Green Active Polo',
    slug: 'forest-green-active-polo',
    description: 'Engineered for the active modern gentleman. This forest green polo is made from breathable, sweat-wicking knit cotton to keep you cool and sharp throughout the day.',
    price: 1150,
    salePrice: 950,
    discountRate: 17,
    purchasePrice: 480,
    stock: 75,
    sku: 'GS-PS-G08',
    categorySlug: 'polo-shirt',
    images: ['/assets/images/products/forest-green-active-polo.webp'],
    tags: ['forest green', 'active polo', 'sporty', 'breathable'],
    attributes: [{ key: 'Color', value: 'Forest Green' }, { key: 'Fabric', value: 'Cotton Pique' }, { key: 'GSM', value: '210' }],
    isFeatured: false,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'Charcoal Grey Premium Polo',
    slug: 'charcoal-grey-premium-polo',
    description: 'Sleek, minimalist polo shirt in a versatile charcoal grey hue. Flat-knit collar and matching cuffs lend a contemporary edge, making it easy to style with denim or chinos.',
    price: 1250,
    purchasePrice: 520,
    stock: 60,
    sku: 'GS-PS-C09',
    categorySlug: 'polo-shirt',
    images: ['/assets/images/products/charcoal-grey-premium-polo.webp'],
    tags: ['charcoal grey', 'minimalist polo', 'contemporary style'],
    attributes: [{ key: 'Color', value: 'Charcoal Grey' }, { key: 'Fit', value: 'Modern Fit' }, { key: 'GSM', value: '220' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Premium White Cotton Polo',
    slug: 'premium-white-cotton-polo',
    description: 'The epitome of classic summer style. A pristine white polo shirt made from top-grade combed cotton. Features exceptional breathability and a luxurious soft texture.',
    price: 1300,
    salePrice: 1050,
    discountRate: 19,
    purchasePrice: 550,
    stock: 70,
    sku: 'GS-PS-W10',
    categorySlug: 'polo-shirt',
    images: ['/assets/images/products/premium-white-cotton-polo.webp'],
    tags: ['white polo', 'premium white', 'cotton pique', 'classic wardrobe'],
    attributes: [{ key: 'Color', value: 'Pristine White' }, { key: 'Material', value: '100% Combed Cotton Pique' }, { key: 'GSM', value: '220' }],
    isFeatured: true,
    isNewArrival: false,
    isFlashSale: true
  },

  // ==================== Category 3: Shirt ====================
  {
    name: 'Classic Blue Oxford Shirt',
    slug: 'classic-blue-oxford-shirt',
    description: 'A timeless staple for every wardrobe. This light-blue button-down shirt is woven from premium Oxford cotton. It is soft, breathable, and transitions effortlessly from office meetings to casual weekends.',
    price: 1450,
    salePrice: 1190,
    discountRate: 17,
    purchasePrice: 600,
    stock: 85,
    sku: 'GS-SH-B11',
    categorySlug: 'shirt',
    images: ['/assets/images/products/classic-blue-oxford-shirt.webp'],
    tags: ['blue shirt', 'oxford cotton', 'button down', 'formal casual'],
    attributes: [{ key: 'Color', value: 'Light Blue' }, { key: 'Material', value: '100% Oxford Cotton' }, { key: 'Sleeve', value: 'Long Sleeve' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'White Formal Dress Shirt',
    slug: 'white-formal-dress-shirt',
    description: 'Crisp, elegant white formal dress shirt. Made from high-thread-count Egyptian cotton with an easy-iron finish. Designed with structural collars and double cuffs for executive settings.',
    price: 1650,
    purchasePrice: 700,
    stock: 90,
    sku: 'GS-SH-W12',
    categorySlug: 'shirt',
    images: ['/assets/images/products/white-formal-dress-shirt.webp'],
    tags: ['white shirt', 'formal wear', 'egyptian cotton', 'office wear'],
    attributes: [{ key: 'Color', value: 'White' }, { key: 'Material', value: '100% Egyptian Cotton' }, { key: 'Fit', value: 'Regular Executive Fit' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: false
  },
  {
    name: 'Black Casual Linen Shirt',
    slug: 'black-casual-linen-shirt',
    description: 'Keep it cool and relaxed with our premium black linen long-sleeve shirt. The lightweight, airy weave of organic linen makes it highly comfortable for humid summer days.',
    price: 1550,
    salePrice: 1250,
    discountRate: 19,
    purchasePrice: 650,
    stock: 65,
    sku: 'GS-SH-B13',
    categorySlug: 'shirt',
    images: ['/assets/images/products/black-casual-linen-shirt.webp'],
    tags: ['black linen', 'casual shirt', 'airy linen', 'summer fashion'],
    attributes: [{ key: 'Color', value: 'Black' }, { key: 'Material', value: '100% Pure Linen' }, { key: 'Fit', value: 'Relaxed Fit' }],
    isFeatured: false,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'Red Checked Flannel Shirt',
    slug: 'red-checked-flannel-shirt',
    description: 'Classic red and black checked cotton flannel long-sleeve shirt. Features a soft brushed texture on both sides for optimum warmth and comfort. Perfect for layering over basic tees.',
    price: 1390,
    purchasePrice: 580,
    stock: 75,
    sku: 'GS-SH-R14',
    categorySlug: 'shirt',
    images: ['/assets/images/products/red-checked-flannel-shirt.webp'],
    tags: ['flannel shirt', 'checked shirt', 'brushed cotton', 'layering'],
    attributes: [{ key: 'Pattern', value: 'Red & Black Plaid' }, { key: 'Material', value: '100% Brushed Cotton Flannel' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Olive Green Utility Shirt',
    slug: 'olive-green-utility-shirt',
    description: 'Rugged yet trendy utility cargo shirt in olive green. Styled with dual chest button-flap pockets, durable stitching, and reinforced collars. Excellent for adventure or casual outdoor styling.',
    price: 1500,
    salePrice: 1200,
    discountRate: 20,
    purchasePrice: 620,
    stock: 80,
    sku: 'GS-SH-G15',
    categorySlug: 'shirt',
    images: ['/assets/images/products/olive-green-utility-shirt.webp'],
    tags: ['utility shirt', 'cargo shirt', 'olive green', 'outdoor fashion'],
    attributes: [{ key: 'Color', value: 'Olive Green' }, { key: 'Pockets', value: 'Double Chest Pockets' }, { key: 'Material', value: 'Heavyweight Cotton Twill' }],
    isFeatured: true,
    isNewArrival: false,
    isFlashSale: true
  },

  // ==================== Category 4: Hoodie ====================
  {
    name: 'Classic Black Fleece Hoodie',
    slug: 'classic-black-fleece-hoodie',
    description: 'Stay cozy and warm in our heavyweight classic black hoodie. Crafted from 320 GSM premium cotton-poly fleece, featuring a double-lined hood with adjustable drawstrings and a spacious kangaroo pocket.',
    price: 1850,
    salePrice: 1490,
    discountRate: 19,
    purchasePrice: 750,
    stock: 70,
    sku: 'GS-HD-B16',
    categorySlug: 'hoodie',
    images: ['/assets/images/products/classic-black-fleece-hoodie.webp'],
    tags: ['black hoodie', 'fleece hoodie', 'cozy', 'winter wear'],
    attributes: [{ key: 'Color', value: 'Black' }, { key: 'Material', value: '80% Cotton / 20% Polyester' }, { key: 'GSM', value: '320' }],
    isFeatured: true,
    isNewArrival: true,
    isFlashSale: true
  },
  {
    name: 'Heather Grey Pullover Hoodie',
    slug: 'heather-grey-pullover-hoodie',
    description: 'A versatile essential for street styling. This heather grey pullover features soft brushed fleece inside for a snug experience, matching ribbed cuffs, and an athletic silhouette.',
    price: 1750,
    purchasePrice: 700,
    stock: 85,
    sku: 'GS-HD-G17',
    categorySlug: 'hoodie',
    images: ['/assets/images/products/heather-grey-pullover-hoodie.webp'],
    tags: ['grey hoodie', 'pullover', 'streetwear', 'casual hoodie'],
    attributes: [{ key: 'Color', value: 'Heather Grey' }, { key: 'Material', value: 'Cotton-Fleece Blend' }, { key: 'GSM', value: '300' }],
    isFeatured: false,
    isNewArrival: true,
    isFlashSale: false
  },
  {
    name: 'Olive Green Oversized Hoodie',
    slug: 'olive-green-oversized-hoodie',
    description: 'Drape yourself in relaxed comfort with our olive green oversized hoodie. Features dropped shoulders, a premium heavy-drape design, and a modern minimal look perfect for casual streetwear.',
    price: 1950,
    purchasePrice: 800,
    stock: 50,
    sku: 'GS-HD-G18',
    categorySlug: 'hoodie',
    images: ['/assets/images/products/olive-green-oversized-hoodie.webp'],
    tags: ['oversized hoodie', 'olive green', 'heavy drape', 'street fashion'],
    attributes: [{ key: 'Color', value: 'Olive Green' }, { key: 'Fit', value: 'Oversized' }, { key: 'GSM', value: '350' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Navy Blue Zip Up Hoodie',
    slug: 'navy-blue-zip-up-hoodie',
    description: 'Functional and stylish. This navy blue zip-up hoodie features a premium metallic YKK zipper, split kangaroo pockets, and a midweight fleece fabric that makes it perfect for daily layering.',
    price: 1890,
    purchasePrice: 780,
    stock: 60,
    sku: 'GS-HD-N19',
    categorySlug: 'hoodie',
    images: ['/assets/images/products/navy-blue-zip-up-hoodie.webp'],
    tags: ['zip up hoodie', 'navy blue', 'ykk zipper', 'sporty'],
    attributes: [{ key: 'Color', value: 'Navy Blue' }, { key: 'Style', value: 'Zip-Up' }, { key: 'GSM', value: '300' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Beige Cotton Comfort Hoodie',
    slug: 'beige-cotton-comfort-hoodie',
    description: 'A cozy beige comfort hoodie made from pre-shrunk premium knit combed cotton. Clean, minimal design with clean seam details for an elegant off-duty casual style.',
    price: 1990,
    purchasePrice: 820,
    stock: 55,
    sku: 'GS-HD-B20',
    categorySlug: 'hoodie',
    images: ['/assets/images/products/beige-cotton-comfort-hoodie.webp'],
    tags: ['beige hoodie', 'comfort hoodie', 'minimal wear', 'soft fleece'],
    attributes: [{ key: 'Color', value: 'Beige' }, { key: 'Material', value: '100% Combed Cotton Fleece' }, { key: 'GSM', value: '320' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },

  // ==================== Category 5: Pants ====================
  {
    name: 'Dark Blue Indigo Jeans',
    slug: 'dark-blue-indigo-jeans',
    description: 'Crafted from high-grade raw indigo denim, these dark blue jeans are cut in a classic slim-fit profile. Built to age beautifully, establishing unique character fades over time.',
    price: 1650,
    purchasePrice: 650,
    stock: 120,
    sku: 'GS-PN-D21',
    categorySlug: 'pants',
    images: ['/assets/images/products/dark-blue-indigo-jeans.webp'],
    tags: ['indigo jeans', 'denim pants', 'slim fit jeans', 'raw denim'],
    attributes: [{ key: 'Color', value: 'Dark Blue Indigo' }, { key: 'Material', value: '98% Cotton / 2% Elastane' }, { key: 'Denim Weight', value: '12 oz' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Slim Fit Khaki Chinos',
    slug: 'slim-fit-khaki-chinos',
    description: 'A smart essential for office or casual gatherings. These khaki chinos are tailored from lightweight stretch-cotton twill, giving you sharp clean lines without compromising comfort.',
    price: 1490,
    purchasePrice: 580,
    stock: 130,
    sku: 'GS-PN-K22',
    categorySlug: 'pants',
    images: ['/assets/images/products/slim-fit-khaki-chinos.webp'],
    tags: ['khaki chinos', 'slim fit', 'office casual', 'twill pants'],
    attributes: [{ key: 'Color', value: 'Khaki' }, { key: 'Material', value: 'Stretch Cotton Twill' }, { key: 'Fit', value: 'Slim Fit' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Classic Black Gabardine Pants',
    slug: 'classic-black-gabardine-pants',
    description: 'A pair of premium black formal trousers stitched from high-density gabardine fabric. Wrinkle-resistant, breathable, and designed with a straight-leg drape for executive comfort.',
    price: 1590,
    purchasePrice: 620,
    stock: 110,
    sku: 'GS-PN-B23',
    categorySlug: 'pants',
    images: ['/assets/images/products/classic-black-gabardine-pants.webp'],
    tags: ['gabardine pants', 'formal trousers', 'black pants', 'wrinkle resistant'],
    attributes: [{ key: 'Color', value: 'Black' }, { key: 'Material', value: 'Premium Gabardine' }, { key: 'Style', value: 'Straight Fit' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Olive Green Cargo Pants',
    slug: 'olive-green-cargo-pants',
    description: 'Durable, tactical-inspired cargo pants in olive green. Structured from tear-resistant ripstop cotton twill, featuring button-flap side utility pockets and a relaxed urban fit.',
    price: 1750,
    purchasePrice: 700,
    stock: 75,
    sku: 'GS-PN-G24',
    categorySlug: 'pants',
    images: ['/assets/images/products/olive-green-cargo-pants.webp'],
    tags: ['cargo pants', 'tactical pants', 'olive green', 'ripstop fabric'],
    attributes: [{ key: 'Color', value: 'Olive Green' }, { key: 'Material', value: 'Ripstop Cotton Twill' }, { key: 'Pockets', value: 'Multi Utility Pockets' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  },
  {
    name: 'Charcoal Grey Jogger Pants',
    slug: 'charcoal-grey-jogger-pants',
    description: 'Ultimate loungewear with an athletic edge. These charcoal grey joggers are made from thick loopback cotton, styled with a comfortable elastic waistband, drawstring, and secure zip pockets.',
    price: 1290,
    purchasePrice: 500,
    stock: 140,
    sku: 'GS-PN-C25',
    categorySlug: 'pants',
    images: ['/assets/images/products/charcoal-grey-jogger-pants.webp'],
    tags: ['joggers', 'charcoal grey', 'activewear', 'cotton track pants'],
    attributes: [{ key: 'Color', value: 'Charcoal Grey' }, { key: 'Material', value: '100% Loopback Cotton' }, { key: 'Waist', value: 'Elasticated with Drawstring' }],
    isFeatured: false,
    isNewArrival: false,
    isFlashSale: false
  }
];

async function seed() {
  try {
    try {
      await mongoose.connect(mongodbUri);
    } catch (connErr) {
      console.log('SRV connection failed, trying direct connection fallback...');
      const directUri = 'mongodb://gentsity:xI2QuBaFZsYQ5vRD@ac-jrowhop-shard-00-00.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-01.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-02.e5n1hnl.mongodb.net:27017/gentsity?ssl=true&authSource=admin';
      await mongoose.connect(directUri);
    }
    console.log('Connected to MongoDB successfully.');

    // Clear existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`Cleared ${deleteResult.deletedCount} existing products.`);

    // Query all categories
    const categoriesList = await Category.find({});
    console.log(`Fetched ${categoriesList.length} categories from DB.`);

    const categoryMap = {};
    categoriesList.forEach(c => {
      categoryMap[c.slug] = c._id;
    });

    // Prepare products with proper Category ObjectIds
    const finalProducts = productsData.map(p => {
      const categoryId = categoryMap[p.categorySlug];
      if (!categoryId) {
        throw new Error(`Category with slug "${p.categorySlug}" not found in DB! Seed categories first.`);
      }
      const pCopy = { ...p };
      pCopy.categories = [categoryId];
      delete pCopy.categorySlug;
      return pCopy;
    });

    // Insert new products
    const insertResult = await Product.insertMany(finalProducts);
    console.log(`Seeded ${insertResult.length} products successfully:`);
    insertResult.forEach((prod, i) => {
      console.log(`[Product ${i + 1}] Name: "${prod.name}", SKU: "${prod.sku}"`);
    });

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

seed();

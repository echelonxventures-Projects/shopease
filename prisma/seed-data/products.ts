export const seedCategories = [
  { name: "Electronics", slug: "electronics", description: "Latest gadgets and electronics", position: 1 },
  { name: "Smartphones", slug: "smartphones", description: "Mobile phones and accessories", parentId: "PARENT_ELECTRONICS", position: 1 },
  { name: "Laptops", slug: "laptops", description: "Notebooks and ultrabooks", parentId: "PARENT_ELECTRONICS", position: 2 },
  { name: "Audio", slug: "audio", description: "Headphones, speakers, earbuds", parentId: "PARENT_ELECTRONICS", position: 3 },
  { name: "Fashion", slug: "fashion", description: "Clothing, shoes & accessories", position: 2 },
  { name: "Men's Clothing", slug: "mens-clothing", description: "Men's apparel", parentId: "PARENT_FASHION", position: 1 },
  { name: "Women's Clothing", slug: "womens-clothing", description: "Women's apparel", parentId: "PARENT_FASHION", position: 2 },
  { name: "Footwear", slug: "footwear", description: "Shoes, sneakers & more", parentId: "PARENT_FASHION", position: 3 },
  { name: "Home & Kitchen", slug: "home-kitchen", description: "Furniture, decor, kitchenware", position: 3 },
  { name: "Furniture", slug: "furniture", description: "Sofas, beds, tables", parentId: "PARENT_HOME", position: 1 },
  { name: "Kitchen", slug: "kitchen", description: "Cookware, appliances", parentId: "PARENT_HOME", position: 2 },
  { name: "Grocery", slug: "grocery", description: "Daily essentials & food items", position: 4 },
  { name: "Beauty", slug: "beauty", description: "Skincare, makeup, personal care", position: 5 },
  { name: "Books", slug: "books", description: "Books, audiobooks, comics", position: 6 },
  { name: "Toys & Games", slug: "toys-games", description: "Toys, board games, puzzles", position: 7 },
  { name: "Sports", slug: "sports", description: "Fitness, outdoor, sporting goods", position: 8 },
];

export const seedBrands = [
  { name: "Apple", slug: "apple" },
  { name: "Samsung", slug: "samsung" },
  { name: "Sony", slug: "sony" },
  { name: "Nike", slug: "nike" },
  { name: "Adidas", slug: "adidas" },
  { name: "Levi's", slug: "levis" },
  { name: "HP", slug: "hp" },
  { name: "Dell", slug: "dell" },
  { name: "LG", slug: "lg" },
  { name: "Bose", slug: "bose" },
];

const productImages = [
  "/uploads/product-1.jpg",
  "/uploads/product-2.jpg",
  "/uploads/product-3.jpg",
  "/uploads/product-4.jpg",
  "/uploads/product-5.jpg",
];

export const seedProducts = [
  { name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", shortDesc: "Apple's flagship smartphone with A17 Pro chip", description: "The iPhone 15 Pro Max features the A17 Pro chip, a customizable Action button, and the most powerful iPhone camera system. Titanium design with 5x Zoom.", price: 159900, comparePrice: 179900, categoryId: "smartphones", brand: "apple", stock: 50, tags: ["smartphone", "apple", "5g"], isFeatured: true, hasVariants: true, images: productImages },
  { name: "Samsung Galaxy S24 Ultra", slug: "samsung-galaxy-s24-ultra", shortDesc: "AI-powered smartphone with S Pen", description: "The Galaxy S24 Ultra brings the power of AI to your smartphone experience. Features a 200MP camera and built-in S Pen.", price: 139900, comparePrice: 149900, categoryId: "smartphones", brand: "samsung", stock: 75, tags: ["smartphone", "samsung", "5g"], isFeatured: true, images: productImages },
  { name: "MacBook Pro 14-inch M3 Pro", slug: "macbook-pro-14-m3", shortDesc: "Supercharged by M3 Pro chip", description: "MacBook Pro with M3 Pro chip delivers exceptional performance for pro workflows. Up to 22 hours of battery life.", price: 199900, comparePrice: 219900, categoryId: "laptops", brand: "apple", stock: 30, tags: ["laptop", "apple", "m3"], isFeatured: true, images: productImages },
  { name: "Dell XPS 15", slug: "dell-xps-15", shortDesc: "Premium Windows laptop with stunning display", description: "Dell XPS 15 features a stunning 15.6\" InfinityEdge display, 13th Gen Intel processors, and Thunderbolt 4.", price: 179900, comparePrice: 199900, categoryId: "laptops", brand: "dell", stock: 40, tags: ["laptop", "dell", "windows"], images: productImages },
  { name: "Sony WH-1000XM5", slug: "sony-wh-1000xm5", shortDesc: "Industry-leading noise cancellation", description: "The Sony WH-1000XM5 headphones feature industry-leading noise cancellation, crystal-clear calls, and up to 30 hours of battery life.", price: 29990, comparePrice: 34990, categoryId: "audio", brand: "sony", stock: 100, tags: ["headphones", "noise-cancelling", "wireless"], isFeatured: true, images: productImages },
  { name: "AirPods Pro 2", slug: "airpods-pro-2", shortDesc: "Active Noise Cancellation with Adaptive Audio", description: "AirPods Pro 2 feature Adaptive Audio, Active Noise Cancellation, and a MagSafe Charging Case with USB-C and speaker.", price: 24900, comparePrice: 26900, categoryId: "audio", brand: "apple", stock: 150, tags: ["earbuds", "apple", "wireless"], images: productImages },
  { name: "Bose QuietComfort Earbuds", slug: "bose-quietcomfort-earbuds", shortDesc: "World-class noise cancellation in earbuds", description: "The most effective noise cancelling earbuds with CustomTune sound. Natural, balanced audio.", price: 27900, comparePrice: 29900, categoryId: "audio", brand: "bose", stock: 80, tags: ["earbuds", "bose", "noise-cancelling"], images: productImages },
  { name: "Nike Air Max 270", slug: "nike-air-max-270", shortDesc: "Lightweight, breathable running shoe", description: "The Nike Air Max 270 delivers visible cushioning with a large Air unit. Lightweight and breathable upper.", price: 12995, comparePrice: 14995, categoryId: "footwear", brand: "nike", stock: 200, tags: ["shoes", "running", "sneakers"], isFeatured: true, images: productImages },
  { name: "Adidas Ultraboost 22", slug: "adidas-ultraboost-22", shortDesc: "Energy-returning running shoe", description: "Ultraboost 22 with BOOST cushioning for incredible energy return. Primeknit upper adapts to your foot.", price: 17999, comparePrice: 19999, categoryId: "footwear", brand: "adidas", stock: 120, tags: ["shoes", "running", "sneakers"], images: productImages },
  { name: "Levi's 501 Original Jeans", slug: "levis-501-original", shortDesc: "The original straight-leg jean", description: "The iconic Levi's 501 with a straight leg and button fly. Wear them faded or washed, tight or loose.", price: 3999, comparePrice: 4999, categoryId: "mens-clothing", brand: "levis", stock: 300, tags: ["jeans", "men", "denim"], images: productImages },
  { name: "Samsung 55\" OLED Smart TV", slug: "samsung-55-oled-tv", shortDesc: "4K OLED display with neural quantum processor", description: "Experience breathtaking picture quality with Samsung's 55-inch OLED TV. Neural Quantum Processor with AI upscaling.", price: 119990, comparePrice: 139990, categoryId: "electronics", brand: "samsung", stock: 20, tags: ["tv", "oled", "smart-tv"], images: productImages },
  { name: "LG 65\" 4K Smart TV", slug: "lg-65-4k-smart-tv", shortDesc: "webOS with α9 AI Processor 4K", description: "LG's 65-inch 4K Smart TV with α9 AI Processor for enhanced picture quality. Dolby Vision & Atmos.", price: 89990, comparePrice: 99990, categoryId: "electronics", brand: "lg", stock: 15, tags: ["tv", "4k", "smart-tv"], images: productImages },
  { name: "HP Spectre x360 14", slug: "hp-spectre-x360-14", shortDesc: "Premium convertible laptop with OLED display", description: "HP Spectre x360 14 is a convertible laptop with a stunning OLED display, 13th Gen Intel processor, and all-day battery life.", price: 154990, comparePrice: 169990, categoryId: "laptops", brand: "hp", stock: 25, tags: ["laptop", "hp", "convertible"], images: productImages },
];

// Seed products for new product types
export const seedExtendedProducts = [
  { name: "Advanced React Patterns Ebook", slug: "advanced-react-patterns-ebook", productType: "DIGITAL", shortDesc: "Master advanced React patterns and best practices", description: "A comprehensive guide to advanced React patterns including Compound Components, Render Props, Higher-Order Components, Custom Hooks, and more.", price: 2499, comparePrice: 3499, categoryId: "books", stock: 9999, tags: ["ebook", "react", "programming"], images: ["/uploads/digital-book.jpg"], digitalUrl: "/downloads/react-patterns.pdf", maxDownloads: 5, isFeatured: true },
  { name: "Premium Coffee Subscription", slug: "premium-coffee-subscription", productType: "SUBSCRIPTION", shortDesc: "Freshly roasted single-origin coffee delivered monthly", description: "Subscribe to receive 500g of freshly roasted, single-origin coffee beans delivered to your door every month. Rotating selections from Colombia, Ethiopia, and Guatemala.", price: 1499, comparePrice: 1999, categoryId: "grocery", stock: 9999, tags: ["coffee", "subscription", "organic"], images: ["/uploads/coffee.jpg"], subscriptionInterval: "month", subscriptionTrialDays: 0 },
  { name: "Starter Electronics Kit", slug: "starter-electronics-kit", productType: "BUNDLE", shortDesc: "Everything you need to start building electronics projects", description: "Bundle includes Arduino Uno board, breadboard, jumper wires, LED kit, resistors, and sensors. Perfect for beginners.", price: 4999, comparePrice: 6999, categoryId: "electronics", stock: 100, tags: ["bundle", "arduino", "electronics"], images: ["/uploads/kit.jpg"] },
  { name: "Organic Almonds 500g", slug: "organic-almonds-500g", productType: "PHYSICAL", shortDesc: "Premium organic almonds, 500g pack", description: "Farm-fresh organic almonds sourced from sustainable farms. Rich in protein, fiber, and vitamin E.", price: 599, comparePrice: 799, categoryId: "grocery", stock: 500, tags: ["organic", "almonds", "snacks"], images: ["/uploads/almonds.jpg"], taxCategory: "FOOD", uom: "PACK", expiryDays: 180, trackingType: "LOT" },
  { name: "Paracetamol 500mg (20 Tablets)", slug: "paracetamol-500mg", productType: "PHYSICAL", shortDesc: "Pain relief tablets, 20 tablet pack", description: "Effective relief from headaches, fever, and pain. 20 tablets of 500mg paracetamol each.", price: 45, comparePrice: 60, categoryId: "grocery", stock: 1000, tags: ["pharma", "pain-relief", "tablets"], images: ["/uploads/medicine.jpg"], taxCategory: "PHARMA", uom: "PACK", expiryDays: 730, trackingType: "LOT" },
  { name: "Designer Sofa Set", slug: "designer-sofa-set", productType: "PHYSICAL", shortDesc: "Luxury 3-seater sofa with cushion", description: "Premium fabric sofa set with ergonomic design. Includes 1 three-seater and 2 single seaters.", price: 89999, comparePrice: 119999, categoryId: "furniture", stock: 10, tags: ["sofa", "furniture", "luxury"], images: ["/uploads/sofa.jpg"], freightClass: "OVERSIZED", uom: "SET" },
];

// Barcode seed data
export const seedBarcodes = [
  { productSlug: "iphone-15-pro-max", barcode: "8901234567890", type: "EAN13" },
  { productSlug: "samsung-galaxy-s24-ultra", barcode: "8901234567891", type: "EAN13" },
  { productSlug: "macbook-pro-14-m3", barcode: "8901234567892", type: "EAN13" },
  { productSlug: "sony-wh-1000xm5", barcode: "8901234567893", type: "EAN13" },
  { productSlug: "airpods-pro-2", barcode: "8901234567894", type: "EAN13" },
  { productSlug: "nike-air-max-270", barcode: "8901234567895", type: "UPC" },
  { productSlug: "advanced-react-patterns-ebook", barcode: "978-0-13-468599-1", type: "ISBN" },
];

// UOM seed data
export const seedUomData = [
  { code: "GM", name: "Gram", category: "WEIGHT", symbol: "g" },
  { code: "KG", name: "Kilogram", category: "WEIGHT", symbol: "kg" },
  { code: "TON", name: "Metric Ton", category: "WEIGHT", symbol: "t" },
  { code: "MM", name: "Millimeter", category: "LENGTH", symbol: "mm" },
  { code: "CM", name: "Centimeter", category: "LENGTH", symbol: "cm" },
  { code: "METER", name: "Meter", category: "LENGTH", symbol: "m" },
  { code: "INCH", name: "Inch", category: "LENGTH", symbol: "in" },
  { code: "FT", name: "Foot", category: "LENGTH", symbol: "ft" },
  { code: "ML", name: "Milliliter", category: "VOLUME", symbol: "ml" },
  { code: "LITER", name: "Liter", category: "VOLUME", symbol: "L" },
  { code: "SQ_M", name: "Square Meter", category: "AREA", symbol: "m²" },
  { code: "SQ_FT", name: "Square Foot", category: "AREA", symbol: "ft²" },
  { code: "PIECE", name: "Piece", category: "COUNT", symbol: "pc" },
  { code: "DOZEN", name: "Dozen", category: "COUNT", symbol: "dz" },
  { code: "PACK", name: "Pack", category: "COUNT", symbol: "pk" },
  { code: "SET", name: "Set", category: "COUNT", symbol: "set" },
  { code: "BOX", name: "Box", category: "COUNT", symbol: "bx" },
  { code: "BUNDLE", name: "Bundle", category: "COUNT", symbol: "bdl" },
  { code: "CAN", name: "Can", category: "COUNT", symbol: "can" },
  { code: "BAG", name: "Bag", category: "COUNT", symbol: "bag" },
  { code: "ROLL", name: "Roll", category: "COUNT", symbol: "roll" },
  { code: "SHEET", name: "Sheet", category: "COUNT", symbol: "sh" },
  { code: "KB", name: "Kilobyte", category: "DIGITAL", symbol: "KB" },
  { code: "MB", name: "Megabyte", category: "DIGITAL", symbol: "MB" },
  { code: "GB", name: "Gigabyte", category: "DIGITAL", symbol: "GB" },
  { code: "TB", name: "Terabyte", category: "DIGITAL", symbol: "TB" },
  { code: "HOUR", name: "Hour", category: "TIME", symbol: "hr" },
  { code: "DAY", name: "Day", category: "TIME", symbol: "day" },
  { code: "MONTH", name: "Month", category: "TIME", symbol: "mo" },
  { code: "YEAR", name: "Year", category: "TIME", symbol: "yr" },
];

// UOM conversion rules
export const seedUomConversions = [
  { from: "KG", to: "GM", factor: 1000 },
  { from: "TON", to: "KG", factor: 1000 },
  { from: "METER", to: "CM", factor: 100 },
  { from: "METER", to: "MM", factor: 1000 },
  { from: "CM", to: "MM", factor: 10 },
  { from: "LITER", to: "ML", factor: 1000 },
  { from: "SQ_M", to: "SQ_FT", factor: 10.7639 },
  { from: "FT", to: "INCH", factor: 12 },
  { from: "DOZEN", to: "PIECE", factor: 12 },
  { from: "GB", to: "MB", factor: 1024 },
  { from: "TB", to: "GB", factor: 1024 },
  { from: "MONTH", to: "DAY", factor: 30 },
  { from: "YEAR", to: "MONTH", factor: 12 },
];

// Tax category rules: per-region tax overrides
export const seedTaxCategoryRules = [
  // India
  { taxCategory: "FOOD", regionCode: "IN", taxRate: 0.05 },
  { taxCategory: "BOOKS", regionCode: "IN", taxRate: 0 },
  { taxCategory: "PHARMA", regionCode: "IN", taxRate: 0.12 },
  { taxCategory: "CLOTHING", regionCode: "IN", taxRate: 0.05 },
  { taxCategory: "LUXURY", regionCode: "IN", taxRate: 0.28 },
  { taxCategory: "ALCOHOL", regionCode: "IN", taxRate: 0.30 },
  { taxCategory: "TOBACCO", regionCode: "IN", taxRate: 0.40 },
  { taxCategory: "STANDARD", regionCode: "IN", taxRate: 0.18 },
  // US
  { taxCategory: "FOOD", regionCode: "US", taxRate: 0 },
  { taxCategory: "BOOKS", regionCode: "US", taxRate: 0 },
  { taxCategory: "PHARMA", regionCode: "US", taxRate: 0 },
  { taxCategory: "CLOTHING", regionCode: "US", taxRate: 0 },
  { taxCategory: "STANDARD", regionCode: "US", taxRate: 0.08 },
  // Germany
  { taxCategory: "FOOD", regionCode: "DE", taxRate: 0.07 },
  { taxCategory: "BOOKS", regionCode: "DE", taxRate: 0.07 },
  { taxCategory: "PHARMA", regionCode: "DE", taxRate: 0.07 },
  { taxCategory: "STANDARD", regionCode: "DE", taxRate: 0.19 },
  // UK
  { taxCategory: "FOOD", regionCode: "GB", taxRate: 0 },
  { taxCategory: "BOOKS", regionCode: "GB", taxRate: 0 },
  { taxCategory: "PHARMA", regionCode: "GB", taxRate: 0 },
  { taxCategory: "STANDARD", regionCode: "GB", taxRate: 0.20 },
];

export const seedBanners = [
  { title: "Summer Sale Up to 50% Off", description: "Huge discounts on electronics, fashion & more", imageUrl: "/uploads/banner-1.jpg", position: 1 },
  { title: "New Arrivals in Fashion", description: "Explore the latest trends in men's and women's clothing", imageUrl: "/uploads/banner-2.jpg", position: 2 },
  { title: "Free Shipping on Orders Above ₹500", description: "No minimum order, free delivery on everything", imageUrl: "/uploads/banner-3.jpg", position: 3 },
];

export const seedCoupons = [
  { code: "WELCOME10", description: "10% off for new customers", discountType: "PERCENTAGE", discountValue: 10, minOrderValue: 500, maxDiscount: 500, usageLimit: 1000, validFrom: new Date("2024-01-01"), validUntil: new Date("2027-12-31") },
  { code: "SAVE500", description: "₹500 off on orders above ₹2000", discountType: "FLAT", discountValue: 500, minOrderValue: 2000, usageLimit: 500, validFrom: new Date("2024-01-01"), validUntil: new Date("2027-12-31") },
  { code: "FIRSTORDER", description: "Flat 15% off your first order", discountType: "PERCENTAGE", discountValue: 15, minOrderValue: 300, maxDiscount: 1000, usageLimit: 5000, validFrom: new Date("2024-01-01"), validUntil: new Date("2027-12-31") },
];

export const seedSystemConfigs = [
  { key: "store_name", value: "ShopEase", description: "Store display name", category: "general" },
  { key: "store_email", value: "support@shopease.com", description: "Store email address", category: "general" },
  { key: "shipping_rate", value: "50", description: "Default shipping rate in INR", category: "shipping" },
  { key: "free_shipping_min", value: "500", description: "Free shipping above this amount", category: "shipping" },
  { key: "tax_rate", value: "18", description: "Default tax rate percentage", category: "tax" },
  { key: "order_cancellation_window", value: "1", description: "Cancellation window in hours", category: "orders" },
];

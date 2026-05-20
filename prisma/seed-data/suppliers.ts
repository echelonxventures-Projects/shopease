export const seedSuppliers = [
  {
    name: "Tech Distributors India",
    code: "SUP-001",
    contactPerson: "Rajesh Kumar",
    email: "sales@techdist.in",
    phone: "9876543210",
    address: "Warehouse 12, Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    zipCode: "400069",
    gstin: "27AABCT1234F1Z5",
    paymentTerms: "Net 30",
    notes: "Primary electronics distributor for Western India",
  },
  {
    name: "Global Electronics Ltd",
    code: "SUP-002",
    contactPerson: "Sarah Chen",
    email: "orders@globalelec.com",
    phone: "+1-555-0100",
    city: "Shanghai",
    state: "Shanghai",
    country: "China",
    zipCode: "200000",
    paymentTerms: "Net 45",
    notes: "Direct manufacturer sourcing for Apple and Samsung products",
  },
  {
    name: "Fashion Wholesale India",
    code: "SUP-003",
    contactPerson: "Priya Sharma",
    email: "orders@fashionwholesale.in",
    phone: "9876543211",
    address: "Block 45, Chandni Chowk",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    zipCode: "110006",
    gstin: "27AABCT5678G2Z6",
    paymentTerms: "COD",
    notes: "Fashion and footwear distributor for North India",
  },
  {
    name: "Home Essentials Supply Co",
    code: "SUP-004",
    contactPerson: "Amit Patel",
    email: "sales@homeessentials.in",
    phone: "9876543212",
    address: "Industrial Area, Phase 2",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    zipCode: "380001",
    paymentTerms: "Net 15",
    notes: "Home and kitchen appliance distributor",
  },
  {
    name: "Sports & Fitness Distributors",
    code: "SUP-005",
    contactPerson: "Vikram Singh",
    email: "orders@sportsfit.co.in",
    phone: "9876543213",
    address: "12th Main, Koramangala",
    city: "Bangalore",
    state: "Karnataka",
    country: "India",
    zipCode: "560034",
    gstin: "29AABCT9012H3Z7",
    paymentTerms: "Net 30",
    notes: "Sports equipment and fitness gear distributor",
  },
];

export const seedProductSuppliers = [
  // Electronics — multiple suppliers
  { productSlug: "iphone-15-pro-max", supplierCode: "SUP-002", costPrice: 105000, leadTimeDays: 14, isPreferred: true },
  { productSlug: "iphone-15-pro-max", supplierCode: "SUP-001", costPrice: 110000, leadTimeDays: 7 },
  { productSlug: "samsung-galaxy-s24-ultra", supplierCode: "SUP-001", costPrice: 90000, leadTimeDays: 7, isPreferred: true },
  { productSlug: "macbook-pro-14-m3", supplierCode: "SUP-002", costPrice: 130000, leadTimeDays: 10 },
  { productSlug: "dell-xps-15", supplierCode: "SUP-002", costPrice: 115000, leadTimeDays: 10, isPreferred: true },
  { productSlug: "sony-wh-1000xm5", supplierCode: "SUP-001", costPrice: 22000, leadTimeDays: 5, isPreferred: true },
  { productSlug: "airpods-pro-2", supplierCode: "SUP-002", costPrice: 16000, leadTimeDays: 7 },
  { productSlug: "bose-quietcomfort-earbuds", supplierCode: "SUP-001", costPrice: 19000, leadTimeDays: 5, isPreferred: true },
  { productSlug: "samsung-55-oled-tv", supplierCode: "SUP-001", costPrice: 75000, leadTimeDays: 10, isPreferred: true },
  { productSlug: "lg-65-4k-smart-tv", supplierCode: "SUP-001", costPrice: 58000, leadTimeDays: 10, isPreferred: true },
  { productSlug: "hp-spectre-x360-14", supplierCode: "SUP-001", costPrice: 100000, leadTimeDays: 7, isPreferred: true },
  // Fashion
  { productSlug: "nike-air-max-270", supplierCode: "SUP-003", costPrice: 7500, leadTimeDays: 5, isPreferred: true },
  { productSlug: "adidas-ultraboost-22", supplierCode: "SUP-003", costPrice: 9000, leadTimeDays: 5, isPreferred: true },
  { productSlug: "levis-501-original", supplierCode: "SUP-003", costPrice: 2200, leadTimeDays: 3, isPreferred: true },
];

// Split existing product stock across suppliers
// For products with 1 supplier: 100% to that supplier
// For products with 2 suppliers: 50/50 split
export const seedInventory = [
  // iPhone — 50 units total (SUP-001: 25, SUP-002: 25)
  { productSlug: "iphone-15-pro-max", supplierCode: "SUP-001", quantity: 25, lowStock: 10, avgCost: 110000 },
  { productSlug: "iphone-15-pro-max", supplierCode: "SUP-002", quantity: 25, lowStock: 10, avgCost: 105000 },
  // Samsung Galaxy — 75 units (SUP-001: 75)
  { productSlug: "samsung-galaxy-s24-ultra", supplierCode: "SUP-001", quantity: 75, lowStock: 15, avgCost: 90000 },
  // MacBook — 30 units (SUP-002: 30)
  { productSlug: "macbook-pro-14-m3", supplierCode: "SUP-002", quantity: 30, lowStock: 10, avgCost: 130000 },
  // Dell XPS — 40 units (SUP-002: 40)
  { productSlug: "dell-xps-15", supplierCode: "SUP-002", quantity: 40, lowStock: 10, avgCost: 115000 },
  // Sony headphones — 100 units (SUP-001: 100)
  { productSlug: "sony-wh-1000xm5", supplierCode: "SUP-001", quantity: 100, lowStock: 20, avgCost: 22000 },
  // AirPods — 150 units (SUP-002: 150)
  { productSlug: "airpods-pro-2", supplierCode: "SUP-002", quantity: 150, lowStock: 30, avgCost: 16000 },
  // Bose Earbuds — 80 units (SUP-001: 80)
  { productSlug: "bose-quietcomfort-earbuds", supplierCode: "SUP-001", quantity: 80, lowStock: 15, avgCost: 19000 },
  // Nike — 200 units (SUP-003: 200)
  { productSlug: "nike-air-max-270", supplierCode: "SUP-003", quantity: 200, lowStock: 40, avgCost: 7500 },
  // Adidas — 120 units (SUP-003: 120)
  { productSlug: "adidas-ultraboost-22", supplierCode: "SUP-003", quantity: 120, lowStock: 25, avgCost: 9000 },
  // Levi's — 300 units (SUP-003: 300)
  { productSlug: "levis-501-original", supplierCode: "SUP-003", quantity: 300, lowStock: 50, avgCost: 2200 },
  // Samsung TV — 20 units (SUP-001: 20)
  { productSlug: "samsung-55-oled-tv", supplierCode: "SUP-001", quantity: 20, lowStock: 5, avgCost: 75000 },
  // LG TV — 15 units (SUP-001: 15)
  { productSlug: "lg-65-4k-smart-tv", supplierCode: "SUP-001", quantity: 15, lowStock: 5, avgCost: 58000 },
  // HP Spectre — 25 units (SUP-001: 25)
  { productSlug: "hp-spectre-x360-14", supplierCode: "SUP-001", quantity: 25, lowStock: 5, avgCost: 100000 },
];

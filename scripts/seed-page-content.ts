import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper: upsert a page content record
async function upsertPage(slug: string, data: any) {
  await prisma.pageContent.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  });
}

async function main() {
  console.log("📄 Seeding page content...");

  // ─── 1. Sell on ShopEase ────────────────────────────────────────────────
  await upsertPage("sell", {
    title: "Sell on ShopEase",
    subtitle: "Reach millions of customers and grow your business",
    heroContent: "ShopEase is the largest online marketplace. Sell your products to millions of customers across the globe with powerful tools, fast fulfillment, and dedicated support.",
    sections: {
      features: [
        {
          type: "stats",
          title: "Why Sell on ShopEase?",
          items: [
            { title: "300M+", description: "Active customers worldwide", icon: "👥" },
            { title: "180+", description: "Countries you can sell to", icon: "🌍" },
            { title: "₹0", description: "Monthly subscription fee", icon: "💰" },
            { title: "24/7", description: "Seller support", icon: "🎧" },
          ],
        },
        {
          type: "features",
          title: "Benefits for Sellers",
          items: [
            { title: "Massive Reach", description: "Access millions of active shoppers across categories", icon: "🚀" },
            { title: "Fast Onboarding", description: "Start selling in under 24 hours with our streamlined process", icon: "⚡" },
            { title: "Fulfilment Support", description: "Use ShopEase FBA for storage, packing, and delivery", icon: "📦" },
            { title: "Marketing Tools", description: "Run ads, coupons, and deals to boost visibility", icon: "📢" },
            { title: "Secure Payments", description: "Guaranteed payouts every 7 days", icon: "🔒" },
            { title: "Analytics Dashboard", description: "Track sales, inventory, and performance in real-time", icon: "📊" },
          ],
        },
        {
          type: "steps",
          title: "How to Start Selling",
          items: [
            { title: "Register", description: "Fill in your business details and verify your account" },
            { title: "List Products", description: "Add your products with images, descriptions, and prices" },
            { title: "Start Selling", description: "Go live and reach millions of customers instantly" },
            { title: "Get Paid", description: "Receive payouts directly to your bank account every 7 days" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "businessName", type: "text", label: "Business Name *", placeholder: "Your business name", required: true },
        { name: "businessEmail", type: "email", label: "Business Email *", placeholder: "you@business.com", required: true },
        { name: "businessPhone", type: "tel", label: "Business Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "gstin", type: "text", label: "GSTIN (optional)", placeholder: "XX XXXX XXXX XXXXX" },
        { name: "address", type: "textarea", label: "Business Address", placeholder: "Full address" },
        { name: "city", type: "text", label: "City", placeholder: "City" },
        { name: "state", type: "text", label: "State", placeholder: "State" },
        { name: "pincode", type: "text", label: "Pincode", placeholder: "XXXXXX" },
      ],
      action: "registerSeller",
    },
    faq: [
      { question: "How much does it cost to sell on ShopEase?", answer: "No monthly subscription fee. You only pay a referral fee per item sold, which varies by category." },
      { question: "How and when do I get paid?", answer: "Payments are deposited into your bank account every 7 days after deducting fees." },
      { question: "What documents do I need?", answer: "Business email, phone number, business address, and GSTIN (recommended). Additional documents may be required based on category." },
      { question: "Do I need to handle shipping?", answer: "You can self-ship or use ShopEase FBA (Fulfilment by ShopEase) for storage, packing, and delivery." },
      { question: "Can I sell internationally?", answer: "Yes, with Amazon Global Selling you can list products in 180+ countries." },
    ],
    sortOrder: 1,
  });

  // ─── 2. ShopEase Accelerator ────────────────────────────────────────────
  await upsertPage("accelerator", {
    title: "Sell under ShopEase Accelerator",
    subtitle: "Accelerated growth for promising brands",
    heroContent: "ShopEase Accelerator is a curated program that provides selected sellers with dedicated support, advanced tools, and premium placement to fast-track their growth on ShopEase.",
    sections: {
      features: [
        {
          type: "features",
          title: "Accelerator Benefits",
          items: [
            { title: "Dedicated Account Manager", description: "One-on-one guidance from a ShopEase expert", icon: "👤" },
            { title: "Priority Listings", description: "Enhanced visibility in search results", icon: "⭐" },
            { title: "Advertising Credits", description: "Up to ₹50,000 in free ad credits in your first 3 months", icon: "💵" },
            { title: "Brand Analytics", description: "Advanced insights into customer behavior and trends", icon: "📈" },
            { title: "A+ Content", description: "Rich product pages with comparison charts and storytelling", icon: "🎨" },
            { title: "FBA Discounts", description: "Reduced fulfilment fees for the first 6 months", icon: "📦" },
          ],
        },
        {
          type: "steps",
          title: "Application Process",
          items: [
            { title: "Apply", description: "Submit your business details and product catalog" },
            { title: "Review", description: "Our team reviews your application within 5 business days" },
            { title: "Onboard", description: "Get access to accelerator tools and dedicated support" },
            { title: "Grow", description: "Accelerate your sales with premium features and placement" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "businessName", type: "text", label: "Business Name *", placeholder: "Your business name", required: true },
        { name: "brandName", type: "text", label: "Brand Name *", placeholder: "Your brand name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@brand.com", required: true },
        { name: "phone", type: "tel", label: "Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "category", type: "select", label: "Product Category *", options: ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Grocery", "Toys", "Sports", "Other"] },
        { name: "annualRevenue", type: "select", label: "Annual Revenue", options: ["Under ₹10L", "₹10L - ₹50L", "₹50L - ₹1Cr", "₹1Cr - ₹5Cr", "₹5Cr+"] },
        { name: "website", type: "url", label: "Website (optional)", placeholder: "https://yourbrand.com" },
        { name: "message", type: "textarea", label: "Tell us about your brand", placeholder: "What makes your brand unique?" },
      ],
      action: "applyAccelerator",
    },
    faq: [
      { question: "Who can apply?", answer: "Registered sellers with a proven product catalog and positive customer feedback." },
      { question: "How long is the program?", answer: "The accelerator program runs for 12 months with quarterly reviews." },
      { question: "Is there a fee?", answer: "No additional fee. Accelerator benefits are included in your standard selling plan." },
      { question: "What support do I get?", answer: "Dedicated account manager, priority support, advertising credits, and access to beta features." },
    ],
    sortOrder: 2,
  });

  // ─── 3. Brand Registry ─────────────────────────────────────────────────
  await upsertPage("brand-registry", {
    title: "Protect and Build Your Brand",
    subtitle: "Safeguard your intellectual property and build a premium brand experience",
    heroContent: "ShopEase Brand Registry helps you protect your brand, report violations, and build a premium customer experience with advanced branding tools.",
    sections: {
      features: [
        {
          type: "features",
          title: "Brand Protection Features",
          items: [
            { title: "Proactive Monitoring", description: "AI-powered tools that detect and remove suspicious listings", icon: "🔍" },
            { title: "Report Violations", description: "File infringement claims directly through the Brand Dashboard", icon: "⚖️" },
            { title: "Transparency", description: "Unique codes protect every unit before it reaches the customer", icon: "🛡️" },
            { title: "Brand Analytics", description: "Insights into customer demographics and purchasing patterns", icon: "📊" },
            { title: "A+ Content", description: "Enhanced product pages with rich images and comparison charts", icon: "🎨" },
            { title: "Brand Store", description: "Create a custom multi-page storefront for your brand", icon: "🏪" },
          ],
        },
        {
          type: "steps",
          title: "How to Register",
          items: [
            { title: "Apply", description: "Submit your active registered trademark" },
            { title: "Verify", description: "Complete identity verification" },
            { title: "Enroll", description: "Link your brand to your ShopEase seller account" },
            { title: "Protect", description: "Start using protection and branding tools" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "brandName", type: "text", label: "Brand Name *", placeholder: "Your registered brand name", required: true },
        { name: "trademarkNumber", type: "text", label: "Trademark Registration Number *", placeholder: "TM-XXXXXXXX", required: true },
        { name: "trademarkOffice", type: "text", label: "Trademark Office", placeholder: "IPO, USPTO, EUIPO, etc." },
        { name: "category", type: "text", label: "Product Category *", placeholder: "Your product categories" },
        { name: "email", type: "email", label: "Email *", placeholder: "brand@company.com", required: true },
        { name: "sellerId", type: "text", label: "ShopEase Seller ID", placeholder: "Your seller account ID" },
      ],
      action: "registerBrand",
    },
    faq: [
      { question: "Do I need a registered trademark?", answer: "Yes, your trademark must be active and registered in the country where you want to enroll." },
      { question: "How long does approval take?", answer: "Typically 1-2 weeks after application submission." },
      { question: "What if my brand is not registered?", answer: "You can apply for a trademark first, then enroll once it's approved." },
      { question: "Is Brand Registry free?", answer: "Yes, Brand Registry is free for all eligible brand owners." },
    ],
    sortOrder: 3,
  });

  // ─── 4. Global Selling ──────────────────────────────────────────────────
  await upsertPage("global-sell", {
    title: "Amazon Global Selling",
    subtitle: "Sell your products to customers across 180+ countries",
    heroContent: "Expand your business internationally with Amazon Global Selling. List your products once and reach millions of customers worldwide with localised storefronts, global fulfilment, and multi-currency payouts.",
    sections: {
      features: [
        {
          type: "stats",
          title: "Global Reach",
          items: [
            { title: "180+", description: "Countries you can sell to", icon: "🌍" },
            { title: "15", description: "Marketplaces worldwide", icon: "🏪" },
            { title: "6", description: "Languages supported", icon: "🗣️" },
            { title: "300M+", description: "Active global customers", icon: "👥" },
          ],
        },
        {
          type: "features",
          title: "Benefits",
          items: [
            { title: "One-Click Expansion", description: "Expand to new marketplaces from a single seller account", icon: "🚀" },
            { title: "Translation Services", description: "Auto-translation of product listings into local languages", icon: "🗣️" },
            { title: "Global Fulfilment", description: "Ship cross-border with ShopEase Logistics", icon: "📦" },
            { title: "Multi-Currency Payouts", description: "Receive payments in your local currency", icon: "💱" },
            { title: "Customs Handling", description: "We handle duties, taxes, and customs clearance", icon: "🛃" },
            { title: "Cross-Border Ads", description: "Reach international shoppers with targeted advertising", icon: "📢" },
          ],
        },
        {
          type: "steps",
          title: "Get Started",
          items: [
            { title: "Register", description: "Sign up for Amazon Global Selling" },
            { title: "Select Markets", description: "Choose the countries you want to sell in" },
            { title: "List Products", description: "Translate and adapt your listings for each market" },
            { title: "Ship & Sell", description: "Start fulfilling orders from day one" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "businessName", type: "text", label: "Business Name *", placeholder: "Your business name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@business.com", required: true },
        { name: "phone", type: "tel", label: "Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "homeMarketplace", type: "select", label: "Home Marketplace", options: ["India", "USA", "UK", "Germany", "France", "Japan", "Australia"] },
        { name: "targetMarkets", type: "select", label: "Target Marketplaces", options: ["North America", "Europe", "Japan", "Australia", "Middle East"] },
        { name: "category", type: "text", label: "Product Category", placeholder: "Your primary category" },
        { name: "annualRevenue", type: "select", label: "Annual Export Revenue", options: ["None (starting fresh)", "Under $50K", "$50K - $250K", "$250K - $1M", "$1M+"] },
      ],
      action: "applyGlobalSelling",
    },
    faq: [
      { question: "What countries can I sell to?", answer: "180+ countries across North America, Europe, Asia-Pacific, and Middle East." },
      { question: "Do I need separate seller accounts?", answer: "No, one seller account gives you access to all marketplaces." },
      { question: "How are international payments handled?", answer: "We convert foreign currency to your local currency and deposit directly." },
      { question: "Who handles customs?", answer: "ShopEase handles all customs clearance and duties for cross-border shipments." },
    ],
    sortOrder: 4,
  });

  // ─── 5. Supply to ShopEase ─────────────────────────────────────────────
  await upsertPage("supply", {
    title: "Supply to ShopEase",
    subtitle: "Become a vendor and supply products directly to ShopEase",
    heroContent: "Instead of selling directly to customers, supply your products in bulk to ShopEase. We handle pricing, fulfilment, and customer service while you focus on manufacturing and supply.",
    sections: {
      features: [
        {
          type: "features",
          title: "Vendor Program Benefits",
          items: [
            { title: "Bulk Orders", description: "Receive and fulfill large wholesale orders from ShopEase", icon: "📦" },
            { title: "Predictable Revenue", description: "Purchase orders guarantee revenue for your products", icon: "💰" },
            { title: "No Customer Facing", description: "ShopEase handles all customer interaction and returns", icon: "🤝" },
            { title: "Vendor Central", description: "Manage orders, invoices, and shipments through Vendor Central", icon: "🖥️" },
            { title: "EDF Program", description: "Early Delivery Fee incentives for fast fulfillment", icon: "⚡" },
            { title: "Category Management", description: "Dedicated category managers to support your growth", icon: "👤" },
          ],
        },
        {
          type: "steps",
          title: "Supply Process",
          items: [
            { title: "Apply", description: "Submit your company and product details" },
            { title: "Negotiate Terms", description: "Agree on pricing, MOQ, and delivery terms" },
            { title: "Receive PO", description: "Get purchase orders from ShopEase" },
            { title: "Ship", description: "Deliver products to ShopEase fulfilment centres" },
            { title: "Get Paid", description: "Receive payments per agreed terms" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "companyName", type: "text", label: "Company Name *", placeholder: "Your company name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@company.com", required: true },
        { name: "phone", type: "tel", label: "Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "category", type: "text", label: "Product Categories", placeholder: "What do you manufacture/supply?" },
        { name: "annualCapacity", type: "text", label: "Annual Production Capacity", placeholder: "Units per year" },
        { name: "certifications", type: "textarea", label: "Certifications (ISO, FSSAI, etc.)", placeholder: "List your quality certifications" },
        { name: "message", type: "textarea", label: "Additional Information", placeholder: "Tell us about your manufacturing capabilities" },
      ],
      action: "applySupply",
    },
    faq: [
      { question: "What's the difference between selling and supplying?", answer: "Selling means you list products and sell directly to customers. Supplying means you sell in bulk to ShopEase, and they resell to customers." },
      { question: "What is the minimum order size?", answer: "Varies by category. Typically 500+ units per order." },
      { question: "How are payments structured?", answer: "Payment terms are typically Net 30 or Net 60 days from delivery." },
      { question: "Do I need certifications?", answer: "Product category-specific certifications may be required (e.g., FSSAI for food, BIS for electronics)." },
    ],
    sortOrder: 5,
  });

  // ─── 6. Affiliate Program ───────────────────────────────────────────────
  await upsertPage("affiliate", {
    title: "Become an Affiliate",
    subtitle: "Earn money by recommending products you love",
    heroContent: "Join the ShopEase Affiliate Program and earn commissions for every sale you refer. Share product links on your blog, YouTube channel, social media, or website.",
    sections: {
      features: [
        {
          type: "stats",
          title: "Program Stats",
          items: [
            { title: "10%", description: "Max commission per referral", icon: "💰" },
            { title: "30-day", description: "Cookie duration", icon: "🍪" },
            { title: "10M+", description: "Products to promote", icon: "🛒" },
            { title: "₹100", description: "Minimum payout threshold", icon: "💵" },
          ],
        },
        {
          type: "features",
          title: "Affiliate Benefits",
          items: [
            { title: "Commission on Sales", description: "Earn up to 10% per qualifying referral sale", icon: "💰" },
            { title: "30-Day Cookie", description: "Earn commission on purchases made within 30 days of your link", icon: "🍪" },
            { title: "Linking Tools", description: "Site Stripe, link builder, and native shopping ads", icon: "🔧" },
            { title: "Detailed Reports", description: "Track clicks, conversions, and earnings in real-time", icon: "📊" },
            { title: "Multiple Payout Options", description: "Bank transfer, Amazon Pay balance, or gift card", icon: "💳" },
            { title: "API Access", description: "Build custom integrations with our Product Advertising API", icon: "🔌" },
          ],
        },
        {
          type: "steps",
          title: "How It Works",
          items: [
            { title: "Sign Up", description: "Create your affiliate account for free" },
            { title: "Get Links", description: "Generate affiliate links for any product" },
            { title: "Share", description: "Post links on your blog, YouTube, or social media" },
            { title: "Earn", description: "Get paid when someone clicks and buys" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "fullName", type: "text", label: "Full Name *", placeholder: "Your full name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@example.com", required: true },
        { name: "website", type: "url", label: "Website / Blog URL *", placeholder: "https://yourwebsite.com", required: true },
        { name: "platform", type: "select", label: "Primary Platform", options: ["Blog/Website", "YouTube", "Instagram", "Facebook", "Twitter/X", "Telegram", "Other"] },
        { name: "audienceSize", type: "select", label: "Audience Size", options: ["Under 1K", "1K - 10K", "10K - 100K", "100K - 1M", "1M+"] },
        { name: "category", type: "text", label: "Content Category", placeholder: "e.g., Tech Reviews, Fashion, Home Decor" },
      ],
      action: "applyAffiliate",
    },
    faq: [
      { question: "Is it free to join?", answer: "Yes, the ShopEase Affiliate Program is completely free." },
      { question: "How much can I earn?", answer: "Commissions range from 1% to 10% depending on the product category." },
      { question: "When do I get paid?", answer: "Payouts are made monthly once you reach the minimum threshold of ₹100." },
      { question: "Can I use links on social media?", answer: "Yes, you can share affiliate links on blogs, YouTube, Instagram, Facebook, and other platforms." },
    ],
    sortOrder: 6,
  });

  // ─── 7. Fulfilment by ShopEase ─────────────────────────────────────────
  await upsertPage("fba", {
    title: "Fulfilment by ShopEase",
    subtitle: "We store, pack, ship, and handle returns so you can focus on growth",
    heroContent: "Let ShopEase handle your logistics. Send your products to our fulfilment centres, and we'll take care of storage, packing, shipping, returns, and customer service.",
    sections: {
      features: [
        {
          type: "stats",
          title: "FBA by Numbers",
          items: [
            { title: "100+", description: "Fulfilment centres across India", icon: "🏭" },
            { title: "1-day", description: "Delivery in major cities", icon: "⚡" },
            { title: "Prime", description: "FBA items get Prime badge", icon: "🚀" },
            { title: "70%", description: "Of ShopEase sales come from FBA sellers", icon: "📊" },
          ],
        },
        {
          type: "features",
          title: "FBA Benefits",
          items: [
            { title: "Prime Eligibility", description: "Your products get the Prime badge and fast delivery", icon: "🚀" },
            { title: "Customer Trust", description: "FBA items have higher conversion rates", icon: "🤝" },
            { title: "Multi-Channel", description: "Use FBA for ShopEase and your own store", icon: "🌐" },
            { title: "Returns Handling", description: "We manage all returns and refunds", icon: "🔄" },
            { title: "Scalable", description: "No limits on storage or order volume", icon: "📈" },
            { title: "24/7 Support", description: "Dedicated FBA seller support", icon: "🎧" },
          ],
        },
        {
          type: "steps",
          title: "How FBA Works",
          items: [
            { title: "Send to FC", description: "Ship your inventory to a ShopEase fulfilment centre" },
            { title: "Customer Orders", description: "When a customer places an order, we pick and pack" },
            { title: "We Ship", description: "Fast delivery with tracking and notifications" },
            { title: "We Handle Returns", description: "Customer service and returns managed by ShopEase" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "sellerId", type: "text", label: "ShopEase Seller ID *", placeholder: "Your seller account ID", required: true },
        { name: "businessName", type: "text", label: "Business Name *", placeholder: "Your business name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@business.com", required: true },
        { name: "phone", type: "tel", label: "Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "productCount", type: "select", label: "Number of Products", options: ["1-50", "50-200", "200-1000", "1000+"] },
        { name: "estimatedMonthlyOrders", type: "select", label: "Estimated Monthly Orders", options: ["Under 100", "100-500", "500-2000", "2000+"] },
      ],
      action: "enrollFBA",
    },
    faq: [
      { question: "What are the FBA fees?", answer: "Fees include fulfilment (pick, pack, ship), storage, and optional services. See the fee schedule for details." },
      { question: "How do I send inventory?", answer: "Create a shipment in Seller Central, pack products per guidelines, and ship to the assigned fulfilment centre." },
      { question: "Can I use FBA for my own website?", answer: "Yes, Multi-Channel Fulfilment lets you use FBA for orders from any sales channel." },
      { question: "What if my products are damaged?", answer: "ShopEase insures products in fulfilment centres. Reimbursement is available for damaged items." },
    ],
    sortOrder: 7,
  });

  // ─── 8. Advertise Your Products ─────────────────────────────────────────
  await upsertPage("advertise", {
    title: "Advertise Your Products",
    subtitle: "Reach shoppers at every stage of their buying journey",
    heroContent: "ShopEase Advertising helps you reach the right customers with sponsored product ads, display ads, and video ads. Set your budget, target your audience, and drive measurable results.",
    sections: {
      features: [
        {
          type: "stats",
          title: "Advertising Stats",
          items: [
            { title: "300M+", description: "Active shoppers to reach", icon: "👥" },
            { title: "3x", description: "Average ROI for advertisers", icon: "📈" },
            { title: "₹100", description: "Minimum daily budget", icon: "💰" },
            { title: "15+", description: "Ad formats available", icon: "🎯" },
          ],
        },
        {
          type: "features",
          title: "Ad Formats",
          items: [
            { title: "Sponsored Products", description: "Product listings that appear in search results", icon: "🔍" },
            { title: "Sponsored Brands", description: "Head-of-search banner ads with your brand logo", icon: "🏷️" },
            { title: "Sponsored Display", description: "Audience-targeted ads on and off ShopEase", icon: "📢" },
            { title: "Video Ads", description: "Auto-playing video ads in search results", icon: "🎬" },
            { title: "Custom Stores", description: "Multi-page branded shopping experiences", icon: "🏪" },
            { title: "Deals & Coupons", description: "Highlighted discount badges on your listings", icon: "🏷️" },
          ],
        },
        {
          type: "steps",
          title: "Start Advertising",
          items: [
            { title: "Choose Format", description: "Select the ad type that matches your goal" },
            { title: "Set Budget", description: "Define daily budget and bid amounts" },
            { title: "Target", description: "Choose keywords, products, or audiences" },
            { title: "Launch & Optimise", description: "Go live and adjust based on performance data" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "businessName", type: "text", label: "Business Name *", placeholder: "Your business name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@business.com", required: true },
        { name: "phone", type: "tel", label: "Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "adFormat", type: "select", label: "Preferred Ad Format", options: ["Sponsored Products", "Sponsored Brands", "Sponsored Display", "Video Ads", "Not Sure"] },
        { name: "monthlyBudget", type: "select", label: "Monthly Ad Budget", options: ["Under ₹5,000", "₹5,000 - ₹25,000", "₹25,000 - ₹1,00,000", "₹1,00,000+"] },
        { name: "goal", type: "select", label: "Primary Goal", options: ["Increase Sales", "Launch New Product", "Build Brand Awareness", "Clear Inventory"] },
      ],
      action: "startAdvertising",
    },
    faq: [
      { question: "How much does advertising cost?", answer: "You pay per click (CPC). Set your own daily budget and bids." },
      { question: "Do I need to be a seller?", answer: "You need to be a registered seller on ShopEase to run ads." },
      { question: "How quickly do ads go live?", answer: "Once approved, your campaigns can start running within 24 hours." },
      { question: "Can I track results?", answer: "Yes, the Advertising Console provides detailed reports on clicks, sales, and ACOS." },
    ],
    sortOrder: 8,
  });

  // ─── 9. ShopEase Pay on Merchants ──────────────────────────────────────
  await upsertPage("pay-merchants", {
    title: "ShopEase Pay on Merchants",
    subtitle: "Accept payments from customers everywhere with ShopEase Pay",
    heroContent: "Integrate ShopEase Pay into your online store or app. Accept UPI, credit/debit cards, net banking, EMI, and ShopEase Pay balance with seamless checkout and instant settlement.",
    sections: {
      features: [
        {
          type: "stats",
          title: "ShopEase Pay Stats",
          items: [
            { title: "6", description: "Payment methods supported", icon: "💳" },
            { title: "Instant", description: "Settlement to your bank account", icon: "⚡" },
            { title: "99.9%", description: "Uptime guarantee", icon: "🔒" },
            { title: "PCI DSS", description: "Level 1 certified security", icon: "🛡️" },
          ],
        },
        {
          type: "features",
          title: "Features",
          items: [
            { title: "All Payment Methods", description: "UPI, Cards, Net Banking, EMI, Wallet", icon: "💳" },
            { title: "One-Click Checkout", description: "Saved payment details for faster checkout", icon: "🚀" },
            { title: "Recurring Payments", description: "Subscription billing with auto-debit", icon: "🔄" },
            { title: "QR Code Payments", description: "Accept payments with ShopEase Pay QR", icon: "📱" },
            { title: "Dashboard", description: "Real-time transaction monitoring and reporting", icon: "📊" },
            { title: "Fraud Protection", description: "AI-powered fraud detection and prevention", icon: "🛡️" },
          ],
        },
        {
          type: "steps",
          title: "Integration Steps",
          items: [
            { title: "Sign Up", description: "Create a ShopEase Pay merchant account" },
            { title: "Integrate SDK", description: "Add our SDK to your website or app" },
            { title: "Test", description: "Use sandbox mode for testing" },
            { title: "Go Live", description: "Accept real payments from customers" },
          ],
        },
      ],
    },
    formConfig: {
      fields: [
        { name: "businessName", type: "text", label: "Business Name *", placeholder: "Your business name", required: true },
        { name: "email", type: "email", label: "Email *", placeholder: "you@business.com", required: true },
        { name: "phone", type: "tel", label: "Phone *", placeholder: "+91 98765 43210", required: true },
        { name: "website", type: "url", label: "Website URL *", placeholder: "https://yourstore.com", required: true },
        { name: "businessType", type: "select", label: "Business Type", options: ["Online Store", "Mobile App", "SaaS Platform", "Marketplace", "Other"] },
        { name: "monthlyVolume", type: "select", label: "Monthly Transaction Volume", options: ["Under ₹1L", "₹1L - ₹10L", "₹10L - ₹1Cr", "₹1Cr+"] },
        { name: "integration", type: "select", label: "Integration Platform", options: ["Custom Build", "Shopify", "WooCommerce", "Magento", "Other"] },
      ],
      action: "registerPayMerchant",
    },
    faq: [
      { question: "What are the transaction fees?", answer: "Fees vary by payment method. UPI is typically 0% for merchants. Cards range from 1.5% - 2%." },
      { question: "How long does integration take?", answer: "Standard integration takes 2-3 hours. Our SDK supports all major platforms." },
      { question: "Is my data secure?", answer: "Yes, we are PCI DSS Level 1 certified with end-to-end encryption." },
      { question: "How fast are settlements?", answer: "Settlements are typically within 24 hours of transaction." },
    ],
    sortOrder: 9,
  });

  console.log(`  ✅ 9 page contents seeded`);
  console.log("✅ Page content seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

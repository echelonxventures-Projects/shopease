import { PrismaClient, GiftCardFormat } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🎁 Seeding gift card store...");

  // ─── Occasions ─────────────────────────────────────────────────────────────
  const occasions = [
    // Everyday occasions
    { name: "Birthday", slug: "birthday", icon: "🎂", description: "Birthday gift cards", sortOrder: 1 },
    { name: "Anniversary", slug: "anniversary", icon: "💍", description: "Anniversary gift cards", sortOrder: 2 },
    { name: "Wedding", slug: "wedding", icon: "💒", description: "Wedding gift cards", sortOrder: 3 },
    { name: "Engagement", slug: "engagement", icon: "💎", description: "Engagement gift cards", sortOrder: 4 },
    { name: "Congratulations", slug: "congratulations", icon: "🎉", description: "Congratulations gift cards", sortOrder: 5 },
    { name: "Thank You", slug: "thank-you", icon: "🙏", description: "Thank you gift cards", sortOrder: 6 },
    { name: "Appreciation", slug: "appreciation", icon: "💐", description: "Appreciation gift cards", sortOrder: 7 },
    { name: "Farewell", slug: "farewell", icon: "👋", description: "Farewell gift cards", sortOrder: 8 },
    { name: "Best Wishes", slug: "best-wishes", icon: "✨", description: "Best wishes gift cards", sortOrder: 9 },
    { name: "Get Well Soon", slug: "get-well-soon", icon: "🌼", description: "Get well soon gift cards", sortOrder: 10 },

    // Festive occasions
    { name: "Christmas", slug: "christmas", icon: "🎄", description: "Christmas gift cards", sortOrder: 20 },
    { name: "Diwali", slug: "diwali", icon: "🪔", description: "Diwali gift cards", sortOrder: 21 },
    { name: "New Year", slug: "new-year", icon: "🎆", description: "New Year gift cards", sortOrder: 22 },
    { name: "Valentine's Day", slug: "valentines", icon: "❤️", description: "Valentine's Day gift cards", sortOrder: 23 },
    { name: "Raksha Bandhan", slug: "raksha-bandhan", icon: "🧵", description: "Raksha Bandhan gift cards", sortOrder: 24 },
    { name: "Holi", slug: "holi", icon: "🎨", description: "Holi gift cards", sortOrder: 25 },
    { name: "Eid", slug: "eid", icon: "🌙", description: "Eid gift cards", sortOrder: 26 },
    { name: "Navratri", slug: "navratri", icon: "🪷", description: "Navratri gift cards", sortOrder: 27 },
    { name: "Onam", slug: "onam", icon: "🌺", description: "Onam gift cards", sortOrder: 28 },
    { name: "Pongal", slug: "pongal", icon: "🎋", description: "Pongal gift cards", sortOrder: 29 },
    { name: "Ganesh Chaturthi", slug: "ganesh-chaturthi", icon: "🐘", description: "Ganesh Chaturthi gift cards", sortOrder: 30 },

    // Family occasions
    { name: "Mother's Day", slug: "mothers-day", icon: "👩", description: "Mother's Day gift cards", sortOrder: 40 },
    { name: "Father's Day", slug: "fathers-day", icon: "👨", description: "Father's Day gift cards", sortOrder: 41 },
    { name: "Teachers' Day", slug: "teachers-day", icon: "👩‍🏫", description: "Teachers' Day gift cards", sortOrder: 42 },

    // Life events
    { name: "Graduation", slug: "graduation", icon: "🎓", description: "Graduation gift cards", sortOrder: 50 },
    { name: "Housewarming", slug: "housewarming", icon: "🏠", description: "Housewarming gift cards", sortOrder: 51 },
    { name: "Baby Shower", slug: "baby-shower", icon: "👶", description: "Baby shower gift cards", sortOrder: 52 },
    { name: "New Job", slug: "new-job", icon: "💼", description: "New job gift cards", sortOrder: 53 },
  ];

  console.log("  Seeding occasions...");
  for (const o of occasions) {
    await prisma.giftCardOccasion.upsert({
      where: { slug: o.slug },
      update: { name: o.name, icon: o.icon, description: o.description, sortOrder: o.sortOrder },
      create: o,
    });
  }
  console.log(`  ✅ ${occasions.length} occasions`);

  // ─── Recipient Types ──────────────────────────────────────────────────────
  const recipients = [
    { name: "For Him", slug: "for-him", icon: "👨", description: "Gift cards for men", sortOrder: 1 },
    { name: "For Her", slug: "for-her", icon: "👩", description: "Gift cards for women", sortOrder: 2 },
    { name: "Husband", slug: "husband", icon: "👨", description: "Gift cards for husband", sortOrder: 3 },
    { name: "Wife", slug: "wife", icon: "👩", description: "Gift cards for wife", sortOrder: 4 },
    { name: "Mother", slug: "mother", icon: "👩", description: "Gift cards for mother", sortOrder: 5 },
    { name: "Father", slug: "father", icon: "👨", description: "Gift cards for father", sortOrder: 6 },
    { name: "Brother", slug: "brother", icon: "👦", description: "Gift cards for brother", sortOrder: 7 },
    { name: "Sister", slug: "sister", icon: "👧", description: "Gift cards for sister", sortOrder: 8 },
    { name: "Friend", slug: "friend", icon: "🤝", description: "Gift cards for friends", sortOrder: 9 },
    { name: "Colleague", slug: "colleague", icon: "💼", description: "Gift cards for colleagues", sortOrder: 10 },
    { name: "Boss", slug: "boss", icon: "👔", description: "Gift cards for boss/manager", sortOrder: 11 },
    { name: "Grandparent", slug: "grandparent", icon: "👴", description: "Gift cards for grandparents", sortOrder: 12 },
    { name: "Children", slug: "children", icon: "🧒", description: "Gift cards for children", sortOrder: 13 },
    { name: "Teacher", slug: "teacher", icon: "👩‍🏫", description: "Gift cards for teachers", sortOrder: 14 },
    { name: "Everyone", slug: "everyone", icon: "🌍", description: "Gift cards for anyone", sortOrder: 15 },
  ];

  console.log("  Seeding recipient types...");
  for (const r of recipients) {
    await prisma.giftCardRecipientType.upsert({
      where: { slug: r.slug },
      update: r,
      create: r,
    });
  }
  console.log(`  ✅ ${recipients.length} recipient types`);

  // ─── Designs ──────────────────────────────────────────────────────────────
  const designs = [
    { name: "Birthday Gift Box", slug: "birthday-gift-box", imageUrl: "/images/gift-cards/birthday-box.jpg", themeColor: "colorful" },
    { name: "Pink Festive Box", slug: "pink-festive-box", imageUrl: "/images/gift-cards/pink-box.jpg", themeColor: "pink" },
    { name: "Black Gift Card Box", slug: "black-card-box", imageUrl: "/images/gift-cards/black-box.jpg", themeColor: "black" },
    { name: "Elegant Red", slug: "elegant-red", imageUrl: "/images/gift-cards/elegant-red.jpg", themeColor: "red" },
    { name: "Royal Blue", slug: "royal-blue", imageUrl: "/images/gift-cards/royal-blue.jpg", themeColor: "blue" },
    { name: "Golden Celebration", slug: "golden-celebration", imageUrl: "/images/gift-cards/golden.jpg", themeColor: "gold" },
    { name: "Minimal White", slug: "minimal-white", imageUrl: "/images/gift-cards/minimal.jpg", themeColor: "white" },
    { name: "Festive Rainbow", slug: "festive-rainbow", imageUrl: "/images/gift-cards/rainbow.jpg", themeColor: "colorful" },
    { name: "Diwali Lights", slug: "diwali-lights", imageUrl: "/images/gift-cards/diwali.jpg", themeColor: "gold" },
    { name: "Christmas Cheer", slug: "christmas-cheer", imageUrl: "/images/gift-cards/christmas.jpg", themeColor: "green" },
    { name: "Wedding Bliss", slug: "wedding-bliss", imageUrl: "/images/gift-cards/wedding.jpg", themeColor: "red" },
    { name: "Animated Confetti", slug: "animated-confetti", imageUrl: "/images/gift-cards/confetti.gif", themeColor: "colorful" },
  ];

  console.log("  Seeding designs...");
  for (const d of designs) {
    await prisma.giftCardDesign.upsert({
      where: { slug: d.slug },
      update: d,
      create: d,
    });
  }
  console.log(`  ✅ ${designs.length} designs`);

  // ─── Gift Card Store Products ─────────────────────────────────────────────
  const storeCards = [
    // BESTSELLERS
    {
      name: "Amazon Pay Gift Card", slug: "amazon-pay-gift-card",
      description: "The most popular gift card. Send to anyone for any occasion.",
      imageUrl: "/images/gift-cards/amazon-pay-standard.jpg",
      minAmount: 25, maxAmount: 50000, fixedAmounts: [100, 200, 500, 1000, 2000, 5000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Everyday", isBestseller: true, isFeatured: true, sortOrder: 1,
      occasionSlugs: ["birthday", "anniversary", "wedding", "christmas", "diwali", "best-wishes", "congratulations"],
      recipientSlugs: ["for-him", "for-her", "husband", "wife", "mother", "father", "brother", "sister", "friend", "colleague", "everyone"],
      designSlug: "minimal-white",
    },
    {
      name: "Birthday Wishes Gift Card", slug: "birthday-wishes-gift-card",
      description: "Make their birthday special with a personalized gift card.",
      imageUrl: "/images/gift-cards/birthday-wishes.jpg",
      minAmount: 50, maxAmount: 10000, fixedAmounts: [100, 200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.ANIMATED,
      seller: "Amazon", categories: "Shopping,Fun", isBestseller: true, sortOrder: 2,
      occasionSlugs: ["birthday"],
      recipientSlugs: ["for-him", "for-her", "friend", "brother", "sister", "mother", "father", "children"],
      designSlug: "birthday-gift-box",
    },
    {
      name: "Wedding Blessings Gift Card", slug: "wedding-blessings-gift-card",
      description: "Bless the newlyweds with a beautiful wedding gift card.",
      imageUrl: "/images/gift-cards/wedding-blessings.jpg",
      minAmount: 200, maxAmount: 50000, fixedAmounts: [500, 1000, 2000, 5000, 10000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Everyday", isBestseller: true, sortOrder: 3,
      occasionSlugs: ["wedding", "engagement"],
      recipientSlugs: ["everyone", "friend", "colleague"],
      designSlug: "wedding-bliss",
    },
    {
      name: "Festive Diwali Gift Card", slug: "festive-diwali-gift-card",
      description: "Light up their Diwali with a gift card full of possibilities.",
      imageUrl: "/images/gift-cards/diwali-gift.jpg",
      minAmount: 50, maxAmount: 25000, fixedAmounts: [100, 250, 500, 1000, 2500, 5000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Festive", isBestseller: true, isFeatured: true, sortOrder: 4,
      occasionSlugs: ["diwali", "ganesh-chaturthi", "navratri", "holi"],
      recipientSlugs: ["everyone", "for-him", "for-her", "mother", "father", "brother", "sister", "colleague"],
      designSlug: "diwali-lights",
    },

    // ANIMATED / E-GIFT
    {
      name: "Animated Confetti Card", slug: "animated-confetti-card",
      description: "Surprise them with an animated eGift card bursting with confetti!",
      imageUrl: "/images/gift-cards/animated-confetti.jpg",
      minAmount: 50, maxAmount: 10000, fixedAmounts: [100, 200, 500, 1000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.ANIMATED,
      seller: "Amazon", categories: "Shopping,Fun", isBestseller: true, sortOrder: 10,
      occasionSlugs: ["birthday", "congratulations", "new-year", "best-wishes"],
      recipientSlugs: ["friend", "for-him", "for-her", "children", "colleague"],
      designSlug: "animated-confetti",
    },
    {
      name: "Your Photo Gift Card", slug: "your-photo-gift-card",
      description: "Upload your photo to create a personalized gift card.",
      imageUrl: "/images/gift-cards/photo-card.jpg",
      minAmount: 100, maxAmount: 10000, fixedAmounts: [200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.PHOTO,
      seller: "Amazon", categories: "Shopping,Personal", sortOrder: 11,
      occasionSlugs: ["birthday", "anniversary", "wedding", "valentines", "mothers-day", "fathers-day"],
      recipientSlugs: ["husband", "wife", "mother", "father", "friend", "everyone"],
      designSlug: "minimal-white",
    },

    // ANNIVERSARY
    {
      name: "Happy Anniversary Gift Card", slug: "happy-anniversary-gift-card",
      description: "Celebrate another year of love and togetherness.",
      imageUrl: "/images/gift-cards/anniversary.jpg",
      minAmount: 100, maxAmount: 10000, fixedAmounts: [200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Romantic", sortOrder: 20,
      occasionSlugs: ["anniversary"],
      recipientSlugs: ["husband", "wife", "for-him", "for-her"],
      designSlug: "elegant-red",
    },
    {
      name: "Golden Anniversary Card", slug: "golden-anniversary-card",
      description: "A golden celebration for your golden anniversary.",
      imageUrl: "/images/gift-cards/golden-anniversary.jpg",
      minAmount: 500, maxAmount: 25000, fixedAmounts: [1000, 2000, 5000, 10000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Luxury", sortOrder: 21,
      occasionSlugs: ["anniversary"],
      recipientSlugs: ["husband", "wife"],
      designSlug: "golden-celebration",
    },

    // THANK YOU / APPRECIATION
    {
      name: "Thank You Gift Card", slug: "thank-you-gift-card",
      description: "Show your gratitude with a heartfelt thank you gift card.",
      imageUrl: "/images/gift-cards/thank-you.jpg",
      minAmount: 50, maxAmount: 5000, fixedAmounts: [100, 200, 500, 1000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Everyday", sortOrder: 30,
      occasionSlugs: ["thank-you", "appreciation", "teachers-day"],
      recipientSlugs: ["teacher", "colleague", "boss", "friend", "everyone"],
      designSlug: "minimal-white",
    },
    {
      name: "Corporate Appreciation Card", slug: "corporate-appreciation-card",
      description: "Perfect for employee recognition and corporate gifting.",
      imageUrl: "/images/gift-cards/corporate.jpg",
      minAmount: 500, maxAmount: 50000, fixedAmounts: [500, 1000, 2000, 5000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Business", sortOrder: 31,
      occasionSlugs: ["appreciation", "congratulations", "best-wishes", "farewell"],
      recipientSlugs: ["colleague", "boss", "everyone"],
      designSlug: "black-card-box",
    },

    // CONGRATULATIONS
    {
      name: "Congratulations Gift Card", slug: "congratulations-gift-card",
      description: "Celebrate their achievement with a congratulatory gift card.",
      imageUrl: "/images/gift-cards/congratulations.jpg",
      minAmount: 50, maxAmount: 10000, fixedAmounts: [100, 200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.ANIMATED,
      seller: "Amazon", categories: "Shopping,Everyday", sortOrder: 40,
      occasionSlugs: ["congratulations", "graduation", "new-job", "housewarming"],
      recipientSlugs: ["friend", "brother", "sister", "colleague", "for-him", "for-her"],
      designSlug: "golden-celebration",
    },

    // FATHER'S DAY
    {
      name: "Happy Father's Day Gift Card", slug: "fathers-day-gift-card",
      description: "A special gift card for the best dad in the world.",
      imageUrl: "/images/gift-cards/fathers-day.jpg",
      minAmount: 50, maxAmount: 5000, fixedAmounts: [100, 200, 500, 1000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Everyday", sortOrder: 50,
      occasionSlugs: ["fathers-day", "best-wishes"],
      recipientSlugs: ["father"],
      designSlug: "royal-blue",
    },

    // MOTHER'S DAY
    {
      name: "Happy Mother's Day Gift Card", slug: "mothers-day-gift-card",
      description: "Treat mom to something special with a gift card.",
      imageUrl: "/images/gift-cards/mothers-day.jpg",
      minAmount: 50, maxAmount: 5000, fixedAmounts: [100, 200, 500, 1000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Everyday", sortOrder: 51,
      occasionSlugs: ["mothers-day", "thank-you", "best-wishes"],
      recipientSlugs: ["mother", "grandparent"],
      designSlug: "pink-festive-box",
    },

    // CHRISTMAS
    {
      name: "Merry Christmas Gift Card", slug: "merry-christmas-gift-card",
      description: "Spread the holiday cheer with a festive Christmas gift card.",
      imageUrl: "/images/gift-cards/christmas.jpg",
      minAmount: 50, maxAmount: 10000, fixedAmounts: [100, 200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Festive", sortOrder: 60,
      occasionSlugs: ["christmas", "new-year"],
      recipientSlugs: ["everyone", "for-him", "for-her", "friend", "family"],
      designSlug: "christmas-cheer",
    },

    // VALENTINE'S DAY
    {
      name: "I Love You Valentine Gift Card", slug: "iloveyou-valentine-gift-card",
      description: "Say 'I love you' with a heartfelt Valentine's gift card.",
      imageUrl: "/images/gift-cards/valentine.jpg",
      minAmount: 50, maxAmount: 5000, fixedAmounts: [100, 200, 500, 1000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Romantic", sortOrder: 61,
      occasionSlugs: ["valentines", "anniversary"],
      recipientSlugs: ["husband", "wife", "for-him", "for-her"],
      designSlug: "elegant-red",
    },

    // PHYSICAL GIFT CARDS
    {
      name: "Premium Physical Gift Card", slug: "premium-physical-gift-card",
      description: "Deliver a premium physical gift card with elegant packaging.",
      imageUrl: "/images/gift-cards/premium-physical.jpg",
      minAmount: 500, maxAmount: 50000, fixedAmounts: [500, 1000, 2000, 5000, 10000],
      customAmount: true, deliveryTypes: "PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Luxury", isFeatured: true, sortOrder: 70,
      occasionSlugs: ["birthday", "wedding", "anniversary", "christmas", "diwali", "best-wishes", "engagement"],
      recipientSlugs: ["everyone", "for-him", "for-her", "mother", "father", "boss"],
      designSlug: "black-card-box",
    },

    // SHOPPING VOUCHERS
    {
      name: "Shopping Voucher Card", slug: "shopping-voucher-card",
      description: "Give the gift of shopping. Valid across thousands of categories.",
      imageUrl: "/images/gift-cards/shopping-voucher.jpg",
      minAmount: 100, maxAmount: 25000, fixedAmounts: [200, 500, 1000, 2500, 5000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Clothing,Electronics,Beauty,Home", sortOrder: 80,
      occasionSlugs: ["birthday", "christmas", "diwali", "best-wishes", "congratulations"],
      recipientSlugs: ["for-him", "for-her", "friend", "colleague", "everyone"],
      designSlug: "royal-blue",
    },

    // FRESH / GROCERY VOUCHERS
    {
      name: "Fresh Grocery Voucher", slug: "fresh-grocery-voucher",
      description: "Treat them to fresh groceries delivered to their door.",
      imageUrl: "/images/gift-cards/grocery-voucher.jpg",
      minAmount: 100, maxAmount: 5000, fixedAmounts: [200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Grocery,Everyday", sortOrder: 81,
      occasionSlugs: ["diwali", "christmas", "best-wishes", "housewarming"],
      recipientSlugs: ["mother", "father", "everyone", "friend"],
      designSlug: "festive-rainbow",
    },

    // BRAND GIFTCARDS
    {
      name: "Fashion Brand Gift Card", slug: "fashion-brand-gift-card",
      description: "Shop top fashion brands with a single gift card.",
      imageUrl: "/images/gift-cards/fashion-brand.jpg",
      minAmount: 500, maxAmount: 10000, fixedAmounts: [1000, 2000, 5000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", brand: "Fashion", categories: "Clothing", sortOrder: 90,
      occasionSlugs: ["birthday", "anniversary", "christmas", "valentines"],
      recipientSlugs: ["for-him", "for-her", "friend", "sister", "brother"],
      designSlug: "pink-festive-box",
    },
    {
      name: "Electronics Brand Gift Card", slug: "electronics-brand-gift-card",
      description: "Perfect for tech lovers. Shop the latest electronics.",
      imageUrl: "/images/gift-cards/electronics-brand.jpg",
      minAmount: 1000, maxAmount: 50000, fixedAmounts: [2000, 5000, 10000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", brand: "Electronics", categories: "Electronics", sortOrder: 91,
      occasionSlugs: ["birthday", "congratulations", "christmas", "new-job"],
      recipientSlugs: ["for-him", "brother", "friend", "colleague"],
      designSlug: "black-card-box",
    },

    // NEW ARRIVALS
    {
      name: "Raksha Bandhan Special Gift Card", slug: "raksha-bandhan-special",
      description: "Celebrate the bond of brother-sister with a special gift card.",
      imageUrl: "/images/gift-cards/raksha-bandhan.jpg",
      minAmount: 100, maxAmount: 10000, fixedAmounts: [200, 500, 1000, 2000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Festive", isNewArrival: true, sortOrder: 100,
      occasionSlugs: ["raksha-bandhan"],
      recipientSlugs: ["brother", "sister"],
      designSlug: "festive-rainbow",
    },
    {
      name: "Holi Celebration Gift Card", slug: "holi-celebration-gift-card",
      description: "Sprinkle colors of joy with a festive Holi gift card.",
      imageUrl: "/images/gift-cards/holi.jpg",
      minAmount: 50, maxAmount: 5000, fixedAmounts: [100, 200, 500, 1000],
      customAmount: true, deliveryTypes: "E_GIFT", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Shopping,Festive", isNewArrival: true, sortOrder: 101,
      occasionSlugs: ["holi"],
      recipientSlugs: ["everyone", "for-him", "for-her", "friend"],
      designSlug: "festive-rainbow",
    },
    {
      name: "Housewarming Gift Card", slug: "housewarming-gift-card",
      description: "Help them make their new house a home.",
      imageUrl: "/images/gift-cards/housewarming.jpg",
      minAmount: 200, maxAmount: 15000, fixedAmounts: [500, 1000, 2000, 5000],
      customAmount: true, deliveryTypes: "E_GIFT,PHYSICAL", format: GiftCardFormat.STANDARD,
      seller: "Amazon", categories: "Home,Shopping", isNewArrival: true, sortOrder: 102,
      occasionSlugs: ["housewarming", "best-wishes"],
      recipientSlugs: ["friend", "colleague", "for-him", "for-her"],
      designSlug: "golden-celebration",
    },
  ];

  console.log(`  Seeding ${storeCards.length} store products...`);

  // Get all occasions and recipients for linking
  const allOccasions = await prisma.giftCardOccasion.findMany({ select: { id: true, slug: true } });
  const allRecipients = await prisma.giftCardRecipientType.findMany({ select: { id: true, slug: true } });
  const allDesigns = await prisma.giftCardDesign.findMany({ select: { id: true, slug: true } });

  const occasionMap = new Map(allOccasions.map((o) => [o.slug, o.id]));
  const recipientMap = new Map(allRecipients.map((r) => [r.slug, r.id]));
  const designMap = new Map(allDesigns.map((d) => [d.slug, d.id]));

  for (const sc of storeCards) {
    const { occasionSlugs, recipientSlugs, designSlug, ...cardData } = sc as any;

    // Parse fixedAmounts to Decimal
    const fixedAmounts = (cardData.fixedAmounts as number[]).map((a) => a);

    const card = await prisma.giftCardStore.upsert({
      where: { slug: cardData.slug },
      update: { ...cardData, fixedAmounts },
      create: { ...cardData, fixedAmounts },
    });

    // Link occasions
    if (occasionSlugs?.length) {
      const ids = occasionSlugs.map((s: string) => occasionMap.get(s)).filter(Boolean) as string[];
      await prisma.giftCardStore.update({
        where: { id: card.id },
        data: { occasions: { connect: ids.map((id: string) => ({ id })) } },
      });
    }

    // Link recipients
    if (recipientSlugs?.length) {
      const ids = recipientSlugs.map((s: string) => recipientMap.get(s)).filter(Boolean) as string[];
      await prisma.giftCardStore.update({
        where: { id: card.id },
        data: { recipients: { connect: ids.map((id: string) => ({ id })) } },
      });
    }

    // Link design
    if (designSlug) {
      const designId = designMap.get(designSlug);
      if (designId) {
        await prisma.giftCardStore.update({
          where: { id: card.id },
          data: { design: { connect: { id: designId } } },
        });
      }
    }
  }
  console.log(`  ✅ ${storeCards.length} store products`);

  console.log("✅ Gift card store seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

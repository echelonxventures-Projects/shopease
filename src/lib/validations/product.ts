import { z } from "zod";
import { stripHtml } from "./common";

// ── Enum value arrays (must match Prisma schema) ────────────────────────────

const PRODUCT_TYPES = ["PHYSICAL","DIGITAL","SUBSCRIPTION","SERVICE","BUNDLE","COMBO","FOOD","BEVERAGE","PHARMA","COSMETIC","CHEMICAL","HAZARDOUS","AUTOMOTIVE","AUTOMOTIVE_PART","REAL_ESTATE","RENTAL","LIVESTOCK","PLANT","SEED","FUEL","GAS","RAW_MATERIAL","TEXTILE","JEWELRY","PRECIOUS_METAL","ARTWORK","ANTIQUE","COLLECTIBLE","WEAPON","AMMUNITION","EXPLOSIVE","MEDICAL_DEVICE","INDUSTRIAL_EQUIPMENT","MACHINERY","SOFTWARE_LICENSE","SAAS","NFT","VIRTUAL_GOOD","GIFT_CARD","VOUCHER","TICKET","INSURANCE","FINANCIAL_PRODUCT","COURSE","EBOOK","AUDIOBOOK","MUSIC","VIDEO","GAME","APP","SPARE_PART","REFURBISHED","USED","HANDMADE","CUSTOM_MADE","MADE_TO_ORDER","PERISHABLE","FROZEN","REFRIGERATED","LIVE_ANIMAL","PET_SUPPLY","TOBACCO","ALCOHOL","CANNABIS","ADULT","FIREARM_ACCESSORY","DRONE","SATELLITE_EQUIPMENT","MARINE","AVIATION","AGRICULTURAL","CONSTRUCTION_MATERIAL","ENERGY","WASTE_RECYCLED"] as const;

const TAX_CATEGORIES = ["STANDARD","FOOD","BOOKS","PHARMA","CLOTHING","LUXURY","ALCOHOL","TOBACCO","ZERO_RATED","EXEMPT","REDUCED","SUPER_REDUCED","DIGITAL_SERVICES","FINANCIAL_SERVICES","INSURANCE","REAL_ESTATE","EDUCATION","HEALTHCARE","TRANSPORT","ENERGY","WATER","AGRICULTURE","PRECIOUS_METALS","SECOND_HAND","ART","CHILDREN_ITEMS","DISABILITY_AIDS","ENVIRONMENTAL","CARBON_TAX","EXCISE","CUSTOMS_DUTY","ANTI_DUMPING","COUNTERVAILING","CESS","SURCHARGE"] as const;

const UOM_VALUES = ["GM","KG","TON","MM","CM","METER","INCH","FT","ML","LITER","SQ_M","SQ_FT","PIECE","DOZEN","PACK","SET","BOX","BUNDLE","CAN","BAG","ROLL","SHEET","KB","MB","GB","TB","HOUR","DAY","MONTH","YEAR"] as const;

const FREIGHT_CLASSES = ["STANDARD","OVERSIZED","FRAGILE","HAZARDOUS","PERISHABLE","REFRIGERATED","FROZEN","LIVE_CARGO","HIGH_VALUE","BULK","LIQUID","GAS","RADIOACTIVE","EXPLOSIVE","FLAMMABLE","CORROSIVE","TOXIC","INFECTIOUS","MAGNETIC","TEMPERATURE_CONTROLLED","HUMIDITY_CONTROLLED","STACKABLE","NON_STACKABLE","FLAT_PACK","HANGING","ROLL","DRUM","PALLET","CONTAINER","ENVELOPE","DOCUMENT","SMALL_PARCEL","HEAVY_FREIGHT","AIR_ONLY","SEA_ONLY","GROUND_ONLY","NO_FLY"] as const;

const TRACKING_TYPES = ["NONE","SERIAL","LOT","BATCH","IMEI","VIN","MAC_ADDRESS"] as const;

const PRODUCT_CONDITIONS = ["NEW","LIKE_NEW","OPEN_BOX","REFURBISHED","CERTIFIED_REFURBISHED","USED_EXCELLENT","USED_GOOD","USED_FAIR","USED_POOR","FOR_PARTS","DAMAGED","EXPIRED","SALVAGE"] as const;

const AGE_RESTRICTIONS = ["NONE","AGE_3_PLUS","AGE_6_PLUS","AGE_12_PLUS","AGE_13_PLUS","AGE_16_PLUS","AGE_18_PLUS","AGE_21_PLUS","AGE_25_PLUS"] as const;

const ENERGY_RATINGS = ["A_PLUS_PLUS_PLUS","A_PLUS_PLUS","A_PLUS","A","B","C","D","E","F","G","NOT_RATED","ENERGY_STAR","ENERGY_STAR_MOST_EFFICIENT"] as const;

const SAFETY_CLASSES = ["GENERAL","CLASS_I","CLASS_II","CLASS_III","CLASS_IV","IP20","IP44","IP54","IP65","IP67","IP68","ATEX_ZONE_0","ATEX_ZONE_1","ATEX_ZONE_2","UL_LISTED","CE_MARKED","FCC_APPROVED","CSA_CERTIFIED","TUV_CERTIFIED"] as const;

const HAZARD_CLASSES = ["NONE","CLASS_1_EXPLOSIVES","CLASS_2_GASES","CLASS_3_FLAMMABLE_LIQUIDS","CLASS_4_FLAMMABLE_SOLIDS","CLASS_5_OXIDIZERS","CLASS_6_TOXINS","CLASS_7_RADIOACTIVE","CLASS_8_CORROSIVES","CLASS_9_MISC_DANGEROUS","ORM_D","LIMITED_QUANTITY","EXCEPTED_QUANTITY"] as const;

const WARRANTY_TYPES = ["NONE","MANUFACTURER","SELLER","EXTENDED","LIFETIME","LIMITED_LIFETIME","ACCIDENTAL_DAMAGE","INTERNATIONAL"] as const;

const RETURN_POLICIES = ["NO_RETURN","DAYS_7","DAYS_14","DAYS_30","DAYS_60","DAYS_90","DAYS_180","DAYS_365","LIFETIME","EXCHANGE_ONLY","STORE_CREDIT_ONLY","MANUFACTURER_ONLY"] as const;

const SUSTAINABILITY_CERTS = ["NONE","FSC","PEFC","RAINFOREST_ALLIANCE","FAIR_TRADE","ORGANIC_USDA","ORGANIC_EU","ORGANIC_INDIA","ORGANIC_JAS","B_CORP","CRADLE_TO_CRADLE","ENERGY_STAR","EPEAT","EU_ECOLABEL","BLUE_ANGEL","NORDIC_SWAN","GREEN_SEAL","CARBON_NEUTRAL","CARBON_NEGATIVE","PLASTIC_FREE","VEGAN","CRUELTY_FREE","OEKO_TEX","GOTS","RECYCLED_CONTENT","BIODEGRADABLE","COMPOSTABLE","ZERO_WASTE"] as const;

const COMPLIANCE_STANDARDS = ["NONE","CE","FCC","UL","CSA","TUV","ROHS","REACH","WEEE","CPSIA","PROP_65","FDA_APPROVED","EMA_APPROVED","WHO_GMP","ISO_9001","ISO_14001","ISO_22000","ISO_13485","HACCP","GMP","BIS","BRC","IFS","SQF","HALAL","KOSHER","FSSAI","USDA","EPA","DOT","IATA","IMO","ICAO","ITAR","EAR","DUAL_USE","CONFLICT_MINERALS","KIMBERLEY_PROCESS","CITES","BASEL_CONVENTION"] as const;

// ── Helpers ─────────────────────────────────────────────────────────────────

const optStr = z.string().trim().max(2000).optional().or(z.literal(""));
const optNum = z.coerce.number().optional().nullable();
const optPosNum = z.coerce.number().positive().optional().nullable();
const optInt = z.coerce.number().int().optional().nullable();
const optPosInt = z.coerce.number().int().positive().optional().nullable();
const optNonNegInt = z.coerce.number().int().nonnegative().optional().nullable();
const optBool = z.boolean().optional().default(false);
const optDate = z.coerce.date().optional().nullable();
const optStrArr = z.array(z.string().trim().max(2048)).max(100).optional().default([]);
const optJson = z.record(z.string(), z.unknown()).optional().nullable();
const optDecimal = z.coerce.number().optional().nullable();

// ── Main Schema ─────────────────────────────────────────────────────────────

export const productSchema = z.object({
  // ── Core (required) ────────────────────────────────────────────────────────
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(300, "Name too long").transform(stripHtml),
  price: z.coerce.number().positive("Price must be positive").max(99999999, "Price exceeds maximum"),
  categoryId: z.string().trim().min(1, "Category is required"),
  images: z.array(z.string().trim().url("Invalid image URL").max(2048)).min(1, "At least one image is required").max(50, "Maximum 50 images allowed"),

  // ── Core (optional) ────────────────────────────────────────────────────────
  description: optStr,
  shortDesc: z.string().max(200).optional(),
  comparePrice: optPosNum,
  brandId: optStr,
  sku: optStr,
  stock: z.coerce.number().int().min(0).default(0),
  weight: optStr,
  dimensions: optStr,
  specs: optStr,
  tags: optStr,
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  discountType: optStr,
  discountValue: optNum,
  offerStartDate: optDate,
  offerEndDate: optDate,

  // ── Product Type & Classification ──────────────────────────────────────────
  productType: z.enum(PRODUCT_TYPES).optional().default("PHYSICAL"),
  barcodes: optStrArr,
  hsCode: optStr,
  taxCategory: z.enum(TAX_CATEGORIES).optional().default("STANDARD"),
  uom: z.enum(UOM_VALUES).nullable().optional(),
  uomMultiplier: optPosNum,
  freightClass: z.enum(FREIGHT_CLASSES).nullable().optional(),
  trackingType: z.enum(TRACKING_TYPES).optional().default("NONE"),
  expiryDays: optPosInt,
  minShelfLife: optPosInt,
  isSnappable: optBool,
  digitalUrl: optStr,
  maxDownloads: optPosInt,
  downloadExpiry: optStr,
  subscriptionInterval: optStr,
  subscriptionDuration: optPosInt,
  subscriptionTrialDays: optNonNegInt,
  bundleItems: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).max(50).nullable().optional(),
  tierPricing: z.array(z.object({ minQty: z.number().int().positive(), price: z.number().positive() })).max(20).nullable().optional(),

  // ── Identification & Classification ────────────────────────────────────────
  gtin: optStr,
  gtin14: optStr,
  mpn: optStr,
  isbn: optStr,
  issn: optStr,
  upc: optStr,
  ean: optStr,
  jan: optStr,
  asin: optStr,
  unspsc: optStr,
  naicsCode: optStr,
  sitcCode: optStr,
  eccnCode: optStr,
  scheduleBCode: optStr,
  taricCode: optStr,
  htsCode: optStr,
  casNumber: optStr,
  ndc: optStr,
  atcCode: optStr,
  gmdn: optStr,
  udiCode: optStr,
  vinNumber: optStr,
  imeiNumber: optStr,
  fccId: optStr,

  // ── Condition & Lifecycle ──────────────────────────────────────────────────
  condition: z.enum(PRODUCT_CONDITIONS).optional().default("NEW"),
  conditionNote: optStr,
  manufactureDate: optDate,
  expiryDate: optDate,
  bestBeforeDate: optDate,
  harvestDate: optDate,
  vintageYear: optInt,
  modelYear: optInt,
  firstAvailableDate: optDate,
  discontinuedDate: optDate,
  endOfLifeDate: optDate,
  endOfSupportDate: optDate,

  // ── Manufacturer & Origin ──────────────────────────────────────────────────
  manufacturer: optStr,
  manufacturerUrl: optStr,
  countryOfOrigin: optStr,
  countryOfManufacture: optStr,
  regionOfOrigin: optStr,
  assembledIn: optStr,
  designedIn: optStr,
  madeInLabel: optStr,
  factoryId: optStr,
  plantCode: optStr,

  // ── Physical Attributes ────────────────────────────────────────────────────
  weightGrams: optDecimal,
  grossWeightGrams: optDecimal,
  tareWeightGrams: optDecimal,
  lengthMm: optDecimal,
  widthMm: optDecimal,
  heightMm: optDecimal,
  volumeMl: optDecimal,
  volumeCbm: optDecimal,
  diameterMm: optDecimal,
  thicknessMm: optDecimal,
  netContent: optStr,
  netContentValue: optDecimal,
  netContentUnit: optStr,
  drainedWeight: optDecimal,
  servingSize: optStr,
  servingsPerContainer: optInt,
  packageType: optStr,
  packageMaterial: optStr,
  packagingLevels: optInt,
  unitsPerPack: optInt,
  packsPerCase: optInt,
  casesPerPallet: optInt,
  palletTi: optInt,
  palletHi: optInt,

  // ── Pricing & Trade ────────────────────────────────────────────────────────
  costPrice: optDecimal,
  wholesalePrice: optDecimal,
  tradePrice: optDecimal,
  mapPrice: optDecimal,
  msrp: optDecimal,
  dutyCost: optDecimal,
  dutyRate: optDecimal,
  vatRate: optDecimal,
  exciseDuty: optDecimal,
  antiDumpingDuty: optDecimal,
  countervailingDuty: optDecimal,
  pricePerUnit: optDecimal,
  pricePerUnitLabel: optStr,
  depositAmount: optDecimal,
  currencyCode: optStr,

  // ── Compliance & Regulatory ────────────────────────────────────────────────
  complianceStandards: z.array(z.enum(COMPLIANCE_STANDARDS)).optional().default([]),
  certifications: optStrArr,
  regulatoryApprovals: optStrArr,
  licenseRequired: optBool,
  licenseType: optStr,
  importPermitRequired: optBool,
  exportRestricted: optBool,
  sanctionedCountries: optStrArr,
  embargoed: optBool,
  controlledSubstance: optBool,
  scheduleClass: optStr,
  prescriptionRequired: optBool,
  otcClassification: optStr,
  recallStatus: optStr,
  recallDate: optDate,
  recallReason: optStr,

  // ── Safety & Hazards ───────────────────────────────────────────────────────
  safetyClass: z.enum(SAFETY_CLASSES).optional().default("GENERAL"),
  hazardClass: z.enum(HAZARD_CLASSES).optional().default("NONE"),
  hazardStatements: optStrArr,
  precautionaryStatements: optStrArr,
  signalWord: optStr,
  ghsPictograms: optStrArr,
  unNumber: optStr,
  packingGroup: optStr,
  flashPoint: optStr,
  autoIgnitionTemp: optStr,
  flammabilityRating: optInt,
  healthRating: optInt,
  reactivityRating: optInt,
  sdsUrl: optStr,
  msdsUrl: optStr,
  emergencyPhone: optStr,
  firstAidInstructions: optStr,
  storageInstructions: optStr,
  disposalInstructions: optStr,
  childResistantPackaging: optBool,
  tamperEvident: optBool,

  // ── Age & Access Restrictions ──────────────────────────────────────────────
  ageRestriction: z.enum(AGE_RESTRICTIONS).optional().default("NONE"),
  ageVerificationRequired: optBool,
  adultOnly: optBool,
  restrictedRegions: optStrArr,
  geoRestrictions: optJson,

  // ── Warranty & Returns ─────────────────────────────────────────────────────
  warrantyType: z.enum(WARRANTY_TYPES).optional().default("NONE"),
  warrantyDurationMonths: optInt,
  warrantyDescription: optStr,
  warrantyUrl: optStr,
  extendedWarrantyAvailable: optBool,
  extendedWarrantyPrice: optDecimal,
  returnPolicy: z.enum(RETURN_POLICIES).optional().default("DAYS_30"),
  returnShippingPaidBy: optStr,
  restockingFeePercent: optDecimal,
  nonReturnable: optBool,
  finalSale: optBool,

  // ── Sustainability & Environment ───────────────────────────────────────────
  sustainabilityCerts: z.array(z.enum(SUSTAINABILITY_CERTS)).optional().default([]),
  carbonFootprintKg: optDecimal,
  waterFootprintL: optDecimal,
  recyclablePercent: optDecimal,
  recycledContentPercent: optDecimal,
  biodegradable: optBool,
  compostable: optBool,
  plasticFree: optBool,
  veganFriendly: optBool,
  crueltyFree: optBool,
  organicCertified: optBool,
  fairTradeCertified: optBool,
  energyRating: z.enum(ENERGY_RATINGS).optional().default("NOT_RATED"),
  annualEnergyKwh: optDecimal,
  standbyPowerW: optDecimal,
  noiseLevel: optDecimal,
  repairabilityScore: optDecimal,
  expectedLifespanYears: optDecimal,
  eprCategory: optStr,

  // ── Logistics & Shipping ───────────────────────────────────────────────────
  shippable: z.boolean().optional().default(true),
  freeShipping: optBool,
  shipsFrom: optStr,
  shipsWithin: optStr,
  deliveryLeadTimeDays: optInt,
  maxDeliveryDays: optInt,
  shippingRestrictions: optStrArr,
  oversized: optBool,
  requiresSpecialHandling: optBool,
  stackable: z.boolean().optional().default(true),
  orientationSensitive: optBool,
  temperatureMin: optDecimal,
  temperatureMax: optDecimal,
  humidityMin: optDecimal,
  humidityMax: optDecimal,
  shelfLifeDays: optInt,
  coldChainRequired: optBool,
  dangerousGoods: optBool,
  lithiumBattery: optBool,
  lithiumBatteryType: optStr,
  lithiumBatteryWh: optDecimal,
  magneticMaterial: optBool,
  customsDescription: optStr,
  exportValue: optDecimal,
  insuranceRequired: optBool,

  // ── Digital & Software ─────────────────────────────────────────────────────
  digitalDeliveryMethod: optStr,
  fileFormat: optStr,
  fileSize: optStr,
  drmProtected: optBool,
  licenseModel: optStr,
  maxActivations: optInt,
  platformCompatibility: optStrArr,
  systemRequirements: optStr,
  apiEndpoint: optStr,
  sdkAvailable: optBool,
  openSource: optBool,
  sourceCodeUrl: optStr,

  // ── Food & Beverage ────────────────────────────────────────────────────────
  ingredients: optStr,
  allergens: optStrArr,
  mayContain: optStrArr,
  nutritionFacts: optJson,
  caloriesPer100g: optDecimal,
  sugarPer100g: optDecimal,
  fatPer100g: optDecimal,
  proteinPer100g: optDecimal,
  sodiumPer100g: optDecimal,
  fiberPer100g: optDecimal,
  dietaryFlags: optStrArr,
  alcoholByVolume: optDecimal,
  caffeineContent: optDecimal,
  organicPercentage: optDecimal,
  gmoFree: optBool,
  additiveFree: optBool,
  preservativeFree: optBool,
  artificialColorFree: optBool,
  sugarFree: optBool,
  lactoseFree: optBool,
  glutenFree: optBool,
  nutFree: optBool,
  soyFree: optBool,
  halalCertified: optBool,
  kosherCertified: optBool,
  jainFriendly: optBool,
  storageConditions: optStr,
  preparationInstructions: optStr,
  servingSuggestion: optStr,

  // ── Pharma & Health ────────────────────────────────────────────────────────
  activeIngredient: optStr,
  dosageForm: optStr,
  strength: optStr,
  routeOfAdministration: optStr,
  indicationsForUse: optStr,
  contraindications: optStr,
  sideEffects: optStr,
  drugInteractions: optStr,
  pregnancyCategory: optStr,
  pediatricUse: optBool,
  geriatricUse: optBool,
  therapeuticClass: optStr,
  pharmacologicalClass: optStr,
  bioequivalent: optBool,
  genericName: optStr,
  brandedGeneric: optBool,
  biologicProduct: optBool,
  biosimilar: optBool,
  orphanDrug: optBool,
  controlledRelease: optBool,
  refrigerationRequired: optBool,
  lightSensitive: optBool,
  moistureSensitive: optBool,

  // ── Automotive & Vehicles ──────────────────────────────────────────────────
  vehicleMake: optStr,
  vehicleModel: optStr,
  vehicleYear: optInt,
  vehicleEngine: optStr,
  vehicleTransmission: optStr,
  vehicleFuelType: optStr,
  vehicleDriveType: optStr,
  vehicleMileage: optInt,
  vehicleColor: optStr,
  vehicleVin: optStr,
  vehicleRegistration: optStr,
  emissionStandard: optStr,
  fuelEfficiency: optStr,
  co2Emissions: optDecimal,
  batteryCapacityKwh: optDecimal,
  rangeKm: optDecimal,
  towingCapacityKg: optDecimal,
  seatingCapacity: optInt,
  oem: optBool,
  aftermarket: optBool,
  fitmentData: optJson,

  // ── Real Estate & Property ─────────────────────────────────────────────────
  propertyType: optStr,
  propertyArea: optDecimal,
  propertyAreaUnit: optStr,
  bedrooms: optInt,
  bathrooms: optInt,
  floors: optInt,
  yearBuilt: optInt,
  lotSize: optDecimal,
  lotSizeUnit: optStr,
  zoning: optStr,
  propertyTax: optDecimal,
  hoaFee: optDecimal,
  furnished: optStr,
  parkingSpaces: optInt,
  garageSpaces: optInt,
  propertyFeatures: optStrArr,
  energyCertificate: optStr,
  floodZone: optBool,
  latitude: optDecimal,
  longitude: optDecimal,

  // ── Jewelry & Precious Items ───────────────────────────────────────────────
  metalType: optStr,
  metalPurity: optStr,
  gemstoneType: optStr,
  gemstoneCarat: optDecimal,
  gemstoneClarity: optStr,
  gemstoneColor: optStr,
  gemstoneCut: optStr,
  gemstoneCertification: optStr,
  hallmarkNumber: optStr,
  assayOffice: optStr,

  // ── Textiles & Fashion ─────────────────────────────────────────────────────
  material: optStr,
  fabricWeight: optStr,
  careInstructions: optStrArr,
  sizeChart: optJson,
  fitType: optStr,
  gender: optStr,
  ageGroup: optStr,
  season: optStr,
  colorFamily: optStr,
  pattern: optStr,
  closure: optStr,
  collarType: optStr,
  sleeveLength: optStr,
  hemLength: optStr,

  // ── Electronics & Technical ────────────────────────────────────────────────
  powerConsumption: optStr,
  voltage: optStr,
  frequency: optStr,
  plugType: optStr,
  batteryType: optStr,
  batteryCapacity: optStr,
  batteryLife: optStr,
  connectivity: optStrArr,
  wirelessStandard: optStr,
  displaySize: optStr,
  displayResolution: optStr,
  displayType: optStr,
  processorType: optStr,
  ramSize: optStr,
  storageSize: optStr,
  operatingSystem: optStr,
  waterResistance: optStr,
  dustResistance: optStr,
  shockResistance: optBool,
  operatingTempMin: optDecimal,
  operatingTempMax: optDecimal,
  certificationMarks: optStrArr,

  // ── Services & Subscriptions ───────────────────────────────────────────────
  serviceArea: optStr,
  serviceHours: optStr,
  responseTimeSla: optStr,
  serviceLevel: optStr,
  contractTermMonths: optInt,
  autoRenew: optBool,
  cancellationPolicy: optStr,
  setupFee: optDecimal,
  recurringFee: optDecimal,
  usageBasedPricing: optBool,
  freeTrialDays: optInt,
  maxUsers: optInt,
  storageQuota: optStr,
  apiCallsPerMonth: optInt,
  slaUptime: optDecimal,

  // ── Custom & Configurable ──────────────────────────────────────────────────
  customizable: optBool,
  personalizationOptions: optJson,
  madeToOrderLeadDays: optInt,
  minOrderQuantity: optInt,
  maxOrderQuantity: optInt,
  bulkDiscountTiers: optJson,
  sampleAvailable: optBool,
  samplePrice: optDecimal,
  preOrderAvailable: optBool,
  preOrderDate: optDate,
  backOrderAllowed: optBool,
  limitedEdition: optBool,
  editionSize: optInt,
  editionNumber: optStr,

  // ── SEO & Marketing ────────────────────────────────────────────────────────
  metaTitle: optStr,
  metaDescription: optStr,
  metaKeywords: optStrArr,
  canonicalUrl: optStr,
  googleProductCategory: optStr,
  facebookProductCategory: optStr,
  searchTerms: optStrArr,
  promotionText: optStr,
  badgeText: optStr,
  videoUrl: optStr,
  video360Url: optStr,
  arModelUrl: optStr,
  sizeguideUrl: optStr,
  documentUrls: optStrArr,
});

export type ProductInput = z.infer<typeof productSchema>;

// ── Brand-Category validation (async, used in server actions) ────────────────

import { prisma } from "@/lib/prisma";

export async function validateBrandCategory(brandId: string | undefined | null, categoryId: string): Promise<void> {
  if (!brandId) return; // no brand selected, skip
  const mapping = await prisma.brandCategory.findUnique({
    where: { brandId_categoryId: { brandId, categoryId } },
  });
  if (!mapping) {
    // Also check parent category
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { parentId: true } });
    if (category?.parentId) {
      const parentMapping = await prisma.brandCategory.findUnique({
        where: { brandId_categoryId: { brandId, categoryId: category.parentId } },
      });
      if (parentMapping) return;
    }
    throw new Error("Selected brand does not belong to the chosen category. Please assign the brand to this category first.");
  }
}

// Re-export enum arrays for use in form dropdowns
export {
  PRODUCT_TYPES,
  TAX_CATEGORIES,
  UOM_VALUES,
  FREIGHT_CLASSES,
  TRACKING_TYPES,
  PRODUCT_CONDITIONS,
  AGE_RESTRICTIONS,
  ENERGY_RATINGS,
  SAFETY_CLASSES,
  HAZARD_CLASSES,
  WARRANTY_TYPES,
  RETURN_POLICIES,
  SUSTAINABILITY_CERTS,
  COMPLIANCE_STANDARDS,
};

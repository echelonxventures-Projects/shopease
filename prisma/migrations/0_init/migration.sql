-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('PLANET', 'REGION', 'COUNTRY', 'STATE', 'DISTRICT', 'VILLAGE', 'CITY', 'FACILITY');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'CUSTOMER_CARE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PHYSICAL', 'DIGITAL', 'SUBSCRIPTION', 'SERVICE', 'BUNDLE', 'COMBO');

-- CreateEnum
CREATE TYPE "UOMCategory" AS ENUM ('WEIGHT', 'LENGTH', 'VOLUME', 'AREA', 'COUNT', 'TIME', 'DIGITAL', 'FUEL_ENERGY');

-- CreateEnum
CREATE TYPE "UOM" AS ENUM ('GM', 'KG', 'TON', 'MM', 'CM', 'METER', 'INCH', 'FT', 'ML', 'LITER', 'SQ_M', 'SQ_FT', 'PIECE', 'DOZEN', 'PACK', 'SET', 'BOX', 'BUNDLE', 'CAN', 'BAG', 'ROLL', 'SHEET', 'KB', 'MB', 'GB', 'TB', 'HOUR', 'DAY', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "FreightClass" AS ENUM ('STANDARD', 'OVERSIZED', 'FRAGILE', 'HAZARDOUS', 'PERISHABLE', 'REFRIGERATED');

-- CreateEnum
CREATE TYPE "TaxCategory" AS ENUM ('STANDARD', 'FOOD', 'BOOKS', 'PHARMA', 'CLOTHING', 'LUXURY', 'ALCOHOL', 'TOBACCO');

-- CreateEnum
CREATE TYPE "ProductTrackingType" AS ENUM ('NONE', 'SERIAL', 'LOT');

-- CreateEnum
CREATE TYPE "SupplierIdType" AS ENUM ('GSTIN', 'PAN', 'EIN', 'VAT', 'ABN', 'SST', 'BUSINESS_REG', 'TAX_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "SupplierVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryLogType" AS ENUM ('PURCHASE_RECEIPT', 'SALE_DEDUCTION', 'RETURN', 'ADJUSTMENT', 'TRANSFER', 'INITIAL');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SHIPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('LLC', 'CORPORATION', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'NONPROFIT', 'GOVERNMENT', 'EDUCATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BusinessVerificationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BusinessUserRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'BUYER');

-- CreateEnum
CREATE TYPE "RFQStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'CLOSED', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RFQPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RFQResponseStatus" AS ENUM ('PENDING', 'SUBMITTED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "B2BPaymentTerms" AS ENUM ('CASH', 'NET_15', 'NET_30', 'NET_60', 'NET_90');

-- CreateEnum
CREATE TYPE "TaxExemptionType" AS ENUM ('GST_EXEMPT', 'VAT_EXEMPT', 'RESALE_CERTIFICATE', 'NONPROFIT_EXEMPT', 'GOVERNMENT_EXEMPT', 'EDUCATIONAL_EXEMPT');

-- CreateEnum
CREATE TYPE "PromoType" AS ENUM ('BANK_OFFER', 'BRAND_OFFER', 'CATEGORY_OFFER', 'FLASH_SALE', 'FESTIVE_OFFER', 'BOGO', 'COMBO', 'TIME_BASED', 'MINIMUM_SPEND', 'COUPON', 'SEASONAL', 'NEW_USER');

-- CreateEnum
CREATE TYPE "PromoStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('PERCENTAGE', 'FLAT', 'FREE_ITEM', 'BUY_X_GET_Y');

-- CreateEnum
CREATE TYPE "PromotionConditionType" AS ENUM ('PRODUCT_IN', 'CATEGORY_IN', 'BRAND_IN', 'MIN_ORDER_VALUE', 'MIN_QUANTITY', 'MAX_ORDER_VALUE', 'EXCLUDED_PRODUCT', 'USER_TAG', 'LOCATION', 'PAYMENT_METHOD', 'TIME_WINDOW', 'FIRST_ORDER', 'MIN_ITEM_PRICE', 'CART_HAS_VARIANT');

-- CreateEnum
CREATE TYPE "PromotionEffectType" AS ENUM ('PERCENTAGE_OFF', 'FLAT_OFF', 'FREE_ITEM', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'SHIPPING_FLAT_FEE', 'SHIPPING_DISCOUNT', 'BANK_CASHBACK', 'PAYMENT_METHOD_DISCOUNT');

-- CreateEnum
CREATE TYPE "PromotionStackStrategy" AS ENUM ('BEST_WINS', 'ADDITIVE', 'EXCLUSIVE');

-- CreateEnum
CREATE TYPE "EffectScope" AS ENUM ('ITEM', 'SHIPPING', 'TOTAL');

-- CreateEnum
CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "PriceTrigger" AS ENUM ('HIGH_STOCK', 'LOW_STOCK', 'EXPIRY_SOON', 'DEMAND_SPIKE', 'COMPETITOR_LOW', 'SEASON_END');

-- CreateEnum
CREATE TYPE "BehavioralType" AS ENUM ('BROWSE_ABANDONMENT', 'CART_ABANDONMENT', 'WIN_BACK', 'INACTIVE_USER', 'REPEAT_PURCHASE', 'CATEGORY_EXPLORER');

-- CreateEnum
CREATE TYPE "GamificationType" AS ENUM ('SPIN_WHEEL', 'SCRATCH_CARD', 'MYSTERY_BOX', 'TREASURE_HUNT');

-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('CARD', 'UPI', 'WALLET', 'NETBANKING', 'BNPL', 'CRYPTO', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'APPLE_PAY', 'GOOGLE_PAY', 'PAYPAL', 'KLARNA', 'AFTERPAY');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ORDER_ISSUE', 'PRODUCT_QUESTION', 'PAYMENT_PROBLEM', 'DELIVERY_ISSUE', 'ACCOUNT_ISSUE', 'TECHNICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_MERCHANT', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'MARKETING_EMAILS', 'MARKETING_SMS', 'COOKIES_ANALYTICS', 'COOKIES_MARKETING');

-- CreateEnum
CREATE TYPE "ActivitySeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ORDER', 'PROMOTION');

-- CreateEnum
CREATE TYPE "DeliveryAgentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'AVAILABLE', 'ON_DELIVERY', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'CAR', 'VAN', 'BIKE_ELECTRIC');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('PICKED_UP', 'IN_TRANSIT', 'NEARBY', 'DELIVERED', 'EXCEPTION', 'LOCATION_UPDATE');

-- CreateEnum
CREATE TYPE "WalletTxnType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TierBalanceMode" AS ENUM ('SHARED', 'SEPARATE');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('AMOUNT', 'PERCENTAGE', 'CASHBACK', 'BONUS');

-- CreateEnum
CREATE TYPE "GiftCardTxnType" AS ENUM ('CREDIT', 'DEBIT', 'ADJUSTMENT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "GiftCardDeliveryType" AS ENUM ('E_GIFT', 'PHYSICAL');

-- CreateEnum
CREATE TYPE "GiftCardFormat" AS ENUM ('STANDARD', 'ANIMATED', 'PHOTO');

-- CreateEnum
CREATE TYPE "TopUpMethod" AS ENUM ('UPI', 'CARD', 'NETBANKING', 'WALLET');

-- CreateEnum
CREATE TYPE "TopUpStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "LocationType" NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_translations" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "location_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_profiles" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "supportedLocales" TEXT[],
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0.18,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "dialCode" TEXT,
    "callingCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currencySymbol" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL,
    "supportedLocales" TEXT[],
    "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0.18,
    "taxInclusive" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDesc" TEXT,
    "description" TEXT,
    "tags" TEXT[],

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRegionPrice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "comparePrice" DECIMAL(65,30),
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(65,30),

    CONSTRAINT "ProductRegionPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRegionAvailability" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ProductRegionAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandTranslation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "BrandTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "locale" TEXT DEFAULT 'en',
    "regionId" TEXT,
    "siteId" TEXT,
    "avatar" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "wishlistShareToken" TEXT,
    "aiSegment" TEXT,
    "aiPreferences" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "type" "AddressType" NOT NULL DEFAULT 'HOME',
    "countryId" TEXT,
    "stateId" TEXT,
    "districtId" TEXT,
    "villageId" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "landmark" VARCHAR(255),
    "addressLabel" VARCHAR(50),
    "deliveryNote" TEXT,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "parentId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDesc" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "comparePrice" DECIMAL(65,30),
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(65,30),
    "offerStartDate" TIMESTAMP(3),
    "offerEndDate" TIMESTAMP(3),
    "images" TEXT[],
    "thumbnail" TEXT,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "weight" TEXT,
    "dimensions" TEXT,
    "hasVariants" BOOLEAN NOT NULL DEFAULT false,
    "specs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "avgRating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "productType" "ProductType" NOT NULL DEFAULT 'PHYSICAL',
    "barcodes" TEXT[],
    "hsCode" TEXT,
    "taxCategory" "TaxCategory" NOT NULL DEFAULT 'STANDARD',
    "uom" "UOM",
    "uomMultiplier" DECIMAL(65,30),
    "freightClass" "FreightClass",
    "trackingType" "ProductTrackingType" NOT NULL DEFAULT 'NONE',
    "expiryDays" INTEGER,
    "minShelfLife" INTEGER,
    "isSnappable" BOOLEAN NOT NULL DEFAULT false,
    "digitalUrl" TEXT,
    "maxDownloads" INTEGER,
    "downloadExpiry" TIMESTAMP(3),
    "subscriptionInterval" TEXT,
    "subscriptionDuration" INTEGER,
    "subscriptionTrialDays" INTEGER,
    "bundleItems" JSONB,
    "tierPricing" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "masterStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "masterCategory" TEXT,
    "aiScore" DOUBLE PRECISION,
    "aiTags" JSONB,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_types" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_option_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_option_values" (
    "id" TEXT NOT NULL,
    "optionTypeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "hexColor" TEXT,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(65,30) NOT NULL,
    "comparePrice" DECIMAL(65,30),
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(65,30),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "weight" TEXT,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "barcodes" TEXT[],
    "hsCode" TEXT,
    "trackingType" "ProductTrackingType" NOT NULL DEFAULT 'NONE',
    "expiryDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_option_values" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "optionValueId" TEXT NOT NULL,

    CONSTRAINT "variant_option_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "locationId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowStock" INTEGER NOT NULL DEFAULT 5,
    "avgCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "locationId" TEXT,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference" TEXT,
    "referenceType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "supplierUniqueId" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "gstin" TEXT,
    "taxId" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "countryId" TEXT,
    "stateId" TEXT,
    "idType" "SupplierIdType" NOT NULL DEFAULT 'TAX_ID',
    "verificationStatus" "SupplierVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suppliers" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierSku" TEXT,
    "costPrice" DECIMAL(65,30),
    "leadTimeDays" INTEGER,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_listings" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "listingSku" TEXT,
    "listingPrice" DECIMAL(65,30) NOT NULL,
    "comparePrice" DECIMAL(65,30),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "shippingWeight" DECIMAL(65,30),
    "shippingLength" DECIMAL(65,30),
    "shippingWidth" DECIMAL(65,30),
    "shippingHeight" DECIMAL(65,30),
    "tags" TEXT[],
    "extraImages" TEXT[],
    "description" TEXT,
    "keywords" TEXT[],
    "enabledAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "locationId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "expectedDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3),
    "notes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "sentDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sentQuantity" INTEGER NOT NULL DEFAULT 0,
    "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
    "returnQuantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" TEXT NOT NULL,
    "inventoryId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "supplierId" TEXT,
    "locationId" TEXT,
    "type" "InventoryLogType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "beforeQuantity" INTEGER NOT NULL,
    "afterQuantity" INTEGER NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "reference" TEXT,
    "userId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_returns" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "shippedDate" TIMESTAMP(3),
    "receivedBySupplierDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_return_items" (
    "id" TEXT NOT NULL,
    "supplierReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "supplier_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "shippingCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL,
    "shippingAddress" JSONB NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntent" TEXT,
    "trackingCode" TEXT,
    "notes" TEXT,
    "couponCode" TEXT,
    "orderNotes" TEXT,
    "isGift" BOOLEAN NOT NULL DEFAULT false,
    "giftMessage" TEXT,
    "giftWrapFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deliverySlotId" TEXT,
    "isExpress" BOOLEAN NOT NULL DEFAULT false,
    "expressFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "codFee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isGuestOrder" BOOLEAN NOT NULL DEFAULT false,
    "guestEmail" TEXT,
    "shareToken" TEXT,
    "regionId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "siteId" TEXT,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_votes" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_questions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT,
    "isSeller" BOOLEAN NOT NULL DEFAULT false,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "oldPrice" DECIMAL(65,30),
    "regionId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_drop_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "targetPrice" DECIMAL(65,30) NOT NULL,
    "triggeredAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_drop_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_deals" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(65,30) NOT NULL,
    "dealDate" TIMESTAMP(3) NOT NULL,
    "bannerImage" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_stories" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "heroImage" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_shares" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "platform" TEXT NOT NULL,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_slots" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeFrom" TIMESTAMP(3) NOT NULL,
    "timeTo" TIMESTAMP(3) NOT NULL,
    "maxOrders" INTEGER NOT NULL DEFAULT 100,
    "bookedOrders" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "shareToken" TEXT,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "shareToken" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_list_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL DEFAULT 'OTHER',
    "industry" TEXT,
    "companySize" TEXT,
    "website" TEXT,
    "gstNumber" TEXT,
    "taxId" TEXT,
    "panNumber" TEXT,
    "registrationNumber" TEXT,
    "registeredCountry" TEXT,
    "businessAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "countryId" TEXT,
    "stateId" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "verificationStatus" "BusinessVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "logo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_documents" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docNumber" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_verifications" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "BusinessVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "steps" JSONB,
    "assignedAdminId" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_users" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BusinessUserRole" NOT NULL DEFAULT 'BUYER',
    "email" TEXT,
    "inviteToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "lastActive" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_approval_rules" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minOrderAmount" DECIMAL(12,2),
    "maxDiscount" DECIMAL(5,2),
    "approverRole" "BusinessUserRole",
    "approverId" TEXT,
    "requiresMultiApprover" BOOLEAN NOT NULL DEFAULT false,
    "minApprovers" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfqs" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RFQStatus" NOT NULL DEFAULT 'OPEN',
    "category" TEXT,
    "priority" "RFQPriority" NOT NULL DEFAULT 'MEDIUM',
    "deadline" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_items" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PIECE',
    "targetPrice" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "rfq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_responses" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "RFQResponseStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rfq_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfq_response_items" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'PIECE',
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(5,2),
    "deliveryDays" INTEGER,
    "leadTime" TEXT,
    "notes" TEXT,

    CONSTRAINT "rfq_response_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_tax_exemptions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "exemptionType" "TaxExemptionType" NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "issuedBy" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_tax_exemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state_tax_rules" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "taxType" TEXT NOT NULL,
    "cgstRate" DECIMAL(5,2),
    "sgstRate" DECIMAL(5,2),
    "igstRate" DECIMAL(5,2),
    "totalRate" DECIMAL(5,2) NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "state_tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "purchaseOrderNumber" TEXT,
    "taxExempt" BOOLEAN NOT NULL DEFAULT false,
    "taxExemptionId" TEXT,
    "paymentTerms" "B2BPaymentTerms" NOT NULL DEFAULT 'CASH',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNotes" TEXT,
    "totalBeforeTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAfterTax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_tier_prices" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "price" DECIMAL(12,2),
    "discountPercentage" DECIMAL(5,2),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_tier_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalSpend" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "avgOrderValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "categoryBreakdown" JSONB,
    "topProducts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeHash" TEXT,
    "encryptedCode" TEXT,
    "description" TEXT,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(65,30) NOT NULL,
    "minOrderValue" DECIMAL(65,30),
    "maxDiscount" DECIMAL(65,30),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "codeHash" TEXT,
    "encryptedCode" TEXT,
    "type" "PromoType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "PromoStatus" NOT NULL DEFAULT 'DRAFT',
    "discountType" "PromoDiscountType" NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "minOrderValue" DECIMAL(65,30),
    "minQuantity" INTEGER,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "applicableProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicableCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicableBrandIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludedProductIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rules" JSONB,
    "stackingGroup" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appOnly" BOOLEAN NOT NULL DEFAULT false,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoTranslation" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PromoTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoUsage" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "discount" DECIMAL(65,30) NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_conditions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "type" "PromotionConditionType" NOT NULL,
    "scope" TEXT,
    "value" TEXT,
    "minValue" DECIMAL(65,30),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_effects" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "type" "PromotionEffectType" NOT NULL,
    "value" DECIMAL(65,30),
    "maxDiscount" DECIMAL(65,30),
    "scope" "EffectScope" NOT NULL DEFAULT 'TOTAL',
    "config" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_effects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_links" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "promotion_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_offers" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "cardType" TEXT NOT NULL DEFAULT 'ALL',
    "discountType" "PromotionEffectType" NOT NULL,
    "discountValue" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "minOrderValue" DECIMAL(65,30),
    "emiTenure" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_promotions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "type" "PromotionEffectType" NOT NULL,
    "discountValue" DECIMAL(65,30),
    "maxDiscount" DECIMAL(65,30),
    "minOrderValue" DECIMAL(65,30),
    "maxWeightKg" DECIMAL(65,30),
    "appliesToZone" TEXT,
    "zoneIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliverySpeed" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_promotions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "methodType" TEXT NOT NULL,
    "gatewayId" TEXT,
    "discountType" "PromotionEffectType" NOT NULL,
    "discountValue" DECIMAL(65,30),
    "maxDiscount" DECIMAL(65,30),
    "minOrderValue" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_method_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_stack_rules" (
    "id" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "strategy" "PromotionStackStrategy" NOT NULL DEFAULT 'BEST_WINS',
    "maxPromos" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "promotion_stack_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clipped_coupons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "clippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),

    CONSTRAINT "clipped_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pointsPerRupee" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "minRedeemPoints" INTEGER NOT NULL DEFAULT 100,
    "pointsExpiryDays" INTEGER NOT NULL DEFAULT 365,
    "tierBronzeMin" INTEGER NOT NULL DEFAULT 0,
    "tierSilverMin" INTEGER NOT NULL DEFAULT 5000,
    "tierGoldMin" INTEGER NOT NULL DEFAULT 20000,
    "tierPlatinumMin" INTEGER NOT NULL DEFAULT 50000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_promos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "referrerReward" DECIMAL(65,30) NOT NULL,
    "refereeReward" DECIMAL(65,30) NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardValue" DECIMAL(65,30) NOT NULL,
    "maxRewardUsages" INTEGER,
    "minOrderValue" DECIMAL(65,30),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "referralPromoId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "referrerReward" DECIMAL(65,30) NOT NULL,
    "refereeReward" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "refereeOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lightning_deals" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "totalSlots" INTEGER NOT NULL,
    "claimedSlots" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "lightning_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lightning_deal_claims" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lightning_deal_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multi_buy_tiers" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "tiers" JSONB NOT NULL,
    "appliesToScope" TEXT NOT NULL DEFAULT 'CART',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "multi_buy_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_with_purchases" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "minOrderValue" DECIMAL(65,30) NOT NULL,
    "giftProductId" TEXT NOT NULL,
    "maxGifts" INTEGER NOT NULL DEFAULT 1,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_with_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cross_category_bundles" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "categoryIds" TEXT[],
    "bundleDiscountType" TEXT NOT NULL,
    "bundleDiscountValue" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "minItemsPerCategory" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cross_category_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_promo_triggers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" "PriceTrigger" NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "condition" JSONB NOT NULL,
    "promoId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_promo_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dynamic_price_rules" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "basePrice" DECIMAL(65,30) NOT NULL,
    "minPrice" DECIMAL(65,30),
    "maxPrice" DECIMAL(65,30),
    "demandMultiplier" DECIMAL(65,30) DEFAULT 1,
    "stockDiscount" DECIMAL(65,30),
    "lastPriceAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priceHistory" JSONB,

    CONSTRAINT "dynamic_price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_promo_triggers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BehavioralType" NOT NULL,
    "condition" JSONB NOT NULL,
    "promoId" TEXT,
    "maxTriggersPerUser" INTEGER,
    "cooldownHours" INTEGER NOT NULL DEFAULT 24,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_promo_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "browse_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "productId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,

    CONSTRAINT "browse_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "abandonedAt" TIMESTAMP(3),
    "promoTriggered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cart_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_analytics" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenueWith" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "revenueWithout" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "conversionRate" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_clicks" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "metadata" JSONB,

    CONSTRAINT "promo_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_schedulers" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3),
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,
    "lastState" TEXT,
    "auditLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_schedulers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_budget_caps" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "totalBudget" DECIMAL(65,30) NOT NULL,
    "spent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dailyLimit" DECIMAL(65,30),
    "dailySpent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastResetDate" TIMESTAMP(3),
    "isExceeded" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_budget_caps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_promos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "promoIdA" TEXT NOT NULL,
    "promoIdB" TEXT NOT NULL,
    "trafficSplit" INTEGER NOT NULL DEFAULT 50,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "winnerPromoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_assignments" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamified_promos" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GamificationType" NOT NULL,
    "prizes" JSONB NOT NULL,
    "maxPerUser" INTEGER NOT NULL DEFAULT 1,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "totalPrizes" INTEGER NOT NULL,
    "claimedPrizes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamified_promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamified_plays" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeType" TEXT NOT NULL,
    "prizeValue" DECIMAL(65,30) NOT NULL,
    "promoIdApplied" TEXT,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamified_plays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_promo_triggers" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL DEFAULT 'CONTAINS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_promo_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pincode_promos" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "pincodes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pincode_promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_deals" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "requiredTier" "LoyaltyTier" NOT NULL,
    "requiredTag" TEXT,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribe_promos" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tieredDiscounts" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribe_promos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_explanations" (
    "id" TEXT NOT NULL,
    "promoId" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGateway" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayRegion" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "currency" TEXT,

    CONSTRAINT "PaymentGatewayRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGatewayMethod" (
    "id" TEXT NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "method" "PaymentMethodType" NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,

    CONSTRAINT "PaymentGatewayMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "gatewayId" TEXT,
    "method" "PaymentMethodType" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerTxnId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "siteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'ORDER_ISSUE',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT[],
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemActivity" (
    "id" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "details" TEXT,
    "severity" "ActivitySeverity" NOT NULL DEFAULT 'INFO',
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotifType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "regionId" TEXT,
    "facilityLocationId" TEXT,
    "centerLat" DECIMAL(9,6),
    "centerLng" DECIMAL(9,6),
    "radiusKm" DECIMAL(5,2) NOT NULL DEFAULT 3,
    "isGeoFenced" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deliveryTimeMin" INTEGER NOT NULL DEFAULT 10,
    "deliveryTimeMax" INTEGER NOT NULL DEFAULT 30,
    "minOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliveryFee" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "freeDeliveryFrom" DECIMAL(10,2),
    "coveragePolygon" JSONB,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_fulfillment_centers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20),
    "zoneId" TEXT NOT NULL,
    "locationId" TEXT,
    "addressLine" TEXT,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "contactPhone" TEXT,
    "operatingHours" JSONB,
    "inventoryCapacity" INTEGER NOT NULL DEFAULT 5000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "micro_fulfillment_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "vehicleType" "VehicleType" NOT NULL DEFAULT 'BIKE',
    "vehicleNumber" VARCHAR(20),
    "licenseNo" VARCHAR(50),
    "currentLat" DECIMAL(9,6),
    "currentLng" DECIMAL(9,6),
    "status" "DeliveryAgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "zoneId" TEXT,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 4.5,
    "totalDeliveries" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_assignments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryAgentId" TEXT NOT NULL,
    "zoneId" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'ASSIGNED',
    "pickupLat" DECIMAL(9,6),
    "pickupLng" DECIMAL(9,6),
    "pickupAt" TIMESTAMP(3),
    "deliveryLat" DECIMAL(9,6),
    "deliveryLng" DECIMAL(9,6),
    "customerLandmark" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "route" JSONB,
    "notes" TEXT,
    "estimatedEta" TIMESTAMP(3),
    "actualDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_tracking_events" (
    "id" TEXT NOT NULL,
    "deliveryAssignmentId" TEXT NOT NULL,
    "eventType" "TrackingEventType" NOT NULL,
    "lat" DECIMAL(9,6),
    "lng" DECIMAL(9,6),
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_tracking_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTxnType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balanceBefore" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "regionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherTier" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#2563eb',
    "balanceMode" "TierBalanceMode" NOT NULL DEFAULT 'SHARED',
    "minPurchasePrice" DECIMAL(65,30),
    "maxRedemptionPerOrder" DECIMAL(65,30) DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherTierTranslation" (
    "id" TEXT NOT NULL,
    "voucherTierId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "VoucherTierTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeHash" TEXT,
    "encryptedCode" TEXT,
    "type" "VoucherType" NOT NULL DEFAULT 'AMOUNT',
    "faceValue" DECIMAL(65,30) NOT NULL,
    "purchasePrice" DECIMAL(65,30) NOT NULL,
    "denomination" DECIMAL(65,30),
    "redeemRate" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expiryDays" INTEGER NOT NULL DEFAULT 365,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voucherTierId" TEXT,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherRedemption" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "voucherCode" TEXT NOT NULL,
    "codeHash" TEXT,
    "redemptionToken" TEXT,
    "voucherTierId" TEXT,
    "faceValue" DECIMAL(65,30) NOT NULL,
    "redeemRate" DECIMAL(65,30) NOT NULL,
    "creditAmount" DECIMAL(65,30) NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherAttempt" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT,
    "codeHash" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherTierBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voucherTierId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherTierBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeHash" TEXT,
    "encryptedCode" TEXT,
    "tierId" TEXT,
    "faceValue" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "totalRedeemed" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCardTransaction" (
    "id" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "type" "GiftCardTxnType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "balanceBefore" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCardTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_occasions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_occasions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_recipient_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_recipient_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_designs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "themeColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_designs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "images" JSONB,
    "minAmount" DECIMAL(65,30) NOT NULL,
    "maxAmount" DECIMAL(65,30) NOT NULL,
    "fixedAmounts" DECIMAL(65,30)[],
    "customAmount" BOOLEAN NOT NULL DEFAULT true,
    "deliveryTypes" TEXT NOT NULL DEFAULT 'E_GIFT',
    "format" "GiftCardFormat" NOT NULL DEFAULT 'STANDARD',
    "isBestseller" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "seller" TEXT,
    "brand" TEXT,
    "categories" TEXT,
    "languages" TEXT,
    "countryOfOrigin" TEXT NOT NULL DEFAULT 'IN',
    "designId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_orders" (
    "id" TEXT NOT NULL,
    "storeCardId" TEXT NOT NULL,
    "giftCardId" TEXT,
    "buyerId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientName" TEXT,
    "message" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "deliveryType" "GiftCardDeliveryType" NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "orderNo" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_card_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_links" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_content" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "heroContent" TEXT,
    "sections" JSONB,
    "formConfig" JSONB,
    "faq" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTopUp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" "TopUpMethod" NOT NULL,
    "status" "TopUpStatus" NOT NULL DEFAULT 'PENDING',
    "referenceId" TEXT,
    "gatewayData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTopUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_category_rules" (
    "id" TEXT NOT NULL,
    "taxCategory" "TaxCategory" NOT NULL,
    "regionId" TEXT,
    "taxRate" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_category_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uom" (
    "id" TEXT NOT NULL,
    "code" "UOM" NOT NULL,
    "name" TEXT NOT NULL,
    "category" "UOMCategory" NOT NULL,
    "symbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uom_conversions" (
    "id" TEXT NOT NULL,
    "fromUomId" TEXT NOT NULL,
    "toUomId" TEXT NOT NULL,
    "factor" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uom_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uom_translations" (
    "id" TEXT NOT NULL,
    "uomId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,

    CONSTRAINT "uom_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serial_lot_tracking" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "type" "ProductTrackingType" NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "manufacturingDate" TIMESTAMP(3),
    "locationId" TEXT,
    "supplierId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serial_lot_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_subscriptions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "trialDays" INTEGER DEFAULT 0,
    "billingCycles" INTEGER,
    "setupFee" DECIMAL(65,30) DEFAULT 0,
    "cancelAnytime" BOOLEAN NOT NULL DEFAULT true,
    "pauseAllowed" BOOLEAN NOT NULL DEFAULT true,
    "maxPauses" INTEGER DEFAULT 2,
    "pauseDays" INTEGER DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEnd" TIMESTAMP(3),
    "nextBillingDate" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "pauseUntil" TIMESTAMP(3),
    "lastChargedAt" TIMESTAMP(3),
    "paymentMethodId" TEXT,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_prices" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "price" DECIMAL(65,30),
    "discountPercentage" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tier_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_items" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_barcodes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "priceAlerts" BOOLEAN NOT NULL DEFAULT true,
    "promotions" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "productId" TEXT,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "isAgent" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "callback_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userPhone" TEXT NOT NULL,
    "preferredTime" TIMESTAMP(3),
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "agentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "callback_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "rateToINR" DECIMAL(65,30) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "taxType" TEXT NOT NULL DEFAULT 'VAT',
    "rate" DECIMAL(65,30) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prime_memberships" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'PRIME',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "freeDelivery" BOOLEAN NOT NULL DEFAULT true,
    "earlyAccess" BOOLEAN NOT NULL DEFAULT false,
    "exclusiveDeals" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prime_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnpl_orders" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "downPayment" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "numberOfInstallments" INTEGER NOT NULL DEFAULT 4,
    "installmentAmount" DECIMAL(65,30) NOT NULL,
    "nextInstallmentDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnpl_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bnpl_installments" (
    "id" TEXT NOT NULL,
    "bnplOrderId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bnpl_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "walletAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cardAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "upiAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "codAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_deals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bannerImage" TEXT,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(65,30) NOT NULL,
    "maxDiscount" DECIMAL(65,30),
    "minItems" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bundle_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bundle_deal_items" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bundle_deal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_reviews" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "thumbnail" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sellers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessEmail" TEXT NOT NULL,
    "businessPhone" TEXT NOT NULL,
    "gstin" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "bankAccount" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_products" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT,
    "costPrice" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_orders" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_payouts" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "commission" DECIMAL(65,30) NOT NULL,
    "netAmount" DECIMAL(65,30) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transferId" TEXT,
    "transferredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_reviews" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "pickupDate" TIMESTAMP(3),
    "pickupAddress" TEXT,
    "refundAmount" DECIMAL(65,30),
    "refundStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fcm_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fcm_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatbotSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "messages" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConfig" (
    "id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'groq',
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT,
    "strategy" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceSearchLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "transcript" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "locale" TEXT NOT NULL,
    "correctedText" TEXT,
    "searchResults" TEXT,
    "hadResults" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceSearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoicePattern" (
    "id" TEXT NOT NULL,
    "phonemeGroup" TEXT NOT NULL,
    "commonProduct" TEXT NOT NULL,
    "correctionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastCorrected" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoicePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "videoUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "frames" JSONB,
    "detectedProducts" JSONB,
    "metadata" JSONB,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "VideoAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "factors" JSONB,
    "action" TEXT NOT NULL DEFAULT 'REVIEW',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FraudScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnPrediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "factors" JSONB,
    "predictedChurnDate" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "config" JSONB NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "lastStatus" TEXT,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingPrediction" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "predictedOptimalPrice" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "demandForecast" DOUBLE PRECISION NOT NULL,
    "competitorAvg" DOUBLE PRECISION,
    "elasticity" DOUBLE PRECISION NOT NULL,
    "suggestedAction" TEXT NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedDemand" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "seasonality" DOUBLE PRECISION,
    "trend" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NextBestAction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "productId" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "converted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NextBestAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_sync_logs" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rulesCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tax_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "subdomain" TEXT,
    "status" "SiteStatus" NOT NULL DEFAULT 'PENDING',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "logo" TEXT,
    "favicon" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "fontFamily" TEXT NOT NULL DEFAULT 'sans',
    "theme" JSONB,
    "settings" JSONB,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_domains" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SUBDOMAIN',
    "sslStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "sslCert" TEXT,
    "sslKey" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_products" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "price" DECIMAL(65,30),
    "comparePrice" DECIMAL(65,30),
    "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(65,30),
    "stock" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "customSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_categories" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "customName" TEXT,
    "customSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_brands" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_banners" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "link" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_menus" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_pages" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_analytics" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clickedProductId" TEXT,
    "clickPosition" INTEGER,
    "userId" TEXT,
    "sessionId" TEXT,
    "regionId" TEXT,
    "siteId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "action" TEXT NOT NULL DEFAULT 'FLAG',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_feedbacks" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryAgentId" TEXT,
    "overallRating" INTEGER NOT NULL,
    "agentRating" INTEGER,
    "timelinessRating" INTEGER,
    "handlingRating" INTEGER,
    "comment" TEXT,
    "tags" TEXT[],
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GiftCardOccasionToGiftCardStore" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GiftCardOccasionToGiftCardStore_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GiftCardRecipientTypeToGiftCardStore" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GiftCardRecipientTypeToGiftCardStore_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "locations_type_idx" ON "locations"("type");

-- CreateIndex
CREATE INDEX "locations_parentId_idx" ON "locations"("parentId");

-- CreateIndex
CREATE INDEX "locations_name_idx" ON "locations"("name");

-- CreateIndex
CREATE INDEX "locations_type_isActive_idx" ON "locations"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE INDEX "location_translations_locale_idx" ON "location_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "location_translations_locationId_locale_key" ON "location_translations"("locationId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "country_profiles_locationId_key" ON "country_profiles"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "country_profiles_isoCode_key" ON "country_profiles"("isoCode");

-- CreateIndex
CREATE INDEX "country_profiles_isoCode_idx" ON "country_profiles"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Region_code_idx" ON "Region"("code");

-- CreateIndex
CREATE INDEX "Region_isActive_idx" ON "Region"("isActive");

-- CreateIndex
CREATE INDEX "ProductTranslation_locale_idx" ON "ProductTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");

-- CreateIndex
CREATE INDEX "ProductRegionPrice_regionId_currency_idx" ON "ProductRegionPrice"("regionId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRegionPrice_productId_regionId_key" ON "ProductRegionPrice"("productId", "regionId");

-- CreateIndex
CREATE INDEX "ProductRegionAvailability_regionId_isAvailable_idx" ON "ProductRegionAvailability"("regionId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRegionAvailability_productId_regionId_key" ON "ProductRegionAvailability"("productId", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_slug_key" ON "CategoryTranslation"("slug");

-- CreateIndex
CREATE INDEX "CategoryTranslation_locale_idx" ON "CategoryTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTranslation_slug_key" ON "BrandTranslation"("slug");

-- CreateIndex
CREATE INDEX "BrandTranslation_locale_idx" ON "BrandTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "BrandTranslation_brandId_locale_key" ON "BrandTranslation"("brandId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_wishlistShareToken_key" ON "User"("wishlistShareToken");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_isFeatured_idx" ON "Product"("isActive", "isFeatured");

-- CreateIndex
CREATE INDEX "Product_masterStatus_idx" ON "Product"("masterStatus");

-- CreateIndex
CREATE INDEX "Product_masterCategory_idx" ON "Product"("masterCategory");

-- CreateIndex
CREATE INDEX "Product_price_idx" ON "Product"("price");

-- CreateIndex
CREATE INDEX "Product_avgRating_idx" ON "Product"("avgRating");

-- CreateIndex
CREATE INDEX "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX "Product_stock_isActive_idx" ON "Product"("stock", "isActive");

-- CreateIndex
CREATE INDEX "Product_brandId_categoryId_idx" ON "Product"("brandId", "categoryId");

-- CreateIndex
CREATE INDEX "product_option_types_productId_idx" ON "product_option_types"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_types_productId_name_key" ON "product_option_types"("productId", "name");

-- CreateIndex
CREATE INDEX "product_option_values_optionTypeId_idx" ON "product_option_values"("optionTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_option_values_optionTypeId_value_key" ON "product_option_values"("optionTypeId", "value");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_sku_key" ON "product_variants"("productId", "sku");

-- CreateIndex
CREATE INDEX "variant_option_values_variantId_idx" ON "variant_option_values"("variantId");

-- CreateIndex
CREATE INDEX "variant_option_values_optionValueId_idx" ON "variant_option_values"("optionValueId");

-- CreateIndex
CREATE UNIQUE INDEX "variant_option_values_variantId_optionValueId_key" ON "variant_option_values"("variantId", "optionValueId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_supplierId_idx" ON "Inventory"("supplierId");

-- CreateIndex
CREATE INDEX "Inventory_locationId_idx" ON "Inventory"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_supplierId_locationId_key" ON "Inventory"("productId", "supplierId", "locationId");

-- CreateIndex
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");

-- CreateIndex
CREATE INDEX "stock_movements_supplierId_idx" ON "stock_movements"("supplierId");

-- CreateIndex
CREATE INDEX "stock_movements_locationId_idx" ON "stock_movements"("locationId");

-- CreateIndex
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

-- CreateIndex
CREATE INDEX "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_supplierUniqueId_key" ON "suppliers"("supplierUniqueId");

-- CreateIndex
CREATE INDEX "suppliers_code_idx" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_isActive_idx" ON "suppliers"("isActive");

-- CreateIndex
CREATE INDEX "suppliers_supplierUniqueId_idx" ON "suppliers"("supplierUniqueId");

-- CreateIndex
CREATE INDEX "suppliers_verificationStatus_idx" ON "suppliers"("verificationStatus");

-- CreateIndex
CREATE INDEX "product_suppliers_supplierId_idx" ON "product_suppliers"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "product_suppliers_productId_supplierId_key" ON "product_suppliers"("productId", "supplierId");

-- CreateIndex
CREATE INDEX "supplier_listings_supplierId_status_idx" ON "supplier_listings"("supplierId", "status");

-- CreateIndex
CREATE INDEX "supplier_listings_productId_status_idx" ON "supplier_listings"("productId", "status");

-- CreateIndex
CREATE INDEX "supplier_listings_status_idx" ON "supplier_listings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_listings_supplierId_productId_key" ON "supplier_listings"("supplierId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNumber_key" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_poNumber_idx" ON "purchase_orders"("poNumber");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_productId_idx" ON "purchase_order_items"("productId");

-- CreateIndex
CREATE INDEX "inventory_logs_inventoryId_idx" ON "inventory_logs"("inventoryId");

-- CreateIndex
CREATE INDEX "inventory_logs_productId_idx" ON "inventory_logs"("productId");

-- CreateIndex
CREATE INDEX "inventory_logs_supplierId_idx" ON "inventory_logs"("supplierId");

-- CreateIndex
CREATE INDEX "inventory_logs_locationId_idx" ON "inventory_logs"("locationId");

-- CreateIndex
CREATE INDEX "inventory_logs_type_idx" ON "inventory_logs"("type");

-- CreateIndex
CREATE INDEX "inventory_logs_referenceId_referenceType_idx" ON "inventory_logs"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "inventory_logs_createdAt_idx" ON "inventory_logs"("createdAt");

-- CreateIndex
CREATE INDEX "inventory_logs_userId_idx" ON "inventory_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_returns_returnNumber_key" ON "supplier_returns"("returnNumber");

-- CreateIndex
CREATE INDEX "supplier_returns_purchaseOrderId_idx" ON "supplier_returns"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "supplier_returns_supplierId_idx" ON "supplier_returns"("supplierId");

-- CreateIndex
CREATE INDEX "supplier_returns_status_idx" ON "supplier_returns"("status");

-- CreateIndex
CREATE INDEX "supplier_returns_returnNumber_idx" ON "supplier_returns"("returnNumber");

-- CreateIndex
CREATE INDEX "supplier_return_items_supplierReturnId_idx" ON "supplier_return_items"("supplierReturnId");

-- CreateIndex
CREATE INDEX "supplier_return_items_productId_idx" ON "supplier_return_items"("productId");

-- CreateIndex
CREATE INDEX "CartItem_userId_idx" ON "CartItem"("userId");

-- CreateIndex
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_productId_variantId_key" ON "CartItem"("userId", "productId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_shareToken_key" ON "Order"("shareToken");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- CreateIndex
CREATE INDEX "Order_siteId_status_idx" ON "Order"("siteId", "status");

-- CreateIndex
CREATE INDEX "Order_regionId_createdAt_idx" ON "Order"("regionId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE INDEX "Review_productId_rating_idx" ON "Review"("productId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_productId_variantId_key" ON "Review"("userId", "productId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "review_votes_reviewId_userId_key" ON "review_votes"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "product_questions_productId_idx" ON "product_questions"("productId");

-- CreateIndex
CREATE INDEX "product_answers_questionId_idx" ON "product_answers"("questionId");

-- CreateIndex
CREATE INDEX "price_history_productId_recordedAt_idx" ON "price_history"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "price_drop_alerts_userId_productId_idx" ON "price_drop_alerts"("userId", "productId");

-- CreateIndex
CREATE INDEX "daily_deals_dealDate_isActive_idx" ON "daily_deals"("dealDate", "isActive");

-- CreateIndex
CREATE INDEX "faqs_category_idx" ON "faqs"("category");

-- CreateIndex
CREATE INDEX "brand_stories_brandId_idx" ON "brand_stories"("brandId");

-- CreateIndex
CREATE INDEX "social_shares_productId_idx" ON "social_shares"("productId");

-- CreateIndex
CREATE INDEX "delivery_slots_date_isActive_idx" ON "delivery_slots"("date", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_shareToken_key" ON "WishlistItem"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_variantId_key" ON "WishlistItem"("userId", "productId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_lists_shareToken_key" ON "custom_lists"("shareToken");

-- CreateIndex
CREATE INDEX "custom_lists_userId_idx" ON "custom_lists"("userId");

-- CreateIndex
CREATE INDEX "custom_lists_shareToken_idx" ON "custom_lists"("shareToken");

-- CreateIndex
CREATE INDEX "custom_list_items_listId_idx" ON "custom_list_items"("listId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_list_items_listId_productId_key" ON "custom_list_items"("listId", "productId");

-- CreateIndex
CREATE INDEX "business_profiles_gstNumber_idx" ON "business_profiles"("gstNumber");

-- CreateIndex
CREATE INDEX "business_profiles_taxId_idx" ON "business_profiles"("taxId");

-- CreateIndex
CREATE INDEX "business_profiles_verificationStatus_idx" ON "business_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "business_documents_businessId_idx" ON "business_documents"("businessId");

-- CreateIndex
CREATE INDEX "business_verifications_businessId_idx" ON "business_verifications"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_inviteToken_key" ON "business_users"("inviteToken");

-- CreateIndex
CREATE INDEX "business_users_businessId_idx" ON "business_users"("businessId");

-- CreateIndex
CREATE INDEX "business_users_inviteToken_idx" ON "business_users"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "business_users_businessId_userId_key" ON "business_users"("businessId", "userId");

-- CreateIndex
CREATE INDEX "business_approval_rules_businessId_idx" ON "business_approval_rules"("businessId");

-- CreateIndex
CREATE INDEX "rfqs_businessId_idx" ON "rfqs"("businessId");

-- CreateIndex
CREATE INDEX "rfqs_status_idx" ON "rfqs"("status");

-- CreateIndex
CREATE INDEX "rfq_items_rfqId_idx" ON "rfq_items"("rfqId");

-- CreateIndex
CREATE INDEX "rfq_responses_rfqId_idx" ON "rfq_responses"("rfqId");

-- CreateIndex
CREATE INDEX "rfq_responses_sellerId_idx" ON "rfq_responses"("sellerId");

-- CreateIndex
CREATE INDEX "rfq_response_items_responseId_idx" ON "rfq_response_items"("responseId");

-- CreateIndex
CREATE INDEX "business_tax_exemptions_businessId_idx" ON "business_tax_exemptions"("businessId");

-- CreateIndex
CREATE INDEX "business_tax_exemptions_regionCode_idx" ON "business_tax_exemptions"("regionCode");

-- CreateIndex
CREATE INDEX "state_tax_rules_country_idx" ON "state_tax_rules"("country");

-- CreateIndex
CREATE INDEX "state_tax_rules_state_idx" ON "state_tax_rules"("state");

-- CreateIndex
CREATE UNIQUE INDEX "state_tax_rules_country_state_taxType_effectiveFrom_key" ON "state_tax_rules"("country", "state", "taxType", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_orders_orderId_key" ON "b2b_orders"("orderId");

-- CreateIndex
CREATE INDEX "b2b_orders_businessId_idx" ON "b2b_orders"("businessId");

-- CreateIndex
CREATE INDEX "b2b_orders_purchaseOrderNumber_idx" ON "b2b_orders"("purchaseOrderNumber");

-- CreateIndex
CREATE INDEX "business_tier_prices_businessId_productId_idx" ON "business_tier_prices"("businessId", "productId");

-- CreateIndex
CREATE INDEX "business_analytics_snapshots_businessId_idx" ON "business_analytics_snapshots"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "business_analytics_snapshots_businessId_month_key" ON "business_analytics_snapshots"("businessId", "month");

-- CreateIndex
CREATE INDEX "ConversionEvent_userId_type_createdAt_idx" ON "ConversionEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ConversionEvent_sessionId_type_createdAt_idx" ON "ConversionEvent"("sessionId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_codeHash_isActive_idx" ON "Coupon"("codeHash", "isActive");

-- CreateIndex
CREATE INDEX "Coupon_code_isActive_idx" ON "Coupon"("code", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Promo_code_key" ON "Promo"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Promo_codeHash_key" ON "Promo"("codeHash");

-- CreateIndex
CREATE INDEX "Promo_code_idx" ON "Promo"("code");

-- CreateIndex
CREATE INDEX "Promo_type_status_idx" ON "Promo"("type", "status");

-- CreateIndex
CREATE INDEX "Promo_validFrom_validUntil_idx" ON "Promo"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "Promo_isActive_idx" ON "Promo"("isActive");

-- CreateIndex
CREATE INDEX "Promo_regionId_isActive_status_idx" ON "Promo"("regionId", "isActive", "status");

-- CreateIndex
CREATE INDEX "PromoTranslation_locale_idx" ON "PromoTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "PromoTranslation_promoId_locale_key" ON "PromoTranslation"("promoId", "locale");

-- CreateIndex
CREATE INDEX "PromoUsage_promoId_idx" ON "PromoUsage"("promoId");

-- CreateIndex
CREATE INDEX "PromoUsage_userId_idx" ON "PromoUsage"("userId");

-- CreateIndex
CREATE INDEX "PromoUsage_orderId_idx" ON "PromoUsage"("orderId");

-- CreateIndex
CREATE INDEX "promotion_conditions_promotionId_idx" ON "promotion_conditions"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_effects_promotionId_idx" ON "promotion_effects"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_links_promotionId_idx" ON "promotion_links"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_links_promotionId_targetType_targetId_key" ON "promotion_links"("promotionId", "targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_offers_promotionId_key" ON "bank_offers"("promotionId");

-- CreateIndex
CREATE INDEX "bank_offers_gatewayId_idx" ON "bank_offers"("gatewayId");

-- CreateIndex
CREATE INDEX "bank_offers_bankCode_idx" ON "bank_offers"("bankCode");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_promotions_promotionId_key" ON "shipping_promotions"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_promotions_promotionId_key" ON "payment_method_promotions"("promotionId");

-- CreateIndex
CREATE INDEX "payment_method_promotions_methodType_idx" ON "payment_method_promotions"("methodType");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_stack_rules_group_key" ON "promotion_stack_rules"("group");

-- CreateIndex
CREATE INDEX "clipped_coupons_userId_idx" ON "clipped_coupons"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "clipped_coupons_userId_promoId_key" ON "clipped_coupons"("userId", "promoId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_userId_idx" ON "loyalty_transactions"("userId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_userId_type_idx" ON "loyalty_transactions"("userId", "type");

-- CreateIndex
CREATE INDEX "referral_rewards_referrerId_idx" ON "referral_rewards"("referrerId");

-- CreateIndex
CREATE INDEX "referral_rewards_refereeId_idx" ON "referral_rewards"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "lightning_deals_promoId_key" ON "lightning_deals"("promoId");

-- CreateIndex
CREATE INDEX "lightning_deals_startTime_endTime_idx" ON "lightning_deals"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "lightning_deals_isActive_idx" ON "lightning_deals"("isActive");

-- CreateIndex
CREATE INDEX "lightning_deal_claims_userId_idx" ON "lightning_deal_claims"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lightning_deal_claims_dealId_userId_key" ON "lightning_deal_claims"("dealId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "multi_buy_tiers_promoId_key" ON "multi_buy_tiers"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_with_purchases_promoId_key" ON "gift_with_purchases"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "cross_category_bundles_promoId_key" ON "cross_category_bundles"("promoId");

-- CreateIndex
CREATE INDEX "auto_promo_triggers_triggerType_idx" ON "auto_promo_triggers"("triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "dynamic_price_rules_productId_key" ON "dynamic_price_rules"("productId");

-- CreateIndex
CREATE INDEX "behavioral_promo_triggers_type_idx" ON "behavioral_promo_triggers"("type");

-- CreateIndex
CREATE INDEX "browse_histories_userId_viewedAt_idx" ON "browse_histories"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "browse_histories_productId_idx" ON "browse_histories"("productId");

-- CreateIndex
CREATE INDEX "cart_sessions_userId_lastActivity_idx" ON "cart_sessions"("userId", "lastActivity");

-- CreateIndex
CREATE INDEX "cart_sessions_abandonedAt_lastActivity_idx" ON "cart_sessions"("abandonedAt", "lastActivity");

-- CreateIndex
CREATE INDEX "promo_analytics_promoId_idx" ON "promo_analytics"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_analytics_promoId_date_key" ON "promo_analytics"("promoId", "date");

-- CreateIndex
CREATE INDEX "promo_clicks_promoId_idx" ON "promo_clicks"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_schedulers_promoId_key" ON "promo_schedulers"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_budget_caps_promoId_key" ON "promo_budget_caps"("promoId");

-- CreateIndex
CREATE INDEX "ab_test_assignments_testId_idx" ON "ab_test_assignments"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "ab_test_assignments_testId_userId_key" ON "ab_test_assignments"("testId", "userId");

-- CreateIndex
CREATE INDEX "gamified_plays_userId_idx" ON "gamified_plays"("userId");

-- CreateIndex
CREATE INDEX "search_promo_triggers_keyword_idx" ON "search_promo_triggers"("keyword");

-- CreateIndex
CREATE UNIQUE INDEX "search_promo_triggers_keyword_promoId_key" ON "search_promo_triggers"("keyword", "promoId");

-- CreateIndex
CREATE INDEX "pincode_promos_promoId_idx" ON "pincode_promos"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "pincode_promos_promoId_pincodes_key" ON "pincode_promos"("promoId", "pincodes");

-- CreateIndex
CREATE UNIQUE INDEX "vip_deals_promoId_key" ON "vip_deals"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "subscribe_promos_promoId_key" ON "subscribe_promos"("promoId");

-- CreateIndex
CREATE INDEX "promo_explanations_promoId_idx" ON "promo_explanations"("promoId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGateway_provider_key" ON "PaymentGateway"("provider");

-- CreateIndex
CREATE INDEX "PaymentGatewayRegion_regionId_isActive_idx" ON "PaymentGatewayRegion"("regionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayRegion_gatewayId_regionId_key" ON "PaymentGatewayRegion"("gatewayId", "regionId");

-- CreateIndex
CREATE INDEX "PaymentGatewayMethod_gatewayId_idx" ON "PaymentGatewayMethod"("gatewayId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGatewayMethod_gatewayId_method_key" ON "PaymentGatewayMethod"("gatewayId", "method");

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_providerTxnId_idx" ON "PaymentTransaction"("provider", "providerTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_customerId_idx" ON "SupportTicket"("customerId");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketNumber_idx" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_idx" ON "ConsentRecord"("userId");

-- CreateIndex
CREATE INDEX "ConsentRecord_type_idx" ON "ConsentRecord"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentRecord_userId_type_withdrawnAt_key" ON "ConsentRecord"("userId", "type", "withdrawnAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "SystemActivity_activityType_idx" ON "SystemActivity"("activityType");

-- CreateIndex
CREATE INDEX "SystemActivity_createdAt_idx" ON "SystemActivity"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_category_idx" ON "SystemConfig"("category");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_zones_code_key" ON "delivery_zones"("code");

-- CreateIndex
CREATE INDEX "delivery_zones_regionId_isActive_idx" ON "delivery_zones"("regionId", "isActive");

-- CreateIndex
CREATE INDEX "delivery_zones_isActive_idx" ON "delivery_zones"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "micro_fulfillment_centers_code_key" ON "micro_fulfillment_centers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "micro_fulfillment_centers_zoneId_key" ON "micro_fulfillment_centers"("zoneId");

-- CreateIndex
CREATE INDEX "micro_fulfillment_centers_zoneId_idx" ON "micro_fulfillment_centers"("zoneId");

-- CreateIndex
CREATE INDEX "micro_fulfillment_centers_isActive_idx" ON "micro_fulfillment_centers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_agents_userId_key" ON "delivery_agents"("userId");

-- CreateIndex
CREATE INDEX "delivery_agents_zoneId_status_idx" ON "delivery_agents"("zoneId", "status");

-- CreateIndex
CREATE INDEX "delivery_agents_status_idx" ON "delivery_agents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_assignments_orderId_key" ON "delivery_assignments"("orderId");

-- CreateIndex
CREATE INDEX "delivery_assignments_orderId_idx" ON "delivery_assignments"("orderId");

-- CreateIndex
CREATE INDEX "delivery_assignments_deliveryAgentId_status_idx" ON "delivery_assignments"("deliveryAgentId", "status");

-- CreateIndex
CREATE INDEX "delivery_assignments_status_idx" ON "delivery_assignments"("status");

-- CreateIndex
CREATE INDEX "delivery_tracking_events_deliveryAssignmentId_idx" ON "delivery_tracking_events"("deliveryAssignmentId");

-- CreateIndex
CREATE INDEX "delivery_tracking_events_createdAt_idx" ON "delivery_tracking_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_referenceId_referenceType_idx" ON "WalletTransaction"("referenceId", "referenceType");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherTier_slug_key" ON "VoucherTier"("slug");

-- CreateIndex
CREATE INDEX "VoucherTier_slug_idx" ON "VoucherTier"("slug");

-- CreateIndex
CREATE INDEX "VoucherTier_isActive_sortOrder_idx" ON "VoucherTier"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "VoucherTier_regionId_isActive_sortOrder_idx" ON "VoucherTier"("regionId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "VoucherTierTranslation_locale_idx" ON "VoucherTierTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherTierTranslation_voucherTierId_locale_key" ON "VoucherTierTranslation"("voucherTierId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE INDEX "Voucher_voucherTierId_idx" ON "Voucher"("voucherTierId");

-- CreateIndex
CREATE INDEX "Voucher_isActive_validFrom_validUntil_idx" ON "Voucher"("isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "Voucher_regionId_isActive_idx" ON "Voucher"("regionId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherRedemption_redemptionToken_key" ON "VoucherRedemption"("redemptionToken");

-- CreateIndex
CREATE INDEX "VoucherRedemption_userId_idx" ON "VoucherRedemption"("userId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_voucherId_idx" ON "VoucherRedemption"("voucherId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_walletId_idx" ON "VoucherRedemption"("walletId");

-- CreateIndex
CREATE INDEX "VoucherRedemption_codeHash_idx" ON "VoucherRedemption"("codeHash");

-- CreateIndex
CREATE INDEX "VoucherRedemption_redemptionToken_idx" ON "VoucherRedemption"("redemptionToken");

-- CreateIndex
CREATE INDEX "VoucherRedemption_voucherTierId_idx" ON "VoucherRedemption"("voucherTierId");

-- CreateIndex
CREATE INDEX "VoucherAttempt_codeHash_idx" ON "VoucherAttempt"("codeHash");

-- CreateIndex
CREATE INDEX "VoucherAttempt_ipAddress_createdAt_idx" ON "VoucherAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "VoucherAttempt_userId_createdAt_idx" ON "VoucherAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VoucherTierBalance_userId_idx" ON "VoucherTierBalance"("userId");

-- CreateIndex
CREATE INDEX "VoucherTierBalance_voucherTierId_idx" ON "VoucherTierBalance"("voucherTierId");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherTierBalance_userId_voucherTierId_key" ON "VoucherTierBalance"("userId", "voucherTierId");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");

-- CreateIndex
CREATE INDEX "GiftCard_codeHash_idx" ON "GiftCard"("codeHash");

-- CreateIndex
CREATE INDEX "GiftCard_tierId_idx" ON "GiftCard"("tierId");

-- CreateIndex
CREATE INDEX "GiftCard_isActive_validFrom_validUntil_idx" ON "GiftCard"("isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "GiftCard_regionId_isActive_idx" ON "GiftCard"("regionId", "isActive");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_giftCardId_idx" ON "GiftCardTransaction"("giftCardId");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_userId_idx" ON "GiftCardTransaction"("userId");

-- CreateIndex
CREATE INDEX "GiftCardTransaction_orderId_idx" ON "GiftCardTransaction"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_occasions_name_key" ON "gift_card_occasions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_occasions_slug_key" ON "gift_card_occasions"("slug");

-- CreateIndex
CREATE INDEX "gift_card_occasions_slug_isActive_idx" ON "gift_card_occasions"("slug", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_occasions_sortOrder_idx" ON "gift_card_occasions"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_recipient_types_name_key" ON "gift_card_recipient_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_recipient_types_slug_key" ON "gift_card_recipient_types"("slug");

-- CreateIndex
CREATE INDEX "gift_card_recipient_types_slug_isActive_idx" ON "gift_card_recipient_types"("slug", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_recipient_types_sortOrder_idx" ON "gift_card_recipient_types"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_designs_name_key" ON "gift_card_designs"("name");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_designs_slug_key" ON "gift_card_designs"("slug");

-- CreateIndex
CREATE INDEX "gift_card_designs_slug_isActive_idx" ON "gift_card_designs"("slug", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_store_slug_key" ON "gift_card_store"("slug");

-- CreateIndex
CREATE INDEX "gift_card_store_slug_isActive_idx" ON "gift_card_store"("slug", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_store_isBestseller_isActive_idx" ON "gift_card_store"("isBestseller", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_store_isNewArrival_isActive_idx" ON "gift_card_store"("isNewArrival", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_store_isFeatured_isActive_idx" ON "gift_card_store"("isFeatured", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_store_seller_isActive_idx" ON "gift_card_store"("seller", "isActive");

-- CreateIndex
CREATE INDEX "gift_card_store_sortOrder_idx" ON "gift_card_store"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "gift_card_orders_orderNo_key" ON "gift_card_orders"("orderNo");

-- CreateIndex
CREATE INDEX "gift_card_orders_buyerId_idx" ON "gift_card_orders"("buyerId");

-- CreateIndex
CREATE INDEX "gift_card_orders_storeCardId_idx" ON "gift_card_orders"("storeCardId");

-- CreateIndex
CREATE INDEX "gift_card_orders_giftCardId_idx" ON "gift_card_orders"("giftCardId");

-- CreateIndex
CREATE INDEX "gift_card_orders_orderNo_idx" ON "gift_card_orders"("orderNo");

-- CreateIndex
CREATE INDEX "gift_card_orders_status_idx" ON "gift_card_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "site_links_href_key" ON "site_links"("href");

-- CreateIndex
CREATE INDEX "site_links_section_isActive_idx" ON "site_links"("section", "isActive");

-- CreateIndex
CREATE INDEX "site_links_sortOrder_idx" ON "site_links"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "page_content_slug_key" ON "page_content"("slug");

-- CreateIndex
CREATE INDEX "page_content_slug_isActive_idx" ON "page_content"("slug", "isActive");

-- CreateIndex
CREATE INDEX "page_content_sortOrder_idx" ON "page_content"("sortOrder");

-- CreateIndex
CREATE INDEX "WalletTopUp_userId_idx" ON "WalletTopUp"("userId");

-- CreateIndex
CREATE INDEX "WalletTopUp_referenceId_idx" ON "WalletTopUp"("referenceId");

-- CreateIndex
CREATE INDEX "tax_category_rules_regionId_idx" ON "tax_category_rules"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_category_rules_taxCategory_regionId_key" ON "tax_category_rules"("taxCategory", "regionId");

-- CreateIndex
CREATE UNIQUE INDEX "uom_code_key" ON "uom"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uom_conversions_fromUomId_toUomId_key" ON "uom_conversions"("fromUomId", "toUomId");

-- CreateIndex
CREATE INDEX "uom_translations_locale_idx" ON "uom_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "uom_translations_uomId_locale_key" ON "uom_translations"("uomId", "locale");

-- CreateIndex
CREATE INDEX "serial_lot_tracking_productId_trackingId_idx" ON "serial_lot_tracking"("productId", "trackingId");

-- CreateIndex
CREATE INDEX "serial_lot_tracking_productId_status_idx" ON "serial_lot_tracking"("productId", "status");

-- CreateIndex
CREATE INDEX "serial_lot_tracking_expiryDate_idx" ON "serial_lot_tracking"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "product_subscriptions_productId_key" ON "product_subscriptions"("productId");

-- CreateIndex
CREATE INDEX "customer_subscriptions_userId_status_idx" ON "customer_subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "customer_subscriptions_nextBillingDate_idx" ON "customer_subscriptions"("nextBillingDate");

-- CreateIndex
CREATE INDEX "tier_prices_productId_idx" ON "tier_prices"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_items_bundleId_productId_key" ON "bundle_items"("bundleId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_barcode_key" ON "product_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "product_barcodes_productId_idx" ON "product_barcodes"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "live_chat_sessions_userId_status_idx" ON "live_chat_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "live_chat_sessions_status_createdAt_idx" ON "live_chat_sessions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "live_chat_sessions_agentId_status_idx" ON "live_chat_sessions"("agentId", "status");

-- CreateIndex
CREATE INDEX "live_chat_messages_sessionId_createdAt_idx" ON "live_chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "callback_requests_status_idx" ON "callback_requests"("status");

-- CreateIndex
CREATE INDEX "webhooks_isActive_idx" ON "webhooks"("isActive");

-- CreateIndex
CREATE INDEX "webhook_deliveries_webhookId_status_idx" ON "webhook_deliveries"("webhookId", "status");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_nextRetryAt_idx" ON "webhook_deliveries"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE INDEX "tax_rates_country_state_idx" ON "tax_rates"("country", "state");

-- CreateIndex
CREATE INDEX "prime_memberships_status_idx" ON "prime_memberships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "prime_memberships_userId_key" ON "prime_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "bnpl_orders_orderId_key" ON "bnpl_orders"("orderId");

-- CreateIndex
CREATE INDEX "bnpl_orders_orderId_idx" ON "bnpl_orders"("orderId");

-- CreateIndex
CREATE INDEX "bnpl_installments_bnplOrderId_status_idx" ON "bnpl_installments"("bnplOrderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "split_payments_orderId_key" ON "split_payments"("orderId");

-- CreateIndex
CREATE INDEX "split_payments_orderId_idx" ON "split_payments"("orderId");

-- CreateIndex
CREATE INDEX "bundle_deals_isActive_idx" ON "bundle_deals"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_deal_items_bundleId_productId_key" ON "bundle_deal_items"("bundleId", "productId");

-- CreateIndex
CREATE INDEX "video_reviews_reviewId_idx" ON "video_reviews"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "sellers_userId_key" ON "sellers"("userId");

-- CreateIndex
CREATE INDEX "sellers_status_idx" ON "sellers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seller_products_productId_key" ON "seller_products"("productId");

-- CreateIndex
CREATE INDEX "seller_products_sellerId_status_idx" ON "seller_products"("sellerId", "status");

-- CreateIndex
CREATE INDEX "seller_orders_sellerId_orderId_idx" ON "seller_orders"("sellerId", "orderId");

-- CreateIndex
CREATE INDEX "seller_orders_sellerId_status_idx" ON "seller_orders"("sellerId", "status");

-- CreateIndex
CREATE INDEX "seller_orders_orderId_idx" ON "seller_orders"("orderId");

-- CreateIndex
CREATE INDEX "seller_payouts_sellerId_status_idx" ON "seller_payouts"("sellerId", "status");

-- CreateIndex
CREATE INDEX "seller_reviews_sellerId_idx" ON "seller_reviews"("sellerId");

-- CreateIndex
CREATE INDEX "return_requests_orderId_status_idx" ON "return_requests"("orderId", "status");

-- CreateIndex
CREATE INDEX "return_requests_userId_idx" ON "return_requests"("userId");

-- CreateIndex
CREATE INDEX "fcm_tokens_userId_idx" ON "fcm_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "fcm_tokens_userId_token_key" ON "fcm_tokens"("userId", "token");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_isActive_idx" ON "ApiKey"("userId", "isActive");

-- CreateIndex
CREATE INDEX "ChatbotSession_userId_startedAt_idx" ON "ChatbotSession"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AIConfig_feature_key" ON "AIConfig"("feature");

-- CreateIndex
CREATE INDEX "UserBehavior_userId_type_createdAt_idx" ON "UserBehavior"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "UserBehavior_sessionId_type_createdAt_idx" ON "UserBehavior"("sessionId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "UserBehavior_productId_type_idx" ON "UserBehavior"("productId", "type");

-- CreateIndex
CREATE INDEX "AIRecommendation_userId_strategy_idx" ON "AIRecommendation"("userId", "strategy");

-- CreateIndex
CREATE INDEX "AIRecommendation_productId_strategy_idx" ON "AIRecommendation"("productId", "strategy");

-- CreateIndex
CREATE INDEX "VoiceSearchLog_userId_createdAt_idx" ON "VoiceSearchLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoicePattern_phonemeGroup_commonProduct_key" ON "VoicePattern"("phonemeGroup", "commonProduct");

-- CreateIndex
CREATE INDEX "FraudScore_userId_type_idx" ON "FraudScore"("userId", "type");

-- CreateIndex
CREATE INDEX "FraudScore_score_idx" ON "FraudScore"("score");

-- CreateIndex
CREATE INDEX "FraudScore_action_createdAt_idx" ON "FraudScore"("action", "createdAt");

-- CreateIndex
CREATE INDEX "FraudScore_orderId_idx" ON "FraudScore"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ChurnPrediction_userId_key" ON "ChurnPrediction"("userId");

-- CreateIndex
CREATE INDEX "ChurnPrediction_riskLevel_idx" ON "ChurnPrediction"("riskLevel");

-- CreateIndex
CREATE INDEX "ChurnPrediction_score_idx" ON "ChurnPrediction"("score");

-- CreateIndex
CREATE INDEX "CustomerSegment_segment_idx" ON "CustomerSegment"("segment");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSegment_userId_segment_key" ON "CustomerSegment"("userId", "segment");

-- CreateIndex
CREATE UNIQUE INDEX "AIAgent_name_key" ON "AIAgent"("name");

-- CreateIndex
CREATE INDEX "AgentRun_agentId_createdAt_idx" ON "AgentRun"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "PricingPrediction_productId_expiresAt_idx" ON "PricingPrediction"("productId", "expiresAt");

-- CreateIndex
CREATE INDEX "DemandForecast_productId_forecastDate_idx" ON "DemandForecast"("productId", "forecastDate");

-- CreateIndex
CREATE INDEX "NextBestAction_userId_delivered_converted_idx" ON "NextBestAction"("userId", "delivered", "converted");

-- CreateIndex
CREATE INDEX "tax_sync_logs_countryCode_syncedAt_idx" ON "tax_sync_logs"("countryCode", "syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sites_slug_key" ON "sites"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sites_domain_key" ON "sites"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "sites_subdomain_key" ON "sites"("subdomain");

-- CreateIndex
CREATE INDEX "sites_slug_idx" ON "sites"("slug");

-- CreateIndex
CREATE INDEX "sites_status_idx" ON "sites"("status");

-- CreateIndex
CREATE INDEX "sites_isDefault_idx" ON "sites"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "site_domains_hostname_key" ON "site_domains"("hostname");

-- CreateIndex
CREATE INDEX "site_domains_siteId_idx" ON "site_domains"("siteId");

-- CreateIndex
CREATE INDEX "site_products_siteId_idx" ON "site_products"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "site_products_siteId_productId_key" ON "site_products"("siteId", "productId");

-- CreateIndex
CREATE INDEX "site_categories_siteId_idx" ON "site_categories"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "site_categories_siteId_categoryId_key" ON "site_categories"("siteId", "categoryId");

-- CreateIndex
CREATE INDEX "site_brands_siteId_idx" ON "site_brands"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "site_brands_siteId_brandId_key" ON "site_brands"("siteId", "brandId");

-- CreateIndex
CREATE INDEX "site_banners_siteId_position_isActive_idx" ON "site_banners"("siteId", "position", "isActive");

-- CreateIndex
CREATE INDEX "site_menus_siteId_name_isActive_idx" ON "site_menus"("siteId", "name", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_siteId_slug_key" ON "site_pages"("siteId", "slug");

-- CreateIndex
CREATE INDEX "search_analytics_normalizedQuery_createdAt_idx" ON "search_analytics"("normalizedQuery", "createdAt");

-- CreateIndex
CREATE INDEX "search_analytics_userId_idx" ON "search_analytics"("userId");

-- CreateIndex
CREATE INDEX "search_analytics_createdAt_idx" ON "search_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "search_analytics_resultCount_idx" ON "search_analytics"("resultCount");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_rules_name_key" ON "fraud_rules"("name");

-- CreateIndex
CREATE INDEX "fraud_rules_type_enabled_idx" ON "fraud_rules"("type", "enabled");

-- CreateIndex
CREATE INDEX "performance_metrics_metric_createdAt_idx" ON "performance_metrics"("metric", "createdAt");

-- CreateIndex
CREATE INDEX "performance_metrics_page_metric_idx" ON "performance_metrics"("page", "metric");

-- CreateIndex
CREATE INDEX "performance_metrics_rating_idx" ON "performance_metrics"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_feedbacks_orderId_key" ON "delivery_feedbacks"("orderId");

-- CreateIndex
CREATE INDEX "delivery_feedbacks_orderId_idx" ON "delivery_feedbacks"("orderId");

-- CreateIndex
CREATE INDEX "delivery_feedbacks_deliveryAgentId_idx" ON "delivery_feedbacks"("deliveryAgentId");

-- CreateIndex
CREATE INDEX "delivery_feedbacks_overallRating_idx" ON "delivery_feedbacks"("overallRating");

-- CreateIndex
CREATE INDEX "_GiftCardOccasionToGiftCardStore_B_index" ON "_GiftCardOccasionToGiftCardStore"("B");

-- CreateIndex
CREATE INDEX "_GiftCardRecipientTypeToGiftCardStore_B_index" ON "_GiftCardRecipientTypeToGiftCardStore"("B");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_translations" ADD CONSTRAINT "location_translations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_profiles" ADD CONSTRAINT "country_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRegionPrice" ADD CONSTRAINT "ProductRegionPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRegionPrice" ADD CONSTRAINT "ProductRegionPrice_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRegionAvailability" ADD CONSTRAINT "ProductRegionAvailability_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRegionAvailability" ADD CONSTRAINT "ProductRegionAvailability_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandTranslation" ADD CONSTRAINT "BrandTranslation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_villageId_fkey" FOREIGN KEY ("villageId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_types" ADD CONSTRAINT "product_option_types_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_optionTypeId_fkey" FOREIGN KEY ("optionTypeId") REFERENCES "product_option_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_option_values" ADD CONSTRAINT "variant_option_values_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "product_option_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_listings" ADD CONSTRAINT "supplier_listings_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_listings" ADD CONSTRAINT "supplier_listings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_supplierReturnId_fkey" FOREIGN KEY ("supplierReturnId") REFERENCES "supplier_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliverySlotId_fkey" FOREIGN KEY ("deliverySlotId") REFERENCES "delivery_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_votes" ADD CONSTRAINT "review_votes_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_questions" ADD CONSTRAINT "product_questions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_answers" ADD CONSTRAINT "product_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "product_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_drop_alerts" ADD CONSTRAINT "price_drop_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_drop_alerts" ADD CONSTRAINT "price_drop_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_deals" ADD CONSTRAINT "daily_deals_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_stories" ADD CONSTRAINT "brand_stories_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_shares" ADD CONSTRAINT "social_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_lists" ADD CONSTRAINT "custom_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "custom_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_list_items" ADD CONSTRAINT "custom_list_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_documents" ADD CONSTRAINT "business_documents_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_verifications" ADD CONSTRAINT "business_verifications_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_users" ADD CONSTRAINT "business_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_approval_rules" ADD CONSTRAINT "business_approval_rules_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_items" ADD CONSTRAINT "rfq_items_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "rfqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_responses" ADD CONSTRAINT "rfq_responses_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfq_response_items" ADD CONSTRAINT "rfq_response_items_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "rfq_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tax_exemptions" ADD CONSTRAINT "business_tax_exemptions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_orders" ADD CONSTRAINT "b2b_orders_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_tier_prices" ADD CONSTRAINT "business_tier_prices_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_analytics_snapshots" ADD CONSTRAINT "business_analytics_snapshots_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionEvent" ADD CONSTRAINT "ConversionEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promo" ADD CONSTRAINT "Promo_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoTranslation" ADD CONSTRAINT "PromoTranslation_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoUsage" ADD CONSTRAINT "PromoUsage_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_conditions" ADD CONSTRAINT "promotion_conditions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_effects" ADD CONSTRAINT "promotion_effects_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_links" ADD CONSTRAINT "promotion_links_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_offers" ADD CONSTRAINT "bank_offers_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_offers" ADD CONSTRAINT "bank_offers_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_promotions" ADD CONSTRAINT "shipping_promotions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method_promotions" ADD CONSTRAINT "payment_method_promotions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_method_promotions" ADD CONSTRAINT "payment_method_promotions_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clipped_coupons" ADD CONSTRAINT "clipped_coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clipped_coupons" ADD CONSTRAINT "clipped_coupons_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referralPromoId_fkey" FOREIGN KEY ("referralPromoId") REFERENCES "referral_promos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lightning_deals" ADD CONSTRAINT "lightning_deals_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lightning_deal_claims" ADD CONSTRAINT "lightning_deal_claims_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "lightning_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_buy_tiers" ADD CONSTRAINT "multi_buy_tiers_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_with_purchases" ADD CONSTRAINT "gift_with_purchases_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_with_purchases" ADD CONSTRAINT "gift_with_purchases_giftProductId_fkey" FOREIGN KEY ("giftProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cross_category_bundles" ADD CONSTRAINT "cross_category_bundles_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dynamic_price_rules" ADD CONSTRAINT "dynamic_price_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_sessions" ADD CONSTRAINT "cart_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_analytics" ADD CONSTRAINT "promo_analytics_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_schedulers" ADD CONSTRAINT "promo_schedulers_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_budget_caps" ADD CONSTRAINT "promo_budget_caps_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_promos" ADD CONSTRAINT "ab_test_promos_promoIdA_fkey" FOREIGN KEY ("promoIdA") REFERENCES "Promo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_promos" ADD CONSTRAINT "ab_test_promos_promoIdB_fkey" FOREIGN KEY ("promoIdB") REFERENCES "Promo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_assignments" ADD CONSTRAINT "ab_test_assignments_testId_fkey" FOREIGN KEY ("testId") REFERENCES "ab_test_promos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamified_plays" ADD CONSTRAINT "gamified_plays_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "gamified_promos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_promo_triggers" ADD CONSTRAINT "search_promo_triggers_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pincode_promos" ADD CONSTRAINT "pincode_promos_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_deals" ADD CONSTRAINT "vip_deals_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribe_promos" ADD CONSTRAINT "subscribe_promos_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribe_promos" ADD CONSTRAINT "subscribe_promos_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promo_explanations" ADD CONSTRAINT "promo_explanations_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "Promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGatewayRegion" ADD CONSTRAINT "PaymentGatewayRegion_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGatewayRegion" ADD CONSTRAINT "PaymentGatewayRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentGatewayMethod" ADD CONSTRAINT "PaymentGatewayMethod_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_facilityLocationId_fkey" FOREIGN KEY ("facilityLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_fulfillment_centers" ADD CONSTRAINT "micro_fulfillment_centers_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "delivery_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "micro_fulfillment_centers" ADD CONSTRAINT "micro_fulfillment_centers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agents" ADD CONSTRAINT "delivery_agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_agents" ADD CONSTRAINT "delivery_agents_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_deliveryAgentId_fkey" FOREIGN KEY ("deliveryAgentId") REFERENCES "delivery_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_assignments" ADD CONSTRAINT "delivery_assignments_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "delivery_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_tracking_events" ADD CONSTRAINT "delivery_tracking_events_deliveryAssignmentId_fkey" FOREIGN KEY ("deliveryAssignmentId") REFERENCES "delivery_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTier" ADD CONSTRAINT "VoucherTier_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTierTranslation" ADD CONSTRAINT "VoucherTierTranslation_voucherTierId_fkey" FOREIGN KEY ("voucherTierId") REFERENCES "VoucherTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_voucherTierId_fkey" FOREIGN KEY ("voucherTierId") REFERENCES "VoucherTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherAttempt" ADD CONSTRAINT "VoucherAttempt_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTierBalance" ADD CONSTRAINT "VoucherTierBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherTierBalance" ADD CONSTRAINT "VoucherTierBalance_voucherTierId_fkey" FOREIGN KEY ("voucherTierId") REFERENCES "VoucherTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "VoucherTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftCardTransaction" ADD CONSTRAINT "GiftCardTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_store" ADD CONSTRAINT "gift_card_store_designId_fkey" FOREIGN KEY ("designId") REFERENCES "gift_card_designs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_orders" ADD CONSTRAINT "gift_card_orders_storeCardId_fkey" FOREIGN KEY ("storeCardId") REFERENCES "gift_card_store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_orders" ADD CONSTRAINT "gift_card_orders_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_orders" ADD CONSTRAINT "gift_card_orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTopUp" ADD CONSTRAINT "WalletTopUp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_category_rules" ADD CONSTRAINT "tax_category_rules_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_fromUomId_fkey" FOREIGN KEY ("fromUomId") REFERENCES "uom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uom_conversions" ADD CONSTRAINT "uom_conversions_toUomId_fkey" FOREIGN KEY ("toUomId") REFERENCES "uom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uom_translations" ADD CONSTRAINT "uom_translations_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "uom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_lot_tracking" ADD CONSTRAINT "serial_lot_tracking_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_lot_tracking" ADD CONSTRAINT "serial_lot_tracking_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serial_lot_tracking" ADD CONSTRAINT "serial_lot_tracking_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_subscriptions" ADD CONSTRAINT "product_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_subscriptions" ADD CONSTRAINT "customer_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_prices" ADD CONSTRAINT "tier_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_sessions" ADD CONSTRAINT "live_chat_sessions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "live_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prime_memberships" ADD CONSTRAINT "prime_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnpl_orders" ADD CONSTRAINT "bnpl_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bnpl_installments" ADD CONSTRAINT "bnpl_installments_bnplOrderId_fkey" FOREIGN KEY ("bnplOrderId") REFERENCES "bnpl_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_payments" ADD CONSTRAINT "split_payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_deal_items" ADD CONSTRAINT "bundle_deal_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "bundle_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_deal_items" ADD CONSTRAINT "bundle_deal_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_reviews" ADD CONSTRAINT "video_reviews_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_orders" ADD CONSTRAINT "seller_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_payouts" ADD CONSTRAINT "seller_payouts_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reviews" ADD CONSTRAINT "seller_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fcm_tokens" ADD CONSTRAINT "fcm_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBehavior" ADD CONSTRAINT "UserBehavior_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingPrediction" ADD CONSTRAINT "PricingPrediction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandForecast" ADD CONSTRAINT "DemandForecast_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_domains" ADD CONSTRAINT "site_domains_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_products" ADD CONSTRAINT "site_products_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_products" ADD CONSTRAINT "site_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_categories" ADD CONSTRAINT "site_categories_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_categories" ADD CONSTRAINT "site_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_brands" ADD CONSTRAINT "site_brands_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_brands" ADD CONSTRAINT "site_brands_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_banners" ADD CONSTRAINT "site_banners_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_menus" ADD CONSTRAINT "site_menus_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_menus" ADD CONSTRAINT "site_menus_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "site_menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_feedbacks" ADD CONSTRAINT "delivery_feedbacks_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiftCardOccasionToGiftCardStore" ADD CONSTRAINT "_GiftCardOccasionToGiftCardStore_A_fkey" FOREIGN KEY ("A") REFERENCES "gift_card_occasions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiftCardOccasionToGiftCardStore" ADD CONSTRAINT "_GiftCardOccasionToGiftCardStore_B_fkey" FOREIGN KEY ("B") REFERENCES "gift_card_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiftCardRecipientTypeToGiftCardStore" ADD CONSTRAINT "_GiftCardRecipientTypeToGiftCardStore_A_fkey" FOREIGN KEY ("A") REFERENCES "gift_card_recipient_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GiftCardRecipientTypeToGiftCardStore" ADD CONSTRAINT "_GiftCardRecipientTypeToGiftCardStore_B_fkey" FOREIGN KEY ("B") REFERENCES "gift_card_store"("id") ON DELETE CASCADE ON UPDATE CASCADE;


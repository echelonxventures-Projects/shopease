import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");

// These are specific fixes for the remaining implicit any errors
const fixes: Array<{ file: string; find: string; replace: string }> = [
  // translations/page.tsx - regionData.prices.map and availabilities.find
  {
    file: "src/app/admin/translations/page.tsx",
    find: "regionData.prices.map((p) =>",
    replace: "regionData.prices.map((p: { regionId: string; regionName: string; currencySymbol: string; price: number; comparePrice?: number }) =>",
  },
  {
    file: "src/app/admin/translations/page.tsx",
    find: "regionData.availabilities?.find((a) =>",
    replace: "regionData.availabilities?.find((a: { regionId: string; isAvailable: boolean }) =>",
  },
  // sites/[id]/page.tsx - allProducts/allCategories/allBrands/siteProducts etc
  {
    file: "src/app/admin/sites/[id]/page.tsx",
    find: ".filter((d) => !siteProducts",
    replace: ".filter((d: { id: string; name: string }) => !siteProducts",
  },
  // payments/page.tsx - methods.map
  {
    file: "src/app/admin/payments/page.tsx",
    find: "methods.map((mm) =>",
    replace: "methods.map((mm: { id: string; name: string; type: string; isActive: boolean; gateway?: string }) =>",
  },
  // promotions/analytics/page.tsx
  {
    file: "src/app/admin/promotions/analytics/page.tsx",
    find: "data.daily?.map((d) =>",
    replace: "data.daily?.map((d: { date: string; orders: number; revenue: number; discount: number }) =>",
  },
  // products/bulk-upload/page.tsx - errors.map
  {
    file: "src/app/admin/products/bulk-upload/page.tsx",
    find: ".errors?.some((e) => e.row",
    replace: ".errors?.some((e: { row: number; message: string }) => e.row",
  },
];

for (const fix of fixes) {
  const fullPath = path.join(root, fix.file);
  if (!fs.existsSync(fullPath)) { console.log(`SKIP: ${fix.file} not found`); continue; }
  let content = fs.readFileSync(fullPath, "utf-8");
  if (content.includes(fix.find)) {
    content = content.replace(fix.find, fix.replace);
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${fix.file}`);
  } else {
    console.log(`NOT FOUND in ${fix.file}: ${fix.find.slice(0, 50)}`);
  }
}

import * as fs from "fs";
import * as path from "path";

const files = [
  "src/app/admin/catalog/page.tsx",
  "src/app/admin/locations/page.tsx",
  "src/app/admin/payments/page.tsx",
  "src/app/admin/regions/page.tsx",
  "src/app/admin/sites/[id]/page.tsx",
  "src/app/admin/supplier-catalog/page.tsx",
  "src/app/admin/supplier-listings/page.tsx",
];

const root = path.resolve(__dirname, "..");

for (const file of files) {
  const fullPath = path.join(root, file);
  let content = fs.readFileSync(fullPath, "utf-8");
  
  // Fix: toast.error(e.message) → toast.error(e instanceof Error ? e.message : "Operation failed")
  const before = content;
  content = content.replace(/toast\.error\(e\.message\)/g, 'toast.error(e instanceof Error ? e.message : "Operation failed")');
  
  if (content !== before) {
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
  }
}

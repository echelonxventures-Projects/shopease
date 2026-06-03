import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

const root = path.resolve(__dirname, "..");

// Files that already have proper types (skip them)
const skipFiles = new Set([
  "src/app/admin/wallets/page.tsx",
  "src/app/admin/batch-assignment/page.tsx",
  "src/app/admin/monitoring/page.tsx",
  "src/app/admin/returns/page.tsx",
  "src/app/admin/purchase-orders/page.tsx",
  "src/app/admin/prime/page.tsx",
  "src/app/admin/analytics/conversion/page.tsx",
  "src/app/admin/fraud/page.tsx",
]);

async function main() {
  const files = await glob("src/app/admin/**/*.tsx", { cwd: root });
  let totalFixed = 0;
  let totalReplacements = 0;

  for (const file of files) {
    if (skipFiles.has(file)) continue;
    const fullPath = path.join(root, file);
    let content = fs.readFileSync(fullPath, "utf-8");
    const before = content;

    // Count replacements
    let fileReplacements = 0;

    // Replace useState<any[]>([]) → useState<Record<string, unknown>[]>([])
    const r1 = content.replace(/useState<any\[\]>\(\[\]\)/g, "useState<Record<string, unknown>[]>([])");
    if (r1 !== content) { fileReplacements += (content.match(/useState<any\[\]>\(\[\]\)/g) || []).length; content = r1; }

    // Replace useState<any>(null) → useState<Record<string, unknown> | null>(null)
    const r2 = content.replace(/useState<any>\(null\)/g, "useState<Record<string, unknown> | null>(null)");
    if (r2 !== content) { fileReplacements += (content.match(/useState<any>\(null\)/g) || []).length; content = r2; }

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      totalFixed++;
      totalReplacements += fileReplacements;
      console.log(`Fixed: ${file} (${fileReplacements} replacements)`);
    }
  }

  console.log(`\nFiles modified: ${totalFixed}, Total replacements: ${totalReplacements}`);
}

main().catch(console.error);

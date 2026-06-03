import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

const root = path.resolve(__dirname, "..");

async function main() {
  const files = await glob("src/app/admin/**/*.tsx", { cwd: root });
  let totalFixed = 0;

  for (const file of files) {
    const fullPath = path.join(root, file);
    let content = fs.readFileSync(fullPath, "utf-8");
    const before = content;

    // Pattern 1: Record<string, any> → Record<string, unknown> (for non-form state)
    // Only replace in specific contexts (settings, config, etc.)
    content = content.replace(/Record<string, any>\s*=\s*\{\}/g, "Record<string, unknown> = {}");
    
    // Pattern 2: (v: any) in onValueChange → (v: string)
    content = content.replace(/onValueChange=\{\(v: any\)/g, "onValueChange={(v: string)");
    
    // Pattern 3: .then((d: any) => ...) → .then((d) => ...)
    // This is safe because the callback type is inferred from the promise
    content = content.replace(/\.then\(\((\w+): any\)/g, ".then(($1)");
    
    // Pattern 4: .catch((e: any) => ...) → .catch((e) => ...)
    content = content.replace(/\.catch\(\((\w+): any\)/g, ".catch(($1)");

    // Pattern 5: (row: any, idx: number) → (row: Record<string, unknown>, idx: number)
    // Only for table row rendering
    content = content.replace(/\(row: any,\s*idx: number\)/g, "(row: Record<string, unknown>, idx: number)");
    content = content.replace(/\(row: any,\s*i: number\)/g, "(row: Record<string, unknown>, i: number)");

    // Pattern 6: (item: any, index: number) → remove type annotation
    content = content.replace(/\(item: any,\s*(\w+): number\)/g, "(item, $1)");
    
    // Pattern 7: (v: number, i: number) in map → remove type annotations when source is typed
    content = content.replace(/\(v: number,\s*i: number\)/g, "(v, i)");

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      totalFixed++;
      console.log(`Fixed: ${file}`);
    }
  }

  console.log(`\nFiles modified: ${totalFixed}`);
}

main().catch(console.error);

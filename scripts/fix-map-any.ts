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

    // Pattern 1: .map((item: any) => ...) → remove : any (let TS infer)
    content = content.replace(/\.map\(\((\w+): any\)/g, ".map(($1)");
    
    // Pattern 2: .filter((item: any) => ...) → remove : any
    content = content.replace(/\.filter\(\((\w+): any\)/g, ".filter(($1)");
    
    // Pattern 3: .find((item: any) => ...) → remove : any
    content = content.replace(/\.find\(\((\w+): any\)/g, ".find(($1)");
    
    // Pattern 4: .forEach((item: any) => ...) → remove : any
    content = content.replace(/\.forEach\(\((\w+): any\)/g, ".forEach(($1)");
    
    // Pattern 5: .some((item: any) => ...) → remove : any
    content = content.replace(/\.some\(\((\w+): any\)/g, ".some(($1)");
    
    // Pattern 6: .every((item: any) => ...) → remove : any
    content = content.replace(/\.every\(\((\w+): any\)/g, ".every(($1)");
    
    // Pattern 7: .reduce((acc: any, item: any) => ...) → remove : any
    content = content.replace(/\.reduce\(\((\w+): any,\s*(\w+): any\)/g, ".reduce(($1, $2)");
    content = content.replace(/\.reduce\(\((\w+): any,\s*(\w+)\)/g, ".reduce(($1, $2)");
    
    // Pattern 8: .flatMap((item: any) => ...) → remove : any
    content = content.replace(/\.flatMap\(\((\w+): any\)/g, ".flatMap(($1)");
    
    // Pattern 9: .sort((a: any, b: any) => ...) → remove : any
    content = content.replace(/\.sort\(\((\w+): any,\s*(\w+): any\)/g, ".sort(($1, $2)");

    // Pattern 10: (e: any) in event handlers → React event types
    // onChange={(e: any) => ...} for inputs
    content = content.replace(/onChange=\{\(e: any\)/g, "onChange={(e: React.ChangeEvent<HTMLInputElement>)");
    // onSubmit={(e: any) => ...}
    content = content.replace(/onSubmit=\{\(e: any\)/g, "onSubmit={(e: React.FormEvent<HTMLFormElement>)");

    // Pattern 11: .catch((err: any) => toast.error(err.message))
    content = content.replace(
      /\.catch\(\(err: any\)\s*=>\s*toast\.error\(err\.message\)\)/g,
      '.catch((err) => toast.error(err instanceof Error ? err.message : "Operation failed"))'
    );
    // .catch((err) => toast.error(err.message)) - already no type but still uses .message
    content = content.replace(
      /\.catch\(\(err\)\s*=>\s*toast\.error\(err\.message\)\)/g,
      '.catch((err) => toast.error(err instanceof Error ? err.message : "Operation failed"))'
    );

    // Pattern 12: Record<string, any> → Record<string, unknown> (when safe)
    // Only for settings/config objects, not for form state
    // Skip this - too risky without context

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      const diff = content.split("any").length - before.split("any").length;
      totalFixed++;
      console.log(`Fixed: ${file} (${Math.abs(before.split(": any").length - content.split(": any").length)} type annotations removed)`);
    }
  }

  console.log(`\nFiles modified: ${totalFixed}`);
}

main().catch(console.error);

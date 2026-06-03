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

    // Fix: onValueChange={(v: string) => ...} → onValueChange={(v) => ...}
    // The Select component's onValueChange type will infer v as string | null
    content = content.replace(/onValueChange=\{\(v: string\)\s*=>/g, "onValueChange={(v) =>");

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      totalFixed++;
      console.log(`Fixed: ${file}`);
    }
  }

  console.log(`\nFiles modified: ${totalFixed}`);
}

main().catch(console.error);

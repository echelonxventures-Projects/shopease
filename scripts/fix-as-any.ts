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

    // Pattern 1: (session?.user as any)?.role → (session?.user as { role?: string })?.role
    content = content.replace(
      /\(session\?\.user as any\)\?\.role/g,
      '(session?.user as { role?: string })?.role'
    );

    // Pattern 2: (order.shippingAddress as any).field → (order.shippingAddress as Record<string, string>).field
    content = content.replace(
      /\((\w+)\.shippingAddress as any\)/g,
      '($1.shippingAddress as Record<string, string>)'
    );

    // Pattern 3: String((result as any).error) → String("error" in result ? result.error : "")
    // This is complex, let's use a simpler approach
    content = content.replace(
      /String\(\(result as any\)\.error\)/g,
      'String("error" in result && result.error ? result.error : "")'
    );
    content = content.replace(
      /toast\.error\(String\(\(result as any\)\.error\)\)/g,
      'toast.error("error" in result && typeof result.error === "string" ? result.error : "Operation failed")'
    );

    // Pattern 4: (accuracy as any) → accuracy as number (in AI pages)
    // Skip - need context

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      totalFixed++;
      console.log(`Fixed: ${file}`);
    }
  }

  console.log(`\nFiles modified: ${totalFixed}`);
}

main().catch(console.error);

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

    // Fix patterns like: onValueChange={(v) => setSomething(v)}
    // → onValueChange={(v) => { if (v) setSomething(v); }}
    // But only when v is passed directly to a setter
    content = content.replace(
      /onValueChange=\{\(v\) => (set\w+)\(v\)\}/g,
      'onValueChange={(v) => { if (v) $1(v); }}'
    );
    
    // Fix patterns like: onValueChange={(v) => setForm({ ...form, field: v })}
    // → onValueChange={(v) => { if (v) setForm({ ...form, field: v }); }}
    content = content.replace(
      /onValueChange=\{\(v\) => (setForm|setNewRule|setEditForm|setCreateForm|setEditRule)\((\{[^}]+\})\)\}/g,
      'onValueChange={(v) => { if (v) $1($2); }}'
    );

    // Fix patterns like: onValueChange={(v) => onChange(v)}
    content = content.replace(
      /onValueChange=\{\(v\) => onChange\(v\)\}/g,
      'onValueChange={(v) => { if (v) onChange(v); }}'
    );

    if (content !== before) {
      fs.writeFileSync(fullPath, content);
      totalFixed++;
      console.log(`Fixed: ${file}`);
    }
  }

  console.log(`\nFiles modified: ${totalFixed}`);
}

main().catch(console.error);

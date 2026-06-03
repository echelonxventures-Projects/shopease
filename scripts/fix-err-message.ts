import { Project, SyntaxKind, Node, CatchClause } from "ts-morph";
import * as path from "path";

const project = new Project({
  tsConfigFilePath: path.resolve(__dirname, "../tsconfig.json"),
  skipAddingFilesFromTsConfig: true,
});

const adminGlob = path.resolve(__dirname, "../src/app/admin/**/*.tsx");
project.addSourceFilesAtPaths(adminGlob);

const sourceFiles = project.getSourceFiles();
let totalFixed = 0;

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  let fileFixed = 0;
  let text = sourceFile.getFullText();
  
  // Pattern: } catch (err) { toast.error(err.message); }
  // → } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  const patterns = [
    // Single line: toast.error(err.message)
    {
      find: /catch\s*\(err\)\s*\{\s*toast\.error\(err\.message\);\s*\}/g,
      replace: 'catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }'
    },
    // Multi-line with toast.error(err.message || "...")
    {
      find: /toast\.error\(err\.message\s*\|\|\s*"([^"]+)"\)/g,
      replace: 'toast.error(err instanceof Error ? err.message : "$1")'
    },
    // toast.error(err.message) standalone (not in single-line catch)
    {
      find: /toast\.error\(err\.message\)/g,
      replace: 'toast.error(err instanceof Error ? err.message : "Operation failed")'
    },
    // console.error("...", err.message)
    {
      find: /console\.error\(("[^"]*"),\s*err\.message\)/g,
      replace: 'console.error($1, err instanceof Error ? err.message : err)'
    },
  ];

  for (const p of patterns) {
    const matches = text.match(p.find);
    if (matches) {
      text = text.replace(p.find, p.replace);
      fileFixed += matches.length;
    }
  }

  if (fileFixed > 0) {
    sourceFile.replaceWithText(text);
    sourceFile.saveSync();
    totalFixed += fileFixed;
    console.log(`${path.relative(process.cwd(), filePath)}: fixed ${fileFixed} err.message usages`);
  }
}

console.log(`\nTotal err.message fixes: ${totalFixed}`);

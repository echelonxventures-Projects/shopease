import { Project, SyntaxKind, Node } from "ts-morph";
import * as path from "path";

const project = new Project({
  tsConfigFilePath: path.resolve(__dirname, "../tsconfig.json"),
  skipAddingFilesFromTsConfig: true,
});

// Add only admin files
const adminGlob = path.resolve(__dirname, "../src/app/admin/**/*.tsx");
project.addSourceFilesAtPaths(adminGlob);

const sourceFiles = project.getSourceFiles();
let totalFixed = 0;

for (const sourceFile of sourceFiles) {
  const filePath = sourceFile.getFilePath();
  let fileFixed = 0;

  // Pattern 1: catch (err: any) { ... err.message ... }
  // → catch (err) { ... (err instanceof Error ? err.message : "...") ... }
  sourceFile.forEachDescendant((node) => {
    if (Node.isCatchClause(node)) {
      const variableDecl = node.getVariableDeclaration();
      if (variableDecl) {
        const typeNode = variableDecl.getTypeNode();
        if (typeNode && typeNode.getText() === "any") {
          // Remove the : any type annotation
          variableDecl.removeType();
          fileFixed++;
        }
      }
    }
  });

  // Pattern 2: (e: any) in event handlers → proper React event types
  // This is more complex, skip for now - handle manually

  if (fileFixed > 0) {
    sourceFile.saveSync();
    totalFixed += fileFixed;
    console.log(`${path.relative(process.cwd(), filePath)}: fixed ${fileFixed} catch clauses`);
  }
}

console.log(`\nTotal catch clause fixes: ${totalFixed}`);

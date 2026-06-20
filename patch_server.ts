import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!code.includes('getLocalDb')) {
  code = code.replace(
    'import { db } from "./src/db/index.ts";',
    'import { db } from "./src/db/index.ts";\nimport { getLocalDb, saveLocalDb } from "./dbStorage.ts";'
  );
}

// Replace pattern:
// let localDb: any = { <anything> };
// if (fs.existsSync(DB_PATH)) {
//   localDb = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
// }
code = code.replace(/let localDb:\s*any\s*=\s*\{.*?\};\s*if\s*\(fs\.existsSync\(DB_PATH\)\)\s*\{\s*localDb\s*=\s*JSON\.parse\(fs\.readFileSync\(DB_PATH,\s*"utf-8"\)\);\s*\}/gs, 'let localDb: any = await getLocalDb();');

// Also handle the variation with no default values:
code = code.replace(/let localDb:\s*any\s*=\s*\{\};\s*if\s*\(fs\.existsSync\(DB_PATH\)\)\s*\{\s*localDb\s*=\s*JSON\.parse\(fs\.readFileSync\(DB_PATH,\s*"utf-8"\)\);\s*\}/gs, 'let localDb: any = await getLocalDb();');

// Replace standard localData constant
code = code.replace(/const localData = JSON\.parse\(fs\.readFileSync\(DB_PATH,\s*"utf-8"\)\);/g, 'const localData = await getLocalDb();');

// Replace standard localDb constant
code = code.replace(/const localDb = JSON\.parse\(fs\.readFileSync\(DB_PATH,\s*"utf-8"\)\);/g, 'let localDb: any = await getLocalDb();');

// Replace stringify
code = code.replace(/fs\.writeFileSync\(DB_PATH,\s*JSON\.stringify\(([a-zA-Z0-9_]+),\s*null,\s*2\),\s*"utf-8"\);/g, 'await saveLocalDb($1);');

// Handle syncLocalFile
// function syncLocalFile needs to become async function syncLocalFile
code = code.replace(/function syncLocalFile\(section: string, operation: string, data: any\) \{/g, 'async function syncLocalFile(section: string, operation: string, data: any) {');

// The contents of syncLocalFile
code = code.replace(/if \(\!fs\.existsSync\(DB_PATH\)\) \{[\s\S]*?fs\.writeFileSync\(DB_PATH.*?,\s*"utf-8"\);\s*\}\s*const fileContents = fs\.readFileSync\(DB_PATH, "utf-8"\);\s*const localDb = JSON\.parse\(fileContents\);/gs, 'let localDb: any = await getLocalDb();');

// Change calls to syncLocalFile to await syncLocalFile
code = code.replace(/syncLocalFile\(/g, 'await syncLocalFile(');

fs.writeFileSync('server.ts', code);

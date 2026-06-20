import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/fs\.existsSync\(DB_PATH\)/g, 'true');
fs.writeFileSync('server.ts', code);

const fs = require('fs');
const code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
let openCount = 0;
let line = 1;
for (let i = 0; i < code.length; i++) {
  if (code[i] === '\n') line++;
  if (code[i] === '{') openCount++;
  if (code[i] === '}') {
    openCount--;
    if (openCount < 0) {
      console.log(`Unmatched } at line ${line}`);
      break;
    }
  }
}
console.log('Final openCount:', openCount);

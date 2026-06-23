const fs = require('fs');
const path = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /value=\{mpesa([a-zA-Z0-9]+)\}/g;
content = content.replace(regex, 'value={mpesa$1 || ""}');

fs.writeFileSync(path, content, 'utf8');

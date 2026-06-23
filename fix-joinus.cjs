const fs = require('fs');
const path = 'src/components/JoinUs.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /value=\{formData\.([a-zA-Z0-9]+)\}/g;
content = content.replace(regex, 'value={formData.$1 || ""}');

content = content.replace(/value=\{amount\}/g, 'value={amount || ""}');
content = content.replace(/value=\{customAmount\}/g, 'value={customAmount || ""}');
content = content.replace(/value=\{phone\}/g, 'value={phone || ""}');

fs.writeFileSync(path, content, 'utf8');

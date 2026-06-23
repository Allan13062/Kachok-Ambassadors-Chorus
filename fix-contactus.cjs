const fs = require('fs');
const path = 'src/components/ContactUs.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /value=\{formData\.([a-zA-Z0-9]+)\}/g;
content = content.replace(regex, 'value={formData.$1 || ""}');

fs.writeFileSync(path, content, 'utf8');

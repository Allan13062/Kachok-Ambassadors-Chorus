const fs = require('fs');
const path = 'src/components/AuthModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/value=\{name\}/g, 'value={name || ""}');
content = content.replace(/value=\{email\}/g, 'value={email || ""}');
content = content.replace(/value=\{password\}/g, 'value={password || ""}');
content = content.replace(/value=\{voicePart\}/g, 'value={voicePart || "Soprano"}');

fs.writeFileSync(path, content, 'utf8');

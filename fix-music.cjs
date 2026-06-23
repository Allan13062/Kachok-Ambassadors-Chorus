const fs = require('fs');
const path = 'src/components/MusicStreaming.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/value=\{currentTime\}/g, 'value={currentTime || 0}');

fs.writeFileSync(path, content, 'utf8');

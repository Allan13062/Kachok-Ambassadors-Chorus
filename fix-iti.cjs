const fs = require('fs');
const path = 'src/components/Itinerary.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/value=\{mediaUrlInput\}/g, 'value={mediaUrlInput || ""}');
content = content.replace(/value=\{itinerarySearch\}/g, 'value={itinerarySearch || ""}');

fs.writeFileSync(path, content, 'utf8');

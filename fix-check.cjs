const fs = require('fs');
const path = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/checked=\{itiForm\.sendBroadcast\}/g, 'checked={itiForm.sendBroadcast || false}');

fs.writeFileSync(path, content, 'utf8');

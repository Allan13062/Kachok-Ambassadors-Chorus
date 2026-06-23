const fs = require('fs');
const path = 'src/components/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

const fields = [
  'trimStart', 'passcode', 'resetRecoveryKey', 'resetCurrentPasscode', 'resetNewPasscode', 'adminEmail', 'gitWebhookSecret', 'printHeaderText', 'printSubText'
];

fields.forEach(field => {
  const regex = new RegExp(`value=\\{${field}\\}`, 'g');
  content = content.replace(regex, `value={${field} || ""}`);
});

fs.writeFileSync(path, content, 'utf8');

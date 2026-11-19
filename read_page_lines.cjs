const fs = require('fs');
const code = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(380, 520).join('\n'));

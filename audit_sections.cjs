const fs = require('fs');
const code = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
const lines = code.split('\n');
console.log('Total lines in page.tsx:', lines.length);
lines.forEach((l, i) => {
  if (l.includes('<section') || l.includes('id=') || l.includes('ecosystem') || l.includes('regional')) {
    console.log((i+1) + ': ' + l.trim());
  }
});

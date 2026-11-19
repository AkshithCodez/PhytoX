const fs = require('fs');
const code = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ecosystem') || l.includes('regional-intelligence') || l.includes('cinematic') || l.includes('.webp') || l.includes('.avif') || l.includes('bg-[')) {
    console.log((i+1) + ': ' + l.trim());
  }
});

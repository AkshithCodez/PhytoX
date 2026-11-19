const fs = require('fs');
const code = fs.readFileSync('apps/web/src/components/eco-tech-scene.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('ecosystem') || l.includes('regional-intelligence') || l.includes('Scene 3') || l.includes('Scene 4') || l.includes('ground')) {
    console.log((i+1) + ': ' + l.trim());
  }
});

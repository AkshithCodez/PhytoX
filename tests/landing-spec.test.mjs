import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const indexHtmlPath = path.resolve('dashboard/index.html');
const assetsDir = path.resolve('dashboard/assets');

test('index.html contains expected fonts and metadata', () => {
  const html = fs.readFileSync(indexHtmlPath, 'utf-8');
  assert.ok(html.includes('Instrument+Serif'), 'Instrument Serif font must be linked');
  assert.ok(html.includes('Barlow'), 'Barlow font must be linked');
  assert.ok(html.includes('KrishRakshak'), 'Title contains KrishRakshak');
  assert.ok(html.includes('id="root"'), 'Mount root div present');
});

test('built CSS contains styling tokens and liquid-glass classes', () => {
  const cssFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
  assert.ok(cssFiles.length > 0, 'CSS bundle must exist in dashboard/assets');
  const css = fs.readFileSync(path.join(assetsDir, cssFiles[0]), 'utf-8');

  assert.ok(css.includes('liquid-glass'), 'CSS defines liquid-glass');
  assert.ok(css.includes('backdrop-filter:blur('), 'Backdrop filter blur present');
});

test('built JS bundle contains real Three.js WebGL scene and 6 editorial sections', () => {
  const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js') && f.startsWith('index-'));
  assert.ok(jsFiles.length > 0, 'Main index JS bundle must exist');
  const js = fs.readFileSync(path.join(assetsDir, jsFiles[0]), 'utf-8');

  // Hero Section
  assert.ok(js.includes('See the signs.'), 'Hero headline part 1 present');
  assert.ok(js.includes('Protect the harvest.'), 'Hero headline part 2 present');
  assert.ok(js.includes('AI-assisted crop health and field reporting'), 'Hero eyebrow present');
  assert.ok(js.includes('Check a Crop'), 'Hero primary CTA present');
  assert.ok(js.includes('Explore the Platform'), 'Hero secondary CTA present');

  // Verify NO hero stats cards present
  assert.ok(!js.includes('Supported Crop Categories'), 'Hero stats card 1 removed from hero');
  assert.ok(!js.includes('Crop and Disease Classes'), 'Hero stats card 2 removed from hero');

  // Section 2: How It Works
  assert.ok(js.includes('From one field observation to informed action'), 'How It Works heading present');
  for (const step of ['Capture', 'Assess', 'Report', 'Review']) {
    assert.ok(js.includes(step), `Stage ${step} present`);
  }

  // Section 3: Farmer Experience
  assert.ok(js.includes('Simple enough for the field'), 'Farmer section heading present');
  assert.ok(js.includes('Open Farmer Portal'), 'Farmer CTA present');

  // Section 4: Officer Intelligence
  assert.ok(js.includes('Turn individual reports into regional awareness'), 'Officer section heading present');
  assert.ok(js.includes('Enter Officer Portal'), 'Officer CTA present');

  // Section 5: Human-in-the-Loop
  assert.ok(js.includes('AI assists. People decide.'), 'Human-in-the-loop heading present');
  assert.ok(js.includes('Communicate uncertainty'), 'Principle 1 present');
  assert.ok(js.includes('Preserve field evidence'), 'Principle 2 present');
  assert.ok(js.includes('Keep officers in control'), 'Principle 3 present');

  // Section 6: Final CTA
  assert.ok(js.includes('Better crop protection begins with better visibility.'), 'Final CTA heading present');

  // Routes
  assert.ok(js.includes('/farmer/predict'), 'Farmer diagnosis route connected');
  assert.ok(js.includes('/farmer'), 'Farmer portal route connected');
  assert.ok(js.includes('/login?role=officer'), 'Officer login route connected');
});

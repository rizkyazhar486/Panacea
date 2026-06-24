const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walk(full);
    } else {
      cleanFile(full);
    }
  }
}

function cleanFile(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return; }
  if (!text.includes('<<<<<<<') && !text.includes('=======') && !text.includes('>>>>>>>')) return;
  const orig = text;
  // Normalize EOLs
  text = text.replace(/\r\n/g, '\n');
  // Remove lines that are just conflict markers
  const cleaned = text.split('\n').filter(line => !/^\s*(<<<<<<<.*|={7,}|>>>>>>>.*)\s*$/.test(line)).join('\n');
  if (cleaned !== orig) {
    fs.writeFileSync(file, cleaned, 'utf8');
    console.log('Cleaned markers in:', file);
  }
}

walk(process.cwd());
console.log('Cleanup done.');

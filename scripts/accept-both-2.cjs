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
      tryProcess(full);
    }
  }
}

function tryProcess(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return; }
  text = text.replace(/\r\n/g, '\n');
  if (!text.includes('  const re = /<<<<<<<[\s\S]*?>>>>>>>.*?(?:\n|$)/g;

  let changed = false;
  const out = text.replace(re, (m) => {
    const inner = m.replace(/^

    const parts = inner.split(/\n=======(?:\n|$)/);
    const left = (parts[0] || '').replace(/\n+$/,'');
    const right = (parts[1] || '').replace(/^\n+/,'');
    changed = true;
    return left + '\n' + right + '\n';
  });
  if (changed) {
    fs.writeFileSync(file, out, 'utf8');
    console.log('Resolved (accepted both):', file);
  }
}

walk(process.cwd());
console.log('Done.');

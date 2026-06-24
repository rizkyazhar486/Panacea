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
  if (!text.includes('  const re = /<<<<<<< .*?\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> .*?(?:\n|$)/g;

  let changed = false;
  const out = text.replace(re, (m, a, b) => {
    changed = true;
    const left = a.replace(/\n+$/,'');
    const right = b.replace(/^\n+/,'');
    return left + '\n' + right + '\n';
  });
  if (changed) {
    fs.writeFileSync(file, out, 'utf8');
    console.log('Resolved (accepted both):', file);
  }
}

const root = process.cwd();
walk(root);
console.log('Done.');

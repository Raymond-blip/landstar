const fs = require('fs').promises;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORED_DIRS = ['.git', 'node_modules', 'media', 'data', 'Content', 'images'];
const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.zip', '.tar', '.gz', '.db']);

const replacements = [
  { from: /WERNER/g, to: 'WERNER' },
  { from: /Werner/g, to: 'Werner' },
  { from: /werner/g, to: 'werner' }
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.includes(entry.name)) continue;
      await walk(full);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXT.has(ext)) continue;
      await processFile(full);
    }
  }
}

async function processFile(filePath) {
  try {
    let txt = await fs.readFile(filePath, 'utf8');
    let out = txt;
    for (const r of replacements) out = out.replace(r.from, r.to);
    if (out !== txt) {
      await fs.writeFile(filePath, out, 'utf8');
      console.log('Updated', path.relative(ROOT, filePath));
    }
  } catch (e) {
    // ignore binary or unreadable files
  }
}

walk(ROOT).then(() => console.log('Done')).catch(err => { console.error(err); process.exit(1); });


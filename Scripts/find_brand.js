const fs = require('fs').promises;
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const IGNORED = ['.git','node_modules','data','media','Content'];
const BINARY_EXT = new Set(['.png','.jpg','.jpeg','.gif','.woff','.woff2','.ttf','.eot','.otf','.db']);
async function walk(dir) {
  const entries = await fs.readdir(dir,{withFileTypes:true});
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir,e.name);
    if (e.isDirectory()) {
      if (IGNORED.includes(e.name)) continue;
      await walk(full);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (BINARY_EXT.has(ext)) continue;
      try {
        const txt = await fs.readFile(full,'utf8');
        if (/werner/i.test(txt)) {
          console.log('MATCH:', path.relative(ROOT, full));
        }
      } catch (err) {}
    }
  }
}
walk(ROOT).then(()=>console.log('Scan complete')).catch(e=>{console.error(e);process.exit(1)});


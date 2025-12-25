const fs = require('fs').promises;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const HTML_GLOBS = ['.htm', '.html'];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules','media','data','.git'].includes(e.name)) continue;
      await walk(full);
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (HTML_GLOBS.includes(ext)) await processFile(full);
    }
  }
}

async function processFile(filePath) {
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    let out = txt;

    // Remove Google Tag Manager block (comments inclusive)
    out = out.replace(/<!--\s*Google Tag Manager[\s\S]*?End Google Tag Manager\s*-->/gi, '');

    // Remove GTM noscript iframe
    out = out.replace(/<noscript>[\s\S]*?googletagmanager\.com\/ns\.html[\s\S]*?<\/noscript>/gi, '');

    // Remove Oracle/Engage/pi scripts that reference pd.js or piHostname/piAId
    out = out.replace(/<script[\s\S]*?(piAId|piHostname|pd\.js)[\s\S]*?<\/script>/gi, '');

    // Remove LinkedIn insight & snap scripts and noscript pixel
    out = out.replace(/<script[\s\S]*?_linkedin_partner_id[\s\S]*?<\/script>/gi, '');
    out = out.replace(/<script[\s\S]*?snap\.licdn\.com[\s\S]*?<\/script>/gi, '');
    out = out.replace(/<noscript>[\s\S]*?px\.ads\.linkedin\.com[\s\S]*?<\/noscript>/gi, '');

    // Remove other common tracking script URLs
    out = out.replace(/https?:\/\/www\.googletagmanager\.com\/gtm\.js[\s\S]*?/gi, '');
    out = out.replace(/https?:\/\/px\.ads\.linkedin\.com\/collect\/[\s\S]*?/gi, '');

    if (out !== txt) {
      // backup
      await fs.copyFile(filePath, filePath + '.bak');
      await fs.writeFile(filePath, out, 'utf8');
      console.log('Stripped cookies/tracking from', path.relative(ROOT, filePath));
    }
  } catch (e) {
    console.error('Failed to process', filePath, e.message);
  }
}

walk(ROOT).then(()=>console.log('Done')).catch(err=>{ console.error(err); process.exit(1); });

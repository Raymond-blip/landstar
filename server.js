const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const ROOT = __dirname;
const PORT = process.env.PORT || 8000;
const DATA_DIR = path.join(ROOT, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

const mimeTypes = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': headers['Content-Type'] || 'application/json', ...headers });
  res.end(payload);
}

function safePath(requestPath) {
  const filePath = path.join(ROOT, decodeURIComponent(requestPath));
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ROOT)) return null;
  return normalized;
}

async function ensureDataFile() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.promises.access(SUBMISSIONS_FILE, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(SUBMISSIONS_FILE, '[]', 'utf8');
  }
}

async function appendSubmission(kind, payload, ip) {
  await ensureDataFile();
  const raw = await fs.promises.readFile(SUBMISSIONS_FILE, 'utf8');
  const data = JSON.parse(raw || '[]');
  data.push({ kind, payload, ip, ts: new Date().toISOString() });
  await fs.promises.writeFile(SUBMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && (url.pathname === '/api/applicant' || url.pathname === '/api/immigrant')) {
    try {
      const raw = await collectBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      await appendSubmission(url.pathname === '/api/applicant' ? 'applicant' : 'immigrant', payload, req.socket.remoteAddress);
      return send(res, 200, { ok: true });
    } catch (err) {
      return send(res, 400, { ok: false, error: 'Invalid payload' });
    }
  }

  // Static file serving
  let pathname = url.pathname;
  if (pathname === '/') pathname = '/index.htm';
  const filePath = safePath(pathname);
  if (!filePath) return send(res, 403, { error: 'Forbidden' });

  fs.promises
    .stat(filePath)
    .then(stat => {
      if (stat.isDirectory()) {
        return send(res, 403, { error: 'Directory listing disabled' });
      }
      const ext = path.extname(filePath).toLowerCase();
      const mime = mimeTypes[ext] || 'application/octet-stream';
      fs.createReadStream(filePath)
        .on('error', () => send(res, 404, { error: 'Not Found' }))
        .pipe(
          res.writeHead(200, { 'Content-Type': mime })
        );
    })
    .catch(() => send(res, 404, { error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving from ${ROOT}`);
  console.log(`POST /api/applicant and /api/immigrant to capture submissions -> ${SUBMISSIONS_FILE}`);
});


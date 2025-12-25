const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const ROOT = __dirname;
const PORT = process.env.PORT || 8002;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'submissions.db');

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

function initDatabase() {
  return new Promise((resolve, reject) => {
    fs.promises.mkdir(DATA_DIR, { recursive: true }).then(() => {
      const db = new sqlite3.Database(DB_FILE, (err) => {
        if (err) return reject(err);
        
        // Create applicants table
        db.run(`CREATE TABLE IF NOT EXISTS applicants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          password_hash TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          date_of_birth TEXT,
          gender TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          position_type TEXT,
          availability_start_date TEXT,
          preferred_routes TEXT,
          years_experience TEXT,
          license_number TEXT,
          license_state TEXT,
          license_expiry TEXT,
          license_class TEXT,
          endorsements TEXT,
          previous_employer_1 TEXT,
          employment_dates_1 TEXT,
          reason_for_leaving_1 TEXT,
          previous_employer_2 TEXT,
          employment_dates_2 TEXT,
          reason_for_leaving_2 TEXT,
          has_accidents TEXT,
          accident_details TEXT,
          has_violations TEXT,
          violation_details TEXT,
          failed_dot_test TEXT,
          has_medical_card TEXT,
          medical_card_expiry TEXT,
          authorization TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) return reject(err);
        });

        // Ensure password_hash column exists on existing DBs
        db.all("PRAGMA table_info(applicants)", (err, cols) => {
          if (!err && Array.isArray(cols)) {
            const hasPwd = cols.some(c => c.name === 'password_hash');
            if (!hasPwd) {
              db.run('ALTER TABLE applicants ADD COLUMN password_hash TEXT', (e) => {
                if (e) console.error('Failed to add password_hash column:', e.message);
              });
            }
          }
        });

        // Create immigrants table
        db.run(`CREATE TABLE IF NOT EXISTS immigrants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT,
          last_name TEXT,
          other_names TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          city TEXT,
          state TEXT,
          zip_code TEXT,
          date_of_birth TEXT,
          country_of_origin TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          immigration_status TEXT,
          uscis_number TEXT,
          issuing_country TEXT,
          document_expiry TEXT,
          work_authorization TEXT,
          nominator_code TEXT,
          sponsoring_company TEXT,
          visa_type TEXT,
          nominator_understanding TEXT,
          license_number TEXT,
          license_state TEXT,
          license_expiry TEXT,
          license_class TEXT,
          endorsements TEXT,
          cdl_location TEXT,
          cdl_country TEXT,
          immigrant_acknowledgment TEXT,
          years_experience TEXT,
          countries_driven TEXT,
          previous_employers TEXT,
          primary_language TEXT,
          english_proficiency TEXT,
          read_signs TEXT,
          has_accidents TEXT,
          accident_details TEXT,
          has_violations TEXT,
          violation_details TEXT,
          failed_dot_test TEXT,
          has_medical_card TEXT,
          medical_card_expiry TEXT,
          authorization TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) return reject(err);
          resolve(db);
        });
      });
    }).catch(reject);
  });
}

function insertSubmission(db, kind, payload, ip) {
  return new Promise((resolve, reject) => {
    const table = kind === 'applicant' ? 'applicants' : 'immigrants';
    
    if (kind === 'applicant') {
      const fields = `first_name, last_name, email, password_hash, phone, address, city, state, zip_code, 
                     date_of_birth, gender, emergency_contact_name, emergency_contact_phone, position_type, 
                     availability_start_date, preferred_routes, years_experience, license_number, license_state, 
                     license_expiry, license_class, endorsements, previous_employer_1, employment_dates_1, 
                     reason_for_leaving_1, previous_employer_2, employment_dates_2, reason_for_leaving_2, 
                     has_accidents, accident_details, has_violations, violation_details, failed_dot_test, 
                     has_medical_card, medical_card_expiry, authorization, ip_address`;
      
      const placeholders = fields.split(', ').map(() => '?').join(', ');
      const values = [
        payload.firstName, payload.lastName, payload.email,
        payload.password ? hashPassword(payload.password) : null,
        payload.phone, payload.address, payload.city, payload.state, payload.zipCode,
        payload.dateOfBirth, payload.gender, payload.emergencyContactName, payload.emergencyContactPhone,
        payload.positionType, payload.availabilityStartDate, payload.preferredRoutes, payload.yearsExperience,
        payload.licenseNumber, payload.licenseState, payload.licenseExpiry, payload.licenseClass,
        payload.endorsements, payload.previousEmployer1, payload.employmentDates1, payload.reasonForLeaving1,
        payload.previousEmployer2, payload.employmentDates2, payload.reasonForLeaving2,
        payload.hasAccidents, payload.accidentDetails, payload.hasViolations, payload.violationDetails,
        payload.failedDotTest, payload.hasMedicalCard, payload.medicalCardExpiry, payload.authorization, ip
      ];
      
      db.run(`INSERT INTO ${table} (${fields}) VALUES (${placeholders})`, values, function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      });
    } else {
      const fields = `first_name, last_name, other_names, email, phone, address, city, state, zip_code, 
                     date_of_birth, country_of_origin, emergency_contact_name, emergency_contact_phone, 
                     immigration_status, uscis_number, issuing_country, document_expiry, work_authorization, 
                     nominator_code, sponsoring_company, visa_type, nominator_understanding, license_number, 
                     license_state, license_expiry, license_class, endorsements, cdl_location, cdl_country, 
                     immigrant_acknowledgment, years_experience, countries_driven, previous_employers, 
                     primary_language, english_proficiency, read_signs, has_accidents, accident_details, 
                     has_violations, violation_details, failed_dot_test, has_medical_card, medical_card_expiry, 
                     authorization, ip_address`;
      
      const placeholders = fields.split(', ').map(() => '?').join(', ');
      const values = [
        payload.firstName, payload.lastName, payload.otherNames, payload.email, payload.phone,
        payload.address, payload.city, payload.state, payload.zipCode, payload.dateOfBirth,
        payload.countryOfOrigin, payload.emergencyContactName, payload.emergencyContactPhone,
        payload.immigrationStatus, payload.uscisNumber, payload.issuingCountry, payload.documentExpiry,
        payload.workAuthorization, payload.nominatorCode, payload.sponsoringCompany, payload.visaType,
        payload.nominatorUnderstanding, payload.licenseNumber, payload.licenseState, payload.licenseExpiry,
        payload.licenseClass, payload.endorsements, payload.cdlLocation, payload.cdlCountry,
        payload.immigrantAcknowledgment, payload.yearsExperience, payload.countriesDriven,
        payload.previousEmployers, payload.primaryLanguage, payload.englishProficiency, payload.readSigns,
        payload.hasAccidents, payload.accidentDetails, payload.hasViolations, payload.violationDetails,
        payload.failedDotTest, payload.hasMedicalCard, payload.medicalCardExpiry, payload.authorization, ip
      ];
      
      db.run(`INSERT INTO ${table} (${fields}) VALUES (${placeholders})`, values, function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      });
    }
  });
}

// Simple password hashing for demo purposes
function hashPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(password).digest('hex');
}

// In-memory session store (demo)
const sessions = new Map();

function cleanupSessions() {
  const now = Date.now();
  for (const [token, info] of sessions) {
    if (info.expires && info.expires < now) sessions.delete(token);
  }
}

function getTokenFromReq(req) {
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  const xtoken = req.headers['x-auth-token'];
  if (xtoken) return xtoken.trim();
  // allow token in query for bookmarked requests (not recommended)
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  } catch (e) {
    return null;
  }
}

function validateToken(req) {
  cleanupSessions();
  const token = getTokenFromReq(req);
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (s.expires && s.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return s;
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

let db;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return send(res, 200, '');
  }

  if (req.method === 'POST' && (url.pathname === '/api/applicant' || url.pathname === '/api/immigrant')) {
    try {
      const raw = await collectBody(req);
      const payload = raw ? JSON.parse(raw) : {};
      const kind = url.pathname === '/api/applicant' ? 'applicant' : 'immigrant';
      // Basic validation and uniqueness for applicants
      if (kind === 'applicant') {
        if (!payload.email) return send(res, 400, { ok: false, error: 'email required' });
        // check for existing email
        const exists = await new Promise((resolve, reject) => db.get('SELECT id FROM applicants WHERE email = ?', [payload.email], (err, row) => err ? reject(err) : resolve(!!row)));
        if (exists) return send(res, 409, { ok: false, error: 'An account with this email already exists' });
      }

      await insertSubmission(db, kind, payload, req.socket.remoteAddress);
      return send(res, 200, { ok: true, message: 'Application submitted successfully' });
    } catch (err) {
      console.error('Submission error:', err);
      return send(res, 400, { ok: false, error: err.message || 'Invalid payload' });
    }
  }

  // POST endpoint to set a password for an existing applicant (demo)
  if (req.method === 'POST' && url.pathname === '/api/set-password') {
    try {
      const raw = await collectBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const { email, password } = body;
      if (!email || !password) return send(res, 400, { ok: false, error: 'email and password required' });

      const pwdHash = hashPassword(password);
      db.run('UPDATE applicants SET password_hash = ? WHERE email = ?', [pwdHash, email], function(err) {
        if (err) return send(res, 500, { ok: false, error: err.message });
        if (this.changes === 0) return send(res, 404, { ok: false, error: 'Account not found' });
        return send(res, 200, { ok: true, message: 'Password updated' });
      });
    } catch (err) {
      console.error('Set-password error:', err);
      return send(res, 400, { ok: false, error: err.message || 'Invalid payload' });
    }
  }

  // POST /api/login - authenticate applicant
  if (req.method === 'POST' && url.pathname === '/api/login') {
    try {
      const raw = await collectBody(req);
      const body = raw ? JSON.parse(raw) : {};
      const { email, password } = body;
      if (!email || !password) return send(res, 400, { ok: false, error: 'email and password required' });

      return db.get('SELECT id, first_name, last_name, email, password_hash FROM applicants WHERE email = ?', [email], (err, row) => {
        if (err) {
          console.error('Login lookup error:', err);
          return send(res, 500, { ok: false, error: err.message });
        }
        if (!row || !row.password_hash) return send(res, 401, { ok: false, error: 'Invalid credentials' });
        const hashed = hashPassword(password);
        if (hashed !== row.password_hash) return send(res, 401, { ok: false, error: 'Invalid credentials' });

        const token = crypto.randomBytes(24).toString('hex');
        sessions.set(token, { id: row.id, expires: Date.now() + 60 * 60 * 1000 });
        return send(res, 200, { ok: true, token, user: { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name } });
      });
    } catch (err) {
      console.error('Login error:', err);
      return send(res, 400, { ok: false, error: err.message || 'Invalid payload' });
    }
  }

  // GET /api/me - return current user based on token
  if (req.method === 'GET' && url.pathname === '/api/me') {
    try {
      const s = validateToken(req);
      if (!s) return send(res, 401, { ok: false, error: 'Unauthorized' });
      // fetch user info
      return db.get('SELECT id, first_name, last_name, email FROM applicants WHERE id = ?', [s.id], (err, row) => {
        if (err) return send(res, 500, { ok: false, error: err.message });
        if (!row) return send(res, 404, { ok: false, error: 'User not found' });
        return send(res, 200, { ok: true, user: { id: row.id, firstName: row.first_name, lastName: row.last_name, email: row.email } });
      });
    } catch (err) {
      console.error('Me error:', err);
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  // POST /api/logout - invalidate token
  if (req.method === 'POST' && url.pathname === '/api/logout') {
    try {
      const token = getTokenFromReq(req) || (await (async () => { const raw = await collectBody(req); try { const j = raw ? JSON.parse(raw) : {}; return j.token; } catch (e) { return null; } })());
      if (!token) return send(res, 400, { ok: false, error: 'token required' });
      const existed = sessions.delete(token);
      return send(res, 200, { ok: true, message: existed ? 'Logged out' : 'Token not found' });
    } catch (err) {
      console.error('Logout error:', err);
      return send(res, 500, { ok: false, error: err.message });
    }
  }

  // GET endpoint to view submissions (for admin/debugging)
  if (req.method === 'GET' && url.pathname === '/api/submissions') {
    try {
      const type = url.searchParams.get('type') || 'all';
      const limit = parseInt(url.searchParams.get('limit') || '50');
      
      return new Promise((resolve, reject) => {
        let query;
        if (type === 'applicant') {
          query = `SELECT * FROM applicants ORDER BY created_at DESC LIMIT ?`;
          db.all(query, [limit], (err, rows) => {
            if (err) return reject(err);
            resolve(send(res, 200, { ok: true, data: rows }));
          });
        } else if (type === 'immigrant') {
          query = `SELECT * FROM immigrants ORDER BY created_at DESC LIMIT ?`;
          db.all(query, [limit], (err, rows) => {
            if (err) return reject(err);
            resolve(send(res, 200, { ok: true, data: rows }));
          });
        } else {
          // Get both
          Promise.all([
            new Promise((res, rej) => db.all('SELECT * FROM applicants ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => err ? rej(err) : res(rows))),
            new Promise((res, rej) => db.all('SELECT * FROM immigrants ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => err ? rej(err) : res(rows)))
          ]).then(([applicants, immigrants]) => {
            resolve(send(res, 200, { ok: true, data: { applicants, immigrants } }));
          }).catch(reject);
        }
      });
    } catch (err) {
      console.error('Query error:', err);
      return send(res, 500, { ok: false, error: err.message });
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
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath)
        .on('error', () => {
          if (!res.headersSent) send(res, 404, { error: 'Not Found' });
        })
        .pipe(res);
    })
    .catch(() => send(res, 404, { error: 'Not Found' }));
});

initDatabase()
  .then((database) => {
    db = database;
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
      console.log(`Serving from ${ROOT}`);
      console.log(`Database: ${DB_FILE}`);
      console.log(`POST /api/applicant and /api/immigrant to capture submissions`);
      console.log(`GET /api/submissions?type=applicant|immigrant|all&limit=50 to view submissions`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });


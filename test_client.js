const http = require('http');
const data = JSON.stringify({
  firstName: 'Smoke', lastName: 'Test', email: 'smoke.test@example.com', password: 'P@ssw0rd!', phone: '555-111-2222', licenseNumber: 'N/A'
});

const opts = {
  hostname: 'localhost', port: 8000, path: '/api/applicant', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
};

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log('BODY', body);
  });
});
req.on('error', (e) => console.error('ERR', e));
req.write(data); req.end();

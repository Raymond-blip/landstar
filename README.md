## Werner Truck Driver Signup (Local Clone)

This project is a local clone of the Landstar public site, customized with a **Werner truck driver signup flow**:

- Updated homepage `index.htm` with a **Sign up** option.
- Two dedicated signup pages:
  - `applicant-signup.htm` – standard truck driver applicants.
  - `immigrant-signup.htm` – immigrant truck driver applicants (extra immigration fields).
- Simple Node backend (`server.js`) to accept and store submissions.

### Requirements

- Node.js (v14+ recommended)
- npm (comes with Node.js)

### Installation

First, install the dependencies:

```bash
cd "C:\Downloaded Web Sites\www.landstar.com"
npm install
```

### Running the site with backend

From the project root:

```bash
npm start
```

Or directly:

```bash
node server.js
```

Then open in your browser:

- Home: `http://localhost:8000/index.htm`
- Applicant signup: `http://localhost:8000/applicant-signup.htm`
- Immigrant signup: `http://localhost:8000/immigrant-signup.htm`

### How form submissions work

- Frontend forms send JSON via `fetch` to:
  - `POST /api/applicant` - Standard truck driver applications
  - `POST /api/immigrant` - Immigrant truck driver applications
- The Node server stores all submissions in **SQLite database**:
  - Database file: `data/submissions.db`
  - Two tables: `applicants` and `immigrants`

### Viewing submissions

You can view all submissions via the API:

- `GET /api/submissions?type=applicant` - View applicant submissions
- `GET /api/submissions?type=immigrant` - View immigrant submissions  
- `GET /api/submissions?type=all` - View all submissions
- `GET /api/submissions?type=applicant&limit=10` - Limit results

Or use a SQLite browser tool (like DB Browser for SQLite) to open `data/submissions.db` directly.

### Customizing backend integration

If you later add a real backend API:

- Update the `endpoint` constant in:
  - `applicant-signup.htm`
  - `immigrant-signup.htm`
- Point them to your real URLs (e.g. `https://api.yourdomain.com/applicants`) and adjust field names or headers as needed.

### Authentication (added demo)

- `POST /api/set-password` — set a password for an existing applicant (body: `{ "email": "...", "password": "..." }`).
- `POST /api/login` — login with `{ "email": "...", "password": "..." }` and receive `{ ok: true, token, user }` on success.
- `GET /api/me` — return current user when sent `Authorization: Bearer <token>` header.
- `POST /api/logout` — invalidate a token (accepts `Authorization: Bearer <token>` header or `{ "token": "..." }` body).

Client notes:

- Use the web UI at `/login.html` to sign in. Successful sign-in redirects to `/dashboard.html`.
- Sessions are stored in-memory (demo). Restarting the server clears sessions.
- Password hashing uses SHA-256 for this demo — do not use this in production without proper salting and stronger password handling.

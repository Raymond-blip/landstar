## Werner Truck Driver Signup (Local Clone)

This project is a local clone of the Landstar public site, customized with a **Werner truck driver signup flow**:

- Updated homepage `index.htm` with a **Sign up** option.
- Two dedicated signup pages:
  - `applicant-signup.htm` – standard truck driver applicants.
  - `immigrant-signup.htm` – immigrant truck driver applicants (extra immigration fields).
- Simple Node backend (`server.js`) to accept and store submissions.

### Requirements

- Node.js (already installed on your machine).

### Running the site with backend

From the project root:

```bash
cd "C:\Downloaded Web Sites\www.landstar.com"
node server.js
```

Then open in your browser:

- Home: `http://localhost:8000/index.htm`
- Applicant signup: `http://localhost:8000/applicant-signup.htm`
- Immigrant signup: `http://localhost:8000/immigrant-signup.htm`

### How form submissions work

- Frontend forms send JSON via `fetch` to:
  - `POST /api/applicant`
  - `POST /api/immigrant`
- The Node server writes all submissions to:
  - `data/submissions.json`

You can open that file to review all submitted applications.

### Customizing backend integration

If you later add a real backend API:

- Update the `endpoint` constant in:
  - `applicant-signup.htm`
  - `immigrant-signup.htm`
- Point them to your real URLs (e.g. `https://api.yourdomain.com/applicants`) and adjust field names or headers as needed.

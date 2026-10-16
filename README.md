# YSP Portal

An internal servicing prototype for the Spring 2027 Youth Soccer Partnership season. The first slice covers the Coney Island Cyclones Soccer Club: a rep portfolio and detail view, a scoped partner view, requirements, logged messages, and files.

## Local setup

Requires Node.js 24 and npm. No external database, storage service, or credentials are needed for the prototype.

```bash
cd /workspace/YSP-Portal  # or your local checkout
npm ci
npm run dev
```

Open `http://localhost:3000`. On first run, the app creates a SQLite database and two random demo passwords in `.data/demo-credentials.txt`. Read that local file and sign in as either **YSP representative** or **Cyclones partner admin**. The credential file and database are ignored by Git. For a production-style local check, use `npm run build && npm run start`.

Optional paths are documented in [.env.example](.env.example). Copy it to `.env.local` only if you want to move the SQLite database or upload directory. Relative paths resolve from the checkout. Uploads default to `.data/uploads`.

```bash
npm run typecheck
npm test
npm run build
```

The data tests create their own temporary SQLite database. `npm run build` also initializes the local demo database if it does not yet exist.

## The Cyclones slice

The rep signs in, opens **Assigned partners**, and selects Cyclones. The detail page shows the known club, contact, owner, season and stage, plus editable website, Instagram and Facebook links. The supplied inline Cyclones logo is represented by a close transparent recreation at `public/cyclones-logo.png`. Replace that file with the approved original PNG when available; the tile and profile views use the same asset.

The rep can mark requirements complete or undo them, log a partner-visible message or internal note, upload a PDF, image or text file (up to 10 MB), and change a file's visibility. **Preview partner view** uses the same organization scoped query as a partner account. Internal notes and files never enter that query. Uploaded files are served by an access checked download endpoint.

Match and experience assignments remain unconfirmed. The draft is shown as **Not started**. No contact address, match date, selected experience, or deadline is invented.

## Data and prototype limits

SQLite persists organizations, users, contacts, partnerships, requirements, communications, files and the other relational concepts in `src/lib/db.ts`. Upload bytes persist on local disk. Session tokens are opaque, random and stored by hash; demo passwords are generated locally and stored as salted scrypt hashes. The two demo accounts provide a real server side role and organization boundary for this prototype, but there is no account administration, password recovery, email verification, multi-factor authentication, or production identity provider.

**Log message** records a communication in the portal; it does not send email or SMS. The draft, match scheduling, reminder delivery, ticket issuance, photo distribution and CRM editing are future work. File downloads require an active session and organization/visibility checks, but local disk storage is not a production object store or signed URL service. Run this prototype only in a trusted development environment until production identity, authorization review, storage, upload scanning, audit logging and backup policies are added. Salesforce is not connected.

The current UI and rep authorization are deliberately limited to the seeded Cyclones record and Phineas Kraebber. The schema includes organization, season, match and experience links for expansion to other clubs. Existing demo data is seeded once; changing seed code does not rewrite a populated database.

## Next milestone

Build the January 2027 draft flow: configure the real match list and available experiences, invite club administrators, collect preferences and estimated participation, then assign matches with an auditable approval step. After that, attach real deadlines and the two month, one month and two week reminder cadence.

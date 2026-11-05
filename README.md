# YSP Portal

An internal servicing prototype for the Spring 2027 Youth Soccer Partnership season. The first slice covers the Coney Island Cyclones Soccer Club: a rep portfolio and detail view, a scoped partner view, requirements, logged messages, and files.

## Local setup

Requires Node.js 24 and npm. No external database, storage service, or credentials are needed for the prototype.

```bash
cd /workspace/YSP-Portal  # or your local checkout
npm ci
npm run dev
```

Open `http://localhost:3000` and choose **Enter rep workspace**, **Enter partner workspace**, **Enter Youth Soccer Club CRM**, or the separate **Enter 2027 Sprint calendar** panel. No password is required in this prototype. On first run, the app creates an ignored SQLite database in `.data`. For a production-style local check, use `npm run build && npm run start`.

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

The Rep page shows five selectable sales rep books: Phineas Kraebber, Chris Anderson, Jason Ortega, Jordan DeBernardo, and Sebastian Maymi. Cyclones remains assigned to Phineas. The owner-supplied assignments give Chris 48 CRM clubs, Jason nine, Jordan three, and Sebastian three. Repeated contact rows for one club create just one club assignment; contact names and emails from those rows have not been imported. Staff can assign CRM directory clubs to a rep from each CRM club page, and that assignment appears in the selected rep's book. CRM club assignments and active partnership records remain distinct.

Match and experience assignments remain unconfirmed. The draft is shown as **Not started**. No contact address, match date, selected experience, or deadline is invented.

## Youth Soccer Club CRM

The CRM entry on the login page opens 633 active club records, including 68 **Current Youth Partners (YSPs)**. The 2026 youth soccer workbook supplied club names and league-sheet sources. Individually approved contact rows are added club by club; the workbook itself is not imported or stored in the repository. Confirmed logo batches are matched to stable CRM IDs; clubs still missing logos show initials. EYSA is the canonical record for Eastchester Soccer Club: its existing partner status, rep assignment, and logo are retained, along with Eastchester's three league sources and provisional Westchester area. CRM records remain separate from the Cyclones partnership workflow.

The directory lists all clubs alphabetically by default and can be grouped by location or current YSP status. Search, location, status, workbook source, and rep filters can be combined. Location tags are separate from YSP status, and a club may have multiple location tags. Existing inferred areas remain provisional; staff can edit the set of locations on each club page. The original workbook is not stored in the repository.

The CRM uses the open rep demo session; it is not production authentication. Salesforce is not connected, and no data sync occurs.

## Sprint Season Experiences

The landing page has a separate **2027 Sprint calendar** entry beside the three workspace buttons, with a preview of the current match schedule. It opens calendar and list views of the seven supplied 2027 Sprint Season matches. Dates, Eastern kickoff times, venue, status, and operational notes are editable. March 27 starts as **Venue TBD**. Updating date, kickoff, or venue flags approved or sent reservation instructions for review.

The experience catalog starts with 11 **draft** types named in the handoff. There are no seeded 2027 offerings or bookings and no imported 2026 capacities or eligibility rules. Staff can edit or add catalog definitions, attach an offering to one match, set participant and chaperone capacity, match-specific rules and logistics, and mark catalog and offering approvals separately. An offering must have an approved catalog definition, approved match rules, and capacity before staff can make it available. Pausing or cancelling an offering does not alter other matches. Active reservations must be released before cancellation.

Staff can create groups and attach multiple separate reservations to an offering, with holds and confirmed allocations tracked independently. Active holds need a future Eastern expiration; expired or released holds stop consuming capacity. Reservations track assigned rep, participant and chaperone counts, next action, and separate manual roster, instruction, and waiver statuses. Match list filters cover date, opponent, venue, experience type, availability, rep, and items needing action. All edits persist in the local SQLite database; no participant or guardian details are collected in this release.

The tracker is a staff-only **prototype** within the existing open demo rep session. It does not send instructions, communicate with groups, or connect to DocuSign. NYCFC staff still need to confirm the 2027 experiences offered per match, capacity and eligibility, ticket rules, approval ownership, roster and waiver deadlines, approved instruction templates, and DocuSign access before live bookings. The 2026 workbook is needed before importing any of its historical rules.

## Data and prototype limits

SQLite persists organizations, users, contacts, partnerships, requirements, communications, CRM records, files and the other relational concepts in `src/lib/db.ts`. Upload bytes persist on local disk. The demo workspace buttons create opaque sessions so each view uses its own server side organization filter. Anyone who can reach the preview can choose any role, so this is **not authentication** and must not be used with real partner data. There is no account administration or production identity provider.

**Log message** records a communication in the portal; it does not send email or SMS. The draft, match scheduling, reminder delivery, ticket issuance and photo distribution are future work. File downloads require an active session and organization/visibility checks, but local disk storage is not a production object store or signed URL service. Run this prototype only in a trusted development environment until production identity, authorization review, storage, upload scanning, audit logging and backup policies are added. Salesforce is not connected.

The existing partnership UI and rep authorization remain deliberately limited to the seeded Cyclones record and Phineas Kraebber. The CRM has 633 active internal records under the same rep demo session. The schema includes organization, season, match and experience links for expansion to other clubs. CRM records are added on startup without replacing saved notes and next actions.

## Next milestone

Build the January 2027 draft flow: configure the real match list and available experiences, invite club administrators, collect preferences and estimated participation, then assign matches with an auditable approval step. After that, attach real deadlines and the two month, one month and two week reminder cadence.

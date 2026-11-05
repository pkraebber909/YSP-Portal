# Youth soccer contact import preparation

Status: the full workbook contact import remains preparation only. The owner later authorized adding individually reviewed club contacts to the pushed portal, starting with Jose Romero Aguilar at 5 Star Soccer Academy. Do not treat that direction as approval to import all workbook rows at once.

## Access and storage gate

The CRM login still accepts the public demo role picker without credentials. The resulting session reaches the internal CRM. SQLite and uploads live on local disk; the project has no production identity provider, access administration, audit trail, or managed encrypted storage. The owner explicitly overrode the earlier GitHub restriction for individually selected contact records and asked for those changes to be pushed. This does not make the CRM access restricted or the contact data private. The workbook and bulk exports remain out of GitHub.

## Attached workbook and reconciliation

Both SharePoint URLs returned HTTP 403 in this environment. The owner then attached `2026 YS Database Phin + Rei (1).xlsx`, which was read without modification. Its SHA-256 is `f5d6c8dc817502beb39364b6242a3259d7c96e71432f7fc043f12d4cea907443`. It differs from the older attachment, so the counts below come from this newly attached file.

The current file has 11 tabs. NYCSL uses `Name`, `Name`, `Club`, `Team`, `Role`, `Email`, `Phone`, `Rep`; EDP North Atlantic and EDP Tri State use `Rep`, `Club Name`, `Position`, `First Name`, `Last Name`, `Email`, `Phone`, `Team(s)`; LIJSL, Hudson Valley Soccer League, CJSA, CJSL, and Big Apple use `Club Name`, `Position`, `First Name`, `Last Name`, `Email`, `Phone`, and optionally `Team(s)`; Westchester YSL and Staten Island use `Club`, `Position`, `First Name`, `Last Name`, `Email`, `Phone`, `Team`; Capital District uses `Role`, `First Name`, `Last Name`, `Email`, `Phone Number`, `Club/Team`. Blank club cells are held rather than filled down. Capital District's combined club/team field needs manual review where a row could refer to multiple clubs.

Read-only preliminary row counts against the current 633 active CRM records, matching normalized exact names and documented aliases with matching workbook tab sources:

| Decision | Rows |
| --- | ---: |
| Populated | 6,813 |
| Exact non-partner club candidates | 5,786 |
| Current partner exclusions | 194 |
| Unmatched club names | 740 |
| Multi-club names requiring review | 76 |
| Blank club names | 17 |

The exact non-partner rows span 489 club IDs; the excluded rows span 10 current partner IDs. Of the 489 candidate clubs, 147 have `Area to confirm` and must be held for location review; the other 342 have only provisional area evidence. These are **row and club matching candidates**, not approved contact imports. Identity, branch, location, duplicate, visibility, and source checks remain.

Among the 5,786 candidate rows, 1,322 lack a named person plus an email or phone and need contact identity review. The remaining rows produce 3,465 provisional distinct contact keys using club ID, normalized person name, and email or phone. There are 774 repeated-key groups representing 999 extra rows, 55 rows with multiple email addresses, 52 email addresses shared by more than one person/club identity, and 30 person/email keys spanning more than one club. No existing non-partner CRM contacts matched for enrichment because there are currently no stored contacts on active directory clubs. These are **estimates for review**, not import decisions; shared inbox and cross-club cases must not be merged automatically.

Representative club-level decisions (no personal contact values shown): `ALBION SC Brooklyn` on NYCSL row 2 is an exact non-partner candidate; `New Hyde Park Wildcats Soccer Club` on NYCSL row 557 is excluded as a current partner; `Brentwood SC (LIJSL)` on NYCSL row 87 is unmatched to the existing stable names/aliases; `Atlantic United SB/LGN SC; Middle Country Children SC (LIJSL)` on LIJSL row 11 is held as multi-club; Westchester YSL row 11 has no club name and is held. No exact-name alias collision was found in this pass, but provisional areas and similar branch names remain identity review items.

## Synthetic pilot

The isolated test database uses only invented `example.com` addresses:

| Club | Contact | Treatment |
| --- | --- | --- |
| Bellport | Pilot Person A, coach, 2014 Boys | Two synthetic source rows become one secondary contact with two provenance entries and two separate email links. |
| Bellport | Club office | General inbox remains its own secondary contact. |
| Bellport and Carmel United | Pilot Person B | Separate club contact records, even with the same person name and email. |

Existing primary contacts, including 06 United, are left unchanged. Other contacts appear in compact cards; the first three are expanded and further cards are collapsible. Role, team, extra email, and source tables are additive and preserve existing contact fields.

## Import decision rules and rollback

Use the current workbook's tab and row number, raw cell values, source/version, visibility status, and decision for each accepted row. Visibility defaults to unverified; a workbook field is not public merely because other GotSport data is public. Match only a unique stable club ID after checking names, documented aliases and location. Exclude current partners and active partner records. Hold uncertain club identity, multi-club names, missing identifiers, and unclear public visibility. Compare normalized names plus email or phone **within the same club**; do not merge on name or email alone. Keep shared mailboxes and cross-club people distinct. Preserve original values and all existing populated fields. Workbook rep text is a suggestion only.

Before any approved real import, take a SQLite backup with the app stopped or SQLite's backup API, record the workbook checksum, and store an import batch ID with per-row decisions. Reruns should match that batch and source row, and rollback should delete only records created by that batch while restoring any separately logged field changes. No real import or backup has been performed in this preparation step.

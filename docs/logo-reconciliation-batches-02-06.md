# YSP logo batches 2–6 review

The five ZIPs each contain 50 confirmed image files. Their 250 image hashes and
club names are distinct across these batches. Every packaged checksum and image
dimension matched the manifest. The packages also contain 35 image-free review
rows (31 distinct names); these rows have no Portal assignment.
The Griffin United review row is a capitalization duplicate of a separately
confirmed Batch 2 entry; only that confirmed entry supplies its image.

## Applied

239 logos were mapped to existing stable CRM IDs whose `logo_path` was empty.
Original file bytes, aspect ratio, and transparency are preserved. The seed
fills only empty logo paths, so later staff choices survive restarts. No club,
contact, note, owner, league source, or partner classification was changed.
The 239 new logo paths are unique. Two older shared-image paths already exist
for Eleftheria-Pancyprian/EPSC and the two Peruvian Soccer records; this import
does not add to those shared assignments.
The source URLs, image filenames, SHA-256 hashes, matching IDs, and individual
decisions are in [the batch mapping](logo-reconciliation-batches-02-06.json).

## Held or retained

No existing crest was replaced. Eight existing logo-bearing records were
retained; five have a different or variant supplied mark, while the others
have an identity/alias question or an existing version worth keeping.

| Submitted image | Decision | Reason |
| --- | --- | --- |
| Hewlett/Lawrence (LIJSL) | Hold | Directory Hewlett/Lawrence and current YSP HLSC appear to be the same club; the source is `hlsc.org`. |
| MYS Sporting CT | Hold | MYS Sporting CT and Sporting CT are separate CRM rows, while the source describes one program. |
| Vale Sports Club | Hold | Vale Sports Club and Vale SC are separate CRM rows, but the source documents both names for one club. |
| 06 United FC | Hold | UPSL team uses the 06 United shield, but its relationship to the youth CRM record is not established. |
| Soccer Legion FC | Hold | Portal name omits FC and its existing crest differs from the supplied current crest. |
| Williamsburg Soccer Club | Hold | Likely the existing Williamsburg Soccer record, but the package does not establish that alias. The existing higher-resolution wordmark remains. |
| Soccer Kids NYC | Hold replacement | Existing skyline version and supplied small round version differ. |
| Tibet FC | Hold replacement | Same shield, different text treatment; existing high-resolution asset remains. |
| Levittown Soccer Club | Hold replacement | Supplied 50th-anniversary crest is a different current variant; existing ordinary crest remains. |
| Saints FC | Hold replacement | Supplied official horizontal wordmark differs from the existing round crest and is designed for a dark background. |
| Tru Tekkers | Keep existing | Same crest; existing version has higher nominal resolution. Supplied version has transparency. |

## Eastchester and EYSA merge

Approved and completed on 5 November 2026. `eysa` remains canonical with its
Current Youth Partner classification, Sebastian Maymi assignment, and existing
logo. Its area is Westchester, with a provisional league-sheet basis. It now
holds the Eastchester directory row's EDP North Atlantic, EDP Tri State, and
Westchester YSL sources. The old `directory-eastchester` row was removed, and
its URL redirects to EYSA. Eastchester and Eastchester Soccer Club remain
searchable aliases. The migration also transfers any contacts, notes, actions,
links, or other unique fields saved on a legacy row before it is removed.

## Display and quality

The CRM uses `object-fit: contain`. No imported raster needs enlargement at the
112 × 80 pixel detail slot. Of the 239 imported images, 95 have at least one
native dimension below 256 pixels, and 10 are below 128 pixels in one
dimension. Particularly small examples include Rosedale Rockets (142 × 54),
Hartford Lions (100 × 115), Warwick (75 × 86), and South Windsor (160 × 75).
Keep their original files until the clubs provide larger art. Rosedale Rockets' official
source places the club in Queens while the existing Long Island area is based
on a provisional league sheet. The area was left unchanged for staff review.

## Checks

The project build, TypeScript check, and all 15 tests pass. Browser checks
covered CRM search, the Connecticut area filter, a newly assigned club detail,
and a narrow viewport. All 359 distinct CRM logo URLs loaded in the browser,
including SVG and GIF assets. A directory grid min-width issue found at a
390-pixel phone viewport was fixed; the layout and scroll width now both remain
390 pixels. After the EYSA merge, an additional browser check verified that
searching Eastchester shows EYSA, the partner and Westchester filters include it,
the old Eastchester URL redirects to `/crm/eysa`, and its logo renders on a
390-pixel viewport. No changes were pushed or published.

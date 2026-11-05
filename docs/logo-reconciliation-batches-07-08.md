# Logo batches 7 and 8

The source archives are `YSP_Logos_Batch_07_2026-11-05.zip` and
`YSP_Logos_Batch_08_2026-11-05.zip`. Their manifests contain 21 and 25
confirmed images respectively. Full source URLs, source image URLs, location
evidence, aliases, hashes, image quality notes, stable CRM IDs, decisions, and
the separate review lists are retained in
[`logo-reconciliation-batches-07-08.json`](logo-reconciliation-batches-07-08.json).

| Decision | Count |
| --- | ---: |
| New image assigned to an empty club logo slot | 36 |
| Existing identical asset assigned to another exact club record | 1 |
| Existing identical club logo retained | 8 |
| Reviewed Community SC crest upgraded to official source version | 1 |
| Verified parent or programme crest shared with a separate CRM record | 6 |
| Review-only entries with no image in Batch 7 | 194 |
| Review-only entries with no image in Batch 8 | 12 |

The 37 new files are copied without altering their bytes, proportions or
transparency. The 43 empty-slot assignments are guarded by `logo_path IS NULL`
in the CRM seed. The Community SC replacement applies only while its logo path
still points to the previous `community-sc.png` seed, preserving any later staff
choice. No club records were created or merged; no partnership, ownership,
contact or note fields were changed.

Orange County Soccer Club uses the identical existing OCSC asset. The six
documented shared-crest mappings use one existing asset for the related record:
Greater Long Beach, Hartford Athletic Youth Academy, Ginga FC, New York City
FC Girls, New York City FC Select, and Metropolitan Oval Academy Brooklyn.
Their CRM records remain separate. In particular, the supplied Greater Long
Beach mapping establishes an alias for the existing Long Beach record but does
not authorize a record merge.

Several Batch 7 images are small source thumbnails, and the Empire State Youth
Soccer Club SVG embeds a small raster. They are suitable for the directory's
small logo display; obtain larger originals before using them for print or
large-format presentation. School and athletics marks from the Staten Island
league are described as such in the mapping and are not represented as
soccer-exclusive marks.

The 206 entries in the review lists have no packaged image and remain
unchanged. No review-list name was treated as an image assignment or as
evidence of NYCFC partnership.

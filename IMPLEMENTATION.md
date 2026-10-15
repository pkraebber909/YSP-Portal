# Implementation note

**Real in this slice:** server rendered rep and partner workspaces; seeded Cyclones relationship; SQLite persistence; requirement completion; website/social link editing; portal-visible versus internal communication logging; local file upload, download and visibility changes; generated demo passwords and hashed sessions; server side role and organization checks; partner projection that filters internal records.

**Placeholder or planned:** Cyclones logo, confirmed contacts beyond Vlad, draft selection, match and experience assignments, deadlines, ticket fulfillment, message delivery, reminders, CRM editing, external authentication, cloud file storage and Salesforce integration. "Partner preview" renders the same filtered partner projection as a partner account, while retaining the rep's session for navigation back.

The primary servicing tables carry an organization ID and a partnership ID that contains the season. Match and experience assignment tables exist but contain no fabricated assignments. CRM activity is a separate table and has no partner query. New partner roles should be added through explicit `portal_access` checks and per-organization tests before multi-club access is enabled.

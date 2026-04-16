# Machrio Partner Program MVP

## Goal

Build a first working version of Machrio's creator partner platform that supports:

- creator application and review status
- partner dashboard sign-in with email verification
- tracked short-link generation
- publication URL submission
- click attribution through `/go/{partnerCode}/{shortCode}`
- RFQ attribution
- order attribution and commission estimation
- internal overview for partner-program admins
- admin review actions for partners and publications
- payout batch creation, CSV export, and payout ledger management

## What This MVP Ships

### Public pages

- `/partner-program`
- `/partner-program/apply`
- `/partner-program/terms`
- `/write-for-us` redirects to `/partner-program`

### Partner pages

- `/partner/dashboard`
- `/partner/admin`

### APIs

- `POST /api/partner-program/apply`
- `GET /api/partner/data`
- `GET|POST /api/partner/links`
- `GET|POST /api/partner/publications`
- `GET /api/partner/admin/overview`
- `PATCH /api/partner/admin/partners/[id]`
- `PATCH /api/partner/admin/publications/[id]`
- `POST /api/partner/admin/payouts`
- `GET|PATCH /api/partner/admin/payouts/[id]`
- `GET /go/[partnerCode]/[linkCode]`

## Data Model

The MVP uses standalone Postgres tables created lazily by `src/lib/partner-program.ts`:

- `creator_partners`
- `creator_tracking_links`
- `creator_publications`
- `creator_click_events`
- `creator_lead_events`
- `creator_commissions`
- `creator_payouts`
- `creator_payout_items`

The helper also adds partner attribution columns to existing `orders` and `rfq_submissions` tables.

## Attribution Flow

1. Partner creates a short link to a Machrio destination.
2. Visitor clicks `/go/{partnerCode}/{shortCode}`.
3. The redirect route records a click event and writes a first-party attribution cookie.
4. If the visitor submits an RFQ, the RFQ is tagged with partner, publication, link, and click IDs.
5. If the visitor creates an order, the order is tagged the same way and a commission row is created.
6. When payment becomes confirmed, the commission row is synced from `pending` to `approved`.
7. Admin can approve partner applications and publication submissions from the internal dashboard.
8. Approved fees and commissions can be locked into a payout batch, then marked paid or cancelled.
9. Each payout batch can be exported as CSV for finance execution or reconciliation.

## Current Business Rules

- fixed content fee defaults:
  - social / thread: `$10`
  - article / blog: `$20`
  - video: `$30`
  - landing / resource page: `$25`
- commission: `3%` of order subtotal
- attribution window: `30 days`
- payout batches are created per partner and per currency
- payout batch export is generated from the locked batch snapshot, so finance sees the exact method, destination, totals, and line items that were approved at batch creation time
- commission status:
  - `pending` before payment confirmation
  - `approved` after paid + valid order status
  - `locked` once added to a payout batch
  - `paid` once a payout batch is marked paid
  - `reversed` for cancelled or refunded orders
- publication fee status:
  - `pending` before admin review
  - `approved` after publication approval
  - `locked` once included in a payout batch
  - `paid` once the payout batch is marked paid
  - `waived` if publication is approved with a zero fee
  - `reversed` if the publication is rejected

## Known MVP Limits

- payout batches are created from all currently approved items for a partner and currency, not by arbitrary manual line selection
- external impressions and views are not automatically fetched from platform APIs yet
- refund handling is status-based and not yet partial-refund aware

## Suggested Next Steps

1. Add Payload admin views for partner review and payout control so the workflow also exists inside CMS admin.
2. Add remittance files and monthly settlement reporting on top of the batch export.
3. Add asset management so partners can choose products and categories from a curated library.
4. Add platform integrations for YouTube and Instagram connected metrics.
5. Add refund-adjustment handling that can create negative payout carryovers instead of only status flips.

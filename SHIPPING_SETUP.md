# Shipping Setup

This project now uses live, database-backed shipping quotes instead of the old fixed fallback rule.

## What the runtime expects

- `shipping_methods`: active shipping routes such as `us-warehouse`, `ddp-air`, and `ddp-sea`
- `shipping_rates`: country-level rate cards with `base_weight`, `base_rate`, `additional_rate`, and `handling_fee`
- `free_shipping_rules`: optional method-level or country-level free-shipping thresholds
- Product weight data:
  - preferred source: `products.shipping_info.weight`
  - runtime fallback: `products.weight`
  - processing time defaults to `3` days when not configured

## Commands

Create or update shipping methods, rates, and free-shipping rules:

```bash
npm run seed:shipping -- --config scripts/shipping-config.json
```

Check whether shipping is ready to go live:

```bash
npm run check:shipping
```

## Recommended workflow

1. Copy `scripts/shipping-config.template.json` to `scripts/shipping-config.json`.
2. Keep the shipping methods you want buyers to see.
3. Add `shipping_rates` for every supported destination.
4. Add an `OTHER` rate for each method if you want a default destination fallback.
5. Add `freeShippingRules` only where you want a route-specific threshold.
6. Run `npm run seed:shipping -- --config scripts/shipping-config.json`.
7. Run `npm run check:shipping`.
8. Test cart and checkout with at least one country-specific rate and one `OTHER` rate.

## Rate object example

```json
{
  "shippingMethodCode": "ddp-air",
  "countryCode": "US",
  "baseWeight": 2,
  "baseRate": 28,
  "additionalRate": 6,
  "handlingFee": 3,
  "isActive": true
}
```

## Free-shipping rule example

```json
{
  "shippingMethodCode": "ddp-sea",
  "countryCode": "US",
  "minimumAmount": 800,
  "isActive": true
}
```

## Current runtime behavior

- If a live rate exists, checkout uses it.
- If no live rate exists, cart and checkout show `Quote required`.
- Orders cannot be placed without a live shipping method selection.
- Shipping cost calculation follows:

```text
shipping = base_rate + overage_cost + handling_fee
overage_cost = max(0, total_weight - base_weight) * additional_rate
```

# Shipping Rate Benchmarks

This file records the public benchmark sources used to build the first draft of `scripts/shipping-config.json`.

## Important note

- These are planning benchmarks, not contracted carrier tariffs.
- Public pages often publish airport-to-airport, LCL/CBM, or container references, while this project needs a buyer-facing checkout formula:

```text
shipping = base_rate + overage_cost + handling_fee
overage_cost = max(0, total_weight - base_weight) * additional_rate
```

- Because of that, the JSON values are inferred commercial starting points, not direct copies of any public table.
- `freeShippingRules` were intentionally left empty for now because public freight benchmarks do not tell us what your margin-safe free-shipping thresholds should be.

## Public benchmark sources used

### DDP and regional reference ranges

- Dantful March 2026 DDP benchmarks:
  - North America (USA): air DDP `5.50-6.50 USD/kg`
  - Europe (Germany/UK): air DDP `5.20-6.00 USD/kg`
  - Middle East (UAE/KSA): air DDP `4.80-5.50 USD/kg`
  - Southeast Asia: air DDP `2.50-3.50 USD/kg`
  - Source: https://www.dantful.com/current-shipping-rates-from-china/

### Country-level air benchmarks used for calibration

- USA: Sino Shipping April 2026, `6.88 USD/kg`
- Canada: Sino Shipping April 2026, `7.00 USD/kg`; Welltrans DDP air `8-15 USD/kg`
- Mexico: Sino Shipping April 2026, `7.60 USD/kg`
- Germany: Sino Shipping February 2026, `7.20 USD/kg`
- United Kingdom: Sino Shipping February 2026, `7.70 USD/kg`
- Denmark: Sino Shipping February 2026, `6.80 USD/kg`
- Australia: BSI 2026 reference range `4.5-7.5 USD/kg`
- New Zealand: Sino Shipping April 2026, `4.50 USD/kg`
- Singapore: Sino Shipping April 2026, `2.50 USD/kg`
- UAE: Sino Shipping April 2026, `4.00 USD/kg`
- Philippines: Sino Shipping April 2026, `3.10 USD/kg`
- Indonesia: Sino Shipping April 2026, `2.60 USD/kg`
- Israel: Sino Shipping April 2026, `6.05 USD/kg`
- Hong Kong: DocShipper benchmark `4.80-6.60 USD/kg`

## How the draft config was inferred

- `us-warehouse`
  - Anchored to UPS 2026 U.S. domestic simple-rate ground pricing for a small domestic parcel floor.
  - Source: UPS 2026 daily rates PDF.

- `ddp-air`
  - `baseWeight` set to `2 kg` to reflect minimum-charge behavior on small urgent shipments.
  - `additionalRate` was set near the midpoint of the public lane benchmark after adjusting from airport-to-airport to a buyer-facing landed quote.
  - `baseRate` was then set so the first `2 kg` does not come out unrealistically cheap versus published market references.

- `ddp-sea`
  - `baseWeight` set to `5 kg` to avoid underpricing small sea shipments.
  - `additionalRate` was inferred from a mix of DDP air/sea public comparisons, container references, and LCL guidance, then normalized into a weight-based checkout model.
  - Regional lanes with lower short-haul or intra-Asia benchmarks were priced lower than North America and Europe.

## Next tuning pass I recommend

1. Replace public benchmarks with your actual forwarder quotes where available.
2. Confirm whether `U.S. Warehouse` should remain `US-only` or also cover Canada/Mexico.
3. Add margin-based `freeShippingRules` after finance review.
4. Run `npm run check:shipping` after every update.

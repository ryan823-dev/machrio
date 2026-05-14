# GSC Revalidation Checklist - 2026-05-14

## Sitemap / Indexability Status

- Category sitemap URL count: 311
- Category redirect rules checked: 93
- Deleted product redirects checked: 8
- Robots disallow paths checked against static sitemap: /admin, /api, /account, /cart, /checkout, /order, /search

## Open Issues To Fix Before Revalidation

| area | issue | url | action |
| --- | --- | --- | --- |
| products | Published product has non-indexable category: missing | /product/missing/other-100w-5000k-10000-lm-ae1303682 | Remap product to a published category or unpublish product. |
| products | Published product has non-indexable category: missing | /product/missing/other-ac2207397 | Remap product to a published category or unpublish product. |
| products | Published product has non-indexable category: missing | /product/missing/other-pvc-300v-10a-pvc-ac2207438 | Remap product to a published category or unpublish product. |
| products | Published product has non-indexable category: missing | /product/missing/sma-female-right-angle-connector-0-481-hole-spacing-weld-mount-2-hole-flange-ae5591610 | Remap product to a published category or unpublish product. |
| products | Published product has non-indexable category: missing | /product/missing/steel-m20-thread-hydraulic-shock-absorber-for-automation-pkg-qty-2-fv4508 | Remap product to a published category or unpublish product. |
| products | Published product has non-indexable category: missing | /product/missing/steel-shank-padlock-1-5-wide-1-shackle-clearance-pkg-qty-20-ac3892103 | Remap product to a published category or unpublish product. |

## Clean / Fixed Checks

| check | result |
| --- | --- |
| Category sitemap excludes legacy redirect-source slugs | 3 redirect-source category records exist in DB; sitemap query excludes 92 static category redirect sources. |
| Category sitemap excludes zero-product categories | 50 published zero-product categories found outside sitemap sample; keep out until converted to demand-capture pages. |
| Static sitemap vs robots.txt | No static sitemap URL is blocked by robots.txt. |
| Product sitemap source query | Requires published product, non-empty product slug, published category, and non-empty category slug. |
| Runtime category/product pages | Patched to require published category status before rendering indexable category or product pages. |

## GSC Submission Notes

1. Submit /sitemap.xml after deployment.
2. Revalidate "Page with redirect" after confirming old category and trailing-slash URLs 301 to final URLs.
3. Revalidate "Alternate page with proper canonical tag" only after duplicate slug checks are clear.
4. Revalidate "Crawled - currently not indexed" for priority category URLs after the SEO copy/RFQ modules are deployed.
5. Keep no-product categories out of sitemap unless the page has buying-guide content, related categories, and a visible RFQ/demand-capture route.

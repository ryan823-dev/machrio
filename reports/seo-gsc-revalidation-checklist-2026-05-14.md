# GSC Revalidation Checklist - 2026-05-14

## Sitemap / Indexability Status

- Category sitemap URL count: 311
- Category redirect rules checked: 93
- Deleted product redirects checked: 8
- Robots disallow paths checked against static sitemap: /admin, /api, /account, /cart, /checkout, /order, /search

## Open Issues To Fix Before Revalidation

None found.

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

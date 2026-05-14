#!/usr/bin/env python3
"""
Classify Google Search Console "Excluded by noindex" drilldown exports.

Usage:
  python3 scripts/audit-gsc-noindex.py /path/to/Coverage-Drilldown.zip
  python3 scripts/audit-gsc-noindex.py /path/to/table.csv --output /tmp/noindex-audit.csv

The script accepts either a GSC ZIP export or the CSV table inside it. It does
not require third-party packages.
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


@dataclass(frozen=True)
class ClassifiedUrl:
    url: str
    last_crawled: str
    path: str
    query: str
    pattern: str
    action: str
    reason: str


KEEP_NOINDEX_PREFIXES = (
    "/account",
    "/admin",
    "/api/",
    "/cart",
    "/checkout",
    "/order/",
    "/partner/admin",
    "/partner/dashboard",
)

MUST_INDEX_PREFIXES = (
    "/category/",
    "/glossary/",
    "/industry/",
    "/knowledge-center/",
    "/product/",
)

MUST_INDEX_STATIC_PATHS = {
    "/",
    "/about",
    "/category",
    "/clearance-duties",
    "/contact",
    "/deals",
    "/faq",
    "/glossary",
    "/how-to-order",
    "/knowledge-center",
    "/new-arrivals",
    "/payment-methods",
    "/privacy",
    "/return-refund",
    "/rfq",
    "/shipping-policy",
    "/terms",
}


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def read_rows_from_zip(path: Path) -> list[dict[str, str]]:
    candidates: list[list[dict[str, str]]] = []

    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            if not info.filename.lower().endswith(".csv"):
                continue

            raw = archive.read(info.filename)
            text = raw.decode("utf-8-sig")
            rows = list(csv.DictReader(io.StringIO(text)))
            if rows and any("网址" in row or "URL" in row or "url" in row for row in rows[:1]):
                candidates.append(rows)

    if not candidates:
        raise SystemExit(f"No URL table CSV found in {path}")

    return max(candidates, key=len)


def read_rows(path: Path) -> list[dict[str, str]]:
    if path.suffix.lower() == ".zip":
        return read_rows_from_zip(path)
    return read_csv_rows(path)


def get_field(row: dict[str, str], *names: str) -> str:
    for name in names:
        value = row.get(name)
        if value:
            return value.strip()
    return ""


def matches_prefix(path: str, prefix: str) -> bool:
    normalized = prefix.rstrip("/")
    return path == normalized or path.startswith(f"{normalized}/")


def classify_url(url: str, last_crawled: str = "") -> ClassifiedUrl:
    parsed = urlparse(url)
    path = parsed.path.rstrip("/") or "/"
    query = parsed.query

    if path.startswith("/product/products/"):
        return ClassifiedUrl(
            url=url,
            last_crawled=last_crawled,
            path=path,
            query=query,
            pattern="/product/products/[slug]",
            action="rescue_validate",
            reason="Legacy product URL should 308 to canonical /product/[category]/[slug]; validate after redirect fix.",
        )

    if path == "/search" or path.startswith("/search/"):
        return ClassifiedUrl(
            url=url,
            last_crawled=last_crawled,
            path=path,
            query=query,
            pattern="/search?*" if query else "/search",
            action="keep_noindex_remove_from_sitemap",
            reason="Search result pages are crawlable for discovery but should remain noindex and absent from sitemap.",
        )

    if path == "/product-gone":
        return ClassifiedUrl(
            url=url,
            last_crawled=last_crawled,
            path=path,
            query=query,
            pattern="/product-gone",
            action="keep_noindex",
            reason="Gone landing page is intentionally noindex.",
        )

    if path == "/find-order":
        return ClassifiedUrl(
            url=url,
            last_crawled=last_crawled,
            path=path,
            query=query,
            pattern="/find-order",
            action="keep_noindex",
            reason="Order lookup is an operational page, not an SEO landing page.",
        )

    if any(matches_prefix(path, prefix) for prefix in KEEP_NOINDEX_PREFIXES):
        return ClassifiedUrl(
            url=url,
            last_crawled=last_crawled,
            path=path,
            query=query,
            pattern=f"{path.split('/')[1] or 'root'}/*",
            action="keep_noindex_remove_from_sitemap",
            reason="Private, transactional, admin, or API URL.",
        )

    if path in MUST_INDEX_STATIC_PATHS or any(path.startswith(prefix) for prefix in MUST_INDEX_PREFIXES):
        return ClassifiedUrl(
            url=url,
            last_crawled=last_crawled,
            path=path,
            query=query,
            pattern="/product/[category]/[slug]" if path.startswith("/product/") else path,
            action="must_index_investigate",
            reason="SEO landing, category, knowledge, glossary, industry, or canonical product URL should not be noindex.",
        )

    return ClassifiedUrl(
        url=url,
        last_crawled=last_crawled,
        path=path,
        query=query,
        pattern="unknown",
        action="manual_review",
        reason="No explicit rule matched; inspect route metadata, robots headers, redirects, and sitemap membership.",
    )


def classify_rows(rows: list[dict[str, str]]) -> list[ClassifiedUrl]:
    classified: list[ClassifiedUrl] = []
    for row in rows:
        url = get_field(row, "网址", "URL", "url", "Url")
        if not url:
            continue
        last_crawled = get_field(row, "上次抓取日期", "Last crawled", "last_crawled")
        classified.append(classify_url(url, last_crawled))
    return classified


def write_output(path: Path, rows: list[ClassifiedUrl]) -> None:
    fieldnames = ["url", "last_crawled", "path", "query", "pattern", "action", "reason"]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "url": row.url,
                "last_crawled": row.last_crawled,
                "path": row.path,
                "query": row.query,
                "pattern": row.pattern,
                "action": row.action,
                "reason": row.reason,
            })


def print_summary(rows: list[ClassifiedUrl]) -> None:
    action_counts = Counter(row.action for row in rows)
    pattern_counts = Counter(row.pattern for row in rows)

    print(f"Total URLs: {len(rows)}")
    print("\nBy action:")
    for action, count in action_counts.most_common():
        print(f"  {count:5}  {action}")

    print("\nBy pattern:")
    for pattern, count in pattern_counts.most_common(30):
        print(f"  {count:5}  {pattern}")

    investigate = [row for row in rows if row.action in {"must_index_investigate", "manual_review"}]
    if investigate:
        print("\nNeeds inspection:")
        for row in investigate[:20]:
            print(f"  {row.action}: {row.url}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Classify GSC noindex coverage exports.")
    parser.add_argument("input", type=Path, help="GSC ZIP export or URL table CSV")
    parser.add_argument("--output", type=Path, help="Optional CSV path for classified rows")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rows = classify_rows(read_rows(args.input))
    print_summary(rows)

    if args.output:
        write_output(args.output, rows)
        print(f"\nWrote {args.output}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

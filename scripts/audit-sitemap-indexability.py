#!/usr/bin/env python3
"""
Audit sitemap URLs for indexability problems.

Checks:
  - sitemap URL returns HTTP 200 without redirect
  - page canonical, when present, points to the sitemap URL itself

Usage:
  python3 scripts/audit-sitemap-indexability.py https://machrio.com/sitemap.xml --limit 500
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen


USER_AGENT = "Mozilla/5.0 MachrioSitemapAudit/1.0"
SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
CANONICAL_RE = re.compile(
    r"<link[^>]+rel=[\"']canonical[\"'][^>]+href=[\"']([^\"']+)",
    re.IGNORECASE,
)


class NoRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
        return None


NO_REDIRECT_OPENER = build_opener(NoRedirectHandler)


@dataclass(frozen=True)
class FetchResult:
    status: int
    final_url: str
    body: bytes
    headers: dict[str, str]
    error: str = ""


@dataclass(frozen=True)
class AuditIssue:
    issue: str
    url: str
    status: int
    target: str
    detail: str


def normalize_url(url: str) -> str:
    return url.rstrip("/")


def fetch(url: str, timeout: int = 20, follow_redirects: bool = True) -> FetchResult:
    request = Request(url, headers={"User-Agent": USER_AGENT})

    try:
        opener = urlopen if follow_redirects else NO_REDIRECT_OPENER.open
        with opener(request, timeout=timeout) as response:
            return FetchResult(
                status=response.status,
                final_url=response.geturl(),
                body=response.read(),
                headers=dict(response.headers),
            )
    except HTTPError as error:
        return FetchResult(
            status=error.code,
            final_url=error.geturl(),
            body=error.read(),
            headers=dict(error.headers),
            error=str(error),
        )
    except URLError as error:
        return FetchResult(status=0, final_url=url, body=b"", headers={}, error=str(error.reason))
    except Exception as error:
        return FetchResult(status=0, final_url=url, body=b"", headers={}, error=str(error))


def parse_locs(xml_bytes: bytes, element_name: str) -> list[str]:
    root = ET.fromstring(xml_bytes)
    return [
        element.text.strip()
        for element in root.findall(f".//sm:{element_name}/sm:loc", SITEMAP_NS)
        if element.text and element.text.strip()
    ]


def collect_sitemap_urls(sitemap_url: str) -> list[str]:
    result = fetch(sitemap_url)
    if result.status != 200:
        raise SystemExit(f"Failed to fetch {sitemap_url}: HTTP {result.status} {result.error}")

    sitemap_locs = parse_locs(result.body, "sitemap")
    if not sitemap_locs:
        return parse_locs(result.body, "url")

    urls: list[str] = []
    for child_sitemap in sitemap_locs:
        child = fetch(child_sitemap)
        if child.status != 200:
            print(f"BAD_SITEMAP,{child.status},{child_sitemap},{child.final_url}", file=sys.stderr)
            continue
        urls.extend(parse_locs(child.body, "url"))

    return list(dict.fromkeys(urls))


def extract_canonical(html: str) -> str:
    match = CANONICAL_RE.search(html)
    return normalize_url(match.group(1)) if match else ""


def audit_url(url: str, timeout: int) -> AuditIssue | None:
    result = fetch(url, timeout=timeout, follow_redirects=False)

    if result.status in {301, 302, 303, 307, 308}:
        return AuditIssue(
            issue="redirect",
            url=url,
            status=result.status,
            target=result.headers.get("Location", ""),
            detail="Sitemap URL must be the final canonical URL, not a redirect source.",
        )

    if result.status != 200:
        return AuditIssue(
            issue="non_200",
            url=url,
            status=result.status,
            target=result.final_url,
            detail=result.error or "Sitemap URL did not return HTTP 200.",
        )

    html = result.body[:500_000].decode("utf-8", "ignore")
    canonical = extract_canonical(html)
    if canonical and canonical != normalize_url(url):
        return AuditIssue(
            issue="canonical_mismatch",
            url=url,
            status=result.status,
            target=canonical,
            detail="Page canonical points to a different URL.",
        )

    return None


def write_csv(path: Path, issues: list[AuditIssue]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["issue", "url", "status", "target", "detail"])
        writer.writeheader()
        for issue in issues:
            writer.writerow({
                "issue": issue.issue,
                "url": issue.url,
                "status": issue.status,
                "target": issue.target,
                "detail": issue.detail,
            })


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit sitemap URLs for redirects, non-200s, and canonical mismatches.")
    parser.add_argument("sitemap", nargs="?", default="https://machrio.com/sitemap.xml")
    parser.add_argument("--limit", type=int, help="Optional maximum URLs to check")
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--output", type=Path, help="Optional CSV output path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    urls = collect_sitemap_urls(args.sitemap)
    if args.limit:
        urls = urls[:args.limit]

    print(f"Collected {len(urls)} sitemap URLs")

    issues: list[AuditIssue] = []
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        futures = [executor.submit(audit_url, url, args.timeout) for url in urls]
        for index, future in enumerate(as_completed(futures), start=1):
            issue = future.result()
            if issue:
                issues.append(issue)
                print(f"{issue.issue}: {issue.status} {issue.url} -> {issue.target}")
            if index % 100 == 0:
                print(f"Checked {index}/{len(urls)}; issues={len(issues)}")

    print(f"Found {len(issues)} issues")
    if args.output:
        write_csv(args.output, issues)
        print(f"Wrote {args.output}")

    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())

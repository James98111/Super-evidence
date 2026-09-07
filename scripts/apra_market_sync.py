#!/usr/bin/env python3
"""Build a browser-friendly market snapshot from APRA's official super datasets.

Outputs:
  data/apra-market/funds-index.json
  data/apra-market/funds/<slug>.json
  data/apra-market/manifest.json

Design principles:
- APRA is the regulator-backed market spine, not a replacement for issuer evidence.
- Keep original APRA field names/values alongside a small normalised layer.
- Never invent missing values.
- Separate managed investment options from direct assets (shares, term deposits, etc.).
- One file per fund so the consumer site never downloads the entire market at once.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "apra-market"
FUNDS_OUT = OUT / "funds"
QSPS_PAGE = "https://www.apra.gov.au/news-and-publications/quarterly-superannuation-product-statistics"
CPPP_PAGE = "https://www.apra.gov.au/cppp-product-performance"
USER_AGENT = "SuperEvidence/0.1 (+public Australian super research)"

FIELD_PATTERNS = {
    "fund": ["rse name", "rse name text", "fund name", "rse trading name"],
    "licensee": ["rse licensee name", "rse licensee name text", "licensee name"],
    "rse_id": ["rse registration number", "rse identifier", "rse id"],
    "product_name": ["superannuation product name", "superannuation product name text", "product name text"],
    "product_id": ["superannuation product identifier", "product identifier"],
    "menu_name": ["investment menu name", "investment menu name text"],
    "menu_id": ["investment menu identifier"],
    "option_name": ["investment option name", "investment option name text"],
    "option_id": ["investment option identifier"],
    "pathway_id": ["pathway identifier"],
    "option_category": ["investment option category", "investment option category type"],
    "option_type": ["investment option type"],
    "management_type": ["investment option management type"],
    "strategy_setting_type": ["investment option strategy setting type"],
    "description": ["investment option description", "investment option description text"],
}
DIRECT_CATEGORIES = {
    "direct cash account", "direct term deposit", "direct fixed income instrument",
    "direct shares", "direct hybrid security",
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def fetch_text(url: str) -> str:
    raw = fetch(url)
    for enc in ("utf-8", "utf-8-sig", "cp1252"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return raw.decode("latin1", errors="replace")


def discover_links(page_url: str) -> list[str]:
    html = fetch_text(page_url)
    links = []
    for href in re.findall(r'href=["\']([^"\']+)["\']', html, flags=re.I):
        u = urllib.parse.urljoin(page_url, href.replace("&amp;", "&"))
        if "apra.gov.au" in u:
            links.append(u)
    return list(dict.fromkeys(links))


def norm_header(s: str) -> str:
    s = (s or "").replace("\ufeff", " ").replace("\n", " ").replace("\r", " ")
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def blank(v) -> bool:
    return v is None or str(v).strip() in {"", "-", "n/a", "N/A", "Not Applicable", "Not applicable"}


def numeric(v):
    if blank(v):
        return None
    s = str(v).strip().replace(",", "").replace("$", "").replace("%", "")
    s = s.replace("(", "-").replace(")", "")
    try:
        return float(s)
    except ValueError:
        return None


def find_col(headers: list[str], candidates: list[str]) -> str | None:
    nh = {h: norm_header(h) for h in headers}
    for candidate in candidates:
        c = norm_header(candidate)
        exact = [h for h, n in nh.items() if n == c]
        if exact:
            return exact[0]
    for candidate in candidates:
        c = norm_header(candidate)
        partial = [h for h, n in nh.items() if c in n]
        if partial:
            return sorted(partial, key=lambda x: len(nh[x]))[0]
    return None


def header_score(row: list[str]) -> int:
    vals = [norm_header(x) for x in row]
    needles = [
        "rse", "superannuation product", "investment menu", "investment option",
        "identifier", "member assets", "return", "fee", "allocation", "sector",
    ]
    return sum(any(n in v for n in needles) for v in vals)


def iter_csv_rows(data: bytes):
    text = None
    for enc in ("utf-8-sig", "cp1252", "latin1"):
        try:
            text = data.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        text = data.decode("utf-8", errors="replace")
    raw_rows = list(csv.reader(io.StringIO(text)))
    if not raw_rows:
        return [], []
    probe = raw_rows[:40]
    best_idx = max(range(len(probe)), key=lambda i: header_score(probe[i]))
    headers = [str(x).strip() or f"column_{i+1}" for i, x in enumerate(raw_rows[best_idx])]
    rows = []
    for vals in raw_rows[best_idx + 1:]:
        if not any(str(x).strip() for x in vals):
            continue
        if len(vals) < len(headers):
            vals = vals + [""] * (len(headers) - len(vals))
        row = dict(zip(headers, vals[:len(headers)]))
        rows.append(row)
    return headers, rows


def slugify(name: str) -> str:
    s = name.lower().replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "fund"


def canonical_key(row: dict, cols: dict) -> tuple[str, str, str, str, str]:
    get = lambda k: str(row.get(cols.get(k), "")).strip() if cols.get(k) else ""
    return (get("fund"), get("product_id") or get("product_name"), get("menu_id") or get("menu_name"), get("option_id") or get("option_name"), get("pathway_id"))


def merge_nonblank(target: dict, incoming: dict):
    for k, v in incoming.items():
        if blank(v):
            continue
        if k not in target or blank(target[k]):
            target[k] = str(v).strip()
        elif target[k] != str(v).strip():
            existing = target[k]
            if not isinstance(existing, list):
                existing = [existing]
            if str(v).strip() not in existing:
                existing.append(str(v).strip())
            target[k] = existing


def classify_fields(row: dict) -> dict:
    out = {}
    for h, v in row.items():
        if blank(v):
            continue
        n = norm_header(h)
        val = str(v).strip()
        if "return" in n or "performance" in n:
            out.setdefault("performance", {})[h] = val
        if "fee" in n or "cost" in n:
            out.setdefault("fees", {})[h] = val
        if "risk" in n or "negative annual" in n:
            out.setdefault("risk", {})[h] = val
        if "member assets" in n or "member account" in n:
            out.setdefault("scale", {})[h] = val
    return out


def extract_allocation(row: dict) -> dict | None:
    headers = list(row)
    sector_col = find_col(headers, ["investment strategic sector type", "investment sector type", "asset class", "strategic sector type"])
    if not sector_col or blank(row.get(sector_col)):
        return None
    pct_candidates = []
    for h in headers:
        n = norm_header(h)
        if any(x in n for x in ["allocation percentage", "allocation percent", "strategic asset allocation", "actual asset allocation", "asset allocation"]):
            v = numeric(row.get(h))
            if v is not None:
                pct_candidates.append((h, v))
    if not pct_candidates:
        return None
    h, value = pct_candidates[0]
    return {"asset_class": str(row[sector_col]).strip(), "value": value, "field": h}


def process_csv(name: str, raw: bytes, records: dict, schema_log: list, dataset: str):
    headers, rows = iter_csv_rows(raw)
    if not headers:
        return
    cols = {k: find_col(headers, v) for k, v in FIELD_PATTERNS.items()}
    schema_log.append({"dataset": dataset, "file": name, "rows": len(rows), "headers": headers, "mapped_columns": cols})
    for i, row in enumerate(rows, start=1):
        key = canonical_key(row, cols)
        fund = key[0]
        if not fund:
            continue
        rec = records.setdefault(key, {
            "fund": fund,
            "licensee": str(row.get(cols.get("licensee"), "")).strip() if cols.get("licensee") else "",
            "rse_id": str(row.get(cols.get("rse_id"), "")).strip() if cols.get("rse_id") else "",
            "product_name": str(row.get(cols.get("product_name"), "")).strip() if cols.get("product_name") else "",
            "product_id": key[1] if cols.get("product_id") else "",
            "menu_name": str(row.get(cols.get("menu_name"), "")).strip() if cols.get("menu_name") else "",
            "menu_id": key[2] if cols.get("menu_id") else "",
            "option_name": str(row.get(cols.get("option_name"), "")).strip() if cols.get("option_name") else "",
            "option_id": key[3] if cols.get("option_id") else "",
            "pathway_id": key[4],
            "option_category": str(row.get(cols.get("option_category"), "")).strip() if cols.get("option_category") else "",
            "option_type": str(row.get(cols.get("option_type"), "")).strip() if cols.get("option_type") else "",
            "management_type": str(row.get(cols.get("management_type"), "")).strip() if cols.get("management_type") else "",
            "strategy_setting_type": str(row.get(cols.get("strategy_setting_type"), "")).strip() if cols.get("strategy_setting_type") else "",
            "description": str(row.get(cols.get("description"), "")).strip() if cols.get("description") else "",
            "attributes": {}, "performance": {}, "fees": {}, "risk": {}, "scale": {}, "allocations": [], "sources": []
        })
        classified = classify_fields(row)
        for section in ("performance", "fees", "risk", "scale"):
            merge_nonblank(rec[section], classified.get(section, {}))
        # Preserve non-empty APRA fields without duplicating the core identity fields.
        core_headers = {c for c in cols.values() if c}
        attrs = {h: str(v).strip() for h, v in row.items() if h not in core_headers and not blank(v)}
        merge_nonblank(rec["attributes"], attrs)
        alloc = extract_allocation(row)
        if alloc and alloc not in rec["allocations"]:
            rec["allocations"].append(alloc)
        rec["sources"].append({"dataset": dataset, "file": name, "row": i})


def process_zip(url: str, records: dict, schema_log: list, dataset: str):
    raw = fetch(url)
    digest = hashlib.sha256(raw).hexdigest()
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names = [n for n in z.namelist() if n.lower().endswith(".csv")]
        for name in names:
            with z.open(name) as fh:
                process_csv(name, fh.read(), records, schema_log, dataset)
    return {"url": url, "sha256": digest, "files": names, "bytes": len(raw)}


def process_csv_url(url: str, records: dict, schema_log: list, dataset: str):
    raw = fetch(url)
    process_csv(Path(urllib.parse.urlparse(url).path).name, raw, records, schema_log, dataset)
    return {"url": url, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw)}


def pick_qsps_links() -> list[tuple[str, str]]:
    links = discover_links(QSPS_PAGE)
    chosen = []
    for u in links:
        lu = urllib.parse.unquote(u).lower()
        if not lu.endswith(".zip"):
            continue
        if "table 1a-1b" in lu:
            chosen.append(("qsps_structure", u))
        elif "table 4-11" in lu or "table 2-11" in lu:
            chosen.append(("qsps_metrics", u))
    if not chosen:
        raise RuntimeError("Could not discover APRA QSPS CSV ZIP links")
    return chosen


def pick_cppp_links() -> list[tuple[str, str]]:
    links = discover_links(CPPP_PAGE)
    out = []
    for u in links:
        lu = urllib.parse.unquote(u).lower()
        if lu.endswith(".csv") and ("cppp" in lu or "publication" in lu):
            out.append(("cppp_2026", u))
    return list(dict.fromkeys(out))


def compact_sources(srcs: list[dict]) -> list[dict]:
    seen, out = set(), []
    for s in srcs:
        k = (s["dataset"], s["file"])
        if k not in seen:
            seen.add(k); out.append({"dataset": s["dataset"], "file": s["file"]})
    return out


def build_outputs(records: dict, manifest: dict, schema_log: list):
    OUT.mkdir(parents=True, exist_ok=True)
    FUNDS_OUT.mkdir(parents=True, exist_ok=True)
    by_fund = defaultdict(list)
    for rec in records.values():
        # Skip rows that never resolve to an option; keep fund/product structure separately later.
        if not rec["option_name"] and not rec["option_id"]:
            continue
        rec["sources"] = compact_sources(rec["sources"])
        cat = norm_header(rec.get("option_category", ""))
        rec["consumer_group"] = "direct_asset" if cat in DIRECT_CATEGORIES or cat.startswith("direct ") else "managed_option"
        by_fund[rec["fund"]].append(rec)

    used_slugs = {}
    fund_index = []
    for fund_name in sorted(by_fund, key=str.casefold):
        rows = by_fund[fund_name]
        base = slugify(fund_name)
        slug = base
        if slug in used_slugs and used_slugs[slug] != fund_name:
            slug = f"{base}-{hashlib.sha1(fund_name.encode()).hexdigest()[:7]}"
        used_slugs[slug] = fund_name
        products = sorted({r["product_name"] for r in rows if r["product_name"]})
        menus = sorted({r["menu_name"] for r in rows if r["menu_name"]})
        managed = [r for r in rows if r["consumer_group"] == "managed_option"]
        direct = [r for r in rows if r["consumer_group"] == "direct_asset"]
        licensees = [r["licensee"] for r in rows if r["licensee"]]
        payload = {
            "schema_version": 1,
            "source": {"organisation": "APRA", "publication": "Quarterly Superannuation Product Statistics", "reporting_period": manifest["reporting_period"], "retrieved_at": manifest["generated_at"]},
            "fund": {"name": fund_name, "licensee": licensees[0] if licensees else None, "slug": slug},
            "summary": {"products": len(products), "menus": len(menus), "managed_options": len(managed), "direct_assets": len(direct), "total_option_records": len(rows)},
            "products": products,
            "menus": menus,
            "options": sorted(rows, key=lambda r: (r["consumer_group"], r["product_name"], r["menu_name"], r["option_name"]))
        }
        (FUNDS_OUT / f"{slug}.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        fund_index.append({"name": fund_name, "slug": slug, "licensee": payload["fund"]["licensee"], **payload["summary"]})

    (OUT / "funds-index.json").write_text(json.dumps({
        "schema_version": 1,
        "source": "APRA QSPS",
        "reporting_period": manifest["reporting_period"],
        "generated_at": manifest["generated_at"],
        "fund_count": len(fund_index),
        "funds": fund_index
    }, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (OUT / "schema-manifest.json").write_text(json.dumps(schema_log, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return fund_index


def validate(fund_index: list[dict]):
    if len(fund_index) < 20:
        raise RuntimeError(f"Unexpectedly low APRA fund count: {len(fund_index)}")
    managed = sum(x["managed_options"] for x in fund_index)
    total = sum(x["total_option_records"] for x in fund_index)
    if managed < 100 or total < 1000:
        raise RuntimeError(f"Unexpectedly low option coverage: managed={managed}, total={total}")
    if any(not x["name"].strip() for x in fund_index):
        raise RuntimeError("Blank fund name in market index")
    print(f"Validated {len(fund_index)} funds, {managed} managed options, {total} total option records")


def main():
    generated_at = datetime.now(timezone.utc).isoformat()
    records = {}
    schema_log = []
    files = []
    for dataset, url in pick_qsps_links():
        print("Downloading", dataset, url)
        files.append({"dataset": dataset, **process_zip(url, records, schema_log, dataset)})
    # CPPP is a newer 2026 performance-test overlay. Failure must not block the QSPS market spine.
    cppp_errors = []
    for dataset, url in pick_cppp_links():
        try:
            print("Downloading", dataset, url)
            files.append({"dataset": dataset, **process_csv_url(url, records, schema_log, dataset)})
        except Exception as e:
            cppp_errors.append({"url": url, "error": str(e)})
            print("CPPP overlay warning:", e, file=sys.stderr)
    manifest = {
        "schema_version": 1,
        "generated_at": generated_at,
        "reporting_period": "2026-03-31",
        "qsps_page": QSPS_PAGE,
        "cppp_page": CPPP_PAGE,
        "files": files,
        "cppp_errors": cppp_errors,
        "parser_version": "apra-market-v1"
    }
    fund_index = build_outputs(records, manifest, schema_log)
    validate(fund_index)


if __name__ == "__main__":
    main()

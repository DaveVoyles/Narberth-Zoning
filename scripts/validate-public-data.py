#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
DATA = DOCS / "data"
DOCUMENTS = DOCS / "documents"

EXPECTED = {
    "Zone 4A": {
        "rows": 303,
        "pages": range(90, 106),
        "categories": {
            "Against proposed Zoning Changes": 223,
            "Neutral": 18,
            "In Favor of proposed Zoning Changes": 62,
        },
        "confidence": {"high": 233, "medium": 64, "low": 6},
    },
    "Zone 5B": {
        "rows": 303,
        "pages": range(77, 90),
        "categories": {
            "Against proposed Zoning Changes": 204,
            "Neutral": 16,
            "In Favor of proposed Zoning Changes": 83,
        },
        "confidence": {"high": 224, "medium": 74, "low": 5},
    },
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def count(rows: list[dict[str, str]], field: str) -> dict[str, int]:
    output: dict[str, int] = {}
    for row in rows:
        output[row[field]] = output.get(row[field], 0) + 1
    return output


def validate_rows(errors: list[str]) -> None:
    combined = []
    for slug, zone in [("zone-4a", "Zone 4A"), ("zone-5b", "Zone 5B")]:
        rows = read_csv(DATA / f"{slug}-classified.csv")
        combined.extend(rows)
        expected = EXPECTED[zone]
        indexes = sorted(int(row["index"]) for row in rows)
        if len(rows) != expected["rows"]:
            errors.append(f"{zone} row count is {len(rows)}, expected {expected['rows']}")
        if indexes != list(range(1, expected["rows"] + 1)):
            errors.append(f"{zone} indexes are not contiguous 1-{expected['rows']}")
        if any(int(row["page"]) not in expected["pages"] for row in rows):
            errors.append(f"{zone} contains page outside expected range")
        if count(rows, "category") != expected["categories"]:
            errors.append(f"{zone} category totals changed: {count(rows, 'category')}")
        if count(rows, "confidence") != expected["confidence"]:
            errors.append(f"{zone} confidence totals changed: {count(rows, 'confidence')}")
        for row in rows:
            for field in ["category", "confidence", "rationale", "topics", "needs_review", "mixed_flag"]:
                if not row.get(field):
                    errors.append(f"{zone} row {row.get('index')} has blank {field}")

    combined_csv = read_csv(DATA / "combined-classified.csv")
    combined_json = json.loads((DATA / "combined-classified.json").read_text(encoding="utf-8"))
    if len(combined_csv) != 606:
        errors.append(f"combined CSV has {len(combined_csv)} rows, expected 606")
    if len(combined_json) != len(combined_csv):
        errors.append("combined CSV/JSON row count mismatch")
    if len(read_csv(DATA / "topic-tags.csv")) < len(combined_csv):
        errors.append("topic-tags.csv should have at least one topic row per classified response")


def validate_json(errors: list[str]) -> None:
    for path in DATA.glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))
    summary = json.loads((DATA / "summary.json").read_text(encoding="utf-8"))
    if summary["combined"]["totalResponses"] != 606:
        errors.append("summary combined total is not 606")
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf-8"))
    if manifest["totalClassifiedResponses"] != 606:
        errors.append("manifest totalClassifiedResponses is not 606")


def validate_links(errors: list[str]) -> None:
    html = (DOCS / "index.html").read_text(encoding="utf-8")
    app = (DOCS / "assets/app.js").read_text(encoding="utf-8")
    hrefs = re.findall(r'(?:href|src)="([^"]+)"', html)
    hrefs += re.findall(r'href: "([^"]+)"', app)
    for href in hrefs:
        if href.startswith(("http", "#", "mailto:")):
            continue
        if not (DOCS / href).exists():
            errors.append(f"missing linked asset: {href}")


def validate_xlsx(errors: list[str]) -> None:
    for path in DOCUMENTS.glob("*.xlsx"):
        with zipfile.ZipFile(path) as archive:
            bad = archive.testzip()
            if bad:
                errors.append(f"{path.name} has bad zip member {bad}")
            for required in ["[Content_Types].xml", "xl/workbook.xml", "xl/styles.xml"]:
                if required not in archive.namelist():
                    errors.append(f"{path.name} missing {required}")
            for member in archive.namelist():
                if member.endswith(".xml"):
                    ElementTree.fromstring(archive.read(member))


def main() -> None:
    errors: list[str] = []
    validate_rows(errors)
    validate_json(errors)
    validate_links(errors)
    validate_xlsx(errors)
    if errors:
        raise SystemExit("\n".join(errors))
    print("public data validation passed")


if __name__ == "__main__":
    main()

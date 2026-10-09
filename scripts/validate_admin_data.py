#!/usr/bin/env python3
"""Validate the reviewed Algeria wilaya/commune reference dataset."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

EXPECTED_WILAYAS = 69
EXPECTED_COMMUNES = 1541
REQUIRED_SOURCE_FIELDS = {"repository", "legal_reference", "retrieved"}
WILAYA_FIELDS = {"id", "code", "name_ar", "name_fr"}
COMMUNE_FIELDS = {"id", "code", "wilaya_id", "name_ar", "name_fr"}


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def load_dataset(path: Path) -> dict[str, Any]:
    if not path.is_file():
        fail(f"dataset file does not exist: {path}")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError as exc:
        fail(f"dataset is not valid UTF-8 ({exc})")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}")
    if not isinstance(value, dict):
        fail("top-level JSON value must be an object")
    return value


def require_text(record: dict[str, Any], field: str, location: str) -> str:
    value = record.get(field)
    if not isinstance(value, str) or not value.strip():
        fail(f"{location}.{field} must be a non-empty string")
    return value.strip()


def unique(records: list[dict[str, Any]], field: str, label: str) -> None:
    seen: dict[str, int] = {}
    for index, record in enumerate(records, 1):
        value = record.get(field)
        if not isinstance(value, str) or not value.strip():
            fail(f"{label} #{index} has missing or invalid {field}")
        if value in seen:
            fail(f"duplicate {label} {field} '{value}' at entries {seen[value]} and {index}")
        seen[value] = index


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "data/algeria.json")
    data = load_dataset(path)
    source = data.get("source")
    if not isinstance(source, dict):
        fail("source must be an object containing provenance metadata")
    missing_source = REQUIRED_SOURCE_FIELDS - source.keys()
    if missing_source:
        fail(f"source is missing provenance field(s): {', '.join(sorted(missing_source))}")

    wilayas = data.get("wilayas")
    communes = data.get("communes")
    if not isinstance(wilayas, list):
        fail("wilayas must be an array")
    if not isinstance(communes, list):
        fail("communes must be an array")
    if len(wilayas) != EXPECTED_WILAYAS:
        fail(f"expected {EXPECTED_WILAYAS} wilayas, got {len(wilayas)}")
    if len(communes) != EXPECTED_COMMUNES:
        fail(f"expected {EXPECTED_COMMUNES} communes, got {len(communes)}")
    if any(not isinstance(item, dict) for item in wilayas):
        fail("every wilaya entry must be an object")
    if any(not isinstance(item, dict) for item in communes):
        fail("every commune entry must be an object")

    for index, wilaya in enumerate(wilayas, 1):
        missing = WILAYA_FIELDS - wilaya.keys()
        if missing:
            fail(f"wilaya #{index} is missing field(s): {', '.join(sorted(missing))}")
        for field in ("id", "code", "name_ar", "name_fr"):
            require_text(wilaya, field, f"wilaya #{index}")
        if len(wilaya["code"]) != 2 or not wilaya["code"].isdigit():
            fail(f"wilaya #{index}.code must be a two-digit numeric code")

    unique(wilayas, "id", "wilaya")
    unique(wilayas, "code", "wilaya")
    wilaya_ids = {wilaya["id"] for wilaya in wilayas}

    for index, commune in enumerate(communes, 1):
        missing = COMMUNE_FIELDS - commune.keys()
        if missing:
            fail(f"commune #{index} is missing field(s): {', '.join(sorted(missing))}")
        for field in ("id", "code", "wilaya_id", "name_ar", "name_fr"):
            require_text(commune, field, f"commune #{index}")
        if commune["wilaya_id"] not in wilaya_ids:
            fail(f"commune #{index} ({commune['id']}) references unknown wilaya_id '{commune['wilaya_id']}'")

    unique(communes, "id", "commune")
    unique(communes, "code", "commune")
    print(
        f"OK: {len(wilayas)} wilayas and {len(communes)} communes; "
        "unique IDs/codes, bilingual names, and valid wilaya relationships"
    )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import json, sys
from pathlib import Path

path = Path(sys.argv[1] if len(sys.argv) > 1 else "data/algeria.json")
if not path.exists():
    raise SystemExit(f"Missing dataset: {path}. Import a reviewed official dataset first.")
data = json.loads(path.read_text())
wilayas, communes = data.get("wilayas", []), data.get("communes", [])
assert len(wilayas) == 69, f"Expected 69 wilayas, got {len(wilayas)}"
assert len(communes) == 1541, f"Expected 1541 communes, got {len(communes)}"
assert len({w["code"] for w in wilayas}) == 69
assert len({c["code"] for c in communes}) == 1541
ids = {w["id"] for w in wilayas}
for w in wilayas:
    assert w["code"] and w["name_ar"] and w["name_fr"]
for c in communes:
    assert c["wilaya_id"] in ids and c["name_ar"] and c["name_fr"]
print("OK: 69 wilayas, 1541 communes, unique codes, valid foreign keys, bilingual names")

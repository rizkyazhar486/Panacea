"""Gerbang budget web berdasarkan manifest yang benar-benar dibaca viewer.

  python3 bodyexposure/pipeline/check_web_budget.py [--dir public/bodyexposure] [--budget 80000]
"""
import argparse
import json
from pathlib import Path
import re
import struct
import sys


def tris(path):
    data = Path(path).read_bytes()
    if len(data) < 20:
        raise ValueError("truncated GLB")
    magic, version, length, size, kind = struct.unpack_from("<5I", data)
    if magic != 0x46546C67 or version != 2 or length != len(data) or kind != 0x4E4F534A or 20 + size > length:
        raise ValueError("invalid GLB header or JSON chunk")
    doc = json.loads(data[20:20 + size])
    count = 0
    for mesh in doc.get("meshes", []):
        for primitive in mesh["primitives"]:
            if primitive.get("mode", 4) != 4:
                raise ValueError("expected triangle primitives")
            index = primitive.get("indices", primitive.get("attributes", {}).get("POSITION"))
            if index is None:
                raise ValueError("primitive has no indices or positions")
            vertices = doc["accessors"][index]["count"]
            if not isinstance(vertices, int) or vertices <= 0 or vertices % 3:
                raise ValueError("invalid triangle accessor count")
            count += vertices // 3
    if count == 0:
        raise ValueError("asset has no triangles")
    return count


def audit(directory, defaults, budget):
    directory = Path(directory)
    matrix = json.loads((directory / "body_matrix.json").read_text())
    files = matrix.get("files", [])
    if not files:
        raise ValueError("body manifest has no files")
    bodies = {}
    for name in files:
        if not isinstance(name, str) or not re.fullmatch(r"[a-z0-9_]+\.[a-z0-9_]+", name):
            raise ValueError(f"invalid manifest asset: {name!r}")
        tag, system = name.split(".")
        bodies.setdefault(tag, set()).add(system)
    rows, failures = [], []
    for tag, systems in sorted(bodies.items()):
        lod = matrix.get("light_lod", {}).get(tag, "LOD3")
        if lod not in ("LOD3", "LOD4"):
            raise ValueError(f"unsupported light LOD for {tag}: {lod}")
        counts = {}
        for system in sorted(systems):
            filename = f"{tag}.{system}.{lod}.glb"
            try:
                counts[system] = tris(directory / filename)
            except (OSError, ValueError, KeyError, IndexError, struct.error) as exc:
                failures.append(f"{filename}: {exc}")
        initial = sum(n for system, n in counts.items() if system in defaults)
        rows.append({"body": tag, "light_lod": lod, "initial_tris": initial,
                     "all_systems_tris": sum(counts.values())})
        if initial > budget:
            failures.append(f"{tag}: {initial} initial triangles exceed {budget}")
    return {"budget": budget, "default_systems": sorted(defaults), "bodies": rows,
            "failures": failures, "ok": not failures}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="public/bodyexposure")
    parser.add_argument("--budget", type=int, default=80000)
    parser.add_argument("--out", default="bodyexposure/qa_reports/web_budget.json")
    args = parser.parse_args()
    if args.budget <= 0:
        parser.error("budget must be positive")
    source = Path("src/pages/CanonicalBody.tsx").read_text()
    match = re.search(r"DEFAULT_ON = new Set\(\[(.*?)\]\)", source)
    if not match:
        parser.error("viewer default systems could not be read")
    defaults = set(re.findall(r"'(\w+)'", match.group(1)))
    if not defaults:
        parser.error("viewer default systems are empty")
    try:
        report = audit(args.dir, defaults, args.budget)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        report = {"ok": False, "failures": [str(exc)], "bodies": []}
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=1) + "\n")
    for row in report["bodies"]:
        print(f"{row['body']:32s} {row['light_lod']} initial {row['initial_tris']:>7,}  all {row['all_systems_tris']:>7,}")
    for failure in report.get("failures", []):
        print(f"FAIL {failure}")
    print("WEB_BUDGET", "ok" if report["ok"] else "FAIL")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())

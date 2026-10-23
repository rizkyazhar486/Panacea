"""Package existing anonymous Blender QA regions for an isolated dataset inspector.

The canonical organ matrix and named-lobe admission remain unchanged. Run in a
new output directory, then pack regions.glb without simplification/quantization.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def prepare(audit_dir, qa_dir, out, repository):
    audit_dir, qa_dir, out, repository = map(Path, (audit_dir, qa_dir, out, repository))
    if out.exists():
        raise ValueError("output already exists; refusing to overwrite")
    expected_audit = json.loads((repository / "bodyexposure/qa_reports/fetal_parcels_audit.json").read_text())
    evidence = json.loads((repository / "bodyexposure/qa_reports/fetal_parcels_blender.json").read_text())
    audit = json.loads((audit_dir / "report.json").read_text())
    # Repository attribution was appended after the original numerical audit.
    attribution = {"source_repository_revision": "74f11a186c709078d712bb2fd827bfa2b36e3407",
                   "source_readme_figure": "info/lungs2024-atlas.jpg"}
    if {**audit, **attribution} != expected_audit:
        raise ValueError("audit differs from committed source evidence")
    if audit["clinical_validation"] != "pending" or audit["runtime_admission"] != "blocked_label_identity_unresolved":
        raise ValueError("pending anonymous QA boundary required")
    if [r["source_label"] for r in audit["regions"]] != list(range(1, 10)):
        raise ValueError("all nine numeric source labels required")
    raw = qa_dir / "fetal_parcels_QA.glb"
    if sha(raw) != evidence["artifacts"][raw.name]["sha256"]:
        raise ValueError("Blender QA GLB differs from committed fingerprint")
    data = raw.read_bytes()
    magic, version, length, size, kind = struct.unpack_from("<5I", data)
    if (magic, version, length, kind) != (0x46546C67, 2, len(data), 0x4E4F534A):
        raise ValueError("invalid source GLB")
    doc = json.loads(data[20:20 + size])
    nodes = [n for n in doc["nodes"] if "mesh" in n]
    if len(nodes) != 9 or sorted(n.get("extras", {}).get("source_label", 0) for n in nodes) != list(range(1, 10)):
        raise ValueError("nine source-labeled GLB meshes required")
    for region, surface in zip(audit["regions"], evidence["regions"]):
        if region["anatomical_name"] is not None or region["id"] != surface["id"]:
            raise ValueError("anonymous region identity mismatch")
        if sha(audit_dir / (region["id"] + ".stl")) != region["stl_sha256"]:
            raise ValueError("source STL fingerprint mismatch")
        if surface["boundary_edges"] or surface["nonmanifold_edges"] or surface["volume_m3"] <= 0:
            raise ValueError("closed positive-volume surfaces required")
    for node in nodes:
        extra = node["extras"]
        if extra.get("clinical_validation") != "pending" or extra.get("anatomical_identity") != "unresolved" or extra.get("runtime_admission") != audit["runtime_admission"]:
            raise ValueError("source extras must retain QA-only status")
    manifest = {
        "schema_version": 1, "purpose": "dataset_inspection", "clinical_validation": "pending",
        "runtime_admission": audit["runtime_admission"], "anatomical_identity": "unresolved",
        "truth_class": "population_reference", "educational_only": True,
        "source": audit["source"], "source_revision": "74f11a186c709078d712bb2fd827bfa2b36e3407",
        "license": audit["license"], "source_sha256": audit["source_sha256"],
        "source_glb_sha256": sha(raw), "asset": "regions.glb",
        "coordinate_frame": "+X subject left, +Y superior, +Z anterior; metres; source origin retained",
        "default_labels": [1, 2, 3, 4, 5], "all_triangles": sum(r["triangles"] for r in audit["regions"]),
        "default_triangles": sum(r["triangles"] for r in audit["regions"][:5]),
        "voxel_mm3": audit["voxel_mm3"], "smoothing_iterations": 0, "fragments_removed": 0,
        "regions": [{**r, "surface_volume_mm3": s["volume_m3"] * 1e9,
                     "boundary_edges": s["boundary_edges"], "nonmanifold_edges": s["nonmanifold_edges"]}
                    for r, s in zip(audit["regions"], evidence["regions"])],
    }
    # All input checks finish before creating any output.
    out.mkdir(parents=True, exist_ok=False)
    shutil.copy2(raw, out / "regions.glb")
    (out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit", required=True)
    parser.add_argument("--qa", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--repository", default=str(Path(__file__).resolve().parents[2]))
    args = parser.parse_args()
    result = prepare(args.audit, args.qa, args.out, args.repository)
    print("Prepared", len(result["regions"]), "anonymous dataset regions; named-lobe admission unchanged")

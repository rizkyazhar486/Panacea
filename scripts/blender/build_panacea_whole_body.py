#!/usr/bin/env python3
"""
Panacea whole-body Blender assembly pipeline.

Run with Blender, not normal Python:
  blender --background --python scripts/blender/build_panacea_whole_body.py -- \
    --input public/anatomy \
    --output public/anatomy-v2

Purpose
-------
Assemble the existing compatible Z-Anatomy / BodyParts3D-derived layer GLBs
into one reference scene without inventing geometry or guessing transforms.

Scientific boundary
-------------------
- This script never aligns different reference bodies by eye.
- HuBMAP female pelvis assets are intentionally excluded from this build
  because they use a different reference coordinate space.
- It does not create fascia, skin histology, vessels, nerves, genitalia or
  microscopic structures that are absent from the source.
- Source object names are preserved in custom properties for runtime picking.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Dict, List

import bpy
from mathutils import Vector

LAYERS = [
    ("surface", "surface.glb"),
    ("skeletal", "skeletal.glb"),
    ("muscular", "muscular.glb"),
    ("cardiovascular", "cardiovascular.glb"),
    ("nervous", "nervous.glb"),
    ("lymphoid", "lymphoid.glb"),
    ("visceral", "visceral.glb"),
]

LICENSE_ID = "CC-BY-SA-4.0"
REFERENCE_SPACE = "z-anatomy-bodyparts3d-male-reference"


def parse_args() -> argparse.Namespace:
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1 :]
    else:
        argv = []

    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Directory containing the source layer GLBs.")
    parser.add_argument("--output", required=True, help="Directory for assembled GLB + manifest.")
    parser.add_argument(
        "--normalize-materials",
        action="store_true",
        help="Apply conservative layer-level PBR materials. Off by default.",
    )
    return parser.parse_args(argv)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(datablocks):
            if block.users == 0:
                datablocks.remove(block)


def selected_objects() -> List[bpy.types.Object]:
    return list(bpy.context.selected_objects)


def ensure_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)


def mesh_triangle_count(obj: bpy.types.Object) -> int:
    if obj.type != "MESH" or obj.data is None:
        return 0
    mesh = obj.data
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def bounds_for_objects(objects: List[bpy.types.Object]) -> Dict[str, List[float]]:
    points: List[Vector] = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))

    if not points:
        return {"min": [0.0, 0.0, 0.0], "max": [0.0, 0.0, 0.0]}

    mins = [min(point[i] for point in points) for i in range(3)]
    maxs = [max(point[i] for point in points) for i in range(3)]
    return {
        "min": [round(value, 7) for value in mins],
        "max": [round(value, 7) for value in maxs],
    }


def material_color(layer: str):
    return {
        "surface": (0.72, 0.48, 0.38, 1.0),
        "skeletal": (0.78, 0.73, 0.61, 1.0),
        "muscular": (0.46, 0.10, 0.08, 1.0),
        "cardiovascular": (0.58, 0.04, 0.08, 1.0),
        "nervous": (0.86, 0.67, 0.12, 1.0),
        "lymphoid": (0.25, 0.62, 0.30, 1.0),
        "visceral": (0.56, 0.25, 0.25, 1.0),
    }[layer]


def apply_layer_material(obj: bpy.types.Object, layer: str) -> None:
    if obj.type != "MESH":
        return

    name = f"Panacea::{layer}"
    material = bpy.data.materials.get(name)
    if material is None:
        material = bpy.data.materials.new(name)
        material.diffuse_color = material_color(layer)
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf is not None:
            bsdf.inputs["Base Color"].default_value = material_color(layer)
            bsdf.inputs["Roughness"].default_value = 0.58
            bsdf.inputs["Metallic"].default_value = 0.0

    obj.data.materials.clear()
    obj.data.materials.append(material)


def import_layer(source_path: Path, layer: str, normalize_materials: bool) -> Dict[str, object]:
    if not source_path.exists():
        raise FileNotFoundError(source_path)

    before = set(bpy.data.objects.keys())
    bpy.ops.import_scene.gltf(filepath=str(source_path))
    after = set(bpy.data.objects.keys())
    imported_names = sorted(after - before)
    imported = [bpy.data.objects[name] for name in imported_names]

    collection = ensure_collection(f"ANATOMY::{layer}")
    mesh_objects: List[bpy.types.Object] = []

    for obj in imported:
        original_name = obj.name
        move_to_collection(obj, collection)
        obj["panacea.layer"] = layer
        obj["panacea.source_file"] = source_path.name
        obj["panacea.source_name"] = original_name
        obj["panacea.reference_space"] = REFERENCE_SPACE
        obj["panacea.license"] = LICENSE_ID

        if obj.type == "MESH":
            mesh_objects.append(obj)
            if normalize_materials:
                apply_layer_material(obj, layer)

    triangles = sum(mesh_triangle_count(obj) for obj in mesh_objects)
    if not mesh_objects or triangles <= 0:
        raise RuntimeError(f"{source_path.name}: no renderable source mesh geometry")

    return {
        "layer": layer,
        "sourceFile": source_path.name,
        "objectCount": len(imported),
        "meshCount": len(mesh_objects),
        "triangles": triangles,
        "bounds": bounds_for_objects(mesh_objects),
    }


def export_glb(output_file: Path) -> None:
    output_file.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output_file),
        export_format="GLB",
        use_selection=False,
        export_extras=True,
        export_yup=True,
        export_apply=False,
        export_cameras=False,
        export_lights=False,
    )


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input).resolve()
    output_dir = Path(args.output).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    clear_scene()

    root = ensure_collection("PANACEA_WHOLE_BODY")
    root["panacea.reference_space"] = REFERENCE_SPACE
    root["panacea.reference_sex"] = "male-reference"
    root["panacea.provenance"] = "Z-Anatomy / BodyParts3D; see public/anatomy/CREDITS.txt"
    root["panacea.license"] = LICENSE_ID

    layer_reports = []
    all_meshes: List[bpy.types.Object] = []

    for layer, filename in LAYERS:
        report = import_layer(input_dir / filename, layer, args.normalize_materials)
        layer_reports.append(report)
        all_meshes.extend(
            obj
            for obj in bpy.data.objects
            if obj.type == "MESH" and obj.get("panacea.layer") == layer
        )

    total_triangles = sum(mesh_triangle_count(obj) for obj in all_meshes)
    if total_triangles <= 0:
        raise RuntimeError("Whole-body assembly has zero triangles")

    glb_path = output_dir / "whole-body-reference.glb"
    export_glb(glb_path)

    manifest = {
        "schemaVersion": 1,
        "referenceId": "male-z-anatomy-v1",
        "referenceSex": "male-reference",
        "coordinateSpace": REFERENCE_SPACE,
        "sourceRoot": str(input_dir),
        "outputGlb": glb_path.name,
        "license": LICENSE_ID,
        "provenance": "Z-Anatomy / BodyParts3D lineage; exact attribution remains in public/anatomy/CREDITS.txt",
        "sourceFiles": [filename for _, filename in LAYERS],
        "layers": layer_reports,
        "totals": {
            "meshCount": len(all_meshes),
            "triangles": total_triangles,
            "bounds": bounds_for_objects(all_meshes),
        },
        "boundaries": [
            "Reference anatomy only; not patient-specific anatomy.",
            "No HRA female pelvis or other incompatible coordinate spaces were merged.",
            "No absent fascia, histology, vessels, nerves or microscopic anatomy were procedurally fabricated.",
            "Custom properties preserve layer, source file and source object name for runtime provenance/picking.",
        ],
    }

    (output_dir / "whole-body-reference.manifest.json").write_text(
        json.dumps(manifest, indent=2, sort_keys=True),
        encoding="utf-8",
    )

    print(json.dumps({
        "ok": True,
        "output": str(glb_path),
        "meshCount": len(all_meshes),
        "triangles": total_triangles,
    }))


if __name__ == "__main__":
    main()

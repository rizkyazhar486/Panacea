#!/usr/bin/env bash
# Mengaudit mesh layer anatomi dengan Blender (bpy). Importer glTF Blender tidak mendukung
# EXT_meshopt_compression, jadi layer didekompresi dulu ke direktori sementara (aset sumber tidak diubah).
#   PYTHON=/path/ke/python-dengan-bpy scripts/blender/run_mesh_audit.sh [layer1,layer2]
set -euo pipefail
LAYERS="${1:-surface,skeletal,muscular,cardiovascular,nervous,visceral,lymphoid}"
PYTHON="${PYTHON:-python3}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for l in ${LAYERS//,/ }; do
  npx --yes @gltf-transform/cli@4 copy "public/anatomy/$l.glb" "$TMP/$l.glb" >/dev/null
done
"$PYTHON" scripts/blender/audit_anatomy_meshes.py --input "$TMP" --output data/anatomy-assets/mesh-quality.json --layers "$LAYERS"

#!/bin/zsh
# Rantai rig laki-laki dewasa yang dapat direproduksi — SELALU mulai dari rig ISB (tanpa --hinges), supaya fit engsel
# tidak pernah dijalankan pada pusat yang sudah disempurnakan (kesalahan yang pernah terjadi: pergeseran bertumpuk).
#   bodyexposure/pipeline/rig_chain.sh [--preview]
set -euo pipefail
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
ROOT=${PANACEA_BE_ROOT:-$HOME/Documents/Panaceamed.id/bodyexposure}
M=$ROOT/PANACEA_HUMAN_MASTER_v011.blend; R=$ROOT/bodies; P=bodyexposure/pipeline; MAN=bodyexposure/manifest; QA=bodyexposure/qa_reports
run() { "$B" -b "$@" 2>&1 | grep -E "^(RIG|HINGE|RIGPOSE|ROMANIM|CONTACT|PREVIEW|RIGGLB)|Error|Traceback" || true; }
run $M -P $P/build_rig.py -- --out $R/PANACEA_RIG_ADULT_MALE.blend --report $MAN/rig_adult_male.json            # 1. ISB
python3 -c "import json,sys; d=json.load(open('$MAN/rig_adult_male.json')); sys.exit(1 if d.get('hinge_refinement') else 0)"  # wajib ISB murni
run $M -P $P/fit_hinge_centres.py -- --rig $MAN/rig_adult_male.json --out $MAN/rig_hinge_refinement.json           # 2. fit dari ISB
run $M -P $P/build_rig.py -- --out $R/PANACEA_RIG_ADULT_MALE.blend --report $MAN/rig_adult_male.json --hinges $MAN/rig_hinge_refinement.json  # 3
run $R/PANACEA_RIG_ADULT_MALE.blend -P $P/check_rig_pose.py -- --rom $MAN/rig_adult_male.json --out $QA/rig_pose_adult_male.json
PV=(); [[ "${1:-}" == "--preview" ]] && PV=(--preview $ROOT/renders/rom_preview_1280x720.mp4)
run $R/PANACEA_RIG_ADULT_MALE.blend -P $P/animate_rom.py -- --rom $MAN/rig_adult_male.json --out $R/PANACEA_RIG_ADULT_MALE_ROM.blend --report $QA/rig_rom_animation.json $PV
RAW=$(mktemp -d)
run $R/PANACEA_RIG_ADULT_MALE_ROM.blend -P $P/export_rig_glb.py -- --out $RAW/adult_male.rig_rom.glb --timeline $QA/rig_rom_animation.json --timeline-out public/bodyexposure/adult_male.rig_rom.json
npx -y gltfpack -i $RAW/adult_male.rig_rom.glb -o public/bodyexposure/adult_male.rig_rom.glb -c -kn -km -ke >/dev/null
echo "CHAIN done"

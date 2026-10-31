#!/bin/zsh
# Rantai rig tungkai bawah perempuan (Visible Human Female, Denver+CT) yang dapat direproduksi.
# Pasangan rig_chain.sh (laki-laki); sebelumnya rantai ini hanya ada sebagai perintah terpisah di PROVENANCE.
#   bodyexposure/pipeline/rig_chain_female.sh
# Masukan lokal (tidak ada di repo): $ROOT/bodies/PANACEA_BODY_VHF_DENVER_CT_ADULT_FEMALE.blend, $ROOT/sources/cmu_mocap
set -euo pipefail
B=${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}
ROOT=${PANACEA_BE_ROOT:-$HOME/Documents/Panaceamed.id/bodyexposure}
R=$ROOT/bodies; P=bodyexposure/pipeline; MAN=bodyexposure/manifest; QA=bodyexposure/qa_reports
BODY=VHF_DENVER_CT.ADULT.FEMALE; ARM=RIG.VHF_LOWER_LIMB
COV="pelvis, legs and feet only"  # kunci "coverage" laporan gait
COVL="$COV; the skeleton above the pelvis, muscles and ligaments do not move"  # label klip di glTF
run() { "$B" -b "$@" 2>&1 | grep -E "^(RIG|HINGE|RIGPOSE|ROMANIM|CONTACT|PREVIEW|RIGGLB)|Error|Traceback" || true; }
run $R/PANACEA_BODY_VHF_DENVER_CT_ADULT_FEMALE.blend -P $P/build_rig_lower_limb.py -- --out $R/PANACEA_RIG_VHF_DENVER_CT.blend --report $MAN/rig_vhf_denver_ct.json --body $BODY --hinges $MAN/rig_vhf_lower_limb_hinge.json
run $R/PANACEA_RIG_VHF_DENVER_CT.blend -P $P/animate_rom_lower_limb.py -- --rom $MAN/rig_vhf_denver_ct.json --out $R/PANACEA_RIG_VHF_DENVER_CT_ROM.blend --report $QA/rig_vhf_denver_ct_rom.json --body $BODY --coverage "$COVL"
run $R/PANACEA_RIG_VHF_DENVER_CT_ROM.blend -P $P/retarget_cmu_gait.py -- --rom $MAN/rig_vhf_denver_ct.json --src $ROOT/sources/cmu_mocap --clips WALK:07:07_01,RUN:09:09_02 --out $R/PANACEA_RIG_VHF_DENVER_CT_GAIT.blend --report $QA/rig_vhf_denver_ct_gait.json --arm $ARM --body $BODY --coverage "$COV"
RAW=$(mktemp -d)
run $R/PANACEA_RIG_VHF_DENVER_CT_GAIT.blend -P $P/export_rig_glb.py -- --out $RAW/vhf_denver_ct_adult_female.rig_rom.glb --timeline $QA/rig_vhf_denver_ct_rom.json --gait $QA/rig_vhf_denver_ct_gait.json --timeline-out public/bodyexposure/vhf_denver_ct_adult_female.rig_motion.json --arm $ARM --coverage "$COVL" --budget 20000
npx -y gltfpack -i $RAW/vhf_denver_ct_adult_female.rig_rom.glb -o public/bodyexposure/vhf_denver_ct_adult_female.rig_rom.glb -c -kn -km -ke -af 0 -ar 16 >/dev/null
node scripts/qa/glb-add-foot-landmarks.mjs public/bodyexposure/vhf_denver_ct_adult_female.rig_rom.glb
echo "CHAIN done"

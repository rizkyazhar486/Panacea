"""Publish the prepared four-component HRA reference into an independent repository worktree.

--prepared contains the builder report and source-preserving GLB. --packed is its meshopt derivative.
Only this reference's files, its manifest rows and the female reference variant are added.
"""
import argparse
import json
import re
from pathlib import Path
import shutil
import struct
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from render_artifacts import fingerprint, verify_unchanged
from female_main_bronchi_source import BODY_ID, SOURCE, SOURCE_SHA256

TAG = BODY_ID.replace('HUMAN.', '').replace('.', '_').lower()


def publish(prepared, packed, repo):
    report = json.loads((prepared/'report.json').read_text())
    rows = report['structures']
    if report['body_id'] != BODY_ID or report['clinical_validation'] != 'pending' or len(rows) != 4:
        raise ValueError('Expected the pending four-component HRA reference')
    if report['input_artifacts'][0]['sha256'] != SOURCE_SHA256:
        raise ValueError('Prepared source fingerprint differs from the pinned HRA file')
    verify_unchanged(report['input_artifacts'] + report['output_artifacts'])
    if any(r['panacea_body_id'] != BODY_ID or r['panacea_clinically_reviewed'] or r['panacea_review_status'] != 'review_required' for r in rows):
        raise ValueError('Reference identity/review metadata changed')
    packed_record = fingerprint(packed)
    blob = packed.read_bytes()
    if len(blob) < 20 or blob[:4] != b'glTF' or struct.unpack_from('<II',blob,4) != (2,len(blob)):
        raise ValueError('Packed output must be a complete GLB 2.0 file')
    size,kind = struct.unpack_from('<II',blob,12)
    if kind != 0x4E4F534A or size > len(blob)-20:
        raise ValueError('Packed GLB has no valid JSON chunk')
    doc = json.loads(blob[20:20+size])
    metadata = [node['extras'] for node in doc.get('nodes',[]) if node.get('extras',{}).get('panacea_structure_id')]
    if len(metadata) != 4 or {m['panacea_structure_id'] for m in metadata} != {r['panacea_structure_id'] for r in rows}:
        raise ValueError('Packed output changed source structure identities')
    if any(m.get('panacea_body_id') != BODY_ID or m.get('panacea_license') != 'CC BY 4.0' or
           m.get('panacea_clinically_reviewed') not in (False,0) or m.get('panacea_review_status') != 'review_required'
           for m in metadata):
        raise ValueError('Packed output changed source/review metadata')
    manifest_path = repo/'bodyexposure/manifest/structures.json'
    manifest = json.loads(manifest_path.read_text())
    new_ids = {r['panacea_structure_id'] for r in rows}
    if len(new_ids) != 4 or new_ids & {r['panacea_structure_id'] for r in manifest['structures']}:
        raise ValueError('Reference structure identities already exist; refusing replacement')
    matrix_paths = [repo/'bodyexposure/manifest/body_matrix.json', repo/'public/bodyexposure/body_matrix.json']
    matrix_texts = [p.read_text() for p in matrix_paths]
    matrices = [json.loads(content) for content in matrix_texts]
    variant = {'body_id': BODY_ID, 'structures': 4, 'stature_m': None,
               'label': 'Main bronchi reference (HRA)', 'status': 'source_backed_partial',
               'source': SOURCE + ', CC BY 4.0',
               'coverage': 'Four main-bronchus/cartilage components in their source coordinates; a separate reference, unregistered to the whole-body model.',
               'individual': 'Visible Human female source; standalone HRA organ reference'}
    names = [f'{TAG}.respiratory.{lod}.glb' for lod in ('LOD2','LOD3')]
    for matrix in matrices:
        female = next(b for b in matrix['bodies'] if b['body_id'] == 'HUMAN.ADULT.FEMALE')
        if any(v['body_id'] == BODY_ID for v in female.get('variants',[])):
            raise ValueError('Reference variant already exists; refusing replacement')
        female.setdefault('variants',[]).append(variant.copy())
        if 'files' in matrix:
            matrix['files'] = sorted(matrix['files'] + [f'{TAG}.respiratory'])
            matrix.setdefault('light_lod',{})[TAG] = 'LOD3'
    pub = repo/'public/bodyexposure'
    evidence_path = repo/'bodyexposure/qa_reports/female_main_bronchi_reference.json'
    ontology_path = pub/f'ontology.{TAG}.json'
    targets = [pub/name for name in names] + [pub/f'{TAG}.index.json', pub/f'{TAG}.review.json', ontology_path, evidence_path]
    if any(p.exists() for p in targets):
        raise FileExistsError('Reference output already exists; refusing replacement')
    ontology_map = {}
    for item in metadata:
        identifier, label = item.get('ontologyid'), item.get('label')
        if not isinstance(identifier, str) or not re.fullmatch(r'(?:UBERON|FMA):\d+', identifier) or not isinstance(label, str) or not label.strip():
            raise ValueError('Expected the four existing ontology identifiers/labels in source GLB extras')
        ontology_map[item['panacea_structure_id']] = {'id': identifier, 'label': label}
    # All validation finishes before publishing any files.
    manifest['structures'].extend(rows)
    manifest['count'] = len(manifest['structures'])
    index = [[r['panacea_structure_id'],r['canonical_name'],r['panacea_laterality'],'respiratory'] for r in rows]
    review = {'body_id': BODY_ID, 'tag': TAG, 'sources': [SOURCE], 'rows': [
        [r['panacea_structure_id'],r['canonical_name'],r['panacea_laterality'],'respiratory','model_segmented','model_segmented',
         f"{r['panacea_version']}:{r['mesh']['verts']}v{r['mesh']['tris']}t",0] for r in rows]}
    for name in names: shutil.copy2(packed,pub/name)
    manifest_path.write_text(json.dumps(manifest,indent=1,ensure_ascii=False)+'\n')
    for p,matrix,original in zip(matrix_paths,matrices,matrix_texts):
        p.write_text(json.dumps(matrix,indent=1,ensure_ascii='\\u' in original)+ ('\n' if original.endswith('\n') else ''))
    (pub/f'{TAG}.index.json').write_text(json.dumps(sorted(index),separators=(',',':'))+'\n')
    (pub/f'{TAG}.review.json').write_text(json.dumps(review,separators=(',',':'))+'\n')
    ontology_path.write_text(json.dumps({'schema': 1, 'body_id': BODY_ID,
        'source': SOURCE + '; ontologyid and label fields retained from the pinned source GLB node extras',
        'source_sha256': SOURCE_SHA256, 'license': 'CC BY 4.0', 'matched_structures': 4,
        'structures_total': 4, 'map': ontology_map},indent=2)+'\n')
    evidence = report | {'packed_artifact': packed_record, 'published_files': names,
                         'packing': 'gltfpack 1.3.0 -c -kn -km -ke -noq; no requested simplification or position quantization',
                         'runtime_variant': variant}
    evidence_path.write_text(json.dumps(evidence,indent=2)+'\n')
    print('Published separate reference:',BODY_ID)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepared',type=Path,required=True)
    parser.add_argument('--packed',type=Path,required=True)
    parser.add_argument('--repo',type=Path,default=Path.cwd())
    args=parser.parse_args()
    publish(args.prepared.resolve(),args.packed.resolve(),args.repo.resolve())

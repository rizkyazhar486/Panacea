"""Publishing must preserve existing files and reject changed or reviewed inputs."""
import copy
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

import publish_female_main_bronchi as publisher
from render_artifacts import fingerprint


class PublishBronchiTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.prepared, self.repo = root/'prepared', root/'repo'
        self.prepared.mkdir()
        for folder in ['bodyexposure/manifest', 'bodyexposure/qa_reports', 'public/bodyexposure']:
            (self.repo/folder).mkdir(parents=True)
        self.source = self.prepared/'source.glb'
        self.source.write_bytes(b'pinned test input')
        fixture = json.loads((Path(__file__).parents[1]/'qa_reports/female_main_bronchi_reference.json').read_text())
        self.report = copy.deepcopy(fixture)
        self.report['input_artifacts'] = [fingerprint(self.source)]
        self.report['output_artifacts'] = []
        self.report_path = self.prepared/'report.json'
        self.save_report()
        ontology = json.loads((Path(__file__).parents[2]/'public/bodyexposure/ontology.adult_female_main_bronchi_reference.json').read_text())['map']
        doc = {'asset': {'version': '2.0'}, 'nodes': [{'extras': r | {
            'ontologyid': ontology[r['panacea_structure_id']]['id'],
            'label': ontology[r['panacea_structure_id']]['label'],
        }} for r in self.report['structures']]}
        chunk = json.dumps(doc).encode()
        chunk += b' ' * (-len(chunk) % 4)
        self.packed = self.prepared/'packed.glb'
        self.packed.write_bytes(struct.pack('<III', 0x46546C67, 2, 20+len(chunk)) + struct.pack('<II', len(chunk), 0x4E4F534A) + chunk)
        (self.repo/'bodyexposure/manifest/structures.json').write_text('{"structures": [], "count": 0}')
        matrix = {'bodies': [{'body_id': 'HUMAN.ADULT.FEMALE', 'structures': 841}], 'files': []}
        for name in ['bodyexposure/manifest/body_matrix.json', 'public/bodyexposure/body_matrix.json']:
            (self.repo/name).write_text(json.dumps(matrix))
        self.addCleanup(patch.stopall)
        patch.object(publisher, 'SOURCE_SHA256', self.report['input_artifacts'][0]['sha256']).start()

    def save_report(self):
        self.report_path.write_text(json.dumps(self.report))

    def snapshot(self):
        return {str(p.relative_to(self.repo)): p.read_bytes() for p in self.repo.rglob('*') if p.is_file()}

    def publish(self):
        publisher.publish(self.prepared, self.packed, self.repo)

    def test_changed_source_cannot_write_any_repository_file(self):
        before = self.snapshot()
        self.source.write_bytes(b'changed test input')
        with self.assertRaises(RuntimeError): self.publish()
        self.assertEqual(self.snapshot(), before)

    def test_reviewed_metadata_cannot_be_published(self):
        before = self.snapshot()
        self.report['structures'][0]['panacea_clinically_reviewed'] = True
        self.save_report()
        with self.assertRaises(ValueError): self.publish()
        self.assertEqual(self.snapshot(), before)

    def test_wrong_source_pin_cannot_be_published(self):
        before = self.snapshot()
        self.report['input_artifacts'][0]['sha256'] = '0'*64
        self.save_report()
        with self.assertRaises(ValueError): self.publish()
        self.assertEqual(self.snapshot(), before)

    def test_existing_evidence_is_preserved(self):
        target = self.repo/'bodyexposure/qa_reports/female_main_bronchi_reference.json'
        target.write_text('previous human trial evidence')
        before = self.snapshot()
        with self.assertRaises(FileExistsError): self.publish()
        self.assertEqual(self.snapshot(), before)

    def test_missing_source_ontology_cannot_partially_publish(self):
        before = self.snapshot()
        blob = self.packed.read_bytes()
        size = struct.unpack_from('<I', blob, 12)[0]
        doc = json.loads(blob[20:20+size])
        del doc['nodes'][0]['extras']['ontologyid']
        chunk = json.dumps(doc).encode()
        chunk += b' ' * (-len(chunk) % 4)
        self.packed.write_bytes(struct.pack('<III', 0x46546C67, 2, 20+len(chunk)) + struct.pack('<II', len(chunk), 0x4E4F534A) + chunk)
        with self.assertRaises(ValueError): self.publish()
        self.assertEqual(self.snapshot(), before)

    def test_fresh_publication_then_retry_preserves_all_files(self):
        self.publish()
        before = self.snapshot()
        matrix = json.loads((self.repo/'public/bodyexposure/body_matrix.json').read_text())
        self.assertEqual(matrix['bodies'][0]['structures'], 841)
        self.assertEqual(matrix['bodies'][0]['variants'][0]['body_id'], publisher.BODY_ID)
        self.assertEqual(matrix['files'], [publisher.TAG+'.respiratory'])
        with self.assertRaises(ValueError): self.publish()
        self.assertEqual(self.snapshot(), before)


if __name__ == '__main__': unittest.main()

import hashlib
import json
from pathlib import Path
import struct
import tempfile
import unittest

from prepare_fetal_parcel_inspection import prepare


class PrepareInspectionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.audit_dir, self.qa_dir = self.root / 'audit', self.root / 'qa'
        self.audit_dir.mkdir(); self.qa_dir.mkdir()
        self.repo = self.root / 'repo'
        (self.repo / 'bodyexposure/qa_reports').mkdir(parents=True)
        source = Path(__file__).resolve().parents[1] / 'qa_reports'
        self.audit = json.loads((source / 'fetal_parcels_audit.json').read_text())
        self.evidence = json.loads((source / 'fetal_parcels_blender.json').read_text())
        for region in self.audit['regions']:
            payload = f"fixture {region['source_label']}".encode()
            (self.audit_dir / (region['id'] + '.stl')).write_bytes(payload)
            region['stl_sha256'] = hashlib.sha256(payload).hexdigest()
        nodes = [{'mesh': i, 'extras': {'source_label': i + 1, 'clinical_validation': 'pending',
                  'anatomical_identity': 'unresolved', 'runtime_admission': self.audit['runtime_admission']}}
                 for i in range(9)]
        encoded = json.dumps({'nodes': nodes}).encode()
        encoded += b' ' * ((-len(encoded)) % 4)
        payload = struct.pack('<5I', 0x46546C67, 2, len(encoded) + 20, len(encoded), 0x4E4F534A) + encoded
        self.raw = self.qa_dir / 'fetal_parcels_QA.glb'; self.raw.write_bytes(payload)
        self.evidence['artifacts'][self.raw.name]['sha256'] = hashlib.sha256(payload).hexdigest()
        self.save_evidence()
        self.out = self.root / 'out'

    def save_evidence(self):
        (self.audit_dir / 'report.json').write_text(json.dumps(self.audit))
        (self.repo / 'bodyexposure/qa_reports/fetal_parcels_audit.json').write_text(json.dumps(self.audit))
        (self.repo / 'bodyexposure/qa_reports/fetal_parcels_blender.json').write_text(json.dumps(self.evidence))

    def run_prepare(self):
        return prepare(self.audit_dir, self.qa_dir, self.out, self.repo)

    def test_pending_numeric_package_and_retry_preserve_originals(self):
        result = self.run_prepare()
        self.assertEqual(result['purpose'], 'dataset_inspection')
        self.assertEqual(result['runtime_admission'], 'blocked_label_identity_unresolved')
        self.assertEqual(result['all_triangles'], 115276)
        original = (self.out / 'regions.glb').read_bytes()
        with self.assertRaisesRegex(ValueError, 'already exists'): self.run_prepare()
        self.assertEqual((self.out / 'regions.glb').read_bytes(), original)
        self.assertEqual(self.raw.read_bytes(), original)

    def test_changed_glb_creates_no_output(self):
        self.raw.write_bytes(self.raw.read_bytes() + b'changed')
        with self.assertRaisesRegex(ValueError, 'fingerprint'): self.run_prepare()
        self.assertFalse(self.out.exists())

    def test_changed_stl_creates_no_output(self):
        (self.audit_dir / 'parcel_09.stl').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'STL'): self.run_prepare()
        self.assertFalse(self.out.exists())

    def test_clinical_promotion_creates_no_output(self):
        self.audit['clinical_validation'] = 'validated'; self.save_evidence()
        with self.assertRaisesRegex(ValueError, 'pending'): self.run_prepare()
        self.assertFalse(self.out.exists())

    def test_guessed_name_creates_no_output(self):
        self.audit['regions'][0]['anatomical_name'] = 'Superior lobe'; self.save_evidence()
        with self.assertRaisesRegex(ValueError, 'anonymous'): self.run_prepare()
        self.assertFalse(self.out.exists())


if __name__ == '__main__':
    unittest.main()

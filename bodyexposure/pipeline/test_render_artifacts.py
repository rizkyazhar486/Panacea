import hashlib
from pathlib import Path
import tempfile
import unittest
from render_artifacts import claim_output, fingerprint, process_memory, verify_unchanged, validate_body_selection


class RenderArtifactsTests(unittest.TestCase):
    def test_body_selection_retains_exact_existing_ids(self):
        rows = [{'type': 'MESH', 'body_id': 'FETUS', 'structure_id': 'FETUS.LUNG.L'}]
        self.assertEqual(validate_body_selection(rows, 'FETUS'), ['FETUS.LUNG.L'])
        self.assertEqual(rows[0]['structure_id'], 'FETUS.LUNG.L')

    def test_empty_mixed_body_and_nonmesh_selections_rejected(self):
        for rows in [[], [{'type': 'MESH', 'body_id': 'OTHER', 'structure_id': 'OTHER.LUNG'}],
                     [{'type': 'EMPTY', 'body_id': 'FETUS', 'structure_id': 'FETUS.ROOT'}]]:
            with self.assertRaises(ValueError):
                validate_body_selection(rows, 'FETUS')

    def test_missing_invalid_and_duplicate_source_ids_rejected(self):
        for sid in [None, '', ' ', 22]:
            with self.assertRaises(ValueError):
                validate_body_selection([{'type': 'MESH', 'body_id': 'FETUS', 'structure_id': sid}], 'FETUS')
        row = {'type': 'MESH', 'body_id': 'FETUS', 'structure_id': 'FETUS.LUNG.L'}
        with self.assertRaises(ValueError):
            validate_body_selection([row, row], 'FETUS')

    def test_saved_source_has_exact_digest_and_size(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source.blend'
            source.write_bytes(b'BLENDER' * 200000)
            record = fingerprint(source)
            self.assertEqual(record['sha256'], hashlib.sha256(source.read_bytes()).hexdigest())
            self.assertEqual(record['bytes'], 1400000)
            verify_unchanged([record])

    def test_missing_source_rejected_without_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileNotFoundError):
                fingerprint(Path(tmp) / 'missing.blend')
            self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_mutated_source_rejected_even_when_size_matches(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source.blend'
            source.write_bytes(b'original')
            record = fingerprint(source)
            source.write_bytes(b'modified')
            with self.assertRaisesRegex(RuntimeError, 'Input changed during render'):
                verify_unchanged([record])

    def test_output_is_exclusive_and_preserves_existing_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = claim_output(Path(tmp) / 'nested' / 'render')
            previous = out / 'capture.png'
            previous.write_bytes(b'previous capture')
            with self.assertRaises(FileExistsError):
                claim_output(out)
            self.assertEqual(previous.read_bytes(), b'previous capture')
            self.assertEqual(list(out.iterdir()), [previous])

    def test_existing_empty_directory_is_also_owned(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(FileExistsError):
                claim_output(tmp)

    def test_host_rss_does_not_claim_gpu_memory(self):
        memory = process_memory()
        self.assertIsNone(memory['gpu_memory_bytes'])
        self.assertIn(memory['scope'], ['process_lifetime_high_water_rss', 'unavailable', 'unsupported_platform'])
        if memory['peak_rss_bytes'] is not None:
            self.assertGreater(memory['peak_rss_bytes'], 0)


if __name__ == '__main__':
    unittest.main()

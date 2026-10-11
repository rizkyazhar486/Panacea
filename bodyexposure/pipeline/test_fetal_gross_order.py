import unittest
from fetal_gross_order import audit_order, REQUIRED

class FetalOrderTests(unittest.TestCase):
    def setUp(self):
        self.z = dict(zip(REQUIRED, [.054, .014, .045, .046, .078, .079, .092]))
    def test_partial_scope_is_explicit(self):
        ok, detail = audit_order(self.z)
        self.assertTrue(ok)
        self.assertIn('heart', detail['not_represented'])
        self.assertEqual(detail['clinical_validation'], 'pending')
    def test_every_required_organ_is_mandatory(self):
        for name in REQUIRED:
            with self.subTest(name=name):
                z = dict(self.z); del z[name]
                self.assertFalse(audit_order(z)[0])
    def test_inverted_order_fails(self):
        for name in ['lung.L', 'lung.R', 'thymus', 'kidney.L', 'kidney.R', 'liver']:
            z = dict(self.z); z[name] = 0
            self.assertFalse(audit_order(z)[0])
    def test_invalid_centroids_fail(self):
        for value in [float('nan'), float('inf'), None]:
            z = dict(self.z); z['liver'] = value
            self.assertFalse(audit_order(z)[0])

if __name__ == '__main__': unittest.main()

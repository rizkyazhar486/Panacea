"""Regresi gerbang aset: manifest, GLB rusak, dan hitungan segitiga."""
import json
from pathlib import Path
import struct
import tempfile
import unittest
from check_web_budget import audit, tris


def glb(path, count=3, indexed=True, mode=4):
    primitive = {"attributes": {"POSITION": 0}, "mode": mode}
    if indexed:
        primitive["indices"] = 0
    doc = {"accessors": [{"count": count}], "meshes": [{"primitives": [primitive]}]}
    chunk = json.dumps(doc).encode()
    chunk += b" " * (-len(chunk) % 4)
    path.write_bytes(struct.pack("<5I", 0x46546C67, 2, 20 + len(chunk), len(chunk), 0x4E4F534A) + chunk)


class BudgetTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.manifest(["adult_male.skeletal"], {"adult_male": "LOD3"})

    def manifest(self, files, lods):
        (self.directory / "body_matrix.json").write_text(json.dumps({"files": files, "light_lod": lods}))

    def test_manifest_lod_overrides_available_lod(self):
        glb(self.directory / "adult_male.skeletal.LOD3.glb", 300)
        glb(self.directory / "adult_male.skeletal.LOD4.glb", 3)
        self.assertFalse(audit(self.directory, {"skeletal"}, 50)["ok"])

    def test_missing_declared_system_fails(self):
        self.assertFalse(audit(self.directory, {"skeletal"}, 100)["ok"])

    def test_missing_hidden_system_also_fails(self):
        self.assertFalse(audit(self.directory, {"digestive"}, 100)["ok"])

    def test_default_lod_and_unindexed_geometry(self):
        self.manifest(["adult_male.skeletal"], {})
        glb(self.directory / "adult_male.skeletal.LOD3.glb", 9, indexed=False)
        report = audit(self.directory, {"skeletal"}, 3)
        self.assertTrue(report["ok"])
        self.assertEqual(report["bodies"][0]["initial_tris"], 3)

    def test_empty_manifest_fails(self):
        self.manifest([], {})
        with self.assertRaises(ValueError):
            audit(self.directory, {"skeletal"}, 100)

    def test_path_traversal_fails(self):
        self.manifest(["../outside.skeletal"], {})
        with self.assertRaises(ValueError):
            audit(self.directory, {"skeletal"}, 100)

    def test_corrupt_header_fails(self):
        path = self.directory / "bad.glb"
        glb(path)
        data = bytearray(path.read_bytes()); data[0] = 0
        path.write_bytes(data)
        with self.assertRaises(ValueError):
            tris(path)

    def test_nontriangles_and_incomplete_triangle_fail(self):
        path = self.directory / "bad.glb"
        for count, mode in [(4, 4), (3, 1), (0, 4)]:
            glb(path, count, mode=mode)
            with self.assertRaises(ValueError):
                tris(path)


if __name__ == "__main__":
    unittest.main()

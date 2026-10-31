"""Uji heuristik bidang MTP (T-D7-05) tanpa Blender: aturan pemilihan, jendela, penolakan masukan rusak.

python3 -m unittest discover -s bodyexposure/pipeline -p test_mtp_plane.py
"""
import json
import math
import os
import unittest

from mtp_plane import pilih_bidang_mtp


def profil_tangga(n=100, turun=None, dasar=10.0):
    """Profil luas sintetis: `dasar` lalu penurunan bertingkat {indeks: luas sesudahnya}."""
    turun = turun or {}
    out, luas = {}, dasar
    for k in range(n):
        if k in turun:
            luas = turun[k]
        out[k] = luas
    return out


class AturanPemilihan(unittest.TestCase):
    def test_satu_penurunan_dipilih_tepat_di_irisannya(self):
        r = pilih_bidang_mtp(profil_tangga(turun={70: 4.0}))
        self.assertEqual(r["k"], 70)
        self.assertEqual(r["jendela"], (54, 84))
        self.assertEqual((r["k0"], r["k1"]), (0, 99))

    def test_puncak_pertama_yang_cukup_kuat_menang_atas_penurunan_distal_yang_lebih_besar(self):
        # penurunan MTP (10 -> 7, skor 3) lalu runcingnya falang distal (7 -> 3, skor 4): 3 >= 0.7 x 4, jadi yang pertama dipilih
        r = pilih_bidang_mtp(profil_tangga(turun={62: 7.0, 78: 3.0}))
        self.assertEqual(r["k"], 62)

    def test_berpasangan_puncak_pertama_di_bawah_ambang_kalah(self):
        # hanya besar penurunan pertama yang berbeda: 10 -> 8 (skor 2 < 0.7 x 5) tidak lagi memenuhi ambang
        r = pilih_bidang_mtp(profil_tangga(turun={62: 8.0, 78: 3.0}))
        self.assertEqual(r["k"], 78)

    def test_penurunan_di_luar_jendela_diabaikan(self):
        # penurunan besar pada 40% rentang (di luar 55-85%) diabaikan; yang kecil di dalam jendela dipilih
        r = pilih_bidang_mtp(profil_tangga(turun={40: 2.0, 70: 1.5}))
        self.assertEqual(r["k"], 70)

    def test_indeks_tidak_mulai_dari_nol(self):
        p = {k + 25: v for k, v in profil_tangga(turun={70: 4.0}).items()}
        self.assertEqual(pilih_bidang_mtp(p)["k"], 95)

    def test_deterministik(self):
        p = profil_tangga(turun={62: 7.0, 78: 3.0})
        self.assertEqual(pilih_bidang_mtp(p), pilih_bidang_mtp(dict(p)))


class PenolakanMasukan(unittest.TestCase):
    def test_profil_kosong_ditolak(self):
        for p in ({}, None, [], "x"):
            with self.subTest(p=p), self.assertRaises(ValueError):
                pilih_bidang_mtp(p)

    def test_luas_tidak_sah_ditolak(self):
        for v in (math.nan, math.inf, -1.0, True, "1"):
            p = profil_tangga(turun={70: 4.0}); p[10] = v
            with self.subTest(v=v), self.assertRaises(ValueError):
                pilih_bidang_mtp(p)

    def test_indeks_bukan_bulat_ditolak(self):
        p = profil_tangga(turun={70: 4.0}); p[10.5] = 1.0
        with self.assertRaises(ValueError):
            pilih_bidang_mtp(p)

    def test_tanpa_penurunan_di_jendela_ditolak_bukan_ditebak(self):
        naik = {k: float(k) for k in range(100)}
        with self.assertRaisesRegex(ValueError, "tidak ada penurunan"):
            pilih_bidang_mtp(naik)
        with self.assertRaisesRegex(ValueError, "tidak ada penurunan"):
            pilih_bidang_mtp(profil_tangga())

    def test_parameter_tidak_sah_ditolak(self):
        p = profil_tangga(turun={70: 4.0})
        for kw in ({"jendela": (0.9, 0.5)}, {"jendela": (-0.1, 0.5)}, {"jendela": (0.5, 1.2)}, {"ambang": 0}, {"ambang": 1.5}, {"lebar": 0}, {"lebar": 2.5}):
            with self.subTest(kw=kw), self.assertRaises(ValueError):
                pilih_bidang_mtp(p, **kw)


AKAR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
PROFIL_NYATA = os.path.join(AKAR, "bodyexposure", "qa_reports", "forefoot_area_profile.vhf_denver_ct_adult_female.json")
MANIFEST = os.path.join(AKAR, "bodyexposure", "manifest", "rig_vhf_denver_ct.json")


def muat_profil():
    with open(PROFIL_NYATA) as f:
        d = json.load(f)
    return d, {s: dict(zip(v["k"], v["area_m2"])) for s, v in d["sides"].items()}


class ProfilNyataVhfBetina(unittest.TestCase):
    """Profil luas nyata dari build_rig_lower_limb.py --areas-out (Blender 5.2.2, tubuh VHF Denver+CT). Kelas kebenaran: derived."""

    def test_bidang_default_sama_dengan_manifest_rig_yang_dicommit(self):
        d, prof = muat_profil()
        with open(MANIFEST) as f:
            metode = json.load(f)["joint_centre_methods"]
        for s in ("L", "R"):
            r = pilih_bidang_mtp(prof[s])
            self.assertEqual(round(r["k"] * d["slab_m"] * 1000, 1), metode[f"MTP.{s}"]["plane_from_ankle_mm"], s)
            self.assertEqual([round(x * d["slab_m"] * 1000) for x in r["jendela"]], metode[f"MTP.{s}"]["search_window_mm"], s)
        self.assertEqual(pilih_bidang_mtp(prof["L"])["puncak"], [70, 80], "kiri: puncak MTP lalu runcingnya falang distal")
        self.assertEqual(pilih_bidang_mtp(prof["R"])["puncak"], [71])

    def test_sensitivitas_ambang_dan_jendela_tidak_menggeser_bidang(self):
        _, prof = muat_profil()
        for s, dasar in (("L", 70), ("R", 71)):
            for kw in ({"ambang": 0.6}, {"ambang": 0.8}, {"ambang": 0.9}, {"jendela": (0.5, 0.85)}, {"jendela": (0.6, 0.85)}, {"jendela": (0.55, 0.8)}, {"jendela": (0.55, 0.9)}):
                with self.subTest(sisi=s, **{k: str(v) for k, v in kw.items()}):
                    self.assertEqual(pilih_bidang_mtp(prof[s], **kw)["k"], dasar)

    def test_sensitivitas_lebar_rata_rata_dipin_termasuk_lompatan_kanan_20_mm(self):
        # Temuan, bukan target: sisi kanan bergantung kuat pada lebar rata-rata 6 mm (3 irisan). Dengan 2 irisan bidang kanan pindah
        # 20 mm ke proksimal (k 71 -> 61). Bila angka ini berubah, profil atau algoritmanya berubah dan rig harus dibangun ulang dan ditinjau.
        _, prof = muat_profil()
        harapan = {("L", 2): 70, ("L", 4): 69, ("R", 2): 61, ("R", 4): 72}
        for (s, lebar), k in harapan.items():
            with self.subTest(sisi=s, lebar=lebar):
                self.assertEqual(pilih_bidang_mtp(prof[s], lebar=lebar)["k"], k)

    def test_sama_dengan_np_mean_bila_numpy_tersedia(self):
        try:
            import numpy as np
        except ImportError:
            self.skipTest("numpy tidak terpasang; kesetaraan dibuktikan oleh laporan rig Blender yang identik byte-per-byte")
        _, prof = muat_profil()
        for s in ("L", "R"):
            for lebar in range(2, 8):
                skor = pilih_bidang_mtp(prof[s], lebar=lebar)["skor"]
                for k, v in skor.items():
                    ref = np.mean([prof[s].get(j, 0.0) for j in range(k - lebar, k)]) - np.mean([prof[s].get(j, 0.0) for j in range(k, k + lebar)])
                    self.assertEqual(v, float(ref), (s, lebar, k))


if __name__ == "__main__":
    unittest.main()

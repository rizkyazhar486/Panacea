"""Pemilihan bidang sendi MTP dari profil luas penampang kaki depan (T-D7-05, heuristik TURUNAN, bukan landmark berlabel).

Dipisah dari build_rig_lower_limb.py agar dapat diuji tanpa Blender dan tanpa numpy (runner CI tidak memasangnya). Rata-rata
dihitung berurutan (sum/len), sama dengan np.mean untuk daftar sependek ini; kesamaan dibuktikan dua kali: laporan rig Blender
identik byte-per-byte dengan versi np.mean sebaris sebelumnya, dan test_mtp_plane.py membandingkan keduanya bila numpy tersedia.
Satu-satunya tambahan perilaku adalah penolakan masukan rusak (profil kosong, nilai tak hingga/negatif, atau tidak ada penurunan
luas di jendela pencarian) daripada memilih bidang yang tidak bermakna.

profil: {indeks irisan (int): luas permukaan irisan (m^2)} sepanjang sumbu pergelangan kaki -> ujung jari, satu irisan = SLAB meter.
Bidang = irisan dengan penurunan luas rata-rata `lebar` irisan sebelum vs sesudahnya, di dalam `jendela` (fraksi rentang mesh), yaitu
puncak lokal PERTAMA (dari posterior) yang skornya >= `ambang` x skor tertinggi: penurunan kedua yang lebih anterior adalah runcingnya
ujung falang distal, bukan sendi MTP.
"""
import math

JENDELA = (0.55, 0.85)
AMBANG = 0.7
LEBAR = 3


def _rerata(xs):
    total = 0.0
    for x in xs:
        total += x
    return total / len(xs)


def pilih_bidang_mtp(profil, jendela=JENDELA, ambang=AMBANG, lebar=LEBAR):
    if not isinstance(profil, dict) or not profil:
        raise ValueError("profil luas kosong")
    for k, v in profil.items():
        if not isinstance(k, int) or isinstance(k, bool):
            raise ValueError(f"indeks irisan bukan bilangan bulat: {k!r}")
        if not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v) or v < 0:
            raise ValueError(f"luas irisan {k} tidak sah: {v!r}")
    a, b = jendela
    if not (0 <= a < b <= 1):
        raise ValueError(f"jendela tidak sah: {jendela!r}")
    if not (0 < ambang <= 1) or not isinstance(lebar, int) or lebar < 1:
        raise ValueError("ambang atau lebar tidak sah")
    ks = sorted(profil)
    k0, k1 = ks[0], ks[-1]
    win = range(int(k0 + a * (k1 - k0)), int(k0 + b * (k1 - k0)) + 1)
    skor = {}
    for k in win:
        sebelum = _rerata([profil.get(j, 0.0) for j in range(k - lebar, k)])
        sesudah = _rerata([profil.get(j, 0.0) for j in range(k, k + lebar)])
        skor[k] = sebelum - sesudah
    tertinggi = max(skor.values())
    if not tertinggi > 0:
        raise ValueError("tidak ada penurunan luas di jendela pencarian; bidang MTP tidak dapat diturunkan")
    ks_w = sorted(skor)
    puncak = [k for i, k in enumerate(ks_w)
              if skor[k] >= ambang * tertinggi
              and (i == 0 or skor[k] >= skor[ks_w[i - 1]])
              and (i == len(ks_w) - 1 or skor[k] >= skor[ks_w[i + 1]])]
    return {"k": puncak[0], "skor": skor, "jendela": (min(win), max(win)), "puncak": puncak, "k0": k0, "k1": k1}

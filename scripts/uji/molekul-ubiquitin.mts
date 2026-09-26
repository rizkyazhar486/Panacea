// Model resolusi residu pada struktur eksperimen nyata (PDB 1UBI, ubiquitin manusia).
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { parsePdb, kePdb, keFasta, type Struktur } from '../../src/lib/molekul/struktur.ts'
import { periksaTulangPunggung, kiralitas, TANDA_L, phiPsi, bentrokan, ikatanHTulangPunggung, sasa, konsistensiUrutan } from '../../src/lib/molekul/validasi.ts'
import { superposisi, terapkan, rotasiDariKuaternion, type V3 } from '../../src/lib/molekul/geometri.ts'
import { validasiHierarki, IDENTITAS, estimasiMemori, type Simpul } from '../../src/lib/molekul/hierarki.ts'

const mentah = readFileSync('public/molekul/1ubi.pdb', 'utf8')
const prov = JSON.parse(readFileSync('public/molekul/PROVENANCE.json', 'utf8')).files['1ubi.pdb']
assert.equal(createHash('sha256').update(mentah).digest('hex'), prov.sha256, 'berkas struktur berubah dari yang tercatat di provenance')
const s = parsePdb(mentah), r = s.rantai[0]
assert.deepEqual([s.idPdb, s.organisme, s.resolusiA, r.residu.length], ['1UBI', 'HOMO SAPIENS', 1.8, 76])

// Urutan: ATOM == SEQRES, residu standar, tanpa celah, tercakup DBREF UniProt.
const k = konsistensiUrutan(s, r)
assert.ok(k.sama && k.nonStandar.length === 0 && k.celah.length === 0 && k.cakupanDbref, 'urutan tidak konsisten dengan SEQRES/DBREF')
assert.equal(k.dbref?.aksesi, 'P62988')
assert.equal(k.atomSeq, 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG', 'urutan terbaca berbeda dari berkas')
assert.match(keFasta(s, 'A'), /^>pdb\|1UBI\|A UNP:P62988 UBIQ_HUMAN 1-76 HOMO SAPIENS\nMQIFVKTLTGK/)

// Geometri tulang punggung terhadap Engh & Huber 1991.
const b = periksaTulangPunggung(r)
assert.ok(b.jumlahUkuran > 600 && b.pencilan.length === 0 && b.rmsZ < 1, `geometri tulang punggung: ${b.pencilan.length} pencilan, rmsZ ${b.rmsZ}`)

// Kiralitas: semua L; cermin -> semua D (pendeteksi benar-benar bekerja).
const kir = kiralitas(r)
assert.ok(kir.length === 70 && kir.every((x) => x.volume !== null && Math.sign(x.volume) === TANDA_L), 'residu bukan-L terdeteksi pada struktur L')
const cermin: Struktur = { ...s, rantai: s.rantai.map((c) => ({ ...c, residu: c.residu.map((x) => ({ ...x, atom: x.atom.map((a) => ({ ...a, x: -a.x })) })) })) }
assert.ok(kiralitas(cermin.rantai[0]).every((x) => Math.sign(x.volume!) === -TANDA_L), 'bayangan cermin (asam amino-D) tidak terdeteksi')

// φ/ψ konsisten dengan anotasi penyimpan (bukan DSSP).
const pp = phiPsi(r), rata = (xs: number[]) => xs.reduce((a, c) => a + c, 0) / xs.length
const hel = pp.filter((x) => x.ss === 'helix' && x.phi !== null && x.psi !== null), lem = pp.filter((x) => x.ss === 'sheet' && x.phi !== null && x.psi !== null)
assert.ok(rata(hel.map((x) => x.phi!)) < -50 && rata(hel.map((x) => x.psi!)) < -20, 'φ/ψ heliks tidak di wilayah α')
assert.ok(rata(lem.map((x) => x.phi!)) < -70 && rata(lem.map((x) => x.psi!)) > 90, 'φ/ψ lembar tidak di wilayah β')

// Bentrokan: tidak ada yang parah; kontak ringan dilaporkan (tidak disembunyikan).
const cl = bentrokan(r)
assert.ok(cl.every((c) => c.tumpang < 0.8), `bentrokan parah: ${JSON.stringify(cl.filter((c) => c.tumpang >= 0.8))}`)
const hb = ikatanHTulangPunggung(r)
assert.ok(hb.filter((h) => h.donor >= 23 && h.donor <= 34 && h.donor - h.akseptor === 4).length >= 6, 'pola ikatan-H i→i+4 heliks 23–34 tidak terlihat')

// SASA: inti hidrofobik terkubur, situs K48 terbuka (fakta biologi ubiquitin yang dikenal).
const sa = sasa(r); let tot = 0; for (const v of sa.values()) tot += v
assert.ok(sa.get(3)! < 5 && sa.get(48)! > 50 && tot > 3000 && tot < 7000, `SASA tidak masuk akal (Ile3 ${sa.get(3)}, Lys48 ${sa.get(48)}, total ${tot})`)

// Round-trip PDB mempertahankan koordinat.
const ulang = parsePdb(kePdb(s))
assert.deepEqual(ulang.rantai[0].residu.flatMap((x) => x.atom.map((a) => [a.nama, a.x, a.y, a.z])), r.residu.flatMap((x) => x.atom.map((a) => [a.nama, a.x, a.y, a.z])), 'ekspor PDB mengubah koordinat/nama atom')

// SE(3): rotasi+translasi yang diketahui dipulihkan; cermin tidak pernah "disuperposisikan".
const ca: V3[] = r.residu.map((x) => { const a = x.atom.find((y) => y.nama === 'CA')!; return [a.x, a.y, a.z] })
const q = [0.8, 0.2, -0.4, 0.4]; const nq = Math.hypot(...q); const R = rotasiDariKuaternion(q.map((v) => v / nq) as never)
const pindah = ca.map((v) => terapkan({ R, t: [5, -3, 12] }, v))
const sup = superposisi(pindah, ca)
assert.ok(sup.rmsd < 1e-6, `superposisi gagal memulihkan transformasi (RMSD ${sup.rmsd})`)
const det = (M: readonly V3[]) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
assert.ok(Math.abs(det(sup.T.R) - 1) < 1e-9, 'superposisi menghasilkan bukan-rotasi')
const supCermin = superposisi(ca.map((v) => [-v[0], v[1], v[2]] as V3), ca)
assert.ok(supCermin.rmsd > 1 && Math.abs(det(supCermin.T.R) - 1) < 1e-9, 'bayangan cermin "disuperposisikan" dengan refleksi')

// Hierarki gagal tertutup.
const protein: Simpul = { id: 'ubq', level: 2, label: 'Ubiquitin (PDB 1UBI)', pose: IDENTITAS, satuan: 'angstrom', geometri: { jenis: 'experimental-structure', berkas: 'molekul/1ubi.pdb', sha256: prov.sha256, idPdb: '1UBI' }, resolusi: 'residue', anak: [], sumber: { uniprot: 'P62988', pdb: '1UBI' } }
const sel: Simpul = { id: 'sitosol', level: 4, label: 'Cytosol (context only)', pose: IDENTITAS, satuan: 'micrometre', geometri: { jenis: 'not-modelled', alasan: 'no source cell geometry' }, resolusi: 'coarse', anak: [protein] }
assert.deepEqual(validasiHierarki(sel), [])
assert.ok(validasiHierarki({ ...sel, resolusi: 'residue' }).some((g) => /no source geometry/.test(g)), 'resolusi tinggi diminta tanpa geometri sumber')
assert.ok(validasiHierarki({ ...protein, anak: [{ ...sel, anak: [] }] }).some((g) => /must be finer/.test(g)), 'urutan level terbalik lolos')
assert.ok(validasiHierarki({ ...protein, geometri: { ...protein.geometri, sha256: 'x' } as never }).some((g) => /sha256/.test(g)))
assert.equal(estimasiMemori({ jumlahProtein: 1, rerataPanjang: 76, atomBeratPerResidu: 602 / 76, resolusi: 'all-atom' }).entitas, 602)
console.log(`molekul-ubiquitin: 1UBI (sha ok), urutan = SEQRES = P62988, ${b.jumlahUkuran} ukuran tulang punggung 0 pencilan (rmsZ ${b.rmsZ.toFixed(2)}), 70/70 L & cermin terdeteksi, ${cl.length} kontak ringan dilaporkan, SASA ${tot.toFixed(0)} Å², SE(3) terpulihkan`)
const panel = readFileSync('src/components/PanelUbiquitin.tsx', 'utf8')
assert.match(panel, /reference structure, not patient-specific/, 'panel protein tanpa label rujukan')
assert.match(readFileSync('src/pages/BodyExposureOS.tsx', 'utf8'), /<PanelUbiquitin \/>/)

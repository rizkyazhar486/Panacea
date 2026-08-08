// Bukti bahwa setiap perubahan Connect benar-benar sampai ke penyimpanan.
//
// Cacat yang diuji di sini tidak pernah berbunyi: semua tombol berhasil, layar
// berubah, lalu server dinyalakan ulang dan blokir yang sudah dipasang hilang.
import {
  pasangPenyimpan, akunConnect, blokir, bukaBlokir, setelRadius, laporkan,
  ajukanVerifikasi, ikatTelepon, putuskanVerifikasi, kurangiKredit, pulihkanKredit,
  putuskanLaporan, tarikPersetujuan, hapusAkunConnect, isiConnect, muatConnect,
  terblokir, laporanMenunggu,
} from '../../server/src/connect.js'

let lulus = 0, gagal = 0
function cek(nama: string, benar: boolean, ket = '') {
  if (benar) { lulus++; console.log('PASS', nama, ket) }
  else { gagal++; console.log('FAIL', nama, ket) }
}

let simpanan = 0
pasangPenyimpan(() => { simpanan++ })

// Setiap fungsi yang mengubah keadaan harus memicu penyimpanan tepat sekali.
function hitung(nama: string, kerja: () => void, minimal = 1) {
  const sebelum = simpanan
  kerja()
  cek(nama + ' memicu simpan', simpanan - sebelum >= minimal, `(+${simpanan - sebelum})`)
}

akunConnect('a@x.id'); akunConnect('b@x.id')

hitung('blokir', () => { blokir('a@x.id', 'b@x.id') })
hitung('bukaBlokir', () => { bukaBlokir('a@x.id', 'b@x.id') })
hitung('setelRadius', () => { setelRadius('a@x.id', 40) })
hitung('laporkan', () => { laporkan('a@x.id', 'b@x.id', 'spam') })
hitung('ikatTelepon', () => { ikatTelepon('a@x.id', '081234567890') })
hitung('kurangiKredit', () => { kurangiKredit('b@x.id', 5, 'uji', 'o@x.id') })
hitung('pulihkanKredit', () => { pulihkanKredit('b@x.id', 5) })
hitung('putuskanLaporan', () => { putuskanLaporan(laporanMenunggu()[0].id, 0, 'o@x.id') })

const ajuan = {
  nama: 'Uji', tempatLahir: 'Bandung', tanggalLahir: '1995-01-01', umur: 31,
  pekerjaan: 'Dokter', status: 'lajang', preferensi: 'straight',
  pendidikanTerakhir: 'S1', tempatTinggal: 'Bandung',
  sosialMedia: ['https://instagram.com/ujicoba'],
  selfieUrl: 'https://contoh.id/s.jpg', telepon: '081234567890',
  persetujuan: ['biometrik_selfie', 'orientasi_seksual', 'telepon_sidik'],
}
hitung('ajukanVerifikasi', () => {
  const r = ajukanVerifikasi('a@x.id', ajuan as never)
  cek('ajuan diterima', r.ok, r.galat ?? '')
})
hitung('putuskanVerifikasi', () => { putuskanVerifikasi('a@x.id', true) })
hitung('tarikPersetujuan', () => { tarikPersetujuan('a@x.id') })
hitung('hapusAkunConnect', () => { hapusAkunConnect('b@x.id') })

// Perjalanan pulang-pergi: keadaan yang disimpan harus kembali utuh, termasuk
// garam — garam baru membuat semua sidik telepon lama tidak cocok lagi.
blokir('a@x.id', 'c@x.id')
const disimpan = JSON.parse(JSON.stringify(isiConnect()))
const garamAsli = disimpan.garam
muatConnect({ akun: {}, laporan: [], garam: 'x'.repeat(64) })
cek('keadaan benar-benar terhapus sebelum dimuat ulang', !terblokir('a@x.id', 'c@x.id'))
muatConnect(disimpan)
cek('blokir bertahan lewat penyimpanan', terblokir('a@x.id', 'c@x.id'))
cek('garam bertahan lewat penyimpanan', isiConnect().garam === garamAsli)
cek('radius bertahan lewat penyimpanan', isiConnect().akun['a@x.id'].radiusKm === 40)

console.log(`\n${lulus} lulus, ${gagal} gagal`)
process.exit(gagal ? 1 : 0)

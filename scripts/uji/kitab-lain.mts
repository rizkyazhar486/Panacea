import { periksaBacaan, PENGANTAR } from '../../src/lib/kitab.ts'
const chk=(n:string,c:boolean,x='')=>console.log(c?'PASS':'FAIL',n,x)
const B=(t:string)=>({rujukan:'X 1:1',teks:t,edisi:'e'})
chk('bacaan sah lolos', periksaBacaan(B('In the beginning was the Word')).utuh)
chk('bacaan kosong ditolak', !periksaBacaan(B('')).utuh)
chk('halaman HTML ditolak', !periksaBacaan(B('<html><body>404</body></html>')).utuh,
  periksaBacaan(B('<html><body>404</body></html>')).alasan?.slice(0,44))
chk('pengodean rusak ditolak', !periksaBacaan(B('In the begin�ing')).utuh)
chk('Ibrani tanpa aksara Ibrani ditolak', !periksaBacaan(B('In the beginning'),'ibrani').utuh,
  periksaBacaan(B('In the beginning'),'ibrani').alasan?.slice(0,46))
chk('Ibrani dengan aksara Ibrani lolos', periksaBacaan(B('בְּרֵאשִׁית'),'ibrani').utuh)
chk('tiga pengantar tersedia', PENGANTAR.length===3, PENGANTAR.map(p=>p.tradisi).join(','))
chk('tiap pengantar punya sumber utama', PENGANTAR.every(p=>p.sumberUtama.length>0))
// Pengantar adalah keterangan, bukan kutipan: tidak boleh ada tanda kutip panjang.
chk('pengantar tidak mengutip isi kitab',
  PENGANTAR.every(p=>!/["“][^"”]{40,}["”]/.test(p.ringkas)))

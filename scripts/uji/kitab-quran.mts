import { periksaDaftarSurah, periksaSurah, TOTAL_SURAH, TOTAL_AYAT_HAFS } from '../../src/lib/kitab.ts'
const chk=(n:string,c:boolean,x='')=>console.log(c?'PASS':'FAIL',n,x)
const S=(n:number,j:number)=>({nomor:n,nama:'x',namaArab:'س',arti:'x',jumlahAyat:j,tempat:'Meccan'})
// Daftar sah: 114 surah, total 6236.
const sah=[...Array(113)].map((_,i)=>S(i+1,55)); sah.push(S(114,6236-113*55))
chk('daftar sah lolos', periksaDaftarSurah(sah).utuh, String(sah.reduce((a,x)=>a+x.jumlahAyat,0)))
chk('kurang dari 114 surah ditolak', !periksaDaftarSurah(sah.slice(0,113)).utuh)
const salahTotal=[...sah]; salahTotal[0]=S(1,54)
chk('total ayat meleset ditolak', !periksaDaftarSurah(salahTotal).utuh,
  periksaDaftarSurah(salahTotal).alasan?.slice(0,52))

const A=(n:number,t:string)=>({nomor:n,arab:t,terjemahan:'t'})
const su=S(1,3)
chk('surah utuh lolos', periksaSurah(su,[A(1,'الْحَمْدُ'),A(2,'الرَّحْمَٰنِ'),A(3,'مَالِكِ')]).utuh)
chk('ayat terpotong ditolak', !periksaSurah(su,[A(1,'الْحَمْدُ'),A(2,'الرَّحْمَٰنِ')]).utuh,
  periksaSurah(su,[A(1,'ا'),A(2,'ب')]).alasan?.slice(0,46))
chk('ayat kosong ditolak', !periksaSurah(S(1,1),[A(1,'')]).utuh)
chk('teks tanpa huruf Arab ditolak', !periksaSurah(S(1,1),[A(1,'Praise be to God')]).utuh,
  periksaSurah(S(1,1),[A(1,'Praise be to God')]).alasan?.slice(0,44))
chk('aksara Latin menyusup ditolak', !periksaSurah(S(1,1),[A(1,'الْحَمْدُ ERROR')]).utuh,
  periksaSurah(S(1,1),[A(1,'الْحَمْدُ ERROR')]).alasan?.slice(0,44))
chk('pengodean rusak (U+FFFD) ditolak', !periksaSurah(S(1,1),[A(1,'الْحَمْدُ�')]).utuh,
  periksaSurah(S(1,1),[A(1,'الْحَمْدُ�')]).alasan?.slice(0,48))
chk('halaman galat HTML ditolak', !periksaSurah(S(1,1),[A(1,'<html>503 Service Unavailable</html>')]).utuh)
chk('angka rujukan universal benar', TOTAL_SURAH===114 && TOTAL_AYAT_HAFS===6236)

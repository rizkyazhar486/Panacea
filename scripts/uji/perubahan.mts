import { ringkas, pekanBerjalan, tinjauanJatuhTempo, type Keadaan, type Komitmen } from '../../src/lib/perubahan.ts'
const chk=(n:string,c:boolean,x='')=>console.log(c?'PASS':'FAIL',n,x)
const hariLalu=(n:number)=>new Date(Date.now()-n*86400_000).toISOString()
const K=(mulaiHariLalu:number):Komitmen=>({sasaran:'Run 5 km',wilayah:'physical',ukuran:'5 km no walking',
  pembatal:'still under 3 km at week 8',kapan:'Tue/Thu 6am',dimana:'park',minimum:'shoes on, 10 min walk',
  rencanaPulih:'restart at minimum',mulaiPada:hariLalu(mulaiHariLalu),pekanTotal:12})
const T=(pekan:number,hari:number,arah:any)=>({pekan,pada:hariLalu(0),hariMinimum:hari,arah,halangan:'',penyesuaian:''})

chk('pekan dihitung dari tanggal mulai', pekanBerjalan(K(15))===3, String(pekanBerjalan(K(15))))
chk('belum mulai = pekan 0', pekanBerjalan({...K(0),mulaiPada:new Date(Date.now()+86400_000).toISOString()})===0)

let s:Keadaan={komitmen:K(2),tinjauan:[],arsip:[]}
chk('pekan berjalan belum bisa ditinjau', tinjauanJatuhTempo(s)===null)
s={komitmen:K(9),tinjauan:[],arsip:[]}
chk('pekan yang sudah lewat jatuh tempo', tinjauanJatuhTempo(s)===1, String(tinjauanJatuhTempo(s)))
s.tinjauan=[T(1,5,'maju')]
chk('tidak menagih pekan yang sudah ditinjau', tinjauanJatuhTempo(s)===null)

// Inti: sistemnya HARUS bisa mengatakan tidak.
const putusan=(t:any[])=>ringkas({komitmen:K(30),tinjauan:t,arsip:[]})!.putusan
chk('kurang dari 3 tinjauan = terlalu awal', putusan([T(1,7,'maju'),T(2,7,'maju')])==='terlalu-awal')
chk('minimum tidak terjadi = tidak berjalan',
  putusan([T(1,1,'diam'),T(2,0,'diam'),T(3,1,'diam')])==='tidak-berjalan')
chk('hadir tapi tidak bergerak = tidak berjalan',
  putusan([T(1,7,'diam'),T(2,7,'diam'),T(3,7,'diam')])==='tidak-berjalan',
  putusan([T(1,7,'diam'),T(2,7,'diam'),T(3,7,'diam')]))
chk('sebagian berjalan = goyah',
  putusan([T(1,3,'maju'),T(2,3,'diam'),T(3,3,'diam')])==='goyah',
  putusan([T(1,3,'maju'),T(2,3,'diam'),T(3,3,'diam')]))
chk('konsisten dan bergerak = berjalan',
  putusan([T(1,6,'maju'),T(2,6,'maju'),T(3,5,'diam'),T(4,6,'maju')])==='berjalan',
  putusan([T(1,6,'maju'),T(2,6,'maju'),T(3,5,'diam'),T(4,6,'maju')]))

const r=ringkas({komitmen:K(30),tinjauan:[T(1,7,'diam'),T(2,7,'diam'),T(3,7,'diam')],arsip:[]})!
chk('alasannya menyalahkan rancangan, bukan orangnya',
  /stimulus is too small|measure is not sensitive/.test(r.alasan), r.alasan.slice(0,60))
const r2=ringkas({komitmen:K(30),tinjauan:[T(1,1,'diam'),T(2,0,'diam'),T(3,1,'diam')],arsip:[]})!
chk('kehadiran rendah disebut masalah rancangan',
  /design problem, not a discipline problem/.test(r2.alasan), r2.alasan.slice(0,60))
chk('tanpa komitmen tidak melempar', ringkas({tinjauan:[],arsip:[]})===null)

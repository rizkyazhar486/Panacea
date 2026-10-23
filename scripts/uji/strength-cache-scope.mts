import assert from 'node:assert/strict'
import { bindPersonalHealthAccount } from '../../src/shared/kernel/personalHealthStorageScope.ts'
const data = new Map<string,string>(); let blocked = false
;(globalThis as any).localStorage = { getItem: (k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>{if(blocked && k.startsWith('pmd_beban_v1:scope_v1:'))throw Error('quota');data.set(k,v)},removeItem:(k:string)=>data.delete(k) }
const {ambilSesi,simpanSesi,hapusSesi}=await import('../../src/lib/angkatBeban.ts')
const {alasanSesiDitolak,volumeMingguan}=await import('../../src/lib/angkatBeban.ts')
const identity=(id:string)=>({id,patientId:`self-${id}`})
const session=(id:string,loginAt=Date.now())=>{data.set('panaceamed.session.v1',JSON.stringify({account:identity(id),loginAt}));bindPersonalHealthAccount(identity(id))}
const row={id:'a',tanggal:new Date().toISOString().slice(0,10),gerakan:'Synthetic private A',set:[{ulangan:5,kg:100}]}
const legacy=JSON.stringify([row]);data.set('pmd_beban_v1',legacy)
session('a');assert.deepEqual(ambilSesi(),[],'unowned legacy is retained without adoption')
assert.equal(simpanSesi(row).length,1)
assert.deepEqual(simpanSesi({...row,id:''}),[row],'invalid identity must not be optimistically stored')
session('b');assert.deepEqual(ambilSesi(),[],'B cannot read A')
assert.equal(simpanSesi({...row,id:'b',gerakan:'Synthetic B'}).length,1)
session('a');assert.deepEqual(ambilSesi(),[row])
const before=new Map(data)
data.set('panaceamed.session.v1',JSON.stringify({account:identity('b'),loginAt:Date.now()}))
assert.deepEqual(ambilSesi(),[],'mounted A cannot read B from another tab')
assert.deepEqual(simpanSesi({...row,id:'stale'}),[])
assert.deepEqual(hapusSesi('b'),[])
for(const [key,value] of before)if(key!=='panaceamed.session.v1')assert.equal(data.get(key),value,'stale callbacks cannot change caches')
session('a');blocked=true;assert.deepEqual(simpanSesi({...row,id:'quota'}),[row],'quota failure cannot invent a persisted row');assert.deepEqual(hapusSesi('a'),[row]);blocked=false
session('a',Date.now()-8*86400000);assert.deepEqual(ambilSesi(),[]);assert.deepEqual(simpanSesi(row),[])
session('a',Date.now()+60000);assert.deepEqual(ambilSesi(),[])
data.delete('panaceamed.session.v1');bindPersonalHealthAccount(null);assert.deepEqual(ambilSesi(),[]);assert.deepEqual(simpanSesi(row),[])
assert.equal(data.get('pmd_beban_v1'),legacy)
session('a');assert.deepEqual(ambilSesi(),[row]);assert.deepEqual(hapusSesi('a'),[])
const scopedKey='pmd_beban_v1:scope_v1:'+encodeURIComponent(JSON.stringify(['a','self-a']))
data.set(scopedKey,JSON.stringify([{...row,tanggal:'2026-10-13'}]))
assert.equal(ambilSesi()[0]?.tanggal,'2026-10-13','owned date-only history is retained when the current timezone differs')
const oldTimezone=process.env.TZ
for(const invalidClock of [null,undefined,'2026-10-13',true,Infinity,NaN]) {
  assert.match(alasanSesiDitolak(row,invalidClock as any)!,/date/)
  assert.deepEqual(volumeMingguan([row],8,invalidClock===undefined?NaN:invalidClock as any),[])
}
try {
  process.env.TZ='Asia/Jakarta'
  const now=Date.UTC(2026,9,12,20)
  assert.equal(alasanSesiDitolak({...row,tanggal:'2026-10-13'},now),null,'local today after midnight is not a future UTC day')
  assert.match(alasanSesiDitolak({...row,tanggal:'2026-10-14'},now)!,/future/)
  const jakarta=volumeMingguan([{...row,tanggal:'2026-10-13'},{...row,id:'future',tanggal:'2026-10-14'}],8,now)
  assert.equal(jakarta.at(-1)!.volume,500,'local today must appear in its calendar-week bucket; tomorrow cannot')
  assert.equal(jakarta.at(-1)!.mulai,'2026-10-07')
  process.env.TZ='America/Los_Angeles'
  const earlyUtc=Date.UTC(2026,9,13,1)
  assert.equal(alasanSesiDitolak({...row,tanggal:'2026-10-12'},earlyUtc),null)
  assert.match(alasanSesiDitolak({...row,tanggal:'2026-10-13'},earlyUtc)!,/future/,'UTC today cannot authorize tomorrow in the local calendar')
  const la=volumeMingguan([{...row,tanggal:'2026-10-12'},{...row,id:'future',tanggal:'2026-10-13'}],8,earlyUtc)
  assert.equal(la.at(-1)!.volume,500)
  assert.deepEqual(volumeMingguan([row],8,NaN),[])
  assert.match(alasanSesiDitolak(row,NaN)!,/date/)
} finally { if(oldTimezone===undefined)delete process.env.TZ;else process.env.TZ=oldTimezone }
console.log('Strength cache: two identities, legacy retention, stale reads/writes/deletes, expiry, guest and quota PASS')

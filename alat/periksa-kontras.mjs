// ─────────────────────────────────────────────────────────────────────────────
// Pemeriksa kontras — dijalankan di peramban sungguhan pada 390x844.
//
//   node alat/periksa-kontras.mjs
//   RUTE="/,/workout,/nutrition" node alat/periksa-kontras.mjs
//   TEMA=dark RUTE="/" node alat/periksa-kontras.mjs
//
// Berkas ini DISIMPAN KE REPOSITORI setelah dua kali membuktikan dirinya, dan
// kedua kali itu perlu dicatat sebab keduanya adalah cara alat semacam ini
// gagal secara diam-diam:
//
//   1. ELEMEN BERGRADIEN DILEWATI. Penelusur warnanya hanya bisa membaca latar
//      polos, jadi apa pun yang berlatar gradien dikecualikan agar tidak
//      melaporkan angka palsu. Akibatnya kartu Longevity Score — tinta gelap di
//      atas gradien hijau tua — lulus setiap pemeriksaan selama berbulan-bulan
//      sambil praktis tidak terbaca. Sekarang perhentian warna gradien diurai
//      dan yang dipakai yang PALING GELAP: tulisan harus terbaca di seluruh
//      bentangan gradien, bukan hanya di titik paling terangnya.
//
//   2. WARNA oklch() TIDAK DIKENALI. Tailwind v4 mengeluarkan warna dalam
//      bentuk oklch(), dan penelusur yang hanya mengenal rgba() membaca SETIAP
//      bidang berwarna sebagai "tidak ada latar", lalu jatuh ke warna halaman.
//      Setiap tulisan di atas bidang berwarna karena itu dinilai terhadap latar
//      yang keliru — dan hampir selalu lulus. Penguraiannya kini diserahkan
//      kepada peramban lewat kanvas 1x1, yang mengenal setiap bentuk warna CSS.
//
//   3. LATAR YANG DIGAMBAR OLEH SAUDARA KANDUNG TIDAK TERLIHAT. Penelusurnya
//      menaiki rantai INDUK. Keping saring di beranda menaruh pil hijaunya
//      sebagai elemen ABSOLUTE terpisah di belakang tombol, sehingga tombol
//      terbaca "tinta gelap di atas latar halaman gelap" (1,04:1) padahal di
//      layar ia gelap di atas hijau. Temuan berpola position:absolute di
//      belakang teks perlu dilihat sendiri sebelum diperbaiki — memperbaikinya
//      atas dasar angka justru merusak yang sudah benar.
//
// Pelajarannya berlaku lebih luas daripada berkas ini: alat pemeriksa yang
// MELEWATI hal yang tidak dipahaminya akan melaporkan nol kegagalan dengan
// penuh keyakinan. Yang dilewati harus dihitung dan disebutkan, bukan
// didiamkan.
// ─────────────────────────────────────────────────────────────────────────────

import pw from '/tmp/pw/node_modules/playwright-core/index.js'
const b = await pw.chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox']})
const ctx = await b.newContext({viewport:{width:390,height:844}, deviceScaleFactor:2, colorScheme:(process.env.TEMA==='dark'?'dark':'light')})
await ctx.addInitScript(() => { localStorage.setItem('panaceamed.session.v1', JSON.stringify({account:{email:'a@b.c',name:'U',role:'pasien',isSubscriber:true,loggedAt:new Date().toISOString()},loginAt:Date.now()})) })
const p = await ctx.newPage()
const AUDIT = () => {
  /* Warna diuraikan lewat KANVAS, bukan lewat regex rgba().
     Tailwind v4 mengeluarkan warna dalam bentuk oklch()/oklab(), dan penelusur
     yang hanya mengenali rgba() membaca SELURUH warna itu sebagai "tidak ada
     latar" — lalu jatuh ke warna halaman. Akibatnya tulisan di atas bidang
     berwarna dilaporkan lulus padahal tidak pernah benar-benar diperiksa.
     getImageData mengembalikan RGBA yang TIDAK dipremultiplikasi, jadi alfa
     dibaca dari salurannya sendiri dan tidak boleh diterapkan dua kali. */
  const kanvas = document.createElement('canvas'); kanvas.width = kanvas.height = 1
  const ktx = kanvas.getContext('2d', { willReadFrequently: true })
  const par = (c) => {
    if (!c || c === 'transparent' || c === 'none') return null
    ktx.clearRect(0, 0, 1, 1)
    try { ktx.fillStyle = c } catch { return null }
    ktx.fillRect(0, 0, 1, 1)
    const d = ktx.getImageData(0, 0, 1, 1).data
    const a = d[3] / 255
    if (a <= 0) return null
    return { r: d[0], g: d[1], b: d[2], a }
  }
  const over = (f,bg) => ({r:f.r*f.a+bg.r*(1-f.a), g:f.g*f.a+bg.g*(1-f.a), b:f.b*f.a+bg.b*(1-f.a), a:1})
  const lum = (c) => { const f=(v)=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b) }
  const cr = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m); return (x+0.05)/(y+0.05) }
  /* Perhentian warna di dalam sebuah gradien. Tanpa ini, elemen bergradien
     terpaksa dilewati seluruhnya — dan sebuah kartu bisa lulus setiap
     pemeriksaan sambil tetap gelap di atas gelap. */
  const stops = (img) => {
    if (!img || img === 'none') return []
    const out=[]
    const re=/rgba?\([^)]+\)|#[0-9a-f]{3,8}\b/gi
    let m
    while ((m = re.exec(img))) {
      const t=m[0]
      if (t[0]==='#') {
        let h=t.slice(1)
        if (h.length===3) h=h.split('').map(c=>c+c).join('')
        out.push({r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16),a:1})
      } else { const c=par(t); if (c) out.push(c) }
    }
    return out.filter(c=>c.a>0.15)
  }
  const bgOf = (el) => {
    const tumpuk=[]; let n=el
    while(n && n!==document.documentElement){
      const cs=getComputedStyle(n)
      const c=par(cs.backgroundColor); if(c&&c.a>0) tumpuk.push(c)
      /* Perhentian gradien ikut ditumpuk — yang dipakai perhentian PALING
         GELAP, sebab tulisan harus terbaca di seluruh bentangan gradien,
         bukan hanya di titik paling terangnya. */
      const g=stops(cs.backgroundImage)
      if (g.length) { g.sort((x,y)=>lum(x)-lum(y)); tumpuk.push({...g[0], a:1}) }
      n=n.parentElement
    }
    const gelap=document.documentElement.classList.contains('dark')
    tumpuk.push(gelap?{r:23,g:23,b:23,a:1}:{r:244,g:247,b:245,a:1})
    let acc=tumpuk[tumpuk.length-1]
    for(let i=tumpuk.length-2;i>=0;i--) acc=over(tumpuk[i],acc)
    return acc
  }
  const hasil=[]
  const dilewati={emoji:0, saudara:0}
  for (const el of document.querySelectorAll('body *')) {
    const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').trim()
    if(!t || t.length<2) continue
    // Emoji menggambar warnanya sendiri; cs.color tidak menentukan apa pun di
    // sana. Keping berisi emoji SAJA karena itu dilewati — tetapi dihitung dan
    // disebutkan di akhir, bukan didiamkan seperti dua kebutaan di atas.
    if(!/[\p{L}\p{N}]/u.test(t)) { dilewati.emoji++; continue }
    const r=el.getBoundingClientRect(); if(r.width<4||r.height<4) continue
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none'||+cs.opacity<0.15) continue
    const fg=par(cs.color); if(!fg) continue
    const bg=bgOf(el); const eff=over(fg,bg)
    const px=parseFloat(cs.fontSize); const w=+cs.fontWeight||400
    const besar = px>=24 || (px>=18.66 && w>=700)
    const rasio=cr(eff,bg); const ambang=besar?3:4.5
    if(rasio<ambang) hasil.push({t:t.slice(0,42), rasio:+rasio.toFixed(2), ambang, px:+px.toFixed(1), w,
      warna:cs.color, latar:`rgb(${bg.r|0},${bg.g|0},${bg.b|0})`, kelas:(el.className||'').toString().slice(0,90)})
  }
  return {hasil, dilewati}
}
const RUTE=(process.env.RUTE||'/,/vitals,/nutrition,/workout,/med-study,/settings').split(',')
for (const rute of RUTE) {
  await p.goto('http://127.0.0.1:4206/#'+rute, {waitUntil:'networkidle'}); await p.waitForTimeout(Number(process.env.TUNGGU||1800))
  for (let i=0;i<6;i++){const d=p.locator('[role="dialog"]'); if(!(await d.count()))break; const btn=d.first().locator('button'); const n=await btn.count(); if(!n)break; await btn.nth(n-1).click({force:true}).catch(()=>{}); await p.waitForTimeout(500)}
  await p.waitForTimeout(Number(process.env.TUNGGU2||1200))
  const {hasil:h, dilewati} = await p.evaluate(AUDIT)
  const uniq=[...new Map(h.map(x=>[x.kelas+'|'+x.warna+'|'+x.latar,x])).values()].sort((a,b)=>a.rasio-b.rasio)
  console.log('\n### '+rute+'  gagal:'+h.length+' pola:'+uniq.length+'  dilewati(emoji):'+dilewati.emoji)
  for (const u of uniq.slice(0,12)) console.log(`  ${u.rasio}/${u.ambang} ${u.px}px w${u.w} ${u.warna} on ${u.latar} :: ${u.t} :: ${u.kelas}`)
}
await b.close()

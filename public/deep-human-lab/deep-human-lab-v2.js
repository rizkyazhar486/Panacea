/* PanaceaMed Deep Human Lab v2
 * Visual, educational, in-silico research sandbox.
 * No biological sequence generation, pathogen engineering, wet-lab protocol,
 * autonomous diagnosis, treatment selection, or bedside deployment.
 */
(() => {
  'use strict'

  const $ = (s, root = document) => root.querySelector(s)
  const $$ = (s, root = document) => [...root.querySelectorAll(s)]
  const clamp = (x, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x))
  const n = (id) => Number($('#' + id)?.value ?? 0)
  const pct = (v) => `${Math.round(clamp(v))}%`
  const lerp = (a, b, t) => a + (b - a) * t

  const state = {
    neuro: {}, endurance: {}, gut: {}, molecule: {}, immune: {}, evidence: {},
    t: 0, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  }

  function setupCanvas(canvas, cssHeight) {
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const w = Math.max(1, Math.round(rect.width * dpr))
    const h = Math.max(1, Math.round((cssHeight || rect.height) * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    return { ctx, w: rect.width, h: cssHeight || rect.height, dpr }
  }

  function rangeBindings(root = document) {
    $$('input[type="range"][data-output]', root).forEach((el) => {
      const out = $('#' + el.dataset.output)
      const format = () => {
        const unit = el.dataset.unit || ''
        const digits = Number(el.dataset.digits || 0)
        if (out) out.textContent = `${Number(el.value).toFixed(digits)}${unit}`
      }
      el.addEventListener('input', () => { format(); updateAll() })
      format()
    })
  }

  function toast(message) {
    const el = $('#dhlToast')
    if (!el) return
    el.textContent = message
    el.classList.add('is-show')
    clearTimeout(toast.timer)
    toast.timer = setTimeout(() => el.classList.remove('is-show'), 2200)
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1) Neurocognitive / consciousness theatre
  // These are transparent heuristic state variables, not diagnostic scores.
  // ────────────────────────────────────────────────────────────────────────────
  function computeNeuro() {
    const attention = n('attention')
    const arousal = n('arousal')
    const valence = n('valence')
    const stress = n('stress')
    const sleep = n('sleep')
    const reward = n('reward')
    const inflammation = n('inflammation')
    const interoception = n('interoception')
    const social = n('social')
    const regulation = n('regulation')

    const arousalFit = 100 - Math.abs(arousal - 58) * 1.35
    const focus = clamp(.30 * attention + .19 * sleep + .17 * regulation + .15 * arousalFit + .10 * reward + .09 * (100 - stress))
    const impulse = clamp(.28 * reward + .24 * arousal + .22 * stress + .12 * (100 - regulation) + .08 * inflammation + .06 * (100 - sleep))
    const resilience = clamp(.25 * sleep + .24 * regulation + .18 * social + .14 * attention + .11 * (100 - inflammation) + .08 * (100 - stress))
    const recovery = clamp(.31 * sleep + .24 * (100 - stress) + .18 * (100 - inflammation) + .15 * regulation + .12 * interoception)
    const trust = clamp(.34 * social + .18 * valence + .18 * regulation + .14 * (100 - stress) + .10 * sleep + .06 * interoception)
    const witness = clamp(.29 * attention + .24 * interoception + .23 * regulation + .14 * sleep + .10 * (100 - stress))
    const threat = clamp(.38 * stress + .23 * inflammation + .18 * (100 - valence) + .12 * arousal + .09 * (100 - social))
    const rumination = clamp(.32 * stress + .21 * (100 - regulation) + .17 * (100 - valence) + .15 * (100 - sleep) + .15 * attention)

    state.neuro = { attention, arousal, valence, stress, sleep, reward, inflammation, interoception, social, regulation, focus, impulse, resilience, recovery, trust, witness, threat, rumination }
    setMetric('focusMetric', focus)
    setMetric('impulseMetric', impulse)
    setMetric('resilienceMetric', resilience)
    setMetric('witnessMetric', witness)
    setMetric('trustMetric', trust)
    setMetric('recoveryMetric', recovery)

    const mode = focus > 72 && stress < 42 ? 'stable focus' :
      threat > 67 ? 'threat-biased processing' :
      rumination > 63 ? 'ruminative loop' :
      impulse > 65 ? 'high action bias' :
      recovery < 38 ? 'low reserve' : 'mixed adaptive state'
    const label = $('#neuroStateLabel')
    if (label) label.textContent = mode

    const observer = $('#observerRing')
    if (observer) {
      observer.setAttribute('opacity', String(.12 + witness / 120))
      observer.setAttribute('stroke-width', String(1.2 + witness / 45))
    }
    updateBrainNetwork()
    drawAffect()
  }

  function setMetric(id, value, digits = 0) {
    const root = $('#' + id)
    if (!root) return
    const b = $('b', root), meter = $('i', root)
    if (b) b.textContent = `${Number(value).toFixed(digits)}`
    if (meter) meter.style.setProperty('--v', pct(value))
  }

  function updateBrainNetwork() {
    const s = state.neuro
    const activations = {
      dmn: clamp(.48 * s.rumination + .26 * (100 - s.attention) + .26 * (100 - s.arousal)),
      cen: clamp(.55 * s.focus + .25 * s.regulation + .20 * s.attention),
      sn: clamp(.40 * s.arousal + .32 * s.threat + .28 * s.interoception),
      limbic: clamp(.38 * s.threat + .28 * Math.abs(s.valence - 50) * 2 + .20 * s.arousal + .14 * s.reward),
      thalamus: clamp(.45 * s.arousal + .25 * s.attention + .15 * s.interoception + .15 * (100 - s.sleep)),
      striatum: clamp(.52 * s.reward + .28 * s.impulse + .20 * s.arousal),
      pfc: clamp(.46 * s.regulation + .34 * s.focus + .20 * s.sleep),
      insula: clamp(.56 * s.interoception + .24 * s.threat + .20 * s.arousal),
    }
    Object.entries(activations).forEach(([id, value]) => {
      const g = $(`#net-${id}`)
      if (!g) return
      g.style.opacity = String(.34 + value / 150)
      g.classList.toggle('is-hot', value > 68)
      g.style.color = value > 70 ? '#63eaff' : '#9878ff'
      const circle = $('circle', g)
      if (circle) circle.setAttribute('r', String(13 + value / 28))
    })
    const edges = $$('.dhl-edge')
    edges.forEach((edge, i) => {
      const coherence = clamp((s.focus + s.regulation + s.witness) / 3)
      edge.style.strokeOpacity = String(.10 + coherence / 185)
      edge.style.strokeWidth = String(1 + coherence / 80 + (i % 3) * .12)
    })
  }

  function drawAffect() {
    const canvas = $('#affectCanvas')
    const c = setupCanvas(canvas, 330)
    if (!c) return
    const { ctx, w, h } = c
    const s = state.neuro
    ctx.clearRect(0, 0, w, h)
    const grad = ctx.createRadialGradient(w*.5,h*.5,20,w*.5,h*.5,Math.max(w,h)*.55)
    grad.addColorStop(0,'rgba(110,95,255,.12)');grad.addColorStop(1,'rgba(3,7,14,0)')
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h)
    ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=1
    ctx.beginPath();ctx.moveTo(w/2,24);ctx.lineTo(w/2,h-24);ctx.moveTo(24,h/2);ctx.lineTo(w-24,h/2);ctx.stroke()

    const regions = [
      ['calm trust',.72,.36,52,'rgba(72,244,183,.12)'],
      ['love / attachment',.76,.55,62,'rgba(255,92,202,.11)'],
      ['focused drive',.68,.72,50,'rgba(83,220,255,.13)'],
      ['threat / fear',.26,.78,58,'rgba(255,92,126,.12)'],
      ['grief / withdrawal',.30,.30,55,'rgba(102,127,255,.12)'],
      ['neutral witness',.52,.46,44,'rgba(255,255,255,.06)'],
    ]
    regions.forEach(([label,xn,yn,r,color])=>{
      ctx.beginPath();ctx.arc(w*xn,h*(1-yn),r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()
      ctx.fillStyle='rgba(180,198,220,.55)';ctx.font='9px Inter, sans-serif';ctx.textAlign='center';ctx.fillText(label,w*xn,h*(1-yn)+3)
    })

    const x = 24 + (w-48)*(s.valence/100)
    const y = h-24 - (h-48)*(s.arousal/100)
    const dominance = clamp((s.regulation + s.witness + s.social)/3)
    const rr = 7 + dominance/10
    const glow = ctx.createRadialGradient(x,y,0,x,y,rr*2.8)
    glow.addColorStop(0,'rgba(255,255,255,.95)');glow.addColorStop(.25,'rgba(86,225,255,.75)');glow.addColorStop(1,'rgba(151,99,255,0)')
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,rr*2.8,0,Math.PI*2);ctx.fill()
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,4.2,0,Math.PI*2);ctx.fill()
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2) Endurance & recovery digital-twin proxy
  // CP/W' is a pedagogic model; outputs are not exercise prescriptions.
  // ────────────────────────────────────────────────────────────────────────────
  function computeEndurance() {
    const intensity = n('intensity')
    const duration = n('duration')
    const sleep = n('endSleep')
    const fueling = n('fueling')
    const hydration = n('hydration')
    const heat = n('heat')
    const training = n('training')
    const stress = state.neuro.stress || 50

    const cp = 46 + training * .42
    const excess = Math.max(0, intensity - cp)
    const wPrime0 = 100
    const depletion = clamp(excess * duration * .055)
    const wPrime = clamp(wPrime0 - depletion)
    const glycogen = clamp(100 - intensity * duration * .0042 + fueling * .24)
    const thermal = clamp(18 + heat * .66 + intensity * .22 - hydration * .15)
    const autonomic = clamp(100 - intensity * .36 - duration * .08 - stress * .18 + sleep * .26)
    const recovery = clamp(.26*sleep + .20*fueling + .17*hydration + .16*training + .13*(100-thermal) + .08*(100-stress))
    const fatigue = clamp(.34*(100-wPrime)+.24*(100-glycogen)+.21*thermal+.21*(100-autonomic))
    const gutPerfusion = clamp(100 - intensity*.46 - heat*.16 + hydration*.18)
    const brainReserve = clamp(.42*autonomic + .28*sleep + .18*(100-fatigue)+.12*fueling)

    state.endurance={intensity,duration,sleep,fueling,hydration,heat,training,cp,wPrime,glycogen,thermal,autonomic,recovery,fatigue,gutPerfusion,brainReserve}
    setMetric('wPrimeMetric',wPrime)
    setMetric('glycogenMetric',glycogen)
    setMetric('autonomicMetric',autonomic)
    setMetric('brainReserveMetric',brainReserve)
    setMetric('endRecoveryMetric',recovery)
    setMetric('fatigueMetric',fatigue)

    const organs={brain:brainReserve,heart:autonomic,lungs:clamp(100-intensity*.22+training*.20),muscle:wPrime,gut:gutPerfusion,immune:clamp(100-thermal*.25-stress*.16+sleep*.28)}
    Object.entries(organs).forEach(([id,v])=>{
      const el=$('#organ-'+id); if(!el)return
      el.style.opacity=String(.35+v/150)
      el.style.filter=`drop-shadow(0 0 ${4+v/12}px rgba(88,220,255,${.06+v/600}))`
    })
    drawEnduranceTimeline()
  }

  function drawEnduranceTimeline(){
    const canvas=$('#enduranceCanvas'); const c=setupCanvas(canvas,180); if(!c)return
    const {ctx,w,h}=c, s=state.endurance
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#050914';ctx.fillRect(0,0,w,h)
    const pad=24;ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1
    for(let i=0;i<4;i++){const y=pad+(h-pad*2)*i/3;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke()}
    const series=(fn,color)=>{ctx.beginPath();for(let i=0;i<=120;i++){const t=i/120;const x=pad+(w-pad*2)*t;const y=h-pad-(h-pad*2)*clamp(fn(t))/100;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()}
    series(t=>100-(100-s.wPrime)*t,'rgba(90,230,255,.95)')
    series(t=>100-(100-s.glycogen)*Math.pow(t,.8),'rgba(157,117,255,.9)')
    series(t=>100-(100-s.autonomic)*Math.pow(t,1.25),'rgba(255,95,210,.82)')
    ctx.font='9px Inter,sans-serif';ctx.fillStyle='#8291a5';ctx.fillText('reserve',6,13);ctx.fillText('session time',w-73,h-7)
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3) Gut-brain-immune systems map
  // ────────────────────────────────────────────────────────────────────────────
  function computeGut(){
    const fiber=n('fiber'), sleep=n('gutSleep'), stress=n('gutStress'), diversity=n('diversity'), barrier=n('barrier'), activity=n('activity')
    const scfa=clamp(.36*fiber+.31*diversity+.19*activity+.14*(100-stress))
    const inflammatory=clamp(.34*(100-barrier)+.27*stress+.18*(100-sleep)+.12*(100-diversity)+.09*(100-activity))
    const vagal=clamp(.28*activity+.25*sleep+.21*(100-stress)+.14*barrier+.12*diversity)
    const cognitive=clamp(.30*sleep+.23*vagal+.18*(100-inflammatory)+.16*state.neuro.attention+.13*state.neuro.regulation)
    state.gut={fiber,sleep,stress,diversity,barrier,activity,scfa,inflammatory,vagal,cognitive}
    setMetric('scfaMetric',scfa);setMetric('inflammationMetric',inflammatory);setMetric('vagalMetric',vagal);setMetric('gutCognitionMetric',cognitive)
    const gut=$('#gutGlow'),brain=$('#gutBrainGlow'),immune=$('#gutImmuneGlow')
    if(gut)gut.setAttribute('opacity',String(.2+scfa/130))
    if(brain)brain.setAttribute('opacity',String(.2+cognitive/130))
    if(immune)immune.setAttribute('opacity',String(.2+inflammatory/130))
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4) Molecule-to-mind conceptual PK/PD sandbox
  // Safe: abstract receptor/exposure parameters only. No compound generation.
  // ────────────────────────────────────────────────────────────────────────────
  function computeMolecule(){
    const affinity=n('affinity'), selectivity=n('selectivity'), exposure=n('exposure'), halfLife=n('halfLife'), bbb=n('bbb'), efficacy=n('efficacy')
    const kd=Math.max(.01,101-affinity)
    const c=Math.max(.01,exposure)
    const occupancy=clamp(100*c/(c+kd))
    const effect=clamp(occupancy*(efficacy/100))
    const cns=clamp(effect*(bbb/100))
    const offTarget=clamp(effect*(100-selectivity)/100)
    const confidence=clamp(.30*selectivity+.22*affinity+.18*(100-offTarget)+.15*bbb+.15*efficacy)
    state.molecule={affinity,selectivity,exposure,halfLife,bbb,efficacy,kd,c,occupancy,effect,cns,offTarget,confidence}
    setMetric('occupancyMetric',occupancy);setMetric('effectMetric',effect);setMetric('cnsMetric',cns);setMetric('offTargetMetric',offTarget)
    const ligand=$('#conceptLigand');if(ligand)ligand.style.setProperty('--bind-speed',`${lerp(5.2,1.6,affinity/100)}s`)
    drawMolecule();drawPK()
  }

  function drawMolecule(){
    const canvas=$('#moleculeCanvas');const c=setupCanvas(canvas,380);if(!c)return
    const {ctx,w,h}=c,s=state.molecule;ctx.clearRect(0,0,w,h)
    const cx=w/2,cy=h/2,t=state.t*.00035
    const nodes=[[-88,-18,13],[-48,-70,10],[6,-82,12],[58,-52,11],[88,2,13],[52,58,11],[-3,78,12],[-58,52,10],[0,-5,17]]
    const transformed=nodes.map(([x,y,r],i)=>{const a=t+i*.07;const xr=x*Math.cos(a)-y*Math.sin(a);const yr=(x*Math.sin(a)+y*Math.cos(a))*.55;return[cx+xr,cy+yr,r]})
    const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[0,8],[2,8],[4,8],[6,8]]
    edges.forEach(([a,b])=>{ctx.beginPath();ctx.moveTo(transformed[a][0],transformed[a][1]);ctx.lineTo(transformed[b][0],transformed[b][1]);ctx.strokeStyle='rgba(113,212,255,.24)';ctx.lineWidth=2;ctx.stroke()})
    transformed.forEach(([x,y,r],i)=>{const g=ctx.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r*1.8);g.addColorStop(0,'#fff');g.addColorStop(.25,i===8?'#ffd28a':'#63e5ff');g.addColorStop(.65,i%2?'#8b73ff':'#ff67d2');g.addColorStop(1,'rgba(40,35,110,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r*1.8,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(240,251,255,.88)';ctx.beginPath();ctx.arc(x,y,r*.46,0,Math.PI*2);ctx.fill()})
    ctx.fillStyle='rgba(162,178,200,.62)';ctx.font='9px Inter,sans-serif';ctx.textAlign='center';ctx.fillText('abstract ligand topology — not a chemical structure',cx,h-20)
  }

  function drawPK(){
    const canvas=$('#pkCanvas');const c=setupCanvas(canvas,180);if(!c)return
    const {ctx,w,h}=c,s=state.molecule;ctx.clearRect(0,0,w,h);ctx.fillStyle='#050914';ctx.fillRect(0,0,w,h)
    const pad=22,k=Math.log(2)/Math.max(.5,s.halfLife),c0=s.exposure
    const pts=[];for(let i=0;i<=100;i++){const hr=i/100*24;const conc=c0*Math.exp(-k*hr);const occ=100*conc/(conc+s.kd);pts.push([hr,conc,occ])}
    const maxC=Math.max(1,c0);const line=(idx,color,scale)=>{ctx.beginPath();pts.forEach((p,i)=>{const x=pad+(w-pad*2)*p[0]/24;const y=h-pad-(h-pad*2)*clamp(p[idx]/scale*100)/100;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()}
    line(1,'rgba(88,220,255,.95)',maxC);line(2,'rgba(255,95,210,.85)',100)
    ctx.fillStyle='#8291a5';ctx.font='8px Inter,sans-serif';ctx.fillText('exposure',5,12);ctx.fillText('24 h',w-38,h-6)
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5) Vaccine immunodynamics — non-operational immune-response model.
  // No sequences, constructs, culture, delivery recipes, or pathogen engineering.
  // ────────────────────────────────────────────────────────────────────────────
  function computeImmune(){
    const priming=n('priming'), innate=n('innate'), match=n('populationMatch'), memory=n('memorySupport'), baseline=n('baselineImmune'), tolerance=n('tolerance')
    const presentation=clamp(.36*priming+.28*innate+.20*baseline+.16*match)
    const antibody=clamp(.32*presentation+.28*memory+.18*match+.12*baseline+.10*tolerance)
    const cellular=clamp(.36*presentation+.27*baseline+.21*memory+.16*innate)
    const reactogenic=clamp(.52*innate+.22*priming+.14*(100-tolerance)+.12*(100-baseline))
    const durability=clamp(.42*memory+.24*cellular+.18*antibody+.16*baseline)
    const confidence=clamp(.28*match+.24*tolerance+.18*baseline+.16*durability+.14*(100-reactogenic))
    state.immune={priming,innate,match,memory,baseline,tolerance,presentation,antibody,cellular,reactogenic,durability,confidence}
    setMetric('presentationMetric',presentation);setMetric('antibodyMetric',antibody);setMetric('cellularMetric',cellular);setMetric('durabilityMetric',durability);setMetric('reactogenicMetric',reactogenic)
    drawImmune()
  }

  function drawImmune(){
    const canvas=$('#immuneCanvas');const c=setupCanvas(canvas,390);if(!c)return
    const {ctx,w,h}=c,s=state.immune;ctx.clearRect(0,0,w,h);ctx.fillStyle='#050914';ctx.fillRect(0,0,w,h)
    const t=state.t*.00035
    for(let i=0;i<28;i++){
      const a=i*2.399+t*(.3+(i%4)*.04),rad=38+(i%7)*19
      const x=w*.5+Math.cos(a)*rad*(w/480),y=h*.48+Math.sin(a)*rad*.72
      const type=i%4;const color=type===0?'rgba(88,220,255,.78)':type===1?'rgba(157,117,255,.72)':type===2?'rgba(255,95,210,.65)':'rgba(67,245,166,.68)'
      const r=4+(i%5)*1.15;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()
    }
    const cy=h*.48,cx=w*.5,rr=38+s.presentation*.18
    const g=ctx.createRadialGradient(cx,cy,3,cx,cy,rr);g.addColorStop(0,'rgba(255,255,255,.92)');g.addColorStop(.18,'rgba(255,210,138,.75)');g.addColorStop(.55,'rgba(255,95,210,.24)');g.addColorStop(1,'rgba(255,95,210,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);ctx.fill()
    // non-operational antibody/memory response curves
    const yBase=h-48;ctx.strokeStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.moveTo(24,yBase);ctx.lineTo(w-24,yBase);ctx.stroke()
    const curve=(peak,delay,color)=>{ctx.beginPath();for(let i=0;i<=100;i++){const x=24+(w-48)*i/100;const u=i/100*8;const val=peak*(1-Math.exp(-Math.max(0,u-delay)*1.3))*Math.exp(-Math.max(0,u-delay)*.12);const y=yBase-val*.54;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()}
    curve(s.antibody*.65,.7,'rgba(88,220,255,.95)');curve(s.cellular*.58,1.05,'rgba(157,117,255,.88)')
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 6) Evidence & translational gate
  // ────────────────────────────────────────────────────────────────────────────
  function computeEvidence(){
    const data=n('dataQuality'), replication=n('replication'), calibration=n('calibration'), explainability=n('explainability'), external=n('externalValidation'), oversight=n('humanOversight')
    const trust=clamp(.20*data+.18*replication+.17*calibration+.15*explainability+.17*external+.13*oversight)
    const readiness=clamp(.26*external+.22*replication+.18*data+.16*calibration+.10*oversight+.08*explainability)
    state.evidence={data,replication,calibration,explainability,external,oversight,trust,readiness}
    const ring=$('#trustRing');if(ring)ring.style.setProperty('--trust',String(trust))
    const score=$('#trustScore');if(score)score.textContent=Math.round(trust)
    setMetric('readinessMetric',readiness)
    const gate=$('#translationGate')
    if(gate) gate.textContent = readiness >= 82 ? 'eligible for governed translational review' : readiness >= 64 ? 'evidence-building stage' : 'research / simulation only'
  }

  // ────────────────────────────────────────────────────────────────────────────
  // High-DPI visual animation
  // ────────────────────────────────────────────────────────────────────────────
  function animate(ts){
    state.t=ts
    if(!state.reducedMotion){
      animateBrainPulse(ts)
      drawMolecule()
      drawImmune()
    }
    requestAnimationFrame(animate)
  }

  function animateBrainPulse(ts){
    const svg=$('#brainSvg');if(!svg)return
    const pulses=$$('.dhl-pulse',svg)
    const paths=$$('.dhl-edge[data-x1]',svg)
    pulses.forEach((p,i)=>{
      const path=paths[i%paths.length];if(!path)return
      const u=((ts*.00008*(1+(i%3)*.22)+i*.17)%1)
      const x=lerp(Number(path.dataset.x1),Number(path.dataset.x2),u)
      const y=lerp(Number(path.dataset.y1),Number(path.dataset.y2),u)
      p.setAttribute('cx',x);p.setAttribute('cy',y);p.setAttribute('opacity',String(.25+state.neuro.focus/135))
    })
  }

  function updateAll(){
    computeNeuro();computeEndurance();computeGut();computeMolecule();computeImmune();computeEvidence()
  }

  function preset(name){
    const presets={
      still:{attention:78,arousal:45,valence:64,stress:24,sleep:82,reward:48,inflammation:20,interoception:82,social:68,regulation:84},
      focus:{attention:90,arousal:62,valence:66,stress:32,sleep:80,reward:73,inflammation:18,interoception:66,social:58,regulation:88},
      threat:{attention:58,arousal:90,valence:20,stress:90,sleep:34,reward:42,inflammation:62,interoception:72,social:28,regulation:28},
      recovery:{attention:64,arousal:34,valence:70,stress:18,sleep:94,reward:46,inflammation:14,interoception:78,social:74,regulation:78},
      endurance:{attention:76,arousal:72,valence:72,stress:38,sleep:82,reward:78,inflammation:26,interoception:70,social:62,regulation:80},
    }
    const p=presets[name];if(!p)return
    Object.entries(p).forEach(([id,v])=>{const el=$('#'+id);if(el)el.value=v})
    rangeBindingsRefresh();updateAll();toast(`State preset: ${name}`)
  }

  function rangeBindingsRefresh(){
    $$('input[type="range"][data-output]').forEach(el=>{
      const out=$('#'+el.dataset.output);if(out)out.textContent=`${Number(el.value).toFixed(Number(el.dataset.digits||0))}${el.dataset.unit||''}`
    })
  }

  function exportState(){
    const payload={
      artifact:'PanaceaMed Deep Human Lab simulation state',
      generatedAt:new Date().toISOString(),
      disclaimer:'Educational/research simulation only; not a clinical recommendation or biological engineering protocol.',
      neuro:state.neuro,endurance:state.endurance,gut:state.gut,molecule:state.molecule,immune:state.immune,evidence:state.evidence,
      formulas:{
        receptorOccupancy:'theta = C/(C + Kd)',
        oneCompartmentPK:'C(t) = C0 * exp(-k t), k = ln(2)/t1/2',
        rewardPredictionError:'delta_t = r_t + gamma V(s_t+1) - V(s_t)',
        criticalPowerConcept:'dWprime/dt = -(P-CP) when P > CP',
      }
    }
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`panaceamed-deep-human-state-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
    toast('Simulation state exported with assumptions and disclaimer')
  }

  async function copyMethods(){
    const s=state
    const text=`PanaceaMed Deep Human Lab — Methods snapshot\n\nNeurocognitive layer: heuristic latent-state visualization using attention, arousal, valence, stress, sleep sufficiency, reward drive, inflammation proxy, interoceptive clarity, social safety and regulatory control. Outputs are explanatory state variables, not validated diagnostic scores.\n\nEndurance layer: pedagogic critical-power/W′-style reserve model coupled to glycogen, thermal strain, autonomic reserve and recovery proxies.\n\nMolecule layer: abstract one-compartment PK and receptor-occupancy/Emax-style relationships. No molecular generation is performed.\n\nImmune layer: abstract antigen-presentation, humoral, cellular-memory and tolerability response visualization. No sequence design, pathogen engineering, construct optimization or wet-lab protocol is produced.\n\nEvidence layer: Trust = 0.20 data quality + 0.18 replication + 0.17 calibration + 0.15 explainability + 0.17 external validation + 0.13 human oversight.\n\nCurrent trust score: ${Math.round(s.evidence.trust||0)}/100.`
    try{await navigator.clipboard.writeText(text);toast('Methods snapshot copied')}catch{toast('Clipboard unavailable on this browser')}
  }

  function wire(){
    rangeBindings()
    $$('[data-preset]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.preset)))
    $('#exportState')?.addEventListener('click',exportState)
    $('#copyMethods')?.addEventListener('click',copyMethods)
    $('#resetLab')?.addEventListener('click',()=>location.reload())
    $$('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:state.reducedMotion?'auto':'smooth',block:'start'})))
    window.addEventListener('resize',()=>{drawAffect();drawEnduranceTimeline();drawMolecule();drawPK();drawImmune()},{passive:true})
    updateAll()
    requestAnimationFrame(animate)
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire);else wire()
})()

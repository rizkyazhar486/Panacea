(() => {
  'use strict'

  /*
   * Panaceamed Feature Spectrum v48
   * --------------------------------
   * Ten palette families synthesized from the 10 visual references supplied
   * on 2026-09-16. The system does not repaint the whole product. It gives
   * every feature a stable identity while keeping the shell neutral:
   *   neutral canvas ~72% + feature hue ~20% + emissive highlight ~8%.
   *
   * The exact route decides the family. A deterministic hash then rotates the
   * accent roles inside that family so sibling features are distinguishable
   * without becoming a random rainbow.
   */

  const PALETTES = {
    astralChrome: {
      id: 'astral-chrome',
      name: 'Astral Chrome',
      base: '#181512',
      accents: ['#D9DEE2', '#22517A', '#917E66', '#A09B98'],
      metal: '#D9DEE2',
    },
    auroraSky: {
      id: 'aurora-sky',
      name: 'Aurora Sky',
      base: '#295489',
      accents: ['#84B4CF', '#F4B183', '#DC8773', '#A895B3'],
      metal: '#EEC2AC',
    },
    emberSingularity: {
      id: 'ember-singularity',
      name: 'Ember Singularity',
      base: '#120F12',
      accents: ['#9D7258', '#6C4539', '#D4C4B4', '#3B2A26'],
      metal: '#D4C4B4',
    },
    crimsonWeb: {
      id: 'crimson-web',
      name: 'Crimson Web',
      base: '#1A1819',
      accents: ['#AD3F34', '#881416', '#12363F', '#9D9990'],
      metal: '#9D9990',
    },
    imperialIvory: {
      id: 'imperial-ivory',
      name: 'Imperial Ivory',
      base: '#25221D',
      accents: ['#E9E5DE', '#A09281', '#92816B', '#DACBB5'],
      metal: '#E9E5DE',
    },
    glacialChrome: {
      id: 'glacial-chrome',
      name: 'Glacial Chrome',
      base: '#345161',
      accents: ['#D7E0E2', '#9CAEB6', '#6C818C', '#C1CBD0'],
      metal: '#D7E0E2',
    },
    shadowTeal: {
      id: 'shadow-teal',
      name: 'Shadow Teal',
      base: '#101513',
      accents: ['#4B756F', '#2B5B5A', '#43C8B9', '#183533'],
      metal: '#8ED8CE',
    },
    prismaticSentinel: {
      id: 'prismatic-sentinel',
      name: 'Prismatic Sentinel',
      base: '#100C14',
      accents: ['#DBE5DD', '#335CA1', '#8B191D', '#808595'],
      metal: '#F4F7F6',
    },
    noirHalo: {
      id: 'noir-halo',
      name: 'Noir Halo',
      base: '#010101',
      accents: ['#C7A85B', '#C3C1B9', '#88877F', '#383832'],
      metal: '#D6C37A',
    },
    cosmicViolet: {
      id: 'cosmic-violet',
      name: 'Cosmic Violet',
      base: '#161436',
      accents: ['#835B92', '#453A70', '#AF77A6', '#E6A9AE'],
      metal: '#D3B0C5',
    },
  }

  const GROUP_RULES = [
    {
      palette: PALETTES.cosmicViolet,
      test: /(body[- ]?explorer|genome|frontier|discovery|invention|innovation|anatom|atlas|molecular|dna|organ|body exposure)/i,
    },
    {
      palette: PALETTES.shadowTeal,
      test: /(nutrition|longevity|wellness|biological[- ]?age|life[- ]?compass|mind|meditation|habit|metabolic|healthy aging)/i,
    },
    {
      palette: PALETTES.glacialChrome,
      test: /(recovery|sleep|radiology|health[- ]?data|your numbers|body signals|vitapulse|imaging|ct|mri|ultrasound)/i,
    },
    {
      palette: PALETTES.emberSingularity,
      test: /(emergency|sos|urgent|critical|crisis|trauma|resusc|warning|alert)/i,
    },
    {
      palette: PALETTES.crimsonWeb,
      test: /(clinical|drug|calculator|labs?|evidence|electrophysiology|arrhythm|heart|cardio|medical records?|emr|diagnos|triage)/i,
    },
    {
      palette: PALETTES.imperialIvory,
      test: /(med[- ]?study|knowledge|education|osce|ukmppd|library|tutorial|curriculum|learn|look up|study)/i,
    },
    {
      palette: PALETTES.auroraSky,
      test: /(latihan|training|workout|fitness|move|run|sport|exercise|performance|vo2|max aerobic)/i,
    },
    {
      palette: PALETTES.prismaticSentinel,
      test: /(chat|message|assistant|copilot|ai[- ]|ai |ask panacea|agent|conversation)/i,
    },
    {
      palette: PALETTES.noirHalo,
      test: /(settings|profile|account|admin|owner|verification|legal|security|privacy|finance|keuangan|wallet|manage|billing)/i,
    },
  ]

  const INTERNAL_ORIGIN = window.location.origin
  const ROOT = document.documentElement
  let raf = 0

  function hexToRgb(hex) {
    const clean = hex.replace('#', '')
    const n = Number.parseInt(clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }

  function rgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  function hash(text) {
    let h = 2166136261
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  function cleanHref(raw) {
    if (!raw) return ''
    try {
      const u = new URL(raw, INTERNAL_ORIGIN)
      return u.origin === INTERNAL_ORIGIN ? `${u.pathname}${u.search}${u.hash}` : ''
    } catch {
      return ''
    }
  }

  function choosePalette(identity) {
    const source = decodeURIComponent(String(identity || '')).replace(/[?&#/_-]+/g, ' ')
    for (const rule of GROUP_RULES) {
      if (rule.test.test(source)) return rule.palette
    }
    return PALETTES.astralChrome
  }

  function tokensFor(palette, identity) {
    const h = hash(String(identity || palette.id))
    const accents = palette.accents
    const primary = accents[h % accents.length]
    const secondary = accents[(h + 1 + ((h >>> 5) % (accents.length - 1))) % accents.length]
    const tertiary = accents[(h + 2) % accents.length]
    return {
      palette,
      primary,
      secondary,
      tertiary,
      metal: palette.metal,
      soft: rgba(primary, 0.12),
      softStrong: rgba(primary, 0.19),
      border: rgba(primary, 0.32),
      focus: rgba(primary, 0.72),
      glow: rgba(primary, 0.22),
      glowStrong: rgba(primary, 0.34),
      secondarySoft: rgba(secondary, 0.13),
      metalSoft: rgba(palette.metal, 0.14),
    }
  }

  function setTokens(el, prefix, t) {
    el.style.setProperty(`${prefix}-primary`, t.primary)
    el.style.setProperty(`${prefix}-secondary`, t.secondary)
    el.style.setProperty(`${prefix}-tertiary`, t.tertiary)
    el.style.setProperty(`${prefix}-metal`, t.metal)
    el.style.setProperty(`${prefix}-soft`, t.soft)
    el.style.setProperty(`${prefix}-soft-strong`, t.softStrong)
    el.style.setProperty(`${prefix}-border`, t.border)
    el.style.setProperty(`${prefix}-focus`, t.focus)
    el.style.setProperty(`${prefix}-glow`, t.glow)
    el.style.setProperty(`${prefix}-glow-strong`, t.glowStrong)
    el.style.setProperty(`${prefix}-secondary-soft`, t.secondarySoft)
    el.style.setProperty(`${prefix}-metal-soft`, t.metalSoft)
  }

  function identityForLink(link) {
    const href = cleanHref(link.getAttribute('href'))
    const label = (link.getAttribute('aria-label') || link.textContent || '').trim().slice(0, 120)
    return `${href} ${label}`.trim()
  }

  function paintLink(link) {
    const href = cleanHref(link.getAttribute('href'))
    if (!href) return

    const identity = identityForLink(link)
    const palette = choosePalette(identity)
    const tokens = tokensFor(palette, identity)
    link.dataset.pmdFeatureLink = 'true'
    link.dataset.pmdFeaturePalette = palette.id
    link.setAttribute('data-pmd-feature-name', palette.name)
    setTokens(link, '--pmd-feature', tokens)
  }

  function paintRoute() {
    const identity = `${window.location.pathname} ${window.location.search}`
    const palette = choosePalette(identity)
    const tokens = tokensFor(palette, identity)

    ROOT.dataset.pmdPalette = palette.id
    ROOT.setAttribute('data-pmd-palette-name', palette.name)
    setTokens(ROOT, '--pmd-route', tokens)

    // Feed the existing shell tokens rather than replacing the shell system.
    ROOT.style.setProperty('--pmd-nav-active', tokens.soft)
    ROOT.style.setProperty('--pmd-nav-active-border', tokens.border)
    ROOT.style.setProperty('--pmd-nav-focus', tokens.focus)

    const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]')
    if (darkMeta) darkMeta.setAttribute('content', palette.base)
  }

  function paintAssistive() {
    const button = document.querySelector(
      'button[aria-label="Buka menu navigasi"], button[aria-label="Tutup menu"]',
    )
    if (button) {
      button.dataset.pmdAssistive = 'true'
      button.setAttribute('data-pmd-palette', ROOT.dataset.pmdPalette || 'astral-chrome')
    }

    const menu = document.querySelector('[role="menu"][aria-label="Tindakan cepat"]')
    if (menu) menu.dataset.pmdAssistiveMenu = 'true'
  }

  function paintFeatureSurfaces() {
    document.querySelectorAll('a[href]').forEach((link) => {
      if (link instanceof HTMLAnchorElement) paintLink(link)
    })
    paintAssistive()
  }

  function apply() {
    raf = 0
    paintRoute()
    paintFeatureSurfaces()
    ROOT.classList.add('pmd-spectrum-ready')
  }

  function schedule() {
    if (raf) return
    raf = window.requestAnimationFrame(apply)
  }

  function installHistoryHook() {
    if (window.__PANACEA_SPECTRUM_HISTORY__) return
    window.__PANACEA_SPECTRUM_HISTORY__ = true

    for (const method of ['pushState', 'replaceState']) {
      const original = history[method]
      history[method] = function panaceaSpectrumHistory(...args) {
        const result = original.apply(this, args)
        window.dispatchEvent(new Event('panacea:spectrum-route'))
        return result
      }
    }
    window.addEventListener('popstate', schedule)
    window.addEventListener('panacea:spectrum-route', schedule)
  }

  function installObserver() {
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.addedNodes.length || m.removedNodes.length)) schedule()
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  installHistoryHook()
  installObserver()
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true })
  else schedule()
})()

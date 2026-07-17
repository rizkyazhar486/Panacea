# External APIs — how Panaceamed accesses free data sources

Panaceamed is built to rely only on **free, key-optional public APIs** wherever
possible, so features work globally without a paid contract. This document lists
every external API the app uses (or can use), how to access it, whether a key is
needed, and the endpoints involved. It's both a reference and a guide for
extending the app.

> **Design rule:** third-party calls that need a secret go through the **server**
> (`server/src/*`), never the browser, so no key is ever shipped to the client.
> Key-free data APIs (weather, air quality) are called directly from the client.

---

## 1. NCBI E-utilities — PubMed literature (LIVE, in use)

Real, currently-indexed biomedical papers for the Clinical Evidence page.

- **Key:** none required. An optional `NCBI_API_KEY` raises the rate limit from
  3 → 10 requests/second. Get one free at
  <https://www.ncbi.nlm.nih.gov/account/> → Settings → API Key Management.
- **Env var:** `NCBI_API_KEY` (optional).
- **Server module:** `server/src/pubmed.ts` · **Endpoint:** `GET /api/evidence/pubmed?q=`
- **Flow:** `esearch` (query → PMIDs) → `esummary` (PMIDs → metadata).
  - Search: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&term=<QUERY>`
  - Summary: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=<PMID,PMID>`
- **Docs:** <https://www.ncbi.nlm.nih.gov/books/NBK25501/>

## 2. ClinicalTrials.gov v2 — registered trials (LIVE, in use)

Real registered studies for the Clinical Trials Finder (the responsible way to
"accommodate" regulated stem-cell / gene / longevity therapies).

- **Key:** none required. No signup.
- **Server module:** `server/src/trials.ts` · **Endpoint:** `GET /api/trials?q=&recruiting=1&country=`
- **Base:** `https://clinicaltrials.gov/api/v2/studies`
  - Example: `.../studies?query.term=senolytics%20aging&filter.overallStatus=RECRUITING&pageSize=12&fields=NCTId,BriefTitle,OverallStatus,Condition,Phase,LocationCity,LocationCountry`
- **Docs:** <https://clinicaltrials.gov/data-api/api>

## 3. Open-Meteo — weather (LIVE, in use)

GPS forecast on the home weather widget.

- **Key:** none. No signup, generous free tier.
- **Client:** `src/components/WeatherWidget.tsx` (called directly — no secret).
- **Endpoint:** `https://api.open-meteo.com/v1/forecast?latitude=<LAT>&longitude=<LNG>&current=temperature_2m,weather_code&daily=...&forecast_days=16`
- **Docs:** <https://open-meteo.com/en/docs>

## 4. Open-Meteo Air Quality — AQI (LIVE, in use)

Local US AQI + PM2.5/PM10/ozone for the Air Quality & Respiratory Risk page.

- **Key:** none.
- **Client:** `src/pages/AirQuality.tsx`.
- **Endpoint:** `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=<LAT>&longitude=<LNG>&current=us_aqi,pm2_5,pm10,ozone`
- **Docs:** <https://open-meteo.com/en/docs/air-quality-api>

## 5. ESPN (unofficial), TheSportsDB, Jolpica-F1, MotoGP pulselive (LIVE, in use)

Free live sports scores (`server/src/sports.ts`). ESPN's public site API and the
MotoGP/F1 feeds need no key; TheSportsDB uses the free public test key `3`.
See the header comment in `sports.ts` for per-league detail.

## 6. API-Football / API-Sports — Indonesian leagues (LIVE, needs a free key)

Liga 1 & Liga 2 Indonesia (`server/src/sports.ts`).

- **Key:** free tier = 100 requests/day. Sign up at
  <https://www.api-football.com/> (or the RapidAPI listing), copy the key.
- **Env var:** `APISPORTS_KEY` (server only — never hardcode).

## 7. OpenFDA — drug labels & recalls (LIVE, in use)

Powers the **Drug Info** page (identify a medicine, see purpose, dosing,
warnings & adverse reactions from the official FDA label). Fully free.

- **Key:** none required; an optional key raises limits (register at
  <https://open.fda.gov/apis/authentication/>). Env var: `OPENFDA_KEY`.
- **Server module:** `server/src/openfda.ts` · **Endpoint:** `GET /api/drugs/label?q=`
- **Endpoints (no key):**
  - Label: `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"<NAME>"&limit=1`
  - Adverse events: `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"<NAME>"`
  - Recalls: `https://api.fda.gov/drug/enforcement.json?search=<TERM>`
- **Docs:** <https://open.fda.gov/apis/>

## 8. RxNorm (NIH) — drug name normalization (AVAILABLE; interaction sub-API is RETIRED)

Normalize brand↔generic drug names and look up related dose forms.

> ⚠️ **Do not build a drug-interaction checker on RxNav's old Interaction API**
> (`/interaction/interaction.json`). NLM retired it in January 2024 because its
> two source databases (DrugBank and ONCHigh) ended their data-sharing
> agreements with NLM — the endpoint is gone, not just deprecated. There is
> currently no free, key-free, licensable interaction dataset to replace it;
> a real interaction checker would need a paid feed (e.g. First Databank,
> Multum) behind the server. Name-normalization below is still live.

- **Key:** none.
- **Endpoints (still live):** `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=<DRUG>` ·
  `https://rxnav.nlm.nih.gov/REST/rxcui/<RXCUI>/related.json?tty=SCD`
- **Docs:** <https://lhncbc.nlm.nih.gov/RxNav/APIs/>

## 9. MyGene.info — gene lookups (LIVE, in use)

Powers the **Gene Info** page — educational gene function, aliases & genomic
location (e.g. explain FOXO3, MTHFR, APOE) without handling anyone's actual
genome — the responsible, free stand-in for the regulated "genomic vault"
features.

- **Key:** none.
- **Server module:** `server/src/mygene.ts` · **Endpoint:** `GET /api/genes/info?q=`
- **Flow:** `query` (symbol/alias/name → gene ID) → `gene/<id>` (ID → annotation).
  - Search: `https://mygene.info/v3/query?q=symbol:<SYMBOL>%20OR%20alias:<SYMBOL>&species=human&size=1`
  - Annotation: `https://mygene.info/v3/gene/<ID>?fields=symbol,name,summary,alias,type_of_gene,genomic_pos,entrezgene,ensembl.gene`
- **Docs:** <https://docs.mygene.info/>

## 10. OpenStreetMap Nominatim / Overpass — nearby facilities (LIVE, in use)

Real nearby hospitals/clinics/pharmacies on the Health Facilities page (see
`src/pages/Hospitals.tsx`). Free; respect the usage policy (set a UA, cache).

- **Docs:** <https://nominatim.org/release-docs/latest/api/Overview/>

---

## Adding a new free API — checklist

1. **Secret needed?** → server module in `server/src/`, read the key from an env
   var, expose an auth-gated `GET /api/...` route (it's automatically covered by
   the rate limiter). **No secret?** → call it directly from the page.
2. Return a small, typed shape (trim fields server-side like `pubmed.ts` does).
3. Degrade gracefully: on any failure return an empty result + an `error` flag so
   the UI can fall back to a manual link.
4. Add the client method in `src/lib/api.ts` and the page under `src/pages/`.
5. Document it here with: key requirement, env var, endpoints, and docs link.
6. Sandbox note: outbound calls to third-party hosts can't be tested from the
   build sandbox — verify the JSON shape on first deploy (as noted in each
   server module header).

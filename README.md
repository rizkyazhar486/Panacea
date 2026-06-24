# Panaceamed.id — Longevity Medical-AI Co-Physician

A web app that demonstrates the Panacea concept: **AI performs the anamnesis and
recommends supporting examinations through a chatbot**, the results flow into an
integrated **AI-EMR**, and the **physical examination and final plan are filled
in and verified by the examining (human) doctor**. The patient identity is kept
**continuously integrated** across every module — always carrying vital signs and
supporting results as support for *longevity*. Built for continuous monitoring of
patients with chronic disease, the elderly, and the immunocompromised.

> ⚕️ The AI **supports, and never replaces**, a licensed clinician. All doses must
> be verified against a current formulary before use.

![Brand](public/logo.svg)

## Modules

| Module | What it does |
| --- | --- |
| **Dashboard** | Continuous patient identity — vital-sign trends, anthropometry, **growth & BMI charts** (pediatric WHO/CDC curves for BB/U·TB/U·IMT/U and an adult BMI band chart), supporting results (Lab/EKG/Radiology), and a Longevity Score. |
| **AI Chatbot** | Anamnesis Co-Physician. Interviews the patient with SOCRATES-based, open-ended questions and recommends supporting examinations. One click drafts a structured AI-EMR. |
| **AI-EMR** | SOAP record. AI drafts the anamnesis (S) and assessment (A) with a *"Dipikirkan …"* comparative narrative; the **doctor fills & verifies the physical exam (O)** and signs. Includes an AI **patient-education** sheet (brief + deep) so patients understand their disease and how to stay healthy. |
| **Planning** | AI recommends management (Suportif · Definitif · Edukasi · Follow-up · Monitoring); the **doctor verifies, rejects, or adds** items. High-alert drugs return ranges + references only. |
| **Marketplace** | Buy & sell **medical notes / materials / journals** (USMLE, UKMPPD) and **AI-EMR templates** with **PanaceaToken (PNC)**. Upload as **Word / PDF / PowerPoint**. Every upload is gated by **Claude AI verification → specialist verifier**. |
| **Materi Saya** | Contributor dashboard — uploaded materials, verification pipeline (Upload → AI Screening → Specialist Verification → Published), downloads, and **royalty earnings**. |
| **Verifikasi** | Two-layer gatekeeping: Panacea AI Verification Layer (accuracy/safety) then a **Spesialis/Subspesialis verifier**. Contributors must be verified before their materials are listed. "Act as" switcher to demo each role. |
| **Billing & Token** | Runnable token wallet — deposit (simulated gateway), purchase, **author royalty payout**, and **subscriptions** (Individu / Rumah Sakit) that unlock full AI-EMR + automatic patient education. |
| **Arsitektur CDSS** | Reference for the hybrid lateral+vertical CDSS: 12 microservices, data flow, the ensemble formula, the safety-filter pseudocode, roadmap, evaluation metrics & regulatory checklist. |
| **Settings** | Anthropic API key, model selection, examining-doctor identity. |

## Clinical engines

- **LMS z-scores (Cole's method)** power the pediatric growth charts — exact z-score &
  percentile with WHO/CDC classification (stunted/wasted/overweight), fitted from the
  tabulated P3/P50/P97 reference points. Adults get a WHO Asia-Pacific BMI band chart.
- **CDSS hybrid safety engine** (`src/lib/cdss.ts`) scores every plan item as
  `CombinedScore = α·V + β·L + γ·S` and **blocks** any item with safety `S < 0.8`
  (allergy/high-alert/contraindication), requiring a **logged clinician override
  justification** (doctor-in-the-loop). Visualized on the Planning page.
- **Comprehensive EMR framework** — the AI drafts records per a Patient-Based Medicine
  spec (SOCRATES algorithmic expansion, conditional pediatric/obstetric history,
  **probability-ranked differentials**, "Dipikirkan …" reasoning, prognosis, and
  evidence-graded Vancouver citations).
- **Modern visual layer** — an anatomical **body map** summarizes physical-exam findings
  per system; patient education renders as a brief, high-impact **presentation deck**.

## Business model

Panaceamed.id is both an **AI-EMR system** and a **tokenized marketplace** for medical
knowledge. Buyers deposit PanaceaToken to purchase notes/materials; authors earn
royalties (platform takes a fee). Contributors are verified by specialist/subspecialist
verifiers, and Panacea AI validates every uploaded item using configurable LLM engines and clinical safety rules — including AI-EMR templates.
Hospitals and individuals subscribe so their **patients receive concise-yet-deep
education** about their disease and how to maintain their health.

## The Co-Physician brain

The chatbot and AI-EMR are orchestrated by the **Panacea Co-Physician Engine**
system prompt (`src/lib/systemPrompt.ts`) — bilingual (ID/EN), tight-by-default,
with a dual safety guardrail separating **Education/Simulation** from **Clinical**
reasoning, and Vancouver citations for key claims.

- **AI Live** — add an API key (Anthropic-compatible) in *Settings* to call the Claude API
  directly from the browser.
- **Mode Demo** — without a key, the app runs a scripted simulation so every
  screen and flow can be explored offline.

## Tech stack

Vite · React · TypeScript · Tailwind CSS v4. State is persisted in `localStorage`
(seeded with three example patients).

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Brand

Logo: red cross + green `tP` letterform. Palette `#00BF63` · `#FF3131` · `#000000`
· `#FFFFFF`. Typeface: **Montserrat**.

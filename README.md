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
| **Dashboard** | Continuous patient identity — vital-sign trends, anthropometry (BMI/Kesan), supporting results (Lab/EKG/Radiology), and a Longevity Score. |
| **AI Chatbot** | Anamnesis Co-Physician. Interviews the patient with SOCRATES-based, open-ended questions and recommends supporting examinations. One click drafts a structured AI-EMR. |
| **AI-EMR** | SOAP record. AI drafts the anamnesis (S) and assessment (A) with a *"Dipikirkan …"* comparative narrative; the **doctor fills & verifies the physical exam (O)** and signs the record. |
| **Planning** | AI recommends management (Suportif · Definitif · Edukasi · Follow-up · Monitoring); the **doctor verifies, rejects, or adds** items. High-alert drugs return ranges + references only. |
| **Settings** | Anthropic API key, model selection, examining-doctor identity. |

## The Co-Physician brain

The chatbot and AI-EMR are powered by the **Longevity Medical-AI Co-Physician**
system prompt (`src/lib/systemPrompt.ts`) — bilingual (ID/EN), tight-by-default,
with a dual safety guardrail separating **Education/Simulation** from **Clinical**
reasoning, and Vancouver citations for key claims.

- **AI Live** — add an Anthropic API key in *Settings* to call the Claude API
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

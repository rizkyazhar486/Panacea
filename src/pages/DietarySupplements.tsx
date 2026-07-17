import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity, IconShield, IconChartUp, IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Dietary Supplements for Exercise & Athletic Performance
// ─────────────────────────────────────────────────────────────────────────────
// Structured after the NIH Office of Dietary Supplements (ODS) health-
// professional fact sheet. This is EVIDENCE-REVIEW / HARM-REDUCTION education,
// not a how-to guide: it deliberately carries NO doses, cycles, or protocols
// for prescription hormones, SARMs, research peptides, or WADA-banned agents.
// Those entries exist so readers understand what these substances actually are,
// what the evidence does and doesn't show, and the real safety & legal risks —
// framed exactly the way the ODS fact sheet frames them: cautious and honest.
// ─────────────────────────────────────────────────────────────────────────────

type StatusKind = 'otc' | 'prescription' | 'banned-supplement' | 'wada-banned' | 'research-only'
type EvidenceGrade = 'strong' | 'moderate' | 'limited' | 'preliminary' | 'insufficient'

interface Substance {
  id: string
  name: string
  aka?: string
  emoji: string
  status: StatusKind
  evidence: EvidenceGrade
  clinicalReality: string
  marketingHype: string
  mechanism: string
  efficacy: string
  safety: string
  adverse: string[]
  legal: string
}

interface Category {
  id: string
  label: string
  emoji: string
  blurb: string
  danger?: boolean
  items: Substance[]
}

const STATUS_META: Record<StatusKind, { label: string; tone: 'brand' | 'low' | 'critical' }> = {
  otc: { label: 'Available as a supplement', tone: 'brand' },
  prescription: { label: 'Prescription-only medicine', tone: 'low' },
  'banned-supplement': { label: 'Banned from supplements (not approved)', tone: 'critical' },
  'wada-banned': { label: 'WADA-banned / experimental', tone: 'critical' },
  'research-only': { label: 'Research chemical — not approved for human use', tone: 'critical' },
}

const EVIDENCE_META: Record<EvidenceGrade, { label: string; tone: 'brand' | 'low' | 'critical' }> = {
  strong: { label: 'Strong evidence', tone: 'brand' },
  moderate: { label: 'Moderate evidence', tone: 'brand' },
  limited: { label: 'Limited evidence', tone: 'low' },
  preliminary: { label: 'Preliminary / animal-only', tone: 'critical' },
  insufficient: { label: 'Insufficient evidence', tone: 'critical' },
}

// ── Evidence-based ergogenic aids (legitimate sports nutrition) ───────────────
const ERGOGENIC: Substance[] = [
  {
    id: 'creatine', name: 'Creatine monohydrate', emoji: '💪', status: 'otc', evidence: 'strong',
    clinicalReality: 'One of the most-studied and reliably effective legal ergogenic aids. Consistently improves performance in short, high-intensity, repeated efforts and supports gains in muscle mass alongside resistance training.',
    marketingHype: 'Marketed as a "steroid alternative" or an instant mass-builder. In reality the weight gain in the first week is largely intramuscular water, and effects on strength accrue gradually with training.',
    mechanism: 'Increases phosphocreatine stores in muscle, accelerating regeneration of ATP during brief maximal efforts and buffering fatigue between sets.',
    efficacy: 'Meta-analyses show small-to-moderate improvements in maximal strength, power, and repeated-sprint work; benefits are clearest in trained individuals doing resistance or sprint work.',
    safety: 'Well tolerated in healthy adults over years of study. Does not damage kidneys in people with normal renal function, though those with kidney disease should consult a clinician first.',
    adverse: ['Transient water-weight gain', 'Occasional GI discomfort or cramping at high single doses', 'Caution with pre-existing kidney disease'],
    legal: 'Legal, widely available, and permitted in sport. Choose third-party-tested products (NSF Certified for Sport, Informed Sport).',
  },
  {
    id: 'caffeine', name: 'Caffeine', emoji: '☕', status: 'otc', evidence: 'strong',
    clinicalReality: 'A genuinely effective, well-evidenced stimulant that improves endurance, alertness, and perceived effort across many sports.',
    marketingHype: 'Energy-drink marketing implies dramatic, universal effects; response actually varies with genetics (CYP1A2), habitual intake, and timing.',
    mechanism: 'Adenosine-receptor antagonism reduces perception of fatigue and effort; also mobilizes calcium handling in muscle.',
    efficacy: 'Robust evidence for endurance and moderate evidence for strength/power. Effect is blunted in habituated heavy users.',
    safety: 'Safe for most adults at moderate intakes; excessive doses cause cardiovascular and neurological effects. Not advisable late in the day due to sleep disruption.',
    adverse: ['Anxiety, jitteriness, palpitations at high doses', 'Insomnia if taken too late', 'GI upset', 'Dependence / withdrawal headaches'],
    legal: 'Legal and permitted in sport (removed from the WADA prohibited list; on the monitoring program).',
  },
  {
    id: 'beta-alanine', name: 'Beta-alanine', emoji: '⚡', status: 'otc', evidence: 'moderate',
    clinicalReality: 'Modestly improves performance in efforts lasting roughly 1–4 minutes by raising muscle carnosine.',
    marketingHype: 'The harmless tingling ("paresthesia") it causes is sometimes marketed as proof it "works" — the sensation is unrelated to the ergogenic effect.',
    mechanism: 'Rate-limiting precursor to carnosine, an intramuscular pH buffer that offsets acidosis during high-intensity exercise.',
    efficacy: 'Small but real benefit for high-intensity efforts of 1–4 min; negligible for single sprints or long endurance.',
    safety: 'Generally safe; the main effect is harmless skin tingling.',
    adverse: ['Paresthesia (skin tingling)', 'No serious effects reported at studied intakes'],
    legal: 'Legal and permitted in sport.',
  },
  {
    id: 'nitrate', name: 'Dietary nitrate / beetroot', aka: 'Beetroot juice', emoji: '🥤', status: 'otc', evidence: 'moderate',
    clinicalReality: 'Can improve endurance efficiency, most reliably in recreational and sub-elite athletes.',
    marketingHype: 'Sold as a universal endurance breakthrough; effects are smaller and less consistent in highly trained elites.',
    mechanism: 'Nitrate → nitrite → nitric oxide pathway improves blood flow and muscle-contraction efficiency, lowering the oxygen cost of exercise.',
    efficacy: 'Moderate evidence for improved time-to-exhaustion and economy, especially in less-trained individuals.',
    safety: 'Safe from whole-food sources; harmless red/pink urine or stool can occur.',
    adverse: ['Harmless discoloration of urine/stool', 'Mild GI upset in some people'],
    legal: 'Legal and permitted in sport.',
  },
  {
    id: 'protein', name: 'Protein & essential amino acids', aka: 'Whey, casein, EAA, BCAA', emoji: '🥛', status: 'otc', evidence: 'strong',
    clinicalReality: 'Adequate total daily protein supports muscle repair and growth. Supplements are a convenient way to hit intake targets, not magic — whole-food protein works equally well.',
    marketingHype: 'BCAA drinks in particular are heavily oversold; for people already eating enough complete protein, isolated BCAAs add little.',
    mechanism: 'Provides amino acids (especially leucine) that trigger muscle protein synthesis; total daily protein matters more than timing.',
    efficacy: 'Strong evidence that meeting protein targets supports muscle mass with training; weaker evidence that isolated BCAAs help when total protein is already sufficient.',
    safety: 'Safe for healthy people at typical athletic intakes; those with kidney disease should get individualized advice.',
    adverse: ['GI discomfort with lactose-containing products', 'Caution with pre-existing kidney disease'],
    legal: 'Legal and permitted in sport.',
  },
  {
    id: 'bicarbonate', name: 'Sodium bicarbonate', emoji: '🧂', status: 'otc', evidence: 'moderate',
    clinicalReality: 'An extracellular pH buffer that can help high-intensity efforts of about 1–10 minutes.',
    marketingHype: 'Presented as a simple hack; the GI side effects are frequently downplayed.',
    mechanism: 'Raises blood bicarbonate, increasing the gradient for exporting hydrogen ions from working muscle.',
    efficacy: 'Moderate evidence for repeated high-intensity efforts; individual GI tolerance limits practical use.',
    safety: 'Frequently causes GI distress; sodium load is relevant for some medical conditions.',
    adverse: ['GI distress, bloating, diarrhea', 'High sodium load'],
    legal: 'Legal and permitted in sport.',
  },
  {
    id: 'hmb', name: 'HMB (β-hydroxy β-methylbutyrate)', emoji: '🧬', status: 'otc', evidence: 'limited',
    clinicalReality: 'A leucine metabolite that may slightly reduce muscle breakdown, mainly in untrained people or during heavy overload.',
    marketingHype: 'Some products claim dramatic, steroid-like body-recomposition results not supported by independent trials.',
    mechanism: 'May attenuate protein breakdown and support membrane repair.',
    efficacy: 'Limited and mixed; any benefit is small and clearest in novice trainees or recovery from intense overload.',
    safety: 'Appears safe at studied intakes.',
    adverse: ['No serious effects reported at studied intakes'],
    legal: 'Legal and permitted in sport.',
  },
  {
    id: 'omega3', name: 'Omega-3 fatty acids', aka: 'EPA/DHA fish oil', emoji: '🐟', status: 'otc', evidence: 'limited',
    clinicalReality: 'Supports general cardiovascular and anti-inflammatory health; direct performance benefits are modest and uncertain.',
    marketingHype: 'Marketed as a recovery cure-all; evidence for large performance or recovery effects is weak.',
    mechanism: 'Incorporates into cell membranes and modulates inflammatory signalling.',
    efficacy: 'Limited evidence for reduced muscle soreness; general health benefits are better established than performance ones.',
    safety: 'Safe for most people; high doses can affect bleeding time.',
    adverse: ['Fishy aftertaste, GI upset', 'Mildly increased bleeding tendency at high doses'],
    legal: 'Legal and permitted in sport.',
  },
]

// ── Anabolic-androgenic steroids (AAS) — prescription / controlled ────────────
const STEROIDS: Substance[] = [
  {
    id: 'testosterone', name: 'Testosterone (TRT & esters)', aka: 'Testosterone enanthate/cypionate/undecanoate', emoji: '⚗️', status: 'prescription', evidence: 'moderate',
    clinicalReality: 'A prescription hormone. Legitimately used to treat clinically diagnosed hypogonadism under medical supervision. Non-medical use for muscle-building is a different, higher-risk scenario and is prohibited in sport.',
    marketingHype: 'Online sellers frame testosterone as a safe "optimization" tool for any tired man. Supra-physiological non-medical dosing carries risks that clinical replacement does not.',
    mechanism: 'Binds androgen receptors to increase muscle protein synthesis and, at supraphysiologic levels, drives large gains in muscle mass and strength while suppressing the body\'s own hormone production.',
    efficacy: 'Clear muscle/strength effects at supraphysiologic doses (which is why it is banned in sport); as replacement therapy it restores physiologic levels in genuine deficiency.',
    safety: 'Meaningful risks especially with non-medical supraphysiologic use: cardiovascular strain, suppression of natural testosterone and fertility, and hormonal side effects. Requires diagnosis and monitoring by a physician.',
    adverse: ['Testicular atrophy and impaired fertility', 'Elevated hematocrit / cardiovascular risk', 'Acne, hair loss, mood changes', 'Gynecomastia (via aromatization)', 'Liver strain with oral 17-alkylated forms'],
    legal: 'Prescription-only and a controlled substance in many countries. Prohibited in sport at all times (WADA). Not a dietary supplement.',
  },
  {
    id: 'nandrolone', name: 'Nandrolone', aka: 'Deca-Durabolin', emoji: '⚗️', status: 'prescription', evidence: 'limited',
    clinicalReality: 'A prescription anabolic steroid with narrow legitimate medical uses. Non-medical use for physique/performance is prohibited and carries the general AAS risk profile.',
    marketingHype: 'Promoted in bodybuilding circles as "joint-friendly" mass. Such claims are anecdotal and ignore endocrine and cardiovascular harm.',
    mechanism: 'Androgen-receptor agonist promoting nitrogen retention and muscle protein synthesis.',
    efficacy: 'Builds muscle at supraphysiologic doses; no legitimate performance indication.',
    safety: 'Shares the AAS risk profile: hormonal suppression, cardiovascular and psychological effects; long-detectable metabolites.',
    adverse: ['Suppression of natural hormone production', 'Cardiovascular and lipid effects', 'Sexual dysfunction', 'Mood disturbance'],
    legal: 'Prescription/controlled substance; prohibited in sport at all times. Not a dietary supplement.',
  },
  {
    id: 'oral-aas', name: 'Oral 17α-alkylated steroids', aka: 'Oxandrolone, stanozolol, methandrostenolone, oxymetholone', emoji: '⚗️', status: 'prescription', evidence: 'limited',
    clinicalReality: 'Prescription anabolic steroids with limited legitimate indications. Oral 17-alkylated forms are specifically associated with liver toxicity.',
    marketingHype: 'Sold as "cutting" or "beginner-friendly" orals. The chemical modification that lets them survive oral dosing is exactly what stresses the liver.',
    mechanism: 'Androgen-receptor agonism; the 17α-alkyl group resists first-pass hepatic breakdown, raising oral bioavailability and hepatotoxicity.',
    efficacy: 'Muscle/strength effects at supraphysiologic doses; no legitimate performance role.',
    safety: 'Hepatotoxicity is a distinctive hazard alongside the shared AAS endocrine/cardiovascular risks.',
    adverse: ['Liver strain / hepatotoxicity', 'Adverse cholesterol changes', 'Hormonal suppression', 'Virilization (especially in women)'],
    legal: 'Prescription/controlled; prohibited in sport at all times. Not a dietary supplement.',
  },
  {
    id: 'trenbolone', name: 'Trenbolone', emoji: '⚗️', status: 'banned-supplement', evidence: 'insufficient',
    clinicalReality: 'A potent androgen developed for veterinary use, with no approved human medical indication. Non-medical human use is high-risk.',
    marketingHype: 'Glorified in bodybuilding media as the ultimate physique drug; the severity of its side-effect profile is routinely understated.',
    mechanism: 'Strong androgen-receptor agonist that does not aromatize to estrogen.',
    efficacy: 'No legitimate human indication; not studied for safe human performance use.',
    safety: 'Associated with pronounced cardiovascular, psychological, and endocrine effects reported in users; not characterized by controlled human trials.',
    adverse: ['Cardiovascular strain', 'Marked hormonal suppression', 'Sleep disturbance, night sweats', 'Mood/aggression changes'],
    legal: 'No approved human use; controlled/prohibited in sport at all times. Not a dietary supplement.',
  },
]

// ── SARMs — not approved, prohibited ──────────────────────────────────────────
const SARMS: Substance[] = [
  {
    id: 'ostarine', name: 'Ostarine', aka: 'MK-2866, enobosarm', emoji: '🧪', status: 'banned-supplement', evidence: 'preliminary',
    clinicalReality: 'A selective androgen receptor modulator investigated as a drug candidate but NOT approved for any use. It is illegally sold in "supplements" despite being an unapproved drug.',
    marketingHype: 'Sold as "muscle without steroid side effects." It is an investigational drug with incompletely characterized safety, not a benign supplement.',
    mechanism: 'Tissue-selective androgen-receptor agonism intended to favor muscle/bone over prostate/skin.',
    efficacy: 'Preliminary trial data suggest lean-mass effects, but it is unapproved and its risk-benefit is not established.',
    safety: 'Signals of testosterone suppression and liver enzyme elevations; products are frequently mislabeled or contaminated.',
    adverse: ['Suppression of natural testosterone', 'Liver enzyme elevations', 'Uncertain long-term safety', 'Mislabeled/contaminated products'],
    legal: 'Not approved; illegal to sell in dietary supplements. Prohibited in sport at all times. The FDA has warned consumers against SARMs.',
  },
  {
    id: 'ligandrol', name: 'Ligandrol', aka: 'LGD-4033', emoji: '🧪', status: 'banned-supplement', evidence: 'preliminary',
    clinicalReality: 'An investigational SARM, not an approved medicine, sold illegally in "supplements."',
    marketingHype: 'Marketed as a potent lean-mass builder; safety in humans is not established.',
    mechanism: 'Non-steroidal selective androgen-receptor agonist.',
    efficacy: 'Early-phase data only; unapproved.',
    safety: 'Documented testosterone suppression and liver-enzyme changes in limited studies and case reports.',
    adverse: ['Hormonal suppression', 'Liver enzyme elevations', 'Reported cases of drug-induced liver injury', 'Unknown long-term risk'],
    legal: 'Not approved; illegal in supplements; prohibited in sport at all times.',
  },
  {
    id: 'rad140', name: 'Testolone', aka: 'RAD-140', emoji: '🧪', status: 'banned-supplement', evidence: 'preliminary',
    clinicalReality: 'A potent investigational SARM with no approval for human use; sold illegally.',
    marketingHype: 'Advertised as near-steroid strength with fewer side effects — an unsubstantiated claim for an unapproved drug.',
    mechanism: 'High-affinity non-steroidal androgen-receptor agonist.',
    efficacy: 'Animal and early data only; unapproved.',
    safety: 'Case reports of liver injury; suppression of endogenous hormones; largely uncharacterized in humans.',
    adverse: ['Drug-induced liver injury (case reports)', 'Hormonal suppression', 'Uncertain cardiovascular effects'],
    legal: 'Not approved; illegal in supplements; prohibited in sport at all times.',
  },
  {
    id: 'other-sarms', name: 'Other SARMs & related agents', aka: 'YK-11, S-23, andarine (S-4), S-22', emoji: '🧪', status: 'banned-supplement', evidence: 'preliminary',
    clinicalReality: 'A family of investigational or research compounds, none approved for human use, commonly mislabeled and sold online.',
    marketingHype: 'Each is marketed with specific "specialties" (hardening, recomposition, etc.) unsupported by human trials.',
    mechanism: 'Various androgen-receptor-active or myostatin-affecting research chemicals with limited human data.',
    efficacy: 'Insufficient human evidence; unapproved.',
    safety: 'Poorly characterized; product contamination and mislabeling are common and add unpredictable risk.',
    adverse: ['Vision disturbances reported with andarine', 'Hormonal suppression', 'Unknown long-term effects', 'Contaminated/mislabeled products'],
    legal: 'Not approved; illegal in supplements; prohibited in sport at all times.',
  },
]

// ── Peptides & GH secretagogues — research chemicals, unapproved ──────────────
const PEPTIDES: Substance[] = [
  {
    id: 'bpc157', name: 'BPC-157', emoji: '🔬', status: 'research-only', evidence: 'preliminary',
    clinicalReality: 'A synthetic peptide studied almost entirely in animals for tissue healing. It is NOT an approved medicine and is sold illegally as a "research chemical."',
    marketingHype: 'Promoted as a miracle healing peptide for tendons and gut. Human efficacy and safety data are essentially absent.',
    mechanism: 'Proposed effects on angiogenesis and growth-factor signalling, based mainly on rodent studies.',
    efficacy: 'Preliminary animal data only; no adequate human trials.',
    safety: 'Human safety is not established; sourced from unregulated suppliers with purity concerns.',
    adverse: ['Unknown human safety profile', 'Injection/sterility risks from unregulated products', 'Unknown long-term effects'],
    legal: 'Not an approved drug; not a lawful dietary-supplement ingredient. Prohibited in sport (S0/peptide categories). The FDA has flagged it for compounding-safety concerns.',
  },
  {
    id: 'tb500', name: 'TB-500 / Thymosin β4 fragment', emoji: '🔬', status: 'research-only', evidence: 'preliminary',
    clinicalReality: 'A synthetic peptide marketed for recovery with only preclinical data and no human approval.',
    marketingHype: 'Sold alongside BPC-157 as a "healing stack"; human evidence is lacking.',
    mechanism: 'Proposed actin-regulation and cell-migration effects from laboratory studies.',
    efficacy: 'Preclinical only; unapproved.',
    safety: 'Not characterized in humans; unregulated sourcing.',
    adverse: ['Unknown human safety', 'Sterility/purity risks', 'Unknown long-term effects'],
    legal: 'Not approved; not a lawful supplement ingredient; prohibited in sport.',
  },
  {
    id: 'gh-secretagogues', name: 'GH secretagogues & GHRH analogues', aka: 'CJC-1295, ipamorelin, GHRP-2/6, hexarelin, sermorelin, tesamorelin', emoji: '🔬', status: 'research-only', evidence: 'preliminary',
    clinicalReality: 'Peptides that stimulate growth-hormone release. A few (e.g., tesamorelin, sermorelin) have specific approved medical uses; most are sold non-medically as unapproved research chemicals for physique/anti-aging.',
    marketingHype: 'Marketed as safe "natural GH boosters" for muscle and anti-aging. Non-medical use is unapproved and prohibited in sport.',
    mechanism: 'Act on GHRH or ghrelin/GH-secretagogue receptors to increase endogenous growth-hormone and IGF-1.',
    efficacy: 'Raise GH/IGF-1 biochemically; performance/anti-aging benefit in healthy people is not established, and risk-benefit is unfavorable.',
    safety: 'Elevating GH/IGF-1 carries metabolic and theoretical proliferative risks; unregulated products add contamination risk.',
    adverse: ['Water retention, joint pain', 'Insulin resistance / altered glucose', 'Injection-site and sterility risks', 'Unknown long-term effects'],
    legal: 'Non-medical use is unapproved; not lawful supplement ingredients. Growth hormone and its secretagogues are prohibited in sport at all times.',
  },
  {
    id: 'igf-mgf', name: 'IGF-1 analogues & MGF', aka: 'IGF-1 LR3, PEG-MGF, AOD-9604', emoji: '🔬', status: 'research-only', evidence: 'preliminary',
    clinicalReality: 'Growth-factor-related research peptides with no approval for performance use.',
    marketingHype: 'Sold as targeted muscle-growth or fat-loss agents; human evidence is minimal.',
    mechanism: 'IGF-1 pathway or mechano-growth-factor signalling, largely from laboratory work.',
    efficacy: 'Preliminary; unapproved.',
    safety: 'IGF-1 signalling raises theoretical proliferative and metabolic concerns; unregulated sourcing.',
    adverse: ['Hypoglycemia risk (IGF-1 analogues)', 'Theoretical proliferative risk', 'Unknown long-term safety'],
    legal: 'Not approved; prohibited in sport at all times.',
  },
  {
    id: 'other-peptides', name: 'Other marketed peptides', aka: 'MOTS-c, epitalon, GHK-Cu, kisspeptin, DSIP', emoji: '🔬', status: 'research-only', evidence: 'preliminary',
    clinicalReality: 'A range of peptides sold for metabolism, "longevity," sleep, or hormonal effects, essentially all without human approval for these uses.',
    marketingHype: 'Each carries futuristic longevity/performance claims far ahead of the actual evidence.',
    mechanism: 'Varied and mostly preclinical.',
    efficacy: 'Insufficient human evidence; unapproved for the marketed uses.',
    safety: 'Human safety largely uncharacterized; unregulated sourcing.',
    adverse: ['Unknown human safety', 'Sterility/purity risks', 'Unknown long-term effects'],
    legal: 'Not approved as medicines or lawful supplement ingredients; several are prohibited in sport.',
  },
]

// ── WADA-banned metabolic modulators ──────────────────────────────────────────
const MODULATORS: Substance[] = [
  {
    id: 'cardarine', name: 'Cardarine', aka: 'GW-501516', emoji: '⛔', status: 'wada-banned', evidence: 'preliminary',
    clinicalReality: 'A PPARδ agonist whose development was HALTED after animal studies showed it caused cancer at multiple sites. It is sold illegally despite this.',
    marketingHype: 'Marketed as "endurance in a pill" with no mention of the carcinogenicity that ended its development.',
    mechanism: 'PPARδ activation shifts metabolism toward fatty-acid oxidation.',
    efficacy: 'Endurance effects in animals; never approved, and development stopped for safety.',
    safety: 'Discontinued specifically because long-term animal studies showed tumor formation.',
    adverse: ['Carcinogenicity in animal studies', 'Unknown but concerning human risk', 'Unregulated product quality'],
    legal: 'Never approved; prohibited in sport at all times (hormone & metabolic modulators). Illegal to sell for human use.',
  },
  {
    id: 'sr9009', name: 'Stenabolic', aka: 'SR9009', emoji: '⛔', status: 'wada-banned', evidence: 'preliminary',
    clinicalReality: 'A REV-ERB agonist studied only in animals; poor oral bioavailability makes marketed "endurance" claims doubtful.',
    marketingHype: 'Sold as "exercise in a bottle." It was not developed as a human drug and has essentially no human data.',
    mechanism: 'Modulates circadian REV-ERB proteins affecting metabolism and mitochondrial activity.',
    efficacy: 'Animal data only; unapproved; likely poorly absorbed orally.',
    safety: 'No human safety data; unregulated sourcing.',
    adverse: ['Unknown human safety', 'Unknown long-term effects', 'Unregulated product quality'],
    legal: 'Not approved; prohibited in sport at all times. Illegal to sell for human use.',
  },
  {
    id: 'meldonium', name: 'Meldonium', aka: 'Mildronate', emoji: '⛔', status: 'wada-banned', evidence: 'limited',
    clinicalReality: 'A cardiac/metabolic medicine approved in some countries for ischemic conditions — not for performance. It was added to the WADA prohibited list after widespread misuse in sport.',
    marketingHype: 'Rumored to boost endurance and recovery; performance benefit in healthy athletes is not established.',
    mechanism: 'Inhibits carnitine biosynthesis, shifting cardiac energy metabolism toward glucose oxidation.',
    efficacy: 'Clinical use is for ischemic conditions; ergogenic benefit in healthy athletes is unproven.',
    safety: 'Used medically under supervision in some regions; non-medical performance use is unsanctioned.',
    adverse: ['Not established for healthy athletes', 'Use outside approved indications is unmonitored'],
    legal: 'Prohibited in sport at all times. Not approved in many countries (including the US). Not a dietary supplement.',
  },
  {
    id: 'trimetazidine', name: 'Trimetazidine', emoji: '⛔', status: 'wada-banned', evidence: 'limited',
    clinicalReality: 'An anti-anginal medicine, not a performance drug; on the WADA prohibited list as a metabolic modulator.',
    marketingHype: 'Occasionally rumored as an endurance aid; no legitimate performance role.',
    mechanism: 'Modulates cardiac fatty-acid/glucose metabolism.',
    efficacy: 'Approved only for angina in some countries; no performance indication.',
    safety: 'Prescription medicine with its own contraindications (e.g., movement-disorder cautions).',
    adverse: ['Not established for athletic use', 'Neurological cautions in susceptible people'],
    legal: 'Prescription medicine; prohibited in sport at all times. Not a dietary supplement.',
  },
]

// ── Prescription hormonal adjuncts (PCT/fertility agents misused in sport) ─────
const ADJUNCTS: Substance[] = [
  {
    id: 'clomiphene', name: 'Clomiphene / SERMs', aka: 'Clomid, tamoxifen', emoji: '💊', status: 'prescription', evidence: 'moderate',
    clinicalReality: 'Prescription medicines with legitimate uses (fertility, breast-cancer therapy). Misused non-medically to restart hormone production after steroid use — a prohibited practice in sport.',
    marketingHype: 'Sold in the steroid ecosystem as routine "post-cycle therapy." That framing normalizes prescription-drug misuse.',
    mechanism: 'Selective estrogen-receptor modulation that can raise gonadotropins and endogenous testosterone.',
    efficacy: 'Effective for their approved indications; non-medical "PCT" use is not a sanctioned or well-standardized protocol.',
    safety: 'Prescription drugs with real side effects and interactions; require medical oversight.',
    adverse: ['Visual disturbances (clomiphene)', 'Mood changes', 'Thromboembolic risk (tamoxifen)', 'Interactions with other drugs'],
    legal: 'Prescription-only; hormone/metabolic modulators prohibited in sport at all times. Not dietary supplements.',
  },
  {
    id: 'hcg', name: 'hCG & aromatase inhibitors', aka: 'Human chorionic gonadotropin, anastrozole, letrozole', emoji: '💊', status: 'prescription', evidence: 'moderate',
    clinicalReality: 'Prescription hormonal agents with defined medical uses, misused within steroid regimens to manage side effects — prohibited in sport.',
    marketingHype: 'Presented as routine "support" drugs; this normalizes unsupervised prescription-hormone use.',
    mechanism: 'hCG mimics LH to stimulate testosterone; aromatase inhibitors lower estrogen synthesis.',
    efficacy: 'Effective for approved indications; non-medical use is unsanctioned.',
    safety: 'Prescription drugs requiring monitoring; hormonal manipulation carries real risks.',
    adverse: ['Estrogen-suppression effects on bone/lipids/mood (AIs)', 'Hormonal disruption', 'Requires medical monitoring'],
    legal: 'Prescription-only; hCG and anti-estrogens are prohibited in sport (in males for hCG). Not dietary supplements.',
  },
]

const CATEGORIES: Category[] = [
  { id: 'ergogenic', label: 'Evidence-Based Ergogenic Aids', emoji: '✅', blurb: 'Legal, permitted-in-sport supplements with credible evidence. Choose third-party-tested products.', items: ERGOGENIC },
  { id: 'steroids', label: 'Anabolic-Androgenic Steroids', emoji: '⚗️', danger: true, blurb: 'Prescription/controlled hormones. Legitimate medical uses exist; non-medical use for physique is high-risk and prohibited in sport. No doses or protocols are given here — this is educational only.', items: STEROIDS },
  { id: 'sarms', label: 'SARMs', emoji: '🧪', danger: true, blurb: 'Investigational drugs, none approved for human use, illegally sold in "supplements." The FDA has warned against them.', items: SARMS },
  { id: 'peptides', label: 'Peptides & GH Secretagogues', emoji: '🔬', danger: true, blurb: 'Mostly research chemicals with animal-only data and no human approval for performance use. Growth-hormone-related agents are banned in sport.', items: PEPTIDES },
  { id: 'modulators', label: 'WADA-Banned Metabolic Modulators', emoji: '⛔', danger: true, blurb: 'Experimental or prescription agents prohibited in sport; some were abandoned in development for serious safety reasons.', items: MODULATORS },
  { id: 'adjuncts', label: 'Prescription Hormonal Adjuncts', emoji: '💊', danger: true, blurb: 'Prescription medicines with legitimate uses that are misused within steroid regimens. Prohibited in sport.', items: ADJUNCTS },
]

// Self-reported usage-prevalence context (ranges reflect the spread across
// national surveys and reviews; exact figures vary widely by population).
const PREVALENCE = [
  { group: 'Any dietary supplement — general adult population', range: '~50%', note: 'Roughly half of adults report using at least one dietary supplement.' },
  { group: 'Supplement use among competitive/elite athletes', range: '40–70%', note: 'Higher than the general population; protein, creatine, and caffeine dominate.' },
  { group: 'Creatine among strength/team-sport athletes', range: '15–40%', note: 'One of the most commonly used evidence-based aids.' },
  { group: 'Lifetime anabolic-androgenic steroid use (global, males)', range: '~3–6%', note: 'Concentrated in male recreational gym-goers, not only competitive athletes.' },
  { group: 'SARMs / research-chemical use', range: '<1–3%', note: 'Lower prevalence but rising among younger gym populations; often mislabeled products.' },
]

const REFERENCES = [
  'NIH Office of Dietary Supplements — "Dietary Supplements for Exercise and Athletic Performance" (Health Professional Fact Sheet).',
  'Australian Institute of Sport (AIS) Sports Supplement Framework — ABCD classification of supplements by evidence.',
  'International Society of Sports Nutrition (ISSN) position stands (creatine, protein, caffeine, β-alanine, nutrient timing).',
  'World Anti-Doping Agency (WADA) — Prohibited List (updated annually).',
  'U.S. FDA consumer warnings on SARMs and unapproved "research chemical" products.',
  'IOC Consensus Statement on dietary supplements and the high-performance athlete (Br J Sports Med).',
]

function StatusPills({ s }: { s: Substance }) {
  const st = STATUS_META[s.status]
  const ev = EVIDENCE_META[s.evidence]
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={st.tone}>{st.label}</Badge>
      <Badge tone={ev.tone}>{ev.label}</Badge>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-[160px_1fr] sm:gap-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{children}</div>
    </div>
  )
}

function SubstanceCard({ s }: { s: Substance }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-white/5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-4 text-left">
        <span className="text-2xl">{s.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-ink dark:text-white">{s.name}</span>
          </div>
          {s.aka && <div className="truncate text-xs text-neutral-400">{s.aka}</div>}
          <div className="mt-1.5"><StatusPills s={s} /></div>
        </div>
        <span className={'shrink-0 text-neutral-400 transition-transform ' + (open ? 'rotate-90' : '')}>›</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-neutral-100 p-4 dark:border-white/10">
          <Row label="Clinical Reality">{s.clinicalReality}</Row>
          <Row label="Marketing Hype">{s.marketingHype}</Row>
          <Row label="Mechanism">{s.mechanism}</Row>
          <Row label="Evidence of Efficacy">{s.efficacy}</Row>
          <Row label="Evidence of Safety">{s.safety}</Row>
          <Row label="Reported Adverse Effects">
            <ul className="ml-4 list-disc space-y-0.5">{s.adverse.map((a) => <li key={a}>{a}</li>)}</ul>
          </Row>
          <Row label="Regulatory / Legal Status">{s.legal}</Row>
        </div>
      )}
    </div>
  )
}

export function DietarySupplements() {
  const [cat, setCat] = useState<string>('ergogenic')
  const active = useMemo(() => CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0], [cat])

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      {/* Introduction */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconActivity size={20} />}
          title="Dietary Supplements for Exercise & Athletic Performance"
          subtitle="An evidence-review reference, structured like the NIH Office of Dietary Supplements fact sheet"
        />
        <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Athletes and active people use a huge range of products to try to improve performance, recovery, and physique — from
          well-studied nutrients to prescription hormones and unapproved research chemicals. This page reviews what these
          substances actually are, what the evidence does and doesn't show, and their real safety and legal status. The goal is
          informed, honest harm reduction.
        </p>
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <b>Important:</b> This is education, not a how-to guide. It intentionally provides <b>no doses, cycles, or protocols</b> for
          steroids, SARMs, research peptides, or banned agents. Prescription medicines belong under the care of a licensed clinician;
          many substances below are illegal to sell, unapproved, and/or prohibited in sport. Nothing here is medical advice.
        </div>
      </Card>

      {/* Category selector */}
      <Card className="!p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Selected Ingredients — browse by category</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={
                'rounded-full px-3 py-1.5 text-xs font-bold transition ' +
                (cat === c.id
                  ? c.danger ? 'bg-rose-500 text-white' : 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-300')
              }
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Active category */}
      <Card className="!p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{active.emoji}</span>
          <div>
            <h2 className="text-lg font-black text-ink dark:text-white">{active.label}</h2>
            <p className={'mt-1 text-sm leading-relaxed ' + (active.danger ? 'text-rose-600 dark:text-rose-300' : 'text-neutral-500 dark:text-neutral-300')}>{active.blurb}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {active.items.map((s) => <SubstanceCard key={s.id} s={s} />)}
        </div>
      </Card>

      {/* Ingredients banned from dietary supplements */}
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Ingredients Banned From Dietary Supplements" subtitle="Sold as 'supplements' but not lawful supplement ingredients" />
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Several substances above are frequently sold in products labeled as dietary supplements even though they are not lawful
          supplement ingredients — they are unapproved drugs. This includes <b>SARMs</b> (ostarine, ligandrol, RAD-140 and others),
          <b> anabolic steroids</b> and steroid-like compounds, <b>GW-501516 (Cardarine)</b> and <b>SR9009</b>, and various <b>research
          peptides</b> (BPC-157, TB-500, GH secretagogues). Regulators including the U.S. FDA have issued consumer warnings that these
          are not legal dietary ingredients, are often mislabeled or contaminated, and can pose serious health risks.
        </p>
      </Card>

      {/* Regulation */}
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="Regulation" subtitle="How supplements are (and aren't) controlled" />
        <ul className="mt-2 ml-4 list-disc space-y-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <li>Dietary supplements are <b>not</b> reviewed for safety and efficacy before sale the way medicines are; manufacturers are responsible for safety, and regulators act mainly after problems appear.</li>
          <li>Supplements can be <b>contaminated or adulterated</b> with unlabeled drugs (including steroids and stimulants) — a real cause of failed drug tests and health harm.</li>
          <li>Athletes under anti-doping rules are held to <b>strict liability</b>: they are responsible for everything in their body regardless of intent. Third-party certification (NSF Certified for Sport, Informed Sport) reduces but does not eliminate risk.</li>
          <li>Prescription medicines, unapproved drugs, and research chemicals are <b>not</b> dietary supplements and are governed by separate (stricter) laws.</li>
        </ul>
      </Card>

      {/* Safety considerations */}
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Safety Considerations" subtitle="Before using anything" />
        <ul className="mt-2 ml-4 list-disc space-y-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <li>"Natural" and "supplement" do not mean safe, effective, or legal.</li>
          <li>More is not better — several effective aids (caffeine, bicarbonate, creatine) have clear diminishing returns and dose-related side effects.</li>
          <li>Unapproved drugs and research chemicals have <b>uncharacterized long-term safety</b> and frequent quality problems.</li>
          <li>Hormonal manipulation (steroids, SERMs, GH agents) can cause lasting endocrine, cardiovascular, and psychological effects.</li>
          <li>Discuss any supplement or substance with a qualified clinician, especially with existing conditions, pregnancy, or other medications.</li>
        </ul>
      </Card>

      {/* Choosing a sensible approach */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Choosing a Sensible Approach" subtitle="Foundations first" />
        <ol className="mt-2 ml-4 list-decimal space-y-1.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          <li><b>Get the basics right first:</b> training, total energy and protein, sleep, and recovery drive the vast majority of results.</li>
          <li><b>Use only well-evidenced, permitted aids</b> where they fit your sport (e.g. creatine, caffeine, β-alanine, nitrate).</li>
          <li><b>Prefer third-party-tested products</b> to reduce contamination and doping risk.</li>
          <li><b>Avoid unapproved drugs and research chemicals</b> — the risk/benefit and legal exposure are unfavorable.</li>
          <li><b>Involve a clinician or accredited sports dietitian</b> for individualized, safe decisions.</li>
        </ol>
      </Card>

      {/* Usage prevalence */}
      <Card className="!p-5">
        <SectionTitle icon={<IconChartUp size={20} />} title="Reported Usage Prevalence" subtitle="Approximate ranges from surveys & reviews — figures vary widely by population" />
        <div className="mt-3 space-y-2">
          {PREVALENCE.map((p) => (
            <div key={p.group} className="rounded-xl bg-neutral-50 p-3 dark:bg-white/5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-ink dark:text-white">{p.group}</span>
                <span className="shrink-0 text-sm font-black text-brand-dark">{p.range}</span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{p.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* References */}
      <Card className="!p-5">
        <SectionTitle icon={<IconShield size={20} />} title="References & Further Reading" />
        <ul className="mt-2 ml-4 list-disc space-y-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {REFERENCES.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        This page is educational and does not constitute medical advice, diagnosis, or treatment, and is not an endorsement or
        instruction to use any substance. Prescription medicines require a licensed clinician. Many substances described are
        unapproved, illegal to sell, and/or prohibited in sport. Always consult a qualified healthcare professional and comply with
        the anti-doping rules and laws that apply to you.
      </div>
    </div>
  )
}

export default DietarySupplements

import type { AtlasSystemId } from './atlasKernel'
import type {
  FunctionalNodeRef,
  FunctionalPathwayKind,
  FunctionalProcess,
  FunctionalSignalDomain,
  FunctionalOverlayIntent,
  FunctionalTopologyEdge,
  FunctionalTopologyManifest,
  FunctionalTopologyPathway,
} from './atlasFunctionalTopology'

const PROVENANCE = {
  sourceId: 'panacea-whole-body-functional-topology-scaffold',
  sourceRevision: '2026-09-10-r1',
  sourceLocator: 'src/lib/anatomy/wholeBodyFunctionalTopology.ts',
  license: 'Internal educational topology scaffold; no third-party physiology animation or patient data bundled',
  reviewStatus: 'academic-review-required' as const,
  reviewerScope: 'Engineering-authored qualitative topology only; pathway anatomy/physiology requires qualified human academic review before authoritative publication.',
}

const a = (id: string): FunctionalNodeRef => ({ namespace: 'atlas', id })
const b = (id: string): FunctionalNodeRef => ({ namespace: 'bio', id })
const k = (ref: FunctionalNodeRef) => `${ref.namespace}:${ref.id}`

function edge(
  id: string,
  from: FunctionalNodeRef,
  to: FunctionalNodeRef,
  process: FunctionalProcess,
  signalDomain: FunctionalSignalDomain,
  overlayIntent: FunctionalOverlayIntent,
  note?: string,
): FunctionalTopologyEdge {
  return { id, from, to, process, signalDomain, overlayIntent, note }
}

function pathway(input: {
  id: string
  label: string
  kind: FunctionalPathwayKind
  systems: readonly AtlasSystemId[]
  nodes: readonly FunctionalNodeRef[]
  edges: readonly FunctionalTopologyEdge[]
  entryRefs: readonly FunctionalNodeRef[]
  terminalRefs: readonly FunctionalNodeRef[]
  crossSystemAllowed?: boolean
  cyclicAllowed?: boolean
  educationalPurpose: string
}): FunctionalTopologyPathway {
  return {
    ...input,
    crossSystemAllowed: input.crossSystemAllowed ?? false,
    cyclicAllowed: input.cyclicAllowed ?? false,
    qualitativeOnly: true,
    patientSpecificAllowed: false,
    provenance: PROVENANCE,
  }
}

const skinEnvelope = a('he:skin-envelope')
const epidermis = a('he:epidermis')
const keratinocyte = b('bio:surface:keratinocyte')
const lamellarGranule = b('bio:surface:lamellar-granule')
const barrierLipids = b('bio:surface:barrier-lipid-complex')

const thoracicCage = a('he:thoracic-cage')
const osteoblast = b('bio:skeletal:osteoblast')
const osteoblastRer = b('bio:skeletal:osteoblast-rer')
const collagenMineral = b('bio:skeletal:collagen-i-mineral-interface')

const kneeComplex = a('he:knee-complex')
const synovialMembrane = a('he:synovial-membrane')
const chondrocyte = b('bio:articular:chondrocyte')
const chondrocyteRer = b('bio:articular:chondrocyte-rer')
const cartilageMatrix = b('bio:articular:collagen-ii-aggrecan-matrix')

const diaphragm = a('he:diaphragm-muscle')
const sarcomere = a('he:sarcomere-unit')
const skeletalMyocyte = b('bio:muscular:skeletal-myocyte')
const sarcoplasmicReticulum = b('bio:muscular:sarcoplasmic-reticulum')
const excitationContraction = b('bio:muscular:excitation-contraction-complex')

const heart = a('cv:heart')
const aorta = a('cv:aorta')
const systemicArteries = a('he:systemic-arterial-tree')
const systemicCapillary = a('he:systemic-capillary-bed')

const portalVeins = a('he:portal-venous-system')
const liver = a('gi:liver')
const hepaticLobule = a('he:hepatic-lobule')
const hepatocyte = b('bio:digestive:hepatocyte')
const hepatocyteSer = b('bio:digestive:hepatocyte-smooth-er')
const cyp450 = b('bio:digestive:cytochrome-p450-system')

const lymphCapillary = a('he:lymphatic-capillary')
const inguinalNodes = a('he:inguinal-lymph-nodes')
const thoracicDuct = a('he:thoracic-duct')

const brain = a('neuro:brain')
const brainstem = a('neuro:brainstem')
const spinalCord = a('neuro:spinal-cord')
const lumbosacralPlexus = a('he:lumbosacral-plexus')
const nerveFascicle = a('he:peripheral-nerve-fascicle')
const cortex = a('he:cerebral-cortex')
const projectionNeuron = b('bio:nervous:projection-neuron')
const synapticVesicle = b('bio:nervous:synaptic-vesicle')
const snareComplex = b('bio:nervous:snare-release-complex')

const nasalCavity = a('resp:nasal-cavity')
const pharynx = a('resp:pharynx')
const larynx = a('resp:larynx')
const trachea = a('resp:trachea')
const carina = a('resp:carina')
const rightMainBronchus = a('resp:right-main-bronchus')
const leftMainBronchus = a('resp:left-main-bronchus')
const rightUpperLobe = a('resp:right-upper-lobe')
const leftUpperLobe = a('resp:left-upper-lobe')
const rightS1 = a('resp:segment:r-s1')
const leftS12 = a('resp:segment:l-s1-2')
const pulmonaryAcinus = a('he:pulmonary-acinus')
const gasBarrier = a('he:alveolar-blood-gas-barrier')
const typeIPneumocyte = b('bio:respiratory:type-i-pneumocyte')
const gasDiffusionInterface = b('bio:respiratory:gas-diffusion-interface')
const typeIIPneumocyte = b('bio:respiratory:type-ii-pneumocyte')
const lamellarBody = b('bio:respiratory:lamellar-body')
const surfactantComplex = b('bio:respiratory:surfactant-complex')

const esophagealWall = a('he:esophageal-wall')
const stomach = a('gi:stomach')
const smallIntestine = a('gi:small-intestine')
const villus = a('he:intestinal-villus')
const largeIntestine = a('gi:large-intestine')
const anorectal = a('he:anorectal-complex')

const kidneys = a('urinary:kidneys')
const renalCortex = a('he:renal-cortex')
const glomerulus = a('he:glomerulus')
const nephron = a('he:nephron')
const ureters = a('urinary:ureters')
const bladder = a('urinary:bladder')
const urethra = a('he:urethra')
const podocyte = b('bio:urinary:podocyte')
const slitDomain = b('bio:urinary:slit-diaphragm-domain')
const nephrinPodocin = b('bio:urinary:nephrin-podocin-complex')

const hpAxis = a('he:hypothalamic-pituitary-axis')
const pituitary = a('endo:pituitary')
const thyroid = a('endo:thyroid')
const thyroidFollicle = a('he:thyroid-follicle')
const pancreaticIslet = a('he:pancreatic-islet')
const betaCell = b('bio:endocrine:pancreatic-beta-cell')
const insulinGranule = b('bio:endocrine:insulin-secretory-granule')
const insulinProcessing = b('bio:endocrine:insulin-processing-axis')

const seminiferousTubule = a('he:seminiferous-tubule')
const spermatid = b('bio:reproductive:spermatid')
const acrosome = b('bio:reproductive:acrosome')
const acrosomalComplex = b('bio:reproductive:acrosomal-enzyme-complex')

const ocularGlobe = a('he:ocular-globe')
const retina = a('he:retina')
const photoreceptorUnit = a('he:retinal-photoreceptor-unit')
const rod = b('bio:sensory:rod-photoreceptor')
const outerDisc = b('bio:sensory:outer-segment-disc')
const phototransduction = b('bio:sensory:phototransduction-complex')

const deepFascia = a('he:deep-fascia')
const fibroblast = b('bio:fascial:fibroblast')
const fibroblastRer = b('bio:fascial:fibroblast-rer')
const collagenMatrix = b('bio:fascial:collagen-i-iii-matrix')

export const WHOLE_BODY_FUNCTIONAL_TOPOLOGY: FunctionalTopologyManifest = {
  id: 'panacea-whole-body-functional-topology',
  revision: '2026-09-10-r1-qualitative-graph',
  pathways: [
    pathway({
      id: 'functional:skin-barrier-homeostasis',
      label: 'Epidermal barrier homeostasis — scale bridge',
      kind: 'barrier-homeostasis',
      systems: ['surface'],
      nodes: [skinEnvelope, epidermis, keratinocyte, lamellarGranule, barrierLipids],
      edges: [
        edge('skin:envelope-epidermis', skinEnvelope, epidermis, 'interfaces', 'structural-program', 'structural-highlight'),
        edge('skin:epidermis-keratinocyte', epidermis, keratinocyte, 'maintains', 'structural-program', 'gradient'),
        edge('skin:keratinocyte-lamellar', keratinocyte, lamellarGranule, 'synthesizes', 'chemical-signal', 'pulse'),
        edge('skin:lamellar-lipids', lamellarGranule, barrierLipids, 'secretes', 'material-flow', 'directional-flow'),
      ],
      entryRefs: [skinEnvelope], terminalRefs: [barrierLipids],
      educationalPurpose: 'Connect macroscopic skin anatomy to an explicitly reference-only cellular/subcellular/molecular barrier narrative.',
    }),
    pathway({
      id: 'functional:bone-matrix-homeostasis',
      label: 'Bone matrix formation — scale bridge',
      kind: 'matrix-homeostasis',
      systems: ['skeletal'],
      nodes: [thoracicCage, osteoblast, osteoblastRer, collagenMineral],
      edges: [
        edge('bone:organ-osteoblast', thoracicCage, osteoblast, 'maintains', 'structural-program', 'gradient'),
        edge('bone:osteoblast-rer', osteoblast, osteoblastRer, 'synthesizes', 'structural-program', 'pulse'),
        edge('bone:rer-matrix', osteoblastRer, collagenMineral, 'synthesizes', 'material-flow', 'structural-highlight'),
      ],
      entryRefs: [thoracicCage], terminalRefs: [collagenMineral],
      educationalPurpose: 'Provide a qualitative organ-to-cell-to-matrix bridge without implying patient histology or remodeling rate.',
    }),
    pathway({
      id: 'functional:articular-matrix-homeostasis',
      label: 'Articular tissue and matrix homeostasis — scale bridge',
      kind: 'matrix-homeostasis', systems: ['articular'],
      nodes: [kneeComplex, synovialMembrane, chondrocyte, chondrocyteRer, cartilageMatrix],
      edges: [
        edge('joint:knee-synovium', kneeComplex, synovialMembrane, 'interfaces', 'structural-program', 'structural-highlight'),
        edge('joint:synovium-chondrocyte', synovialMembrane, chondrocyte, 'maintains', 'structural-program', 'gradient'),
        edge('joint:chondrocyte-rer', chondrocyte, chondrocyteRer, 'synthesizes', 'structural-program', 'pulse'),
        edge('joint:rer-matrix', chondrocyteRer, cartilageMatrix, 'synthesizes', 'material-flow', 'structural-highlight'),
      ],
      entryRefs: [kneeComplex], terminalRefs: [cartilageMatrix],
      educationalPurpose: 'Demonstrate a bounded joint-to-cell matrix narrative while keeping the molecular representation non-geometric.',
    }),
    pathway({
      id: 'functional:excitation-contraction-scale',
      label: 'Skeletal muscle excitation–contraction scale pathway',
      kind: 'excitation-contraction', systems: ['muscular'],
      nodes: [diaphragm, sarcomere, skeletalMyocyte, sarcoplasmicReticulum, excitationContraction],
      edges: [
        edge('muscle:diaphragm-sarcomere', diaphragm, sarcomere, 'contracts', 'mechanical-state', 'gradient'),
        edge('muscle:sarcomere-myocyte', sarcomere, skeletalMyocyte, 'interfaces', 'structural-program', 'structural-highlight'),
        edge('muscle:myocyte-sr', skeletalMyocyte, sarcoplasmicReticulum, 'conducts', 'electrical-signal', 'pulse'),
        edge('muscle:sr-ec', sarcoplasmicReticulum, excitationContraction, 'transduces', 'chemical-signal', 'pulse'),
      ],
      entryRefs: [diaphragm], terminalRefs: [excitationContraction],
      educationalPurpose: 'Bridge muscle organ mechanics to reference-only excitation–contraction machinery without quantitative force or calcium kinetics.',
    }),
    pathway({
      id: 'functional:systemic-perfusion',
      label: 'Systemic arterial perfusion topology',
      kind: 'perfusion', systems: ['cardiovascular'],
      nodes: [heart, aorta, systemicArteries, systemicCapillary],
      edges: [
        edge('perfusion:heart-aorta', heart, aorta, 'transports', 'material-flow', 'directional-flow'),
        edge('perfusion:aorta-arteries', aorta, systemicArteries, 'transports', 'material-flow', 'directional-flow'),
        edge('perfusion:arteries-capillary', systemicArteries, systemicCapillary, 'transports', 'material-flow', 'gradient'),
      ],
      entryRefs: [heart], terminalRefs: [systemicCapillary],
      educationalPurpose: 'Represent directional arterial delivery topology only; no blood pressure, velocity, resistance, or perfusion value is inferred.',
    }),
    pathway({
      id: 'functional:portal-hepatic-interface',
      label: 'Portal venous to hepatic lobule interface',
      kind: 'portal-flow', systems: ['cardiovascular', 'digestive'], crossSystemAllowed: true,
      nodes: [portalVeins, liver, hepaticLobule, hepatocyte, hepatocyteSer, cyp450],
      edges: [
        edge('portal:vein-liver', portalVeins, liver, 'transports', 'material-flow', 'directional-flow'),
        edge('portal:liver-lobule', liver, hepaticLobule, 'transports', 'material-flow', 'gradient'),
        edge('portal:lobule-hepatocyte', hepaticLobule, hepatocyte, 'exchanges', 'exchange-interface', 'exchange-glow'),
        edge('portal:hepatocyte-ser', hepatocyte, hepatocyteSer, 'maintains', 'structural-program', 'structural-highlight'),
        edge('portal:ser-cyp', hepatocyteSer, cyp450, 'transduces', 'chemical-signal', 'pulse'),
      ],
      entryRefs: [portalVeins], terminalRefs: [cyp450],
      educationalPurpose: 'Connect portal circulation and hepatic microstructure to a reference-only hepatocyte molecular processing narrative.',
    }),
    pathway({
      id: 'functional:representative-lower-body-lymph-drainage',
      label: 'Representative lower-body lymph drainage topology',
      kind: 'lymph-drainage', systems: ['lymphatic'],
      nodes: [lymphCapillary, inguinalNodes, thoracicDuct],
      edges: [
        edge('lymph:capillary-inguinal', lymphCapillary, inguinalNodes, 'drains', 'material-flow', 'directional-flow', 'Representative lower-body educational route, not a universal drainage assignment for every lymphatic capillary.'),
        edge('lymph:inguinal-thoracic-duct', inguinalNodes, thoracicDuct, 'drains', 'material-flow', 'directional-flow', 'Simplified route for topology visualization; intermediate nodal/collecting anatomy is intentionally not fabricated.'),
      ],
      entryRefs: [lymphCapillary], terminalRefs: [thoracicDuct],
      educationalPurpose: 'Demonstrate directional lymph drainage while explicitly preserving missing intermediate anatomy instead of inventing it.',
    }),
    pathway({
      id: 'functional:descending-neural-conduction',
      label: 'Central-to-peripheral neural conduction scaffold',
      kind: 'neural-conduction', systems: ['nervous'],
      nodes: [brain, brainstem, spinalCord, lumbosacralPlexus, nerveFascicle],
      edges: [
        edge('neural:brain-brainstem', brain, brainstem, 'conducts', 'electrical-signal', 'pulse'),
        edge('neural:brainstem-cord', brainstem, spinalCord, 'conducts', 'electrical-signal', 'pulse'),
        edge('neural:cord-plexus', spinalCord, lumbosacralPlexus, 'conducts', 'electrical-signal', 'directional-flow'),
        edge('neural:plexus-fascicle', lumbosacralPlexus, nerveFascicle, 'conducts', 'electrical-signal', 'directional-flow'),
      ],
      entryRefs: [brain], terminalRefs: [nerveFascicle],
      educationalPurpose: 'Provide a high-level conduction topology without claiming tract-level localization, conduction velocity, lesion diagnosis, or patient-specific innervation.',
    }),
    pathway({
      id: 'functional:cortical-synaptic-scale',
      label: 'Cortical neuron to synaptic release machinery',
      kind: 'neural-conduction', systems: ['nervous'],
      nodes: [cortex, projectionNeuron, synapticVesicle, snareComplex],
      edges: [
        edge('synapse:cortex-neuron', cortex, projectionNeuron, 'conducts', 'electrical-signal', 'pulse'),
        edge('synapse:neuron-vesicle', projectionNeuron, synapticVesicle, 'transduces', 'chemical-signal', 'pulse'),
        edge('synapse:vesicle-snare', synapticVesicle, snareComplex, 'secretes', 'chemical-signal', 'exchange-glow'),
      ],
      entryRefs: [cortex], terminalRefs: [snareComplex],
      educationalPurpose: 'Bridge cortical tissue to conceptual synaptic machinery without quantitative electrophysiology.',
    }),
    pathway({
      id: 'functional:respiratory-airflow-gas-exchange',
      label: 'Branched airway to alveolar gas-exchange topology',
      kind: 'airflow-gas-exchange', systems: ['respiratory'],
      nodes: [nasalCavity, pharynx, larynx, trachea, carina, rightMainBronchus, leftMainBronchus, rightUpperLobe, leftUpperLobe, rightS1, leftS12, pulmonaryAcinus, gasBarrier, typeIPneumocyte, gasDiffusionInterface],
      edges: [
        edge('air:nose-pharynx', nasalCavity, pharynx, 'transports', 'material-flow', 'directional-flow'),
        edge('air:pharynx-larynx', pharynx, larynx, 'transports', 'material-flow', 'directional-flow'),
        edge('air:larynx-trachea', larynx, trachea, 'transports', 'material-flow', 'directional-flow'),
        edge('air:trachea-carina', trachea, carina, 'transports', 'material-flow', 'directional-flow'),
        edge('air:carina-right', carina, rightMainBronchus, 'transports', 'material-flow', 'directional-flow'),
        edge('air:carina-left', carina, leftMainBronchus, 'transports', 'material-flow', 'directional-flow'),
        edge('air:right-rul', rightMainBronchus, rightUpperLobe, 'transports', 'material-flow', 'directional-flow'),
        edge('air:left-lul', leftMainBronchus, leftUpperLobe, 'transports', 'material-flow', 'directional-flow'),
        edge('air:rul-s1', rightUpperLobe, rightS1, 'transports', 'material-flow', 'directional-flow'),
        edge('air:lul-s12', leftUpperLobe, leftS12, 'transports', 'material-flow', 'directional-flow'),
        edge('air:right-segment-acinus', rightS1, pulmonaryAcinus, 'transports', 'material-flow', 'gradient'),
        edge('air:left-segment-acinus', leftS12, pulmonaryAcinus, 'transports', 'material-flow', 'gradient'),
        edge('air:acinus-barrier', pulmonaryAcinus, gasBarrier, 'exchanges', 'exchange-interface', 'exchange-glow'),
        edge('air:barrier-at1', gasBarrier, typeIPneumocyte, 'interfaces', 'exchange-interface', 'exchange-glow'),
        edge('air:at1-diffusion', typeIPneumocyte, gasDiffusionInterface, 'exchanges', 'exchange-interface', 'exchange-glow'),
      ],
      entryRefs: [nasalCavity], terminalRefs: [gasDiffusionInterface],
      educationalPurpose: 'Support branched qualitative airflow and gas-exchange visualization without deriving flow rate, airway resistance, gas tension, V/Q, or patient physiology.',
    }),
    pathway({
      id: 'functional:surfactant-secretory-scale',
      label: 'Type-II pneumocyte surfactant secretory pathway',
      kind: 'airflow-gas-exchange', systems: ['respiratory'],
      nodes: [gasBarrier, typeIIPneumocyte, lamellarBody, surfactantComplex],
      edges: [
        edge('surfactant:barrier-at2', gasBarrier, typeIIPneumocyte, 'interfaces', 'structural-program', 'structural-highlight'),
        edge('surfactant:at2-lamellar', typeIIPneumocyte, lamellarBody, 'synthesizes', 'chemical-signal', 'pulse'),
        edge('surfactant:lamellar-complex', lamellarBody, surfactantComplex, 'secretes', 'material-flow', 'exchange-glow'),
      ],
      entryRefs: [gasBarrier], terminalRefs: [surfactantComplex],
      educationalPurpose: 'Connect the alveolar barrier to an explicitly reference-only surfactant secretory narrative.',
    }),
    pathway({
      id: 'functional:digestive-transit',
      label: 'Digestive luminal transit topology',
      kind: 'digestive-transit', systems: ['digestive'],
      nodes: [esophagealWall, stomach, smallIntestine, villus, largeIntestine, anorectal],
      edges: [
        edge('gi:esophagus-stomach', esophagealWall, stomach, 'transports', 'material-flow', 'directional-flow'),
        edge('gi:stomach-small-bowel', stomach, smallIntestine, 'transports', 'material-flow', 'directional-flow'),
        edge('gi:small-bowel-villus', smallIntestine, villus, 'absorbs', 'exchange-interface', 'exchange-glow'),
        edge('gi:small-large-bowel', smallIntestine, largeIntestine, 'transports', 'material-flow', 'directional-flow'),
        edge('gi:large-anorectal', largeIntestine, anorectal, 'transports', 'material-flow', 'directional-flow'),
      ],
      entryRefs: [esophagealWall], terminalRefs: [villus, anorectal],
      educationalPurpose: 'Provide branching transit/absorption topology without motility timing, nutrient flux, or patient-specific GI modeling.',
    }),
    pathway({
      id: 'functional:renal-filtration-urinary-flow',
      label: 'Glomerular filtration to urinary outflow topology',
      kind: 'filtration-urinary-flow', systems: ['urinary'],
      nodes: [kidneys, renalCortex, glomerulus, nephron, ureters, bladder, urethra, podocyte, slitDomain, nephrinPodocin],
      edges: [
        edge('renal:kidney-cortex', kidneys, renalCortex, 'interfaces', 'structural-program', 'structural-highlight'),
        edge('renal:cortex-glomerulus', renalCortex, glomerulus, 'filters', 'material-flow', 'gradient'),
        edge('renal:glomerulus-nephron', glomerulus, nephron, 'filters', 'material-flow', 'directional-flow'),
        edge('renal:nephron-ureter', nephron, ureters, 'transports', 'material-flow', 'directional-flow'),
        edge('renal:ureter-bladder', ureters, bladder, 'transports', 'material-flow', 'directional-flow'),
        edge('renal:bladder-urethra', bladder, urethra, 'transports', 'material-flow', 'directional-flow'),
        edge('renal:glomerulus-podocyte', glomerulus, podocyte, 'interfaces', 'exchange-interface', 'exchange-glow'),
        edge('renal:podocyte-slit', podocyte, slitDomain, 'filters', 'exchange-interface', 'exchange-glow'),
        edge('renal:slit-nephrin', slitDomain, nephrinPodocin, 'maintains', 'structural-program', 'structural-highlight'),
      ],
      entryRefs: [kidneys], terminalRefs: [urethra, nephrinPodocin],
      educationalPurpose: 'Combine macroscopic urinary outflow with a reference-only glomerular filtration branch; no GFR, pressure, clearance, or patient renal function is inferred.',
    }),
    pathway({
      id: 'functional:hypothalamic-pituitary-thyroid-topology',
      label: 'Hypothalamic–pituitary–thyroid signaling topology',
      kind: 'endocrine-signaling', systems: ['endocrine'],
      nodes: [hpAxis, pituitary, thyroid, thyroidFollicle],
      edges: [
        edge('endo:axis-pituitary', hpAxis, pituitary, 'conducts', 'chemical-signal', 'pulse'),
        edge('endo:pituitary-thyroid', pituitary, thyroid, 'transports', 'chemical-signal', 'directional-flow'),
        edge('endo:thyroid-follicle', thyroid, thyroidFollicle, 'secretes', 'chemical-signal', 'exchange-glow'),
      ],
      entryRefs: [hpAxis], terminalRefs: [thyroidFollicle],
      educationalPurpose: 'Represent endocrine signaling direction qualitatively; no hormone concentration, feedback gain, diagnosis, or dosing is modeled.',
    }),
    pathway({
      id: 'functional:pancreatic-beta-secretory-scale',
      label: 'Pancreatic beta-cell secretory scale pathway',
      kind: 'endocrine-signaling', systems: ['endocrine'],
      nodes: [pancreaticIslet, betaCell, insulinGranule, insulinProcessing],
      edges: [
        edge('beta:islet-cell', pancreaticIslet, betaCell, 'secretes', 'chemical-signal', 'gradient'),
        edge('beta:cell-granule', betaCell, insulinGranule, 'synthesizes', 'chemical-signal', 'pulse'),
        edge('beta:granule-processing', insulinGranule, insulinProcessing, 'secretes', 'chemical-signal', 'exchange-glow'),
      ],
      entryRefs: [pancreaticIslet], terminalRefs: [insulinProcessing],
      educationalPurpose: 'Connect endocrine microstructure to conceptual insulin secretory machinery without glucose-response kinetics or patient inference.',
    }),
    pathway({
      id: 'functional:male-germ-cell-scale',
      label: 'Seminiferous to spermatid/acrosomal scale pathway',
      kind: 'reproductive-cell-program', systems: ['reproductive'],
      nodes: [seminiferousTubule, spermatid, acrosome, acrosomalComplex],
      edges: [
        edge('repro:tubule-spermatid', seminiferousTubule, spermatid, 'maintains', 'structural-program', 'gradient'),
        edge('repro:spermatid-acrosome', spermatid, acrosome, 'synthesizes', 'structural-program', 'pulse'),
        edge('repro:acrosome-complex', acrosome, acrosomalComplex, 'maintains', 'structural-program', 'structural-highlight'),
      ],
      entryRefs: [seminiferousTubule], terminalRefs: [acrosomalComplex],
      educationalPurpose: 'Provide a reference-only spermatid/acrosomal scale bridge, not a fertility assessment or gamete-quality model.',
    }),
    pathway({
      id: 'functional:retinal-phototransduction',
      label: 'Retinal phototransduction scale pathway',
      kind: 'sensory-transduction', systems: ['sensory'],
      nodes: [ocularGlobe, retina, photoreceptorUnit, rod, outerDisc, phototransduction],
      edges: [
        edge('vision:eye-retina', ocularGlobe, retina, 'interfaces', 'structural-program', 'structural-highlight'),
        edge('vision:retina-unit', retina, photoreceptorUnit, 'transduces', 'electrical-signal', 'gradient'),
        edge('vision:unit-rod', photoreceptorUnit, rod, 'transduces', 'electrical-signal', 'pulse'),
        edge('vision:rod-disc', rod, outerDisc, 'transduces', 'chemical-signal', 'pulse'),
        edge('vision:disc-complex', outerDisc, phototransduction, 'transduces', 'chemical-signal', 'exchange-glow'),
      ],
      entryRefs: [ocularGlobe], terminalRefs: [phototransduction],
      educationalPurpose: 'Bridge eye/retina anatomy to conceptual phototransduction machinery without retinal response amplitude or patient visual-function inference.',
    }),
    pathway({
      id: 'functional:fascial-matrix-homeostasis',
      label: 'Deep fascia to fibroblast matrix homeostasis',
      kind: 'matrix-homeostasis', systems: ['fascial'],
      nodes: [deepFascia, fibroblast, fibroblastRer, collagenMatrix],
      edges: [
        edge('fascia:deep-fibroblast', deepFascia, fibroblast, 'maintains', 'structural-program', 'gradient'),
        edge('fascia:fibroblast-rer', fibroblast, fibroblastRer, 'synthesizes', 'structural-program', 'pulse'),
        edge('fascia:rer-matrix', fibroblastRer, collagenMatrix, 'synthesizes', 'material-flow', 'structural-highlight'),
      ],
      entryRefs: [deepFascia], terminalRefs: [collagenMatrix],
      educationalPurpose: 'Provide a deep-fascia to reference-only fibroblast/matrix scale narrative without claiming force magnitude or tissue pathology.',
    }),
  ],
}

// Compile-time/readability guard: every authored node is addressable by a stable namespace key.
export const WHOLE_BODY_FUNCTIONAL_REF_KEYS = [...new Set(
  WHOLE_BODY_FUNCTIONAL_TOPOLOGY.pathways.flatMap((item) => item.nodes.map(k)),
)].sort()

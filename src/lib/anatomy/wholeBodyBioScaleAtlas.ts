import type { AtlasSystemId } from './atlasKernel'
import {
  deriveCanonicalBioScaleHierarchy,
  type BioScale,
  type BioScaleManifest,
  type BioScaleNode,
  type BioStructureKind,
} from './bioScaleAtlas'

const BIOSCALE_PROVENANCE = {
  sourceId: 'panacea-whole-body-bioscale-educational-scaffold',
  sourceRevision: '2026-09-10-r1',
  license: 'Internal educational metadata scaffold; no third-party microscopy or molecular geometry bundled',
  sourceLocator: 'src/lib/anatomy/wholeBodyBioScaleAtlas.ts',
  reviewStatus: 'academic-review-required' as const,
  reviewerScope: 'Engineering ontology and educational naming only; biomedical publication requires qualified human review and source-specific evidence.',
}

type Definition = {
  id: string
  label: string
  system: AtlasSystemId
  scale: BioScale
  kind: BioStructureKind
  anchorAtlasNodeId: string
  parentId?: string
  synonyms?: readonly string[]
  physiologyCapable?: boolean
  relations?: BioScaleNode['relations']
}

const DEFINITIONS: readonly Definition[] = [
  // Surface / integumentary
  { id: 'bio:surface:keratinocyte', label: 'Epidermal keratinocyte', system: 'surface', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:epidermis', physiologyCapable: true },
  { id: 'bio:surface:lamellar-granule', label: 'Keratinocyte lamellar granule', system: 'surface', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:epidermis', parentId: 'bio:surface:keratinocyte', physiologyCapable: true },
  { id: 'bio:surface:barrier-lipid-complex', label: 'Stratum-corneum barrier lipid complex', system: 'surface', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:epidermis', parentId: 'bio:surface:lamellar-granule', physiologyCapable: true },

  // Skeletal
  { id: 'bio:skeletal:osteoblast', label: 'Osteoblast', system: 'skeletal', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'system:skeletal', physiologyCapable: true },
  { id: 'bio:skeletal:osteoblast-rer', label: 'Osteoblast rough endoplasmic reticulum', system: 'skeletal', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'system:skeletal', parentId: 'bio:skeletal:osteoblast', physiologyCapable: true },
  { id: 'bio:skeletal:collagen-i-mineral-interface', label: 'Type-I collagen–mineral matrix interface', system: 'skeletal', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'system:skeletal', parentId: 'bio:skeletal:osteoblast-rer', physiologyCapable: true },

  // Articular
  { id: 'bio:articular:chondrocyte', label: 'Articular chondrocyte', system: 'articular', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:synovial-membrane', physiologyCapable: true },
  { id: 'bio:articular:chondrocyte-rer', label: 'Chondrocyte rough endoplasmic reticulum', system: 'articular', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:synovial-membrane', parentId: 'bio:articular:chondrocyte', physiologyCapable: true },
  { id: 'bio:articular:collagen-ii-aggrecan-matrix', label: 'Type-II collagen–aggrecan matrix complex', system: 'articular', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:synovial-membrane', parentId: 'bio:articular:chondrocyte-rer', physiologyCapable: true },

  // Muscular
  { id: 'bio:muscular:skeletal-myocyte', label: 'Skeletal myocyte', system: 'muscular', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:sarcomere-unit', physiologyCapable: true },
  { id: 'bio:muscular:sarcoplasmic-reticulum', label: 'Sarcoplasmic reticulum', system: 'muscular', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:sarcomere-unit', parentId: 'bio:muscular:skeletal-myocyte', physiologyCapable: true },
  { id: 'bio:muscular:excitation-contraction-complex', label: 'Excitation–contraction coupling complex', system: 'muscular', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:sarcomere-unit', parentId: 'bio:muscular:sarcoplasmic-reticulum', physiologyCapable: true },

  // Cardiovascular
  { id: 'bio:cardiovascular:cardiomyocyte', label: 'Cardiomyocyte', system: 'cardiovascular', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'cv:heart', physiologyCapable: true },
  { id: 'bio:cardiovascular:cardiomyocyte-mitochondrion', label: 'Cardiomyocyte mitochondrion', system: 'cardiovascular', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'cv:heart', parentId: 'bio:cardiovascular:cardiomyocyte', physiologyCapable: true },
  { id: 'bio:cardiovascular:oxidative-phosphorylation-complex', label: 'Mitochondrial oxidative-phosphorylation machinery', system: 'cardiovascular', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'cv:heart', parentId: 'bio:cardiovascular:cardiomyocyte-mitochondrion', physiologyCapable: true },

  // Lymphatic
  { id: 'bio:lymphatic:lymphatic-endothelial-cell', label: 'Lymphatic endothelial cell', system: 'lymphatic', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:lymphatic-capillary', physiologyCapable: true },
  { id: 'bio:lymphatic:endothelial-junction-domain', label: 'Lymphatic endothelial junction domain', system: 'lymphatic', scale: 'subcellular', kind: 'specialized-compartment', anchorAtlasNodeId: 'he:lymphatic-capillary', parentId: 'bio:lymphatic:lymphatic-endothelial-cell', physiologyCapable: true },
  { id: 'bio:lymphatic:vegfr3-prox1-program', label: 'VEGFR3–PROX1 lymphatic identity/signaling program', system: 'lymphatic', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:lymphatic-capillary', parentId: 'bio:lymphatic:endothelial-junction-domain', physiologyCapable: true },

  // Nervous
  { id: 'bio:nervous:projection-neuron', label: 'Projection neuron', system: 'nervous', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:cerebral-cortex', physiologyCapable: true },
  { id: 'bio:nervous:synaptic-vesicle', label: 'Synaptic vesicle', system: 'nervous', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:cerebral-cortex', parentId: 'bio:nervous:projection-neuron', physiologyCapable: true },
  { id: 'bio:nervous:snare-release-complex', label: 'SNARE neurotransmitter-release complex', system: 'nervous', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:cerebral-cortex', parentId: 'bio:nervous:synaptic-vesicle', physiologyCapable: true },

  // Respiratory — deep dive beyond organ-level atlas
  { id: 'bio:respiratory:type-ii-pneumocyte', label: 'Type II pneumocyte', system: 'respiratory', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:alveolar-blood-gas-barrier', synonyms: ['alveolar type II cell', 'AT2 cell'], physiologyCapable: true },
  { id: 'bio:respiratory:lamellar-body', label: 'Type II pneumocyte lamellar body', system: 'respiratory', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:alveolar-blood-gas-barrier', parentId: 'bio:respiratory:type-ii-pneumocyte', physiologyCapable: true },
  { id: 'bio:respiratory:surfactant-complex', label: 'Pulmonary surfactant lipid–protein complex', system: 'respiratory', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:alveolar-blood-gas-barrier', parentId: 'bio:respiratory:lamellar-body', physiologyCapable: true },
  { id: 'bio:respiratory:type-i-pneumocyte', label: 'Type I pneumocyte', system: 'respiratory', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:alveolar-blood-gas-barrier', synonyms: ['alveolar type I cell', 'AT1 cell'], physiologyCapable: true, relations: [{ kind: 'interfaces-with', targetId: 'bio:respiratory:capillary-endothelial-cell' }] },
  { id: 'bio:respiratory:capillary-endothelial-cell', label: 'Pulmonary capillary endothelial cell', system: 'respiratory', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:alveolar-blood-gas-barrier', physiologyCapable: true, relations: [{ kind: 'interfaces-with', targetId: 'bio:respiratory:type-i-pneumocyte' }] },
  { id: 'bio:respiratory:gas-diffusion-interface', label: 'Alveolar gas-diffusion molecular interface', system: 'respiratory', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:alveolar-blood-gas-barrier', parentId: 'bio:respiratory:type-i-pneumocyte', physiologyCapable: true },

  // Digestive
  { id: 'bio:digestive:hepatocyte', label: 'Hepatocyte', system: 'digestive', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:hepatic-lobule', physiologyCapable: true },
  { id: 'bio:digestive:hepatocyte-smooth-er', label: 'Hepatocyte smooth endoplasmic reticulum', system: 'digestive', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:hepatic-lobule', parentId: 'bio:digestive:hepatocyte', physiologyCapable: true },
  { id: 'bio:digestive:cytochrome-p450-system', label: 'Cytochrome P450 enzyme system', system: 'digestive', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:hepatic-lobule', parentId: 'bio:digestive:hepatocyte-smooth-er', physiologyCapable: true },

  // Urinary
  { id: 'bio:urinary:podocyte', label: 'Glomerular podocyte', system: 'urinary', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:glomerulus', physiologyCapable: true },
  { id: 'bio:urinary:slit-diaphragm-domain', label: 'Podocyte slit-diaphragm domain', system: 'urinary', scale: 'subcellular', kind: 'specialized-compartment', anchorAtlasNodeId: 'he:glomerulus', parentId: 'bio:urinary:podocyte', physiologyCapable: true },
  { id: 'bio:urinary:nephrin-podocin-complex', label: 'Nephrin–podocin slit-diaphragm complex', system: 'urinary', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:glomerulus', parentId: 'bio:urinary:slit-diaphragm-domain', physiologyCapable: true },

  // Endocrine
  { id: 'bio:endocrine:pancreatic-beta-cell', label: 'Pancreatic beta cell', system: 'endocrine', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:pancreatic-islet', physiologyCapable: true },
  { id: 'bio:endocrine:insulin-secretory-granule', label: 'Insulin secretory granule', system: 'endocrine', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:pancreatic-islet', parentId: 'bio:endocrine:pancreatic-beta-cell', physiologyCapable: true },
  { id: 'bio:endocrine:insulin-processing-axis', label: 'Proinsulin–insulin processing axis', system: 'endocrine', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:pancreatic-islet', parentId: 'bio:endocrine:insulin-secretory-granule', physiologyCapable: true },

  // Reproductive
  { id: 'bio:reproductive:spermatid', label: 'Spermatid', system: 'reproductive', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:seminiferous-tubule', physiologyCapable: true },
  { id: 'bio:reproductive:acrosome', label: 'Acrosome', system: 'reproductive', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:seminiferous-tubule', parentId: 'bio:reproductive:spermatid', physiologyCapable: true },
  { id: 'bio:reproductive:acrosomal-enzyme-complex', label: 'Acrosomal enzyme complex', system: 'reproductive', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:seminiferous-tubule', parentId: 'bio:reproductive:acrosome', physiologyCapable: true },

  // Sensory
  { id: 'bio:sensory:rod-photoreceptor', label: 'Rod photoreceptor', system: 'sensory', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:retinal-photoreceptor-unit', physiologyCapable: true },
  { id: 'bio:sensory:outer-segment-disc', label: 'Photoreceptor outer-segment disc', system: 'sensory', scale: 'subcellular', kind: 'specialized-compartment', anchorAtlasNodeId: 'he:retinal-photoreceptor-unit', parentId: 'bio:sensory:rod-photoreceptor', physiologyCapable: true },
  { id: 'bio:sensory:phototransduction-complex', label: 'Rhodopsin–transducin–PDE6 phototransduction complex', system: 'sensory', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:retinal-photoreceptor-unit', parentId: 'bio:sensory:outer-segment-disc', physiologyCapable: true },

  // Fascial / connective tissue
  { id: 'bio:fascial:fibroblast', label: 'Connective-tissue fibroblast', system: 'fascial', scale: 'cellular', kind: 'cell', anchorAtlasNodeId: 'he:deep-fascia', physiologyCapable: true },
  { id: 'bio:fascial:fibroblast-rer', label: 'Fibroblast rough endoplasmic reticulum', system: 'fascial', scale: 'subcellular', kind: 'organelle', anchorAtlasNodeId: 'he:deep-fascia', parentId: 'bio:fascial:fibroblast', physiologyCapable: true },
  { id: 'bio:fascial:collagen-i-iii-matrix', label: 'Type-I/III collagen fibrillar matrix', system: 'fascial', scale: 'molecular', kind: 'molecular-complex', anchorAtlasNodeId: 'he:deep-fascia', parentId: 'bio:fascial:fibroblast-rer', physiologyCapable: true },
]

function makeNode(definition: Definition): BioScaleNode {
  return {
    id: definition.id,
    label: definition.label,
    system: definition.system,
    scale: definition.scale,
    kind: definition.kind,
    anchorAtlasNodeId: definition.anchorAtlasNodeId,
    parentId: definition.parentId,
    synonyms: definition.synonyms,
    relations: definition.relations,
    representation: definition.scale === 'cellular'
      ? 'reference-microscopy'
      : definition.scale === 'molecular'
        ? 'reference-molecular'
        : 'conceptual',
    provenance: BIOSCALE_PROVENANCE,
    educationalPriority: definition.scale === 'molecular' ? 0.78 : 0.86,
    physiologyCapable: definition.physiologyCapable,
    patientSpecificAllowed: false,
  }
}

export const WHOLE_BODY_BIOSCALE_ATLAS: BioScaleManifest = {
  id: 'panacea-whole-body-bioscale-atlas',
  revision: '2026-09-10-r1-cell-subcellular-molecular',
  nodes: deriveCanonicalBioScaleHierarchy(DEFINITIONS.map(makeNode)),
}

export const WHOLE_BODY_BIOSCALE_SYSTEMS: readonly AtlasSystemId[] = [...new Set(WHOLE_BODY_BIOSCALE_ATLAS.nodes.map((node) => node.system))].sort()

export type SurgicalSpatialRegion = 'cardiac' | 'abdomen' | 'hand' | 'knee'

export interface SurgicalSpatialCheckpoint {
  id: string
  label: string
  anatomy: string
  relationships: string[]
  structuresAtRisk: string[]
  nodeHints: string[]
  layerHints: Array<'surface' | 'muscular' | 'cardiovascular' | 'nervous' | 'lymphoid' | 'visceral' | 'skeletal'>
}

export interface SurgicalSpatialScenario {
  id: string
  label: string
  region: SurgicalSpatialRegion
  purpose: string
  orientation: string
  checkpoints: SurgicalSpatialCheckpoint[]
  sourceLabel: string
  sourceUrl?: string
  referencePrototype?: string
  geometryBoundary: string
}

/**
 * Spatial surgical anatomy for education.
 *
 * These scenarios describe RELATIONSHIPS between named structures. They do not
 * encode device dimensions, procedural success thresholds, patient-specific
 * target coordinates, force feedback, or a "safe path". When a structure is
 * absent from the shared source mesh, the UI must say so rather than fabricate
 * geometry.
 */
export const SURGICAL_SPATIAL_SCENARIOS: SurgicalSpatialScenario[] = [
  {
    id: 'transseptal-anatomy',
    label: 'Transseptal anatomy',
    region: 'cardiac',
    purpose: 'Understand the true interatrial septum and the structures surrounding the fossa ovalis before interpreting catheter or echo views.',
    orientation: 'Right-atrial view of the interatrial septal region. The fossa ovalis floor is septum primum; the muscular rim is formed by septum secundum / atrial infolding.',
    checkpoints: [
      {
        id: 'fo-floor',
        label: 'Fossa ovalis floor',
        anatomy: 'Thin true interatrial septal tissue formed predominantly by septum primum.',
        relationships: [
          'Surrounded by the muscular limbus / septum secundum region.',
          'Inferior landmark: inferior vena cava region.',
          'Superior landmark: superior vena cava region.',
        ],
        structuresAtRisk: ['Left atrial free wall if spatial orientation is lost'],
        nodeHints: ['interatrial septum', 'fossa ovalis', 'right atrium', 'left atrium'],
        layerHints: ['cardiovascular', 'visceral'],
      },
      {
        id: 'anterior-superior-neighbor',
        label: 'Anterior-superior neighbor',
        anatomy: 'The non-coronary aortic sinus / aortic root lies anterior-superior to the fossa ovalis region.',
        relationships: [
          'The aortic root is not part of the true septum.',
          'Anterior septal orientation also relates to the septal tricuspid annulus.',
        ],
        structuresAtRisk: ['Aortic root'],
        nodeHints: ['aorta', 'aortic root', 'aortic valve', 'tricuspid valve'],
        layerHints: ['cardiovascular', 'visceral'],
      },
      {
        id: 'anterior-inferior-neighbor',
        label: 'Anterior-inferior neighbor',
        anatomy: 'The coronary sinus ostium is an anterior-inferior landmark of the interatrial septal region.',
        relationships: [
          'It helps orient the inferior/anterior boundary from the right atrium.',
          'The inferior vena cava approaches the right atrium inferiorly and should remain spatially distinct from the septal target region.',
        ],
        structuresAtRisk: ['Coronary sinus ostium and adjacent atrial tissue'],
        nodeHints: ['coronary sinus', 'inferior vena cava', 'right atrium'],
        layerHints: ['cardiovascular', 'visceral'],
      },
    ],
    sourceLabel: 'EHRA/HFA/EAPCI/EACVI/AEPC clinical consensus statement on transseptal puncture (Europace, 2026)',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/42213503/',
    referencePrototype: 'shimayuz/cardiac-atlas-lab — used as interaction inspiration only; its own README states the educational reconstruction and clinical validation limits.',
    geometryBoundary: 'Panacea does not infer a patient-specific puncture point. Fossa-ovalis detail may be absent from the whole-body source mesh; labels describe published anatomy and only existing meshes are highlighted.',
  },
  {
    id: 'knee-medial-parapatellar-spatial',
    label: 'Knee medial parapatellar spatial map',
    region: 'knee',
    purpose: 'Relate the extensor mechanism, retinaculum, capsule, patella and posterior neurovascular structures around a medial parapatellar exposure.',
    orientation: 'Anterior knee with the patella, quadriceps tendon, patellar tendon and medial retinacular/capsular tissues kept in one continuous extensor-mechanism frame.',
    checkpoints: [
      {
        id: 'extensor-envelope',
        label: 'Extensor envelope',
        anatomy: 'Quadriceps tendon continues through the patella into the patellar tendon; the medial retinacular tissues blend with the capsule.',
        relationships: ['Patella is embedded in the extensor mechanism.', 'Trochlea and femoral condyles are deep to the extensor envelope.'],
        structuresAtRisk: ['Infrapatellar branch of saphenous nerve in superficial tissues'],
        nodeHints: ['quadriceps', 'patella', 'patellar tendon', 'femur'],
        layerHints: ['surface', 'muscular', 'nervous', 'skeletal'],
      },
      {
        id: 'joint-interior',
        label: 'Joint interior',
        anatomy: 'The capsule and synovium open onto the patellofemoral and tibiofemoral compartments; menisci and cruciate ligaments are intra-articular structures.',
        relationships: ['ACL and PCL cross within the intercondylar region.', 'Menisci sit between femoral condyles and tibial plateau.'],
        structuresAtRisk: ['Menisci', 'Cruciate ligaments'],
        nodeHints: ['femur', 'tibia', 'patella', 'meniscus', 'anterior cruciate ligament', 'posterior cruciate ligament'],
        layerHints: ['visceral', 'skeletal'],
      },
      {
        id: 'posterior-boundary',
        label: 'Posterior boundary',
        anatomy: 'The popliteal neurovascular bundle lies posterior to the knee and must remain conceptually behind the posterior capsule rather than inside the joint space.',
        relationships: ['Popliteal artery is closely related to the posterior capsule.', 'The bundle is posterior to the distal femur/proximal tibia, not an anterior intra-articular structure.'],
        structuresAtRisk: ['Popliteal artery', 'Popliteal vein', 'Tibial nerve'],
        nodeHints: ['popliteal artery', 'popliteal vein', 'tibial nerve', 'femur', 'tibia'],
        layerHints: ['cardiovascular', 'nervous', 'skeletal'],
      },
    ],
    sourceLabel: 'Standard orthopaedic surgical anatomy; paired with Panacea layer sequence from Hoppenfeld, Surgical Exposures in Orthopaedics.',
    geometryBoundary: 'This is a spatial teaching map, not an operative plan. It does not estimate incision length, retractor depth, implant alignment or patient-specific vascular distance.',
  },
  {
    id: 'carpal-tunnel-spatial',
    label: 'Carpal tunnel spatial map',
    region: 'hand',
    purpose: 'Show the roof, floor, median nerve and flexor tendons as a true tunnel relationship instead of a flat list.',
    orientation: 'Palmar wrist/hand. Flexor retinaculum forms the roof; carpal bones form the concave osseous floor and walls.',
    checkpoints: [
      {
        id: 'roof',
        label: 'Roof',
        anatomy: 'The transverse carpal ligament / flexor retinaculum forms the fibrous roof of the carpal tunnel.',
        relationships: ['Palmar aponeurosis is superficial.', 'Median nerve lies immediately deep to the roof within the tunnel.'],
        structuresAtRisk: ['Palmar cutaneous branch of median nerve superficially', 'Recurrent motor branch distally'],
        nodeHints: ['flexor retinaculum', 'median nerve', 'palmar aponeurosis'],
        layerHints: ['surface', 'nervous', 'skeletal'],
      },
      {
        id: 'contents',
        label: 'Contents',
        anatomy: 'The median nerve and nine flexor tendons traverse the tunnel; the flexor carpi radialis tendon occupies a separate compartment and is not one of the nine tunnel tendons.',
        relationships: ['Median nerve is superficial relative to most flexor tendons.', 'Carpal bones bound the tunnel dorsally and laterally.'],
        structuresAtRisk: ['Median nerve'],
        nodeHints: ['median nerve', 'flexor digitorum superficialis', 'flexor digitorum profundus', 'flexor pollicis longus', 'carpal'],
        layerHints: ['muscular', 'nervous', 'skeletal'],
      },
    ],
    sourceLabel: 'Standard hand surgical anatomy; paired with Panacea layer sequence from Green’s Operative Hand Surgery.',
    geometryBoundary: 'Small nerve branches and individual carpal ligaments may not exist as separate source meshes. Missing geometry remains text-only.',
  },
  {
    id: 'hepatocystic-triangle-spatial',
    label: 'Hepatocystic triangle spatial map',
    region: 'abdomen',
    purpose: 'Teach the relative position of gallbladder neck, cystic duct, common hepatic duct and nearby arterial/ductal variants without pretending the atlas can certify a critical view.',
    orientation: 'Inferior liver surface around the gallbladder neck and hepatoduodenal region.',
    checkpoints: [
      {
        id: 'triangle-bounds',
        label: 'Hepatocystic triangle',
        anatomy: 'Bounded by the cystic duct, common hepatic duct and inferior edge of the liver in the contemporary surgical definition.',
        relationships: ['Cystic artery commonly courses within this region.', 'Right hepatic artery may pass nearby and can have variant anatomy.'],
        structuresAtRisk: ['Common hepatic duct', 'Common bile duct', 'Right hepatic artery'],
        nodeHints: ['gallbladder', 'cystic duct', 'common hepatic duct', 'common bile duct', 'hepatic artery', 'liver'],
        layerHints: ['cardiovascular', 'visceral'],
      },
      {
        id: 'gallbladder-bed',
        label: 'Gallbladder–liver interface',
        anatomy: 'The gallbladder body/fundus lies against the visceral surface of the liver; the neck transitions into the cystic duct.',
        relationships: ['The cystic plate is the connective-tissue plane between gallbladder and liver.', 'Ductal and arterial variants are common enough that a generic mesh cannot certify identity.'],
        structuresAtRisk: ['Subvesical bile ducts / ductal variants', 'Right hepatic artery variants'],
        nodeHints: ['gallbladder', 'liver', 'cystic duct', 'hepatic artery'],
        layerHints: ['cardiovascular', 'visceral'],
      },
    ],
    sourceLabel: 'SAGES safe cholecystectomy / critical-view surgical anatomy concepts; paired with Panacea layer sequence.',
    geometryBoundary: 'The viewer cannot verify a real critical view of safety, duct identity, or vascular variant. It visualizes only named relationships present in educational source geometry.',
  },
]

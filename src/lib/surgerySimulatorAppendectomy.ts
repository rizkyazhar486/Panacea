import type { SurgerySimulationScenario } from './surgerySimulator'

/**
 * DIYAI laparoscopic appendectomy anatomy simulation.
 *
 * This is deliberately a cognitive/anatomy trainer, not an operative recipe.
 * It never encodes trocar coordinates, insufflation targets, device settings,
 * tissue force, division/stapling instructions, medication, or patient-specific
 * planning. Where the source atlas cannot prove a structure, the gap stays
 * visible instead of being drawn by AI.
 */
export const LAP_APPENDIX_SCENARIO: SurgerySimulationScenario = {
  id: 'diyai-laparoscopic-appendectomy',
  label: 'DIYAI · Laparoscopic appendectomy anatomy simulation',
  shortLabel: 'DIYAI Lap Appy',
  atlas: 'gastro',
  atlasFile: 'atlas/gastro.glb',
  atlasLabel: 'Gastrointestinal reference atlas',
  atlasSource: 'BodyParts3D 4.0 / DBCLS (CC BY 4.0), packaged through the Panacea specialty-atlas pipeline',
  purpose:
    'Practice recognizing appendix-centred spatial anatomy and anatomical variation in a source-grounded 3D reference without turning one reference body into a patient-specific operative map.',
  referenceContext:
    'The Panacea gastro atlas preserves named BodyParts3D structures including the caecum/cecum, appendix, ileum and colonic segments. A single reference mesh represents only one configuration; systematic-review evidence shows that appendix position varies substantially between people.',
  instrumentFamilies: [
    'Laparoscopic visualization system',
    'Atraumatic tissue-handling instruments',
    'Dissection / haemostasis instrument family',
    'Specimen retrieval equipment',
  ],
  steps: [
    {
      id: 'lap-appy-orientation',
      label: 'Right lower-quadrant orientation',
      mode: 'deep-anatomy',
      objective: 'Establish the cecum, terminal ileum, ascending colon and appendix as separate named structures before focusing on the appendix itself.',
      anatomy:
        'The appendix arises from the cecum near the ileocecal region. Its relationship to the cecum and terminal ileum is more reliable for orientation than assuming that the appendiceal tip occupies one fixed screen location.',
      atlasKeywords: ['appendix', 'caecum', 'cecum', 'ileum', 'ascending colon'],
      sharedBodyKeywords: ['appendix', 'cecum', 'caecum', 'ileum', 'ascending colon'],
      atRiskKeywords: ['ileum', 'caecum', 'cecum'],
      atRiskText: ['Terminal ileum', 'Cecal wall', 'Adjacent small bowel'],
      bodyDepth: 5,
      imaging: {
        modality: '3D atlas',
        view: 'Reference right-lower-quadrant anatomy',
        expected: ['Appendix connected to cecal region', 'Terminal ileum adjacent to the cecum', 'Ascending colon continuous with the cecal region'],
        limitation: 'This is a reference-body geometry, not a laparoscopic camera reconstruction or patient CT segmentation.',
      },
      selfCheck: {
        prompt: 'Why should the appendix not be identified from its tip position alone?',
        answer: 'Because appendiceal position varies; orientation should be grounded in its cecal relationship and other verified landmarks.',
      },
    },
    {
      id: 'lap-appy-base',
      label: 'Appendiceal base & taeniae concept',
      mode: 'verification',
      objective: 'Connect the appendiceal base to the cecum while keeping a textbook landmark separate from what the current mesh actually resolves.',
      anatomy:
        'The appendiceal base has a consistent cecal relationship, and the three taeniae coli converge at the appendiceal base. The current specialty atlas does not claim that taeniae are separately segmented unless named source meshes are present.',
      atlasKeywords: ['appendix', 'caecum', 'cecum'],
      sharedBodyKeywords: ['appendix', 'cecum', 'caecum'],
      atRiskKeywords: ['caecum', 'cecum', 'ileum'],
      atRiskText: ['Cecal wall', 'Terminal ileum'],
      bodyDepth: 5,
      selfCheck: {
        prompt: 'Does a visible appendix mesh prove that the taeniae coli are separately modelled?',
        answer: 'No. The taeniae are an evidence-grounded landmark concept; Panacea only highlights them if a named source mesh actually exists.',
      },
      boundary: 'No appendiceal-base division line, stapler trajectory, ligature position or “safe margin” is generated from the atlas.',
    },
    {
      id: 'lap-appy-variation',
      label: 'Position variation check',
      mode: 'verification',
      objective: 'Prevent one attractive 3D model from being mistaken for universal human anatomy.',
      anatomy:
        'Appendix position can be retrocecal, pelvic, retro-ileal, pre-ileal, prececal/paracecal and, more rarely, in other locations. The simulator therefore treats the displayed position as one reference configuration only.',
      atlasKeywords: ['appendix', 'caecum', 'cecum', 'ileum'],
      sharedBodyKeywords: ['appendix', 'cecum', 'caecum', 'ileum'],
      atRiskKeywords: ['ileum', 'caecum', 'cecum'],
      atRiskText: ['Terminal ileum', 'Cecum', 'Adjacent bowel'],
      bodyDepth: 5,
      selfCheck: {
        prompt: 'What is the academic limitation of the current appendix mesh?',
        answer: 'It shows one reference-body configuration and cannot represent the full spectrum of appendiceal positional variation.',
      },
    },
    {
      id: 'lap-appy-mesoappendix',
      label: 'Mesoappendix & vascular concept',
      mode: 'verification',
      objective: 'Distinguish the visible appendix from supporting mesenteric and vascular anatomy that may not be separately resolved.',
      anatomy:
        'The mesoappendix conveys appendiceal vessels to the appendix. If the mesoappendix or appendiceal artery is not available as a named source mesh, Panacea keeps that relationship text-only rather than inventing a vessel course.',
      atlasKeywords: ['appendix'],
      sharedBodyKeywords: ['appendix', 'cecum', 'ileum'],
      atRiskKeywords: [],
      atRiskText: ['Mesoappendix', 'Appendiceal vascular supply', 'Adjacent bowel'],
      bodyDepth: 5,
      selfCheck: {
        prompt: 'What should happen if the appendiceal artery is not separately present in source geometry?',
        answer: 'The simulator should state the anatomical relationship but must not draw or guess a vessel path.',
      },
      boundary: 'No vessel sealing, clipping, energy setting, bleeding model or tissue-force simulation is encoded.',
    },
    {
      id: 'lap-appy-review',
      label: 'Source-vs-literature review',
      mode: 'verification',
      objective: 'Finish by identifying exactly which statements came from source geometry and which came from published anatomy.',
      anatomy:
        'Source geometry can establish the named structures present in this BodyParts3D reference. Published anatomical literature establishes variability and landmarks that may not be separately segmented. Neither source alone grants operative competence.',
      atlasKeywords: ['appendix', 'caecum', 'cecum', 'ileum', 'ascending colon'],
      sharedBodyKeywords: ['appendix', 'cecum', 'caecum', 'ileum', 'ascending colon'],
      atRiskKeywords: ['ileum', 'caecum', 'cecum'],
      atRiskText: ['Cecum', 'Terminal ileum', 'Adjacent bowel', 'Mesoappendix / appendiceal vessels'],
      bodyDepth: 5,
      selfCheck: {
        prompt: 'What would be required before calling this content academically reviewed?',
        answer: 'A qualified human anatomy/surgical reviewer must review the content and have their identity, credentials, date and scope recorded. Source citations alone are not the same as human academic review.',
      },
      boundary: 'AI-assisted educational draft. It must not be labelled academically reviewed until a qualified human reviewer is actually recorded.',
    },
  ],
  geometryBoundary:
    'BodyParts3D provides a single reference configuration. Panacea does not fabricate alternate appendix positions, mesoappendix vessels, inflammatory deformation, trocar paths, dissection planes or patient-specific anatomy that are absent from the source.',
  evidenceBoundary:
    'Source-grounded, AI-assisted educational simulation. Human academic review is currently pending. This is not an operative manual, credentialing tool, autonomous surgical advisor or substitute for supervised surgical training.',
  sources: [
    'BodyParts3D 4.0 / DBCLS, CC BY 4.0; Mitsuhashi et al. (2009), doi:10.1093/nar/gkn613; atlas packaging provenance recorded in public/atlas/CREDITS.txt',
    'Sakellariadis A, et al. Anatomical Variations of the Vermiform Appendix. Acta Med Acad. 2024;53(3):335-342. PMID:39720866. Systematic review.',
    'Barlow A, et al. The vermiform appendix: a review. Clin Anat. 2013;26(7):833-842. PMID:23716128.',
    'Sumi SA, et al. Variations in the Position of Vermiform Appendix in Bangladeshi People. Mymensingh Med J. 2019;28(1):54-59. PMID:30755551. Used only for the taeniae/base landmark statement, not for universal position frequencies.',
    'MANDATORY INTERACTIVE REFERENCE · thebuggeddev/anatomy — https://github.com/thebuggeddev/anatomy — external reference only; no code or assets are vendored until an explicit upstream license and asset provenance are verified.',
    'MANDATORY INTERACTIVE REFERENCE · Breath Atlas — https://breath-atlas.thebuggeddev.chatgpt.site/ — external interaction/physiology reference only pending explicit license, provenance, and qualified academic review.',
  ],
}

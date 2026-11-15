// Sensory physiology (eye and inner ear) for the Physiology stage. Each step restates the abstract of a cited
// review; every review was resolved against PubMed and recorded in governance/LITERATURE_CITATION_LEDGER.json.
// Generic teaching physiology: nothing here tests or describes a person's vision, hearing or balance.

import type { SourcedPhysiology } from './sourcedPhysiology.ts'

export const SENSORY_PHYSIOLOGY: readonly SourcedPhysiology[] = [
  {
    id: 'retinal-phototransduction',
    label: 'Phototransduction: light into an electrical signal',
    systems: ['sensory-ent'],
    summary: [
      'A photon captured by a molecule of visual pigment generates an electrical response in a photoreceptor cell.',
      'In vertebrate rods the photoreceptor G protein transducin links the visual pigment, rhodopsin, to its effector enzyme, cGMP phosphodiesterase.',
      'The balance between the steps that amplify the signal and those that end G-protein activity sets how fast and how sensitive the response to light is.',
      'The brain itself receives the information as electrical signals — action potentials and changes in electrochemical gradients — not as photons.',
    ],
    references: [
      { reference: 'PMID 11826267', note: 'Arshavsky, Lamb & Pugh (2002), G proteins and phototransduction: transducin links rhodopsin to cGMP phosphodiesterase; amplification and its termination set the speed and sensitivity of the light response.' },
      { reference: 'PMID 25274585', note: 'Mannu (2014), Retinal phototransduction: how photons reaching the retina are transduced into the electrical signals the brain perceives.' },
    ],
    boundary: 'Generic teaching physiology of photoreceptors, from two reviews: not a test of any person’s vision, retina or colour vision, and not a diagnosis or treatment guidance.',
  },
  {
    id: 'inner-ear-hair-cell-mechanotransduction',
    label: 'Inner-ear hair cells: hearing and balance',
    systems: ['sensory-ent'],
    summary: [
      'Deflecting a hair bundle, the sensory organelle of an inner-ear hair cell, opens mechanically gated channels.',
      'Hair bundles monitor the orientation of the head and its angular and linear acceleration, and they detect sound.',
      'Hair cells not only detect but also amplify the softest sounds, which lets hearing span a very wide range of intensities; the amplification is frequency specific, which gives fine frequency discrimination.',
      'Adaptation lets a bundle reset its operating point; fast adaptation, the rapid closure of transduction channels after a stimulus, appears closely involved in the amplification.',
    ],
    references: [
      { reference: 'PMID 16269359', note: 'LeMasurier & Gillespie (2005), Hair-cell mechanotransduction and cochlear amplification: hair cells detect and frequency-specifically amplify soft sounds, and fast adaptation appears involved in that amplification.' },
      { reference: 'PMID 30661717', note: 'Ó Maoiléidigh & Ricci (2019), A bundle of mechanisms: inner-ear hair-cell mechanotransduction — bundle deflection opens mechanically gated channels, bundles sense head orientation, acceleration and sound, and adaptation resets the operating point.' },
    ],
    boundary: 'Generic teaching physiology of inner-ear hair cells, from two reviews: not a hearing or balance test of any person, and not a diagnosis or treatment guidance.',
  },
]

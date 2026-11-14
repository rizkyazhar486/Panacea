// Musculoskeletal physiology for the Physiology stage. Each step restates the abstract of a cited review; every
// review was resolved against PubMed and recorded in governance/LITERATURE_CITATION_LEDGER.json. Generic teaching
// physiology: nothing here describes a person.

import type { SourcedPhysiology } from './sourcedPhysiology.ts'

export const MUSCULOSKELETAL_PHYSIOLOGY: readonly SourcedPhysiology[] = [
  {
    id: 'skeletal-muscle-excitation-contraction-coupling',
    label: 'Excitation–contraction coupling in skeletal muscle',
    systems: ['musculoskeletal'],
    summary: [
      'An action potential starts and travels along the muscle fibre’s plasma membrane, then spreads through the transverse-tubule (T-tubule) system.',
      'Dihydropyridine receptors sense the change in membrane potential and interact allosterically with the ryanodine receptors of the sarcoplasmic reticulum; coupled, the two form the Ca²⁺-release units.',
      'Ryanodine-receptor gating releases Ca²⁺ from the sarcoplasmic reticulum rapidly and massively, so the Ca²⁺ concentration in the myoplasm rises briefly.',
      'Released Ca²⁺ binds troponin C, which activates the contractile machinery; some binds myoplasmic buffers such as parvalbumin.',
      'Ca²⁺ then leaves the myoplasm mainly by reuptake into the sarcoplasmic reticulum through SERCA; under some conditions it also moves into mitochondria or out through the Na⁺/Ca²⁺ exchanger.',
    ],
    references: [
      { reference: 'PMID 28509964', note: 'Calderón, Bolaños & Caputo (2014), The excitation-contraction coupling mechanism in skeletal muscle: the sequence in twitch muscle, from the action potential to Ca²⁺ reuptake by SERCA.' },
      { reference: 'PMID 36117698', note: 'Bolaños & Calderón (2022), Excitation-contraction coupling in mammalian skeletal muscle: coupled dihydropyridine and ryanodine receptors form the Ca²⁺-release units, and released Ca²⁺ binds troponin C to activate contraction.' },
    ],
    boundary: 'Generic teaching physiology of a twitch skeletal-muscle fibre, from two reviews: not a measurement of any person’s muscle, strength, fibre type or fatigue, and not a diagnosis or treatment guidance.',
  },
  {
    id: 'bone-remodelling-cycle',
    label: 'Bone remodelling: resorption coupled to formation',
    // Both reviews name hormones among the cycle's regulators, so the endocrine system shows it too.
    systems: ['musculoskeletal', 'endocrine'],
    summary: [
      'Bone is remodelled throughout life: osteoclasts remove old or damaged mineralised bone, then osteoblasts lay down new matrix that becomes mineralised.',
      'Resorption is tightly coupled to formation within a basic multicellular unit, in five steps: activation, resorption, reversal, formation and termination. Many sites of the skeleton remodel at once, out of step with one another.',
      'RANK / RANKL / osteoprotegerin signalling and canonical Wnt signalling are the key pathways that control resorption and formation.',
      'Hormones regulate the cycle — parathyroid hormone, vitamin D (calcitriol), calcitonin, growth hormone, glucocorticoids, sex hormones and thyroid hormone — while cytokines, growth factors and prostaglandins act locally.',
      'Remodelling adapts bone architecture to changing mechanical needs, repairs microdamage and helps keep plasma calcium stable.',
    ],
    references: [
      { reference: 'PMID 29368538', note: 'Kenkre & Bassett (2018), The bone remodelling cycle: coupling within the basic multicellular unit, its five steps, RANK/RANKL/osteoprotegerin and Wnt signalling, and its paracrine and endocrine regulators.' },
      { reference: 'PMID 17308163', note: 'Hadjidakis & Androulakis (2006), Bone remodeling: osteoclastic resorption followed by osteoblastic formation, adaptation to mechanical needs, microdamage repair and plasma calcium homeostasis.' },
    ],
    boundary: 'Generic teaching physiology of the bone remodelling cycle, from two reviews: not a measurement of any person’s bone density, bone turnover or calcium, and not a diagnosis of bone disease or treatment guidance.',
  },
]

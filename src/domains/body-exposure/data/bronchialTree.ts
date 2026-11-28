// Tracheobronchial tree to segmental level, in textbook (Boyden / Jackson–Huber) nomenclature, mapped to the shaft
// meshes of the Z-Anatomy / BodyParts3D atlas in public/anatomy/visceral.glb (names as GLTFLoader sanitises them).
// Topology is reference anatomy; branching variants that real patients show are not represented.
// Left lower lobe: the atlas carries separate medial (B7) and anterior (B8) basal meshes, so they are kept separate
// here even though many texts describe a common anteromedial trunk (LB7+8).

export interface BronchusDef {
  id: string
  parent: string | null
  /** Mesh node in visceral.glb holding this bronchus' own shaft. */
  mesh: string
  /** Short code shown on the orifice label. */
  code: string
  name: string
}

export const BRONCHIAL_TREE: readonly BronchusDef[] = [
  { id: 'trachea', parent: null, mesh: 'Trachea', code: 'Trachea', name: 'Trachea' },

  { id: 'rmb', parent: 'trachea', mesh: 'Right_main_bronchus_1', code: 'RMB', name: 'Right main bronchus' },
  { id: 'rul', parent: 'rmb', mesh: 'Right_superior_lobar_bronchus_1', code: 'RUL', name: 'Right upper lobe bronchus' },
  { id: 'rb1', parent: 'rul', mesh: 'Apical_segmental_bronchus_of_right_lung_(BI)', code: 'RB1', name: 'Apical' },
  { id: 'rb2', parent: 'rul', mesh: 'Posterior_segmental_bronchus_of_right_lung_(BII)', code: 'RB2', name: 'Posterior' },
  { id: 'rb3', parent: 'rul', mesh: 'Anterior_segmental_bronchus_of_right_lung_(BIII)', code: 'RB3', name: 'Anterior' },
  { id: 'bi', parent: 'rmb', mesh: 'Intermediate_bronchus', code: 'BI', name: 'Bronchus intermedius' },
  { id: 'rml', parent: 'bi', mesh: 'Middle_lobar_bronchus', code: 'RML', name: 'Right middle lobe bronchus' },
  { id: 'rb4', parent: 'rml', mesh: 'Lateral_segmental_bronchus_of_right_lung_(BIV)', code: 'RB4', name: 'Lateral' },
  { id: 'rb5', parent: 'rml', mesh: 'Medial_segmental_bronchus_of_right_lung_(BV)', code: 'RB5', name: 'Medial' },
  { id: 'rll', parent: 'bi', mesh: 'Right_inferior_lobar_bronchus_1', code: 'RLL', name: 'Right lower lobe bronchus' },
  { id: 'rb6', parent: 'rll', mesh: 'Superior_segmental_bronchus_of_right_lung_(BVI)', code: 'RB6', name: 'Superior' },
  { id: 'rb7', parent: 'rll', mesh: 'Medial_basal_segmental_bronchus_of_right_lung_(BVII)', code: 'RB7', name: 'Medial basal' },
  { id: 'rb8', parent: 'rll', mesh: 'Anterior_basal_segmental_bronchus_of_right_lung_(BVIII)', code: 'RB8', name: 'Anterior basal' },
  { id: 'rb9', parent: 'rll', mesh: 'Lateral_basal_segmental_bronchus_of_right_lung_(BIX)', code: 'RB9', name: 'Lateral basal' },
  { id: 'rb10', parent: 'rll', mesh: 'Posterior_basal_segmental_bronchus_of_right_lung_(BX)', code: 'RB10', name: 'Posterior basal' },

  { id: 'lmb', parent: 'trachea', mesh: 'Left_main_bronchus_1', code: 'LMB', name: 'Left main bronchus' },
  { id: 'lul', parent: 'lmb', mesh: 'Left_superior_lobar_bronchus_1', code: 'LUL', name: 'Left upper lobe bronchus' },
  { id: 'lb12', parent: 'lul', mesh: 'Apicoposterior_segmental_bronchus_of_left_lung_(BI+BII)', code: 'LB1+2', name: 'Apicoposterior' },
  { id: 'lb3', parent: 'lul', mesh: 'Anterior_segmental_bronchus_of_left_lung_(BIII)', code: 'LB3', name: 'Anterior' },
  { id: 'lb4', parent: 'lul', mesh: 'Superior_lingular_segmental_bronchus_of_left_lung_(BIV)', code: 'LB4', name: 'Superior lingular' },
  { id: 'lb5', parent: 'lul', mesh: 'Inferior_lingular_segmental_bronchus_of_left_lung_(BV)', code: 'LB5', name: 'Inferior lingular' },
  { id: 'lll', parent: 'lmb', mesh: 'Left_inferior_lobar_bronchus_1', code: 'LLL', name: 'Left lower lobe bronchus' },
  { id: 'lb6', parent: 'lll', mesh: 'Superior_segmental_bronchus_of_left_lung_(BVI)', code: 'LB6', name: 'Superior' },
  { id: 'lb7', parent: 'lll', mesh: 'Medial_basal_segmental_bronchus_of_left_lung_(BVII)', code: 'LB7', name: 'Medial basal' },
  { id: 'lb8', parent: 'lll', mesh: 'Anterior_basal_segmental_bronchus_of_left_lung_(BVIII)', code: 'LB8', name: 'Anterior basal' },
  { id: 'lb9', parent: 'lll', mesh: 'Lateral_basal_segmental_bronchus_of_left_lung_(BIX)', code: 'LB9', name: 'Lateral basal' },
  { id: 'lb10', parent: 'lll', mesh: 'Posterior_basal_segmental_bronchus_of_left_lung_(BX)', code: 'LB10', name: 'Posterior basal' },
]

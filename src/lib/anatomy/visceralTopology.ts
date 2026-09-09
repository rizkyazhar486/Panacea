import type { AtlasRelationPatch } from './highEndTopology'

const continuous = (from: string, to: string, note?: string): AtlasRelationPatch => ({ from, to, kind: 'continuous-with', note })
const supplies = (from: string, to: string, note?: string): AtlasRelationPatch => ({ from, to, kind: 'supplies', note })
const drains = (from: string, to: string, note?: string): AtlasRelationPatch => ({ from, to, kind: 'drains', note })

const gastrointestinalContinuity: readonly AtlasRelationPatch[] = [
  continuous('gi:esophagus', 'gi:gastroesophageal-junction'),
  continuous('gi:gastroesophageal-junction', 'gi:stomach'),
  continuous('gi:stomach', 'gi:pylorus'),
  continuous('gi:pylorus', 'gi:duodenum'),
  continuous('gi:duodenum', 'gi:jejunum'),
  continuous('gi:jejunum', 'gi:ileum'),
  continuous('gi:ileum', 'gi:ileocecal-valve'),
  continuous('gi:ileocecal-valve', 'gi:cecum'),
  continuous('gi:cecum', 'gi:ascending-colon'),
  continuous('gi:ascending-colon', 'gi:hepatic-flexure'),
  continuous('gi:hepatic-flexure', 'gi:transverse-colon'),
  continuous('gi:transverse-colon', 'gi:splenic-flexure'),
  continuous('gi:splenic-flexure', 'gi:descending-colon'),
  continuous('gi:descending-colon', 'gi:sigmoid-colon'),
  continuous('gi:sigmoid-colon', 'gi:rectum'),
  continuous('gi:rectum', 'gi:anal-canal'),
]

const biliaryPancreaticContinuity: readonly AtlasRelationPatch[] = [
  continuous('gi:right-hepatic-duct', 'gi:common-hepatic-duct'),
  continuous('gi:left-hepatic-duct', 'gi:common-hepatic-duct'),
  continuous('gi:gallbladder-neck', 'gi:cystic-duct'),
  continuous('gi:cystic-duct', 'gi:common-bile-duct'),
  continuous('gi:common-hepatic-duct', 'gi:common-bile-duct'),
  continuous('gi:common-bile-duct', 'gi:major-duodenal-papilla'),
  continuous('gi:main-pancreatic-duct', 'gi:major-duodenal-papilla'),
]

const splanchnicArterial: readonly AtlasRelationPatch[] = [
  continuous('cv:abdominal-aorta', 'cv:celiac-trunk'),
  continuous('cv:abdominal-aorta', 'cv:superior-mesenteric-artery'),
  continuous('cv:abdominal-aorta', 'cv:inferior-mesenteric-artery'),
  continuous('cv:abdominal-aorta', 'cv:right-renal-artery'),
  continuous('cv:abdominal-aorta', 'cv:left-renal-artery'),
  continuous('cv:abdominal-aorta', 'cv:right-gonadal-artery'),
  continuous('cv:abdominal-aorta', 'cv:left-gonadal-artery'),

  continuous('cv:celiac-trunk', 'cv:left-gastric-artery'),
  continuous('cv:celiac-trunk', 'cv:splenic-artery'),
  continuous('cv:celiac-trunk', 'cv:common-hepatic-artery'),
  continuous('cv:common-hepatic-artery', 'cv:proper-hepatic-artery'),
  continuous('cv:common-hepatic-artery', 'cv:gastroduodenal-artery'),
  continuous('cv:proper-hepatic-artery', 'cv:right-hepatic-artery'),
  continuous('cv:proper-hepatic-artery', 'cv:left-hepatic-artery'),

  supplies('cv:left-gastric-artery', 'gi:stomach', 'Educational arterial supply edge; not patient perfusion mapping.'),
  supplies('cv:splenic-artery', 'lymph:spleen', 'Educational splenic arterial supply edge.'),
  supplies('cv:right-hepatic-artery', 'gi:right-hepatic-lobe', 'Educational hepatic arterial supply edge.'),
  supplies('cv:left-hepatic-artery', 'gi:left-hepatic-lobe', 'Educational hepatic arterial supply edge.'),
  supplies('cv:gastroduodenal-artery', 'gi:duodenum', 'Educational gastroduodenal supply anchor; branch-level arcades are not inferred.'),
  supplies('cv:superior-mesenteric-artery', 'gi:small-intestine', 'Educational SMA supply territory anchor; not patient ischemia localization.'),
  supplies('cv:superior-mesenteric-artery', 'gi:ascending-colon', 'Educational SMA supply territory anchor; not patient ischemia localization.'),
  supplies('cv:inferior-mesenteric-artery', 'gi:descending-colon', 'Educational IMA supply territory anchor; not patient ischemia localization.'),
  supplies('cv:inferior-mesenteric-artery', 'gi:sigmoid-colon', 'Educational IMA supply territory anchor; not patient ischemia localization.'),
  supplies('cv:right-renal-artery', 'urinary:right-kidney', 'Educational renal arterial supply edge.'),
  supplies('cv:left-renal-artery', 'urinary:left-kidney', 'Educational renal arterial supply edge.'),
]

const portalAndSystemicVenous: readonly AtlasRelationPatch[] = [
  drains('cv:inferior-mesenteric-vein', 'cv:splenic-vein'),
  drains('cv:splenic-vein', 'cv:portal-vein'),
  drains('cv:superior-mesenteric-vein', 'cv:portal-vein'),
  supplies('cv:portal-vein', 'gi:liver', 'Portal venous inflow to liver; educational topology only.'),
  drains('gi:liver', 'cv:right-hepatic-vein'),
  drains('gi:liver', 'cv:middle-hepatic-vein'),
  drains('gi:liver', 'cv:left-hepatic-vein'),
  drains('cv:right-hepatic-vein', 'cv:inferior-vena-cava'),
  drains('cv:middle-hepatic-vein', 'cv:inferior-vena-cava'),
  drains('cv:left-hepatic-vein', 'cv:inferior-vena-cava'),
  drains('urinary:right-kidney', 'cv:right-renal-vein'),
  drains('urinary:left-kidney', 'cv:left-renal-vein'),
  drains('cv:right-renal-vein', 'cv:inferior-vena-cava'),
  drains('cv:left-renal-vein', 'cv:inferior-vena-cava'),
  drains('cv:right-gonadal-vein', 'cv:inferior-vena-cava'),
  drains('cv:left-gonadal-vein', 'cv:left-renal-vein', 'Common educational drainage pattern; anatomical variation is not encoded here.'),
]

function urinarySide(side: 'right' | 'left'): readonly AtlasRelationPatch[] {
  return [
    continuous(`urinary:${side}-collecting-duct`, `urinary:${side}-minor-calyces`),
    continuous(`urinary:${side}-minor-calyces`, `urinary:${side}-major-calyces`),
    continuous(`urinary:${side}-major-calyces`, `urinary:${side}-renal-pelvis`),
    continuous(`urinary:${side}-renal-pelvis`, `urinary:${side}-ureter`),
    continuous(`urinary:${side}-ureter`, 'urinary:bladder'),
  ]
}

const urinaryContinuity: readonly AtlasRelationPatch[] = [
  ...urinarySide('right'),
  ...urinarySide('left'),
  continuous('urinary:bladder', 'urinary:bladder-neck'),
  continuous('urinary:bladder-neck', 'urinary:urethra-reference'),
]

export const VISCERAL_RELATION_PATCHES: readonly AtlasRelationPatch[] = [
  ...gastrointestinalContinuity,
  ...biliaryPancreaticContinuity,
  ...splanchnicArterial,
  ...portalAndSystemicVenous,
  ...urinaryContinuity,
]

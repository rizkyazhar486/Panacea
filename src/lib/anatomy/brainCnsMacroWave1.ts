export type BrainMacroDomain =
  | 'cerebrum'
  | 'diencephalon'
  | 'basal-ganglia'
  | 'limbic'
  | 'brainstem'
  | 'cerebellum'
  | 'white-matter'
  | 'ventricular-csf'
  | 'meninges'
  | 'vascular'
  | 'cranial-nerves'

export type BrainMacroKind = 'region' | 'lobe' | 'gyrus' | 'nucleus' | 'tract' | 'ventricle' | 'membrane' | 'artery' | 'nerve' | 'junction'

export interface BrainMacroNode {
  id: string
  label: string
  domain: BrainMacroDomain
  kind: BrainMacroKind
  parentId?: string
  nodeHints: string[]
  function: string
  relations: string[]
  bloodSupply?: string[]
  geometryStatus: 'native-or-source-match-required' | 'reference-only'
  reviewStatus: 'academic-review-pending'
  sourceAnchors: string[]
  boundary: string
}

const B = 'Generic educational neuroanatomy only; do not infer lesion localization, diagnosis, prognosis, surgical corridor safety, vascular territory infarction, seizure focus, cognitive phenotype, or patient-specific anatomy from this atlas.'
const NCBI = ['NCBI:Neuroanatomy']
const N = (
  id: string,
  label: string,
  domain: BrainMacroDomain,
  kind: BrainMacroKind,
  nodeHints: string[],
  function: string,
  relations: string[],
  parentId?: string,
  bloodSupply?: string[],
  geometryStatus: BrainMacroNode['geometryStatus'] = 'native-or-source-match-required',
  sourceAnchors: string[] = NCBI,
): BrainMacroNode => ({ id, label, domain, kind, parentId, nodeHints, function, relations, bloodSupply, geometryStatus, reviewStatus: 'academic-review-pending', sourceAnchors, boundary: B })

export const BRAIN_CNS_MACRO_WAVE1: readonly BrainMacroNode[] = [
  N('brain','Brain','cerebrum','region',['brain','encephalon'],'Central organ integrating sensory, motor, autonomic, endocrine and cognitive functions.',['cerebrum','diencephalon','brainstem','cerebellum']),
  N('cerebrum','Cerebrum','cerebrum','region',['cerebrum','cerebral hemisphere'],'Largest supratentorial compartment containing cortex, subcortical white matter and deep nuclei.',['frontal lobe','parietal lobe','temporal lobe','occipital lobe','insula','corpus callosum'],'brain'),
  N('frontal-lobe','Frontal lobe','cerebrum','lobe',['frontal lobe'],'Major cortical territory for motor planning, executive function, language production and behavioral regulation.',['precentral gyrus','premotor cortex','prefrontal cortex','inferior frontal gyrus'],'cerebrum',['ACA','MCA']),
  N('precentral-gyrus','Precentral gyrus / primary motor cortex','cerebrum','gyrus',['precentral gyrus','primary motor cortex'],'Primary cortical output region for voluntary movement.',['central sulcus','premotor cortex','corticospinal tract'],'frontal-lobe',['ACA','MCA']),
  N('premotor-cortex','Premotor and supplementary motor cortex','cerebrum','gyrus',['premotor cortex','supplementary motor area'],'Plans and sequences voluntary movement.',['precentral gyrus','basal ganglia circuits','thalamus'],'frontal-lobe',['ACA','MCA'],'reference-only'),
  N('prefrontal-cortex','Prefrontal cortex','cerebrum','gyrus',['prefrontal cortex'],'Supports executive control, working memory, decision making and behavioral regulation.',['orbitofrontal cortex','anterior cingulate','mediodorsal thalamus'],'frontal-lobe',['ACA','MCA'],'reference-only'),
  N('broca-region','Inferior frontal language-production region','cerebrum','gyrus',['inferior frontal gyrus','Broca area'],'Dominant-hemisphere language production network node.',['premotor cortex','arcuate fasciculus','temporal language regions'],'frontal-lobe',['MCA'],'reference-only'),
  N('parietal-lobe','Parietal lobe','cerebrum','lobe',['parietal lobe'],'Integrates somatosensory, spatial and multimodal association information.',['postcentral gyrus','superior parietal lobule','inferior parietal lobule'],'cerebrum',['ACA','MCA']),
  N('postcentral-gyrus','Postcentral gyrus / primary somatosensory cortex','cerebrum','gyrus',['postcentral gyrus','somatosensory cortex'],'Primary cortical reception for somatic sensation.',['central sulcus','thalamocortical fibers','parietal association cortex'],'parietal-lobe',['ACA','MCA']),
  N('temporal-lobe','Temporal lobe','cerebrum','lobe',['temporal lobe'],'Contains auditory, language-association, memory and ventral visual-stream regions.',['superior temporal gyrus','hippocampus','amygdala','inferior temporal cortex'],'cerebrum',['MCA','PCA']),
  N('auditory-cortex','Primary auditory cortex','cerebrum','gyrus',['Heschl gyrus','primary auditory cortex'],'Primary cortical processing of auditory input.',['medial geniculate body','superior temporal gyrus'],'temporal-lobe',['MCA'],'reference-only'),
  N('occipital-lobe','Occipital lobe','cerebrum','lobe',['occipital lobe'],'Primary cortical visual processing territory.',['calcarine cortex','visual association cortex'],'cerebrum',['PCA']),
  N('primary-visual-cortex','Primary visual cortex','cerebrum','gyrus',['calcarine cortex','visual cortex','V1'],'First cortical stage for geniculocortical visual input.',['lateral geniculate nucleus','optic radiations','visual association cortex'],'occipital-lobe',['PCA'],'reference-only'),
  N('insula','Insular cortex','cerebrum','lobe',['insula','insular cortex'],'Integrates interoceptive, gustatory, autonomic and salience-related information.',['opercula','limbic structures','thalamus'],'cerebrum',['MCA'],'reference-only'),

  N('diencephalon','Diencephalon','diencephalon','region',['diencephalon'],'Deep central region containing thalamus, hypothalamus and epithalamic structures.',['thalamus','hypothalamus','third ventricle'],'brain'),
  N('thalamus','Thalamus','diencephalon','nucleus',['thalamus'],'Major relay and integration hub for sensory, motor and associative cortical circuits.',['internal capsule','third ventricle','basal ganglia','cortex'],'diencephalon',['PCA','posterior communicating artery']),
  N('lgn','Lateral geniculate nucleus','diencephalon','nucleus',['lateral geniculate nucleus','LGN'],'Thalamic relay for retinal visual signals to primary visual cortex.',['optic tract','optic radiations'],'thalamus',['anterior choroidal artery','PCA'],'reference-only'),
  N('mgn','Medial geniculate nucleus','diencephalon','nucleus',['medial geniculate nucleus','MGN'],'Thalamic relay for auditory information to auditory cortex.',['inferior colliculus','auditory radiations'],'thalamus',['PCA'],'reference-only'),
  N('hypothalamus','Hypothalamus','diencephalon','nucleus',['hypothalamus'],'Coordinates autonomic, endocrine, thermoregulatory, circadian and homeostatic functions.',['pituitary stalk','third ventricle','limbic system','brainstem'],'diencephalon',['ACA perforators','PCA perforators'],'reference-only'),

  N('basal-ganglia','Basal ganglia','basal-ganglia','region',['basal ganglia','basal nuclei'],'Deep nuclei participating in action selection, movement scaling, learning and reward circuits.',['caudate','putamen','globus pallidus','subthalamic nucleus','substantia nigra'],'brain'),
  N('caudate','Caudate nucleus','basal-ganglia','nucleus',['caudate nucleus'],'Striatal nucleus participating in motor, associative and limbic loops.',['lateral ventricle','internal capsule','putamen'],'basal-ganglia',['lenticulostriate arteries','recurrent artery of Heubner']),
  N('putamen','Putamen','basal-ganglia','nucleus',['putamen'],'Major motor striatal input nucleus.',['globus pallidus','external capsule','internal capsule'],'basal-ganglia',['lenticulostriate arteries']),
  N('globus-pallidus','Globus pallidus','basal-ganglia','nucleus',['globus pallidus'],'Pallidal output/intermediate nucleus in basal-ganglia circuits.',['putamen','internal capsule','thalamus'],'basal-ganglia',['lenticulostriate arteries','anterior choroidal artery']),
  N('subthalamic-nucleus','Subthalamic nucleus','basal-ganglia','nucleus',['subthalamic nucleus'],'Excitatory node in indirect/hyperdirect basal-ganglia pathways.',['globus pallidus','substantia nigra','internal capsule'],'basal-ganglia',['PCA perforators'],'reference-only'),
  N('substantia-nigra','Substantia nigra','basal-ganglia','nucleus',['substantia nigra'],'Midbrain nucleus providing dopaminergic modulation and basal-ganglia output functions.',['cerebral peduncle','red nucleus','striatum'],'basal-ganglia',['PCA perforators'],'reference-only'),

  N('limbic-system','Limbic system','limbic','region',['limbic system'],'Distributed network supporting memory, emotion, motivation and autonomic integration.',['hippocampus','amygdala','cingulate gyrus','fornix','hypothalamus'],'brain','', 'reference-only'),
  N('hippocampus','Hippocampal formation','limbic','region',['hippocampus'],'Critical medial temporal structure for episodic memory formation and spatial representation.',['parahippocampal gyrus','fornix','amygdala','temporal horn'],'limbic-system',['PCA','anterior choroidal artery'],'reference-only'),
  N('amygdala','Amygdala','limbic','nucleus',['amygdala'],'Deep temporal nuclear complex involved in emotional salience and associative learning.',['hippocampus','uncus','hypothalamus'],'limbic-system',['anterior choroidal artery','MCA'],'reference-only'),
  N('cingulate-gyrus','Cingulate gyrus','limbic','gyrus',['cingulate gyrus'],'Medial cortical limbic structure linking cognition, emotion, autonomic control and behavior.',['corpus callosum','paracingulate cortex','hippocampal formation'],'limbic-system',['ACA'],'reference-only'),
  N('fornix','Fornix','white-matter','tract',['fornix'],'Major white-matter output pathway of hippocampal formation.',['hippocampus','mammillary bodies','septal region'],'limbic-system',undefined,'reference-only'),

  N('white-matter','Cerebral white matter','white-matter','region',['cerebral white matter'],'Long-range projection, commissural and association fibers connecting cortical and subcortical regions.',['corpus callosum','internal capsule','corona radiata','association fasciculi'],'cerebrum'),
  N('corpus-callosum','Corpus callosum','white-matter','tract',['corpus callosum'],'Largest commissural tract connecting cerebral hemispheres.',['cingulate gyrus','lateral ventricles','centrum semiovale'],'white-matter',['ACA','PCA']),
  N('internal-capsule','Internal capsule','white-matter','tract',['internal capsule'],'Dense projection-fiber corridor connecting cortex with thalamus, brainstem and spinal cord.',['caudate','lentiform nucleus','thalamus','cerebral peduncle'],'white-matter',['lenticulostriate arteries','anterior choroidal artery']),
  N('corona-radiata','Corona radiata','white-matter','tract',['corona radiata'],'Fan-shaped projection fibers between cortex and internal capsule.',['centrum semiovale','internal capsule','motor cortex','sensory cortex'],'white-matter',['ACA','MCA'],'reference-only'),
  N('optic-radiations','Optic radiations','white-matter','tract',['optic radiation','geniculocalcarine tract'],'Carry visual signals from lateral geniculate nucleus to visual cortex.',['LGN','temporal lobe','parietal lobe','calcarine cortex'],'white-matter',['MCA','PCA'],'reference-only'),

  N('brainstem','Brainstem','brainstem','region',['brainstem'],'Connects cerebrum, cerebellum and spinal cord; contains cranial-nerve nuclei and major ascending/descending pathways.',['midbrain','pons','medulla','fourth ventricle'],'brain'),
  N('midbrain','Midbrain','brainstem','region',['midbrain','mesencephalon'],'Rostral brainstem containing cerebral peduncles, tectum and multiple cranial-nerve and motor nuclei.',['pons','diencephalon','cerebral aqueduct'],'brainstem',['PCA','superior cerebellar artery']),
  N('superior-colliculus','Superior colliculus','brainstem','nucleus',['superior colliculus'],'Tectal structure coordinating visual orienting and eye-head movements.',['pretectal region','periaqueductal gray','oculomotor pathways'],'midbrain',['PCA'],'reference-only'),
  N('inferior-colliculus','Inferior colliculus','brainstem','nucleus',['inferior colliculus'],'Major auditory midbrain relay.',['lateral lemniscus','medial geniculate nucleus'],'midbrain',['PCA'],'reference-only'),
  N('pons','Pons','brainstem','region',['pons'],'Middle brainstem linking cortex and cerebellum and housing cranial-nerve nuclei.',['midbrain','medulla','middle cerebellar peduncle','fourth ventricle'],'brainstem',['basilar artery','AICA','SCA']),
  N('medulla','Medulla oblongata','brainstem','region',['medulla','medulla oblongata'],'Caudal brainstem containing autonomic, sensory and motor nuclei and corticospinal decussation.',['pons','spinal cord','fourth ventricle','inferior cerebellar peduncle'],'brainstem',['vertebral artery','PICA','anterior spinal artery']),

  N('cerebellum','Cerebellum','cerebellum','region',['cerebellum'],'Coordinates movement timing, error correction, balance and motor learning.',['vermis','cerebellar hemispheres','deep cerebellar nuclei','cerebellar peduncles'],'brain'),
  N('vermis','Cerebellar vermis','cerebellum','region',['cerebellar vermis'],'Midline cerebellar region important for axial/postural control.',['cerebellar hemispheres','fourth ventricle'],'cerebellum',['PICA','SCA'],'reference-only'),
  N('dentate-nucleus','Dentate nucleus','cerebellum','nucleus',['dentate nucleus'],'Largest deep cerebellar nucleus; major output node for planning and coordination.',['superior cerebellar peduncle','cerebellar cortex'],'cerebellum',['SCA'],'reference-only'),
  N('superior-cerebellar-peduncle','Superior cerebellar peduncle','white-matter','tract',['superior cerebellar peduncle'],'Major cerebellar efferent pathway toward midbrain/thalamus.',['dentate nucleus','midbrain','thalamus'],'cerebellum',['SCA'],'reference-only'),
  N('middle-cerebellar-peduncle','Middle cerebellar peduncle','white-matter','tract',['middle cerebellar peduncle'],'Major pontocerebellar afferent pathway.',['pons','cerebellar hemisphere'],'cerebellum',['AICA'],'reference-only'),
  N('inferior-cerebellar-peduncle','Inferior cerebellar peduncle','white-matter','tract',['inferior cerebellar peduncle'],'Carries multiple medullary/spinal/vestibular afferents and cerebellar outputs.',['medulla','vestibular nuclei','cerebellum'],'cerebellum',['PICA'],'reference-only'),

  N('ventricular-system','Ventricular system','ventricular-csf','region',['ventricular system'],'CSF-containing cavities continuous with central canal and subarachnoid space.',['lateral ventricles','third ventricle','cerebral aqueduct','fourth ventricle'],'brain','', 'reference-only'),
  N('lateral-ventricles','Lateral ventricles','ventricular-csf','ventricle',['lateral ventricle'],'Paired ventricular cavities within cerebral hemispheres.',['caudate','corpus callosum','fornix','foramen of Monro'],'ventricular-system',undefined,'reference-only'),
  N('third-ventricle','Third ventricle','ventricular-csf','ventricle',['third ventricle'],'Midline diencephalic CSF cavity.',['thalamus','hypothalamus','foramen of Monro','cerebral aqueduct'],'ventricular-system',undefined,'reference-only'),
  N('cerebral-aqueduct','Cerebral aqueduct','ventricular-csf','junction',['cerebral aqueduct','aqueduct of Sylvius'],'Narrow CSF conduit through midbrain connecting third and fourth ventricles.',['third ventricle','fourth ventricle','periaqueductal gray'],'ventricular-system',undefined,'reference-only'),
  N('fourth-ventricle','Fourth ventricle','ventricular-csf','ventricle',['fourth ventricle'],'CSF cavity between pons/medulla and cerebellum.',['pons','medulla','cerebellum','foramina of Luschka and Magendie'],'ventricular-system',undefined,'reference-only'),
  N('choroid-plexus','Choroid plexus','ventricular-csf','region',['choroid plexus'],'Specialized vascular epithelium producing most CSF.',['ventricles','ependymal lining'],'ventricular-system',['choroidal arteries'],'reference-only'),

  N('meninges','Meninges','meninges','region',['meninges'],'Protective connective-tissue coverings around brain and spinal cord.',['dura','arachnoid','pia','subarachnoid space'],'brain','', 'reference-only'),
  N('dura','Dura mater','meninges','membrane',['dura mater'],'Outer tough meningeal layer forming dural partitions and venous sinuses.',['skull','arachnoid','dural venous sinuses'],'meninges',['middle meningeal artery'],'reference-only'),
  N('arachnoid','Arachnoid mater','meninges','membrane',['arachnoid mater'],'Middle meningeal membrane bounding subarachnoid space.',['dura','pia','subarachnoid cisterns'],'meninges',undefined,'reference-only'),
  N('pia','Pia mater','meninges','membrane',['pia mater'],'Delicate vascular membrane closely investing brain surface.',['cortex','subarachnoid space','penetrating vessels'],'meninges',undefined,'reference-only'),
  N('subarachnoid-space','Subarachnoid space','meninges','region',['subarachnoid space'],'CSF-filled compartment containing major cerebral vessels and cisterns.',['arachnoid','pia','basal cisterns'],'meninges',undefined,'reference-only'),

  N('circle-of-willis','Circle of Willis','vascular','region',['circle of Willis','cerebral arterial circle'],'Arterial anastomotic ring at brain base connecting anterior and posterior circulations.',['ACA','MCA origins','PCA','communicating arteries'],'brain',undefined,'reference-only'),
  N('aca','Anterior cerebral artery','vascular','artery',['anterior cerebral artery','ACA'],'Supplies medial frontal/parietal cortex and deep perforator territories.',['anterior communicating artery','pericallosal artery','callosomarginal artery'],'circle-of-willis',undefined,'reference-only'),
  N('mca','Middle cerebral artery','vascular','artery',['middle cerebral artery','MCA'],'Supplies most lateral cerebral convexity and deep lenticulostriate territories.',['Sylvian fissure','lenticulostriate arteries','cortical branches'],'circle-of-willis',undefined,'reference-only'),
  N('pca','Posterior cerebral artery','vascular','artery',['posterior cerebral artery','PCA'],'Supplies occipital, inferomedial temporal, thalamic and midbrain territories.',['basilar tip','posterior communicating artery','calcarine artery'],'circle-of-willis',undefined,'reference-only'),
  N('basilar','Basilar artery','vascular','artery',['basilar artery'],'Midline artery formed by vertebral arteries supplying pons and posterior circulation branches.',['vertebral arteries','AICA','SCA','PCA'],'brainstem',undefined,'reference-only'),
  N('vertebral-arteries','Vertebral arteries','vascular','artery',['vertebral artery'],'Paired arteries contributing to posterior circulation and basilar formation.',['PICA','anterior spinal artery','basilar artery'],'brainstem',undefined,'reference-only'),

  N('cranial-nerves','Cranial nerves','cranial-nerves','region',['cranial nerves'],'Twelve paired nerves connecting brain/brainstem with sensory, motor and autonomic targets.',['forebrain','midbrain','pons','medulla'],'brain','', 'reference-only'),
  N('cn1','CN I · Olfactory','cranial-nerves','nerve',['olfactory nerve','CN I'],'Conveys olfaction from nasal epithelium to olfactory bulb/tract.',['olfactory bulb','cribriform plate','olfactory tract'],'cranial-nerves',undefined,'reference-only'),
  N('cn2','CN II · Optic','cranial-nerves','nerve',['optic nerve','CN II'],'Carries retinal ganglion-cell output toward chiasm and visual pathway.',['retina','optic canal','optic chiasm'],'cranial-nerves',undefined,'reference-only'),
  N('cn3','CN III · Oculomotor','cranial-nerves','nerve',['oculomotor nerve','CN III'],'Motor/parasympathetic nerve for most extraocular muscles, levator and pupil constriction/accommodation.',['midbrain','cavernous sinus','superior orbital fissure'],'cranial-nerves',undefined,'reference-only'),
  N('cn4','CN IV · Trochlear','cranial-nerves','nerve',['trochlear nerve','CN IV'],'Motor nerve to superior oblique muscle.',['dorsal midbrain','cavernous sinus','superior orbital fissure'],'cranial-nerves',undefined,'reference-only'),
  N('cn5','CN V · Trigeminal','cranial-nerves','nerve',['trigeminal nerve','CN V'],'Major somatic sensory nerve of face with branchial motor component.',['pons','trigeminal ganglion','V1','V2','V3'],'cranial-nerves',undefined,'reference-only'),
  N('cn6','CN VI · Abducens','cranial-nerves','nerve',['abducens nerve','CN VI'],'Motor nerve to lateral rectus muscle.',['pontomedullary junction','cavernous sinus','superior orbital fissure'],'cranial-nerves',undefined,'reference-only'),
  N('cn7','CN VII · Facial','cranial-nerves','nerve',['facial nerve','CN VII'],'Controls facial expression and carries taste/parasympathetic fibers.',['pons','internal acoustic meatus','facial canal'],'cranial-nerves',undefined,'reference-only'),
  N('cn8','CN VIII · Vestibulocochlear','cranial-nerves','nerve',['vestibulocochlear nerve','CN VIII'],'Carries auditory and vestibular information.',['pontomedullary junction','internal acoustic meatus'],'cranial-nerves',undefined,'reference-only'),
  N('cn9','CN IX · Glossopharyngeal','cranial-nerves','nerve',['glossopharyngeal nerve','CN IX'],'Mixed sensory, motor and parasympathetic nerve of pharyngeal/carotid/taste pathways.',['medulla','jugular foramen'],'cranial-nerves',undefined,'reference-only'),
  N('cn10','CN X · Vagus','cranial-nerves','nerve',['vagus nerve','CN X'],'Major parasympathetic and mixed nerve for pharynx/larynx and thoracoabdominal viscera.',['medulla','jugular foramen'],'cranial-nerves',undefined,'reference-only'),
  N('cn11','CN XI · Accessory','cranial-nerves','nerve',['accessory nerve','CN XI'],'Motor supply to sternocleidomastoid and trapezius via spinal accessory component.',['upper cervical cord','foramen magnum','jugular foramen'],'cranial-nerves',undefined,'reference-only'),
  N('cn12','CN XII · Hypoglossal','cranial-nerves','nerve',['hypoglossal nerve','CN XII'],'Motor supply to intrinsic/extrinsic tongue muscles except palatoglossus.',['medulla','hypoglossal canal'],'cranial-nerves',undefined,'reference-only'),
] as const

export const BRAIN_MACRO_REQUIRED_IDS = [
  'brain','cerebrum','frontal-lobe','parietal-lobe','temporal-lobe','occipital-lobe','insula','thalamus','hypothalamus',
  'caudate','putamen','globus-pallidus','subthalamic-nucleus','substantia-nigra','hippocampus','amygdala','corpus-callosum','internal-capsule',
  'brainstem','midbrain','pons','medulla','cerebellum','dentate-nucleus','lateral-ventricles','third-ventricle','cerebral-aqueduct','fourth-ventricle',
  'dura','arachnoid','pia','circle-of-willis','aca','mca','pca','basilar','vertebral-arteries',
  'cn1','cn2','cn3','cn4','cn5','cn6','cn7','cn8','cn9','cn10','cn11','cn12',
] as const

export function validateBrainCnsMacroWave1(records: readonly BrainMacroNode[] = BRAIN_CNS_MACRO_WAVE1): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  for (const item of records) {
    if (ids.has(item.id)) errors.push(`duplicate:${item.id}`)
    ids.add(item.id)
    if (!item.label.trim()) errors.push(`label:${item.id}`)
    if (!item.function.trim()) errors.push(`function:${item.id}`)
    if (!item.boundary.includes('Generic educational neuroanatomy')) errors.push(`boundary:${item.id}`)
    if (!item.sourceAnchors.length) errors.push(`source:${item.id}`)
    if (item.reviewStatus !== 'academic-review-pending') errors.push(`review:${item.id}`)
  }
  for (const item of records) if (item.parentId && !ids.has(item.parentId)) errors.push(`parent:${item.id}:${item.parentId}`)
  for (const id of BRAIN_MACRO_REQUIRED_IDS) if (!ids.has(id)) errors.push(`required:${id}`)
  return errors
}

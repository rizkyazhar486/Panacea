"""Blender BVH reproduction over unchanged public LOD3 geometry.
Blender -b --factory-startup -P this.py -- input.json output.json
Sampling/rays/tolerance reproduce qa_gross_anatomy.py; this is a technical
reference-mesh screen, not patient anatomy, clinical review or a volume ratio.
"""
import json
import sys
import math
import re
from mathutils import Vector
from mathutils.bvhtree import BVHTree


def inside_fraction(vertices, target_vertices, target_triangles, sample_target=300):
    if not vertices or not target_vertices or not target_triangles:
        raise ValueError('Missing geometry')
    for points in (vertices, target_vertices):
        if any(len(p) != 3 or any(type(x) not in (int,float) or not math.isfinite(x) for x in p) for p in points):
            raise ValueError('Invalid finite vertex coordinates')
    if any(len(t) != 3 or any(type(i) != int or i < 0 or i >= len(target_vertices) for i in t) for t in target_triangles):
        raise ValueError('Invalid triangle indices')
    if type(sample_target) != int or sample_target <= 0:
        raise ValueError('Invalid sample target')
    tree = BVHTree.FromPolygons(target_vertices, target_triangles, all_triangles=True)
    step = max(1, len(vertices) // sample_target)
    directions = [Vector(d).normalized() for d in [(1,.013,.007),(-.011,1,.017),(.009,-.015,-1)]]
    inside = total = 0
    for vertex in vertices[::step]:
        votes = 0
        for direction in directions:
            point = Vector(vertex)
            crossings = 0
            for _ in range(64):
                hit = tree.ray_cast(point, direction)
                if hit[0] is None:
                    break
                crossings += 1
                point = hit[0] + direction * 1e-5
            else:
                raise ValueError('Ray crossing limit reached; containment unknown')
            votes += crossings % 2
        inside += votes >= 2
        total += 1
    return {'inside': inside, 'sampled': total, 'fraction': round(inside/total, 3), 'stride': step}


def gross_checks(summaries):
    if not summaries: raise ValueError('Missing whole-body summaries')
    def find(pattern): return [s for s in summaries if re.search(pattern,s['name'])]
    def one(*patterns):
        for p in patterns:
            matches=find(p)
            if matches:return max(matches,key=lambda s:s['vertexCount'])
        raise ValueError('Missing required gross structure: '+str(patterns))
    checks=[]
    def check(name,ok,detail):checks.append({'check':name,'ok':bool(ok),'detail':detail})
    bad=[s for s in summaries if (s['name'].endswith('.L') and s['centroid'][0]<-.003)
         or (s['name'].endswith('.R') and s['centroid'][0]>.003)]
    unexplained=[s['name'] for s in bad if not s.get('qaNote')]
    check('laterality_suffix_matches_side',not unexplained,
          {'paired':sum(s['name'].endswith(('.L','.R')) for s in summaries),
           'documented_exceptions':[s['name'] for s in bad if s.get('qaNote')],'unexplained':unexplained})
    liver=one(r'\.LIVER$',r'DIGESTIVE\.CAPSULE_OF_THE_LIVER$')
    spleen=one(r'\.SPLEEN$')
    heart=one(r'HEART_WALL$',r'CARDIOVASCULAR\.LEFT_VENTRICLE$')
    stomach=one(r'\.STOMACH_WALL$',r'DIGESTIVE\.STOMACH$')
    for name,s,ok in [('liver_on_right',liver,liver['centroid'][0]<0),
                      ('spleen_on_left',spleen,spleen['centroid'][0]>0),
                      ('heart_left_of_midline',heart,heart['centroid'][0]>-.005),
                      ('stomach_on_left',stomach,stomach['centroid'][0]>0)]:
        check(name,ok,s['centroid'][0])
    brain=one(r'\.BRAIN$',r'WHITE_MATTER_OF_TELENCEPHALON$',r'NERVOUS\.CORPUS_CALLOSUM\.[LR]$')
    bladder=one(r'URINARY_BLADDER_WALL$',r'URINARY\.URINARY_BLADDER$',r'FUNDUS_OF_URINARY_BLADDER_DOME$')
    kidneys=find(r'KIDNEY_CORTEX\.[LR]$') or find(r'URINARY\.KIDNEY\.[LR]$') or find(r'KIDNEY_CAPSULE\.[LR]$')
    if not kidneys:raise ValueError('Missing kidneys')
    z={'brain':brain['centroid'][2],'heart':heart['centroid'][2],'liver':liver['centroid'][2],
       'kidney':sum(s['centroid'][2] for s in kidneys)/len(kidneys),'bladder':bladder['centroid'][2]}
    check('vertical_organ_order',all(z[a]>z[b] for a,b in [('brain','heart'),('heart','liver'),('liver','bladder'),('kidney','bladder')]),z)
    floor=min(s['lo'][2] for s in summaries)
    check('feet_on_ground',abs(floor)<.005,floor)
    ribs=find(r'RIBS_CORTICAL$') or find(r'SKELETAL\.\w+_RIB\.[LR]$')
    if not ribs:raise ValueError('Missing ribs')
    rib_range=[min(s['lo'][2] for s in ribs),max(s['hi'][2] for s in ribs)]
    check('heart_within_ribcage_height',rib_range[0]<z['heart']<rib_range[1],{'heart_z':z['heart'],'ribs_z':rib_range})
    skull=find(r'CRANIUM_CORTICAL$') or find(r'SKELETAL\.(FRONTAL_BONE|OCCIPITAL_BONE|PARIETAL_BONE\.[LR]|SPHENOID_BONE|TEMPORAL_BONE\.[LR])$')
    if not skull:raise ValueError('Missing cranium')
    lo=[min(s['lo'][k] for s in skull) for k in range(3)]
    hi=[max(s['hi'][k] for s in skull) for k in range(3)]
    check('brain_within_cranium_bounds',all(lo[k]-.002<=brain['lo'][k] and brain['hi'][k]<=hi[k]+.002 for k in range(3)),
          {'brain':brain['name'],'cranium_parts':len(skull),'tolerance_m':.002})
    return checks


def audit(data):
    expected = [['liver','heart'],['liver','stomach'],['heart','lungLeft'],['heart','lungRight'],['kidneyLeft','spleen'],['liver','kidneyRight'],['bladder','rectum']]
    if data.get('schema') != 1 or data.get('coordinateFrame') != 'Blender Z-up metres' or data.get('pairs') != expected:
        raise ValueError('Unexpected geometry contract or pair coverage')
    checks = []
    for a,b in expected:
        A,B = data['organs'][a],data['organs'][b]
        detail = inside_fraction(A['vertices'],B['vertices'],B['triangles'])
        checks.append({'a':A['name'],'b':B['name'],**detail,'ok':detail['inside']/detail['sampled']<=.05})
    gross=gross_checks(data['summaries'])
    return {'grossChecks':gross,'structureCount':len(data['summaries']),'schema':1,'sourceLevel':data['sourceLevel'],'sources':data['sources'],
            'method':'3-ray majority parity; source vertices sampled at max(1,floor(N/300)) stride; 1e-5m step; raw fraction threshold before display rounding',
            'threshold':.05,'thresholdSource':'bodyexposure/pipeline/qa_gross_anatomy.py existing technical screen',
            'checks':checks,'ok':all(c['ok'] for c in checks+gross),
            'limits':['LOD3 exported surface and split vertices differ from original Blender source mesh',
                      'Sampled vertex fraction is directional, not overlap volume or clinical validation']}

if __name__ == '__main__':
    args=sys.argv[sys.argv.index('--')+1:]
    result=audit(json.load(open(args[0])))
    with open(args[1],'w') as output: json.dump(result,output,indent=2)
    print(json.dumps(result,indent=2))
    if not result['ok']: raise SystemExit(1)

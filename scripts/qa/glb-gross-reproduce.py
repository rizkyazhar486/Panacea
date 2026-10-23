# Reproduksi independen parsial gerbang anatomi kasar D3 dari GLB publik (bukan gerbang CI). Pakai: python3 scripts/qa/glb-gross-reproduce.py public/bodyexposure/adult_male
import json,struct,glob,sys,re
# Reproduksi independen parsial D3: lateralitas, sisi organ, kaki, dan rongga.
# Khusus layout ekspor adult_male LOD3: translation induk dan translation/scale anak.
# Bukan pembaca GLTF umum; interpenetrasi dan sentroid verteks belum direproduksi.
def load(p):
    b=open(p,'rb').read(); n=struct.unpack('<I',b[12:16])[0]; return json.loads(b[20:20+n])
def centers(p):
    j=load(p); out={}
    for nd in j['nodes']:
        nm=nd.get('name')
        if not nm or 'children' not in nd: continue
        t=nd.get('translation',[0,0,0]); lo=[1e9]*3; hi=[-1e9]*3
        for c in nd['children']:
            ch=j['nodes'][c]; ct=ch.get('translation',[0,0,0]); cs=ch.get('scale',[1,1,1])
            acc=j['accessors'][j['meshes'][ch['mesh']]['primitives'][0]['attributes']['POSITION']]
            nrm=acc.get('normalized',False)
            for k in range(3):
                a=acc['min'][k]; z=acc['max'][k]
                if nrm: d=65535.0 if acc['componentType']==5123 else 32767.0; a/=d; z/=d
                lo[k]=min(lo[k],ct[k]+cs[k]*a); hi[k]=max(hi[k],ct[k]+cs[k]*z)
        out[nm]=([t[k]+(lo[k]+hi[k])/2 for k in range(3)],[t[k]+lo[k] for k in range(3)],[t[k]+hi[k] for k in range(3)])
    return out
def cavity_checks(C):
    """GLB y is vertical; reproduce coarse bbox checks, not mesh containment."""
    def find(pattern):
        return [v for name,v in C.items() if re.search(pattern,name)]
    heart = find(r'CARDIOVASCULAR\.LEFT_VENTRICLE$')
    brain = (find(r'\.BRAIN$') or find(r'WHITE_MATTER_OF_TELENCEPHALON$')
             or find(r'NERVOUS\.CORPUS_CALLOSUM\.[LR]$'))
    ribs = find(r'SKELETAL\.\w+_RIB\.[LR]$')
    cranium = find(r'SKELETAL\.(FRONTAL_BONE|OCCIPITAL_BONE|PARIETAL_BONE\.[LR]|SPHENOID_BONE|TEMPORAL_BONE\.[LR])$')
    def result(name, present, ok, detail):
        return {'check': name, 'ok': bool(present and ok), 'detail': detail,
                'method': 'exported LOD3 axis-aligned bounding boxes'}
    rib_range = [min(v[1][1] for v in ribs),max(v[2][1] for v in ribs)] if ribs else None
    heart_y = heart[0][0][1] if heart else None
    height_ok = bool(rib_range and heart_y is not None and rib_range[0] < heart_y < rib_range[1])
    bounds = ([min(v[1][k] for v in cranium) for k in range(3)],
              [max(v[2][k] for v in cranium) for k in range(3)]) if cranium else None
    brain_ok = bool(bounds and brain and all(bounds[0][k]-0.002 <= v[1][k]
                    and v[2][k] <= bounds[1][k]+0.002 for v in brain for k in range(3)))
    return [result('heart_within_ribcage_height',heart and ribs,height_ok,
                   {'heart_y_m':heart_y,'ribs_y_m':rib_range,'missing':[n for n,v in [('heart',heart),('ribs',ribs)] if not v]}),
            result('brain_within_cranium_bounds',brain and cranium,brain_ok,
                   {'brain_parts':len(brain),'cranium_parts':len(cranium),'tolerance_m':0.002,
                    'missing':[n for n,v in [('brain',brain),('cranium',cranium)] if not v]})]


def main():
    C={}
    for p in sorted(glob.glob(sys.argv[1]+'.*.LOD3.glb')): C.update(centers(p))
    if not C: raise SystemExit('No public LOD3 structures found')
    print('structures',len(C))
    bad=[n for n,(c,_,_) in C.items() if (n.endswith('.L') and c[0]<=0) or (n.endswith('.R') and c[0]>=0)]
    paired=sum(1 for n in C if n.endswith(('.L','.R')))
    print('paired',paired,'laterality violations',len(bad),bad[:8])
    def x(pat):
        return [(n,c[0]) for n,(c,_,_) in C.items() if re.search(pat,n)][:3]
    for k,p in dict(liver=r'DIGESTIVE\.LIVER$',spleen=r'LYMPHATIC\.SPLEEN$',stomach=r'DIGESTIVE\.STOMACH$').items(): print(k,x(p))
    print('min y (feet)',min(l[1] for _,(_,l,_) in C.items()))
    for n in bad: print(n.split('.',2)[2], round(C[n][0][0],4))
    checks=cavity_checks(C)
    print(json.dumps({'scope':'partial D3; interpenetration not reproduced','checks':checks},indent=2))
    if any(not c['ok'] for c in checks): raise SystemExit(1)

if __name__ == '__main__': main()

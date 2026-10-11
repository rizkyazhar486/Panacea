# Reproduksi independen parsial gerbang anatomi kasar D3 dari GLB publik (bukan gerbang CI). Pakai: python3 scripts/qa/glb-gross-reproduce.py public/bodyexposure/adult_male
import json,struct,glob,sys,re
# Reproduksi independen D3 dari GLB terkirim (tanpa Blender): bbox-center tiap struktur -> lateralitas, sisi organ, kaki.
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
        out[nm]=([t[k]+(lo[k]+hi[k])/2 for k in range(3)],[t[k]+lo[k] for k in range(3)])
    return out
C={}
for p in sorted(glob.glob(sys.argv[1]+'.*.LOD3.glb')): C.update(centers(p))
print('structures',len(C))
bad=[n for n,(c,_) in C.items() if (n.endswith('.L') and c[0]<=0) or (n.endswith('.R') and c[0]>=0)]
paired=sum(1 for n in C if n.endswith(('.L','.R')))
print('paired',paired,'laterality violations',len(bad),bad[:8])
def x(pat):
    m=[(n,c[0]) for n,(c,_) in C.items() if re.search(pat,n)]; return m[:3]
for k,p in dict(liver=r'DIGESTIVE\.LIVER$',spleen=r'LYMPHATIC\.SPLEEN$',stomach=r'DIGESTIVE\.STOMACH$').items(): print(k,x(p))
print('min y (feet)',min(l[1] for _,(c,l) in C.items()))
for n in bad: print(n.split('.',2)[2], round(C[n][0][0],4))

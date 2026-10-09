"""Uji silang: tulang tungkai bawah Denver (VHF) vs femur/tibia/fibula/patela HuBMAP VH_Female.

  Blender -b -P bodyexposure/pipeline/check_vhf_lower_limb_vs_hubmap.py

Keduanya dari subjek Visible Human Female yang sama, dengan segmentasi berbeda. Satu transformasi rigid (ICP pada femur kiri)
dipakai untuk semua tulang tungkai kiri; jarak permukaan median menunjukkan apakah keduanya menggambarkan individu yang sama.
Hanya pemeriksaan konsistensi sumber: kedua dataset TIDAK dicampur dalam satu tubuh.
"""
import bpy, os, json, numpy as np, mathutils
RES = {}
from mathutils import kdtree
HOME=os.path.expanduser('~')
def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete()
def verts(o):
    return np.array([(o.matrix_world@x.co)[:] for x in o.data.vertices])
clear()
bpy.ops.import_scene.gltf(filepath=HOME+'/Documents/Panaceamed.id/bodyexposure/sources/hubmap/VH_F_United_v1.1.glb')
hub={o.name:verts(o) for o in bpy.data.objects if o.type=='MESH' and o.name in('VH_F_femur_L','VH_F_tibia_L','VH_F_fibula_L','VH_F_patella_L','VH_F_femur_R','VH_F_tibia_R','VH_F_sacrum','VH_F_coccyx','VH_F_ilium_compact_bone_L')}
du={}
D=HOME+'/Downloads/Final 3D STL Models-stl/'
for k,f in {'femur_L':'Left/VHF_Left_Bone_Femur_smooth.stl','tibia_L':'Left/VHF_Left_Bone_Tibia_smooth.stl','fibula_L':'Left/VHF_Left_Bone_Fibula_smooth.stl','patella_L':'Left/VHF_Left_Bone_Patella_smooth.stl','femur_R':'Right/VHF_Right_Bone_Femur_smooth.stl','tibia_R':'Right/VHF_Right_Bone_Tibia_smooth.stl','sacrum':'Left/VHF_Left_Bone_Sacrum_smooth.stl','coccyx':'Left/VHF_Left_Bone_Coccyx_smooth.stl','pelvis_L':'Left/VHF_Left_Bone_Pelvis_smooth.stl'}.items():
    before=set(bpy.data.objects); bpy.ops.wm.stl_import(filepath=D+f)
    o=[x for x in bpy.data.objects if x not in before][0]; du[k]=verts(o)
# Denver (mm, +X kanan, +Y anterior, +Z superior) → bingkai HuBMAP setelah impor Blender (m, +X kiri, −Y anterior, +Z superior): rotasi 180° pada Z
def to_gltf(v): return np.stack([-v[:,0],-v[:,1],v[:,2]],1)/1000.0
# handedness check

def kabsch(A,B):
    ca,cb=A.mean(0),B.mean(0); H=(A-ca).T@(B-cb); U,S,Vt=np.linalg.svd(H); d=np.sign(np.linalg.det(Vt.T@U.T)); R=Vt.T@np.diag([1,1,d])@U.T; return R,cb-R@ca
def dist(A,B):
    kd=kdtree.KDTree(len(B)); [kd.insert(mathutils.Vector(p),i) for i,p in enumerate(B)]; kd.balance()
    return np.array([kd.find(mathutils.Vector(p))[2] for p in A])
def icp(src,dst,it=40):
    s=src[::max(1,len(src)//4000)]; R=np.eye(3); t=dst.mean(0)-s.mean(0)
    for _ in range(it):
        p=s@R.T+t; kd=kdtree.KDTree(len(dst)); [kd.insert(mathutils.Vector(q),i) for i,q in enumerate(dst)]; kd.balance()
        idx=[kd.find(mathutils.Vector(q))[1] for q in p]; R2,t2=kabsch(s,dst[idx]); R,t=R2,t2
    return R,t
femur=to_gltf(du['femur_L']); R,t=icp(femur,hub['VH_F_femur_L'])
RES['residual_rotation_deg_after_axis_map']=round(float(np.degrees(np.arccos((np.trace(R)-1)/2))),2)
def report(name,duk,hubk,R,t):
    a=to_gltf(du[duk])@R.T+t; d=dist(a[::max(1,len(a)//3000)],hub[hubk]); RES[name]={'median_mm':round(float(np.median(d))*1000,1),'p95_mm':round(float(np.percentile(d,95))*1000,1)}; print(f'{name}: median {np.median(d)*1000:.1f} mm  p95 {np.percentile(d,95)*1000:.1f} mm  (Denver->HuBMAP)')
report('femur_L (fit)','femur_L','VH_F_femur_L',R,t)
for n,a,b in [('tibia_L','tibia_L','VH_F_tibia_L'),('fibula_L','fibula_L','VH_F_fibula_L'),('patella_L','patella_L','VH_F_patella_L')]: report(n+' (femur transform)',a,b,R,t)
# tibia own fit for comparison
Rt,tt=icp(to_gltf(du['tibia_L']),hub['VH_F_tibia_L']); report('tibia_L (own fit)','tibia_L','VH_F_tibia_L',Rt,tt)

RES['note']='One rigid transform fitted on the left femur is applied to the other left-leg bones; own-fit rows refit per bone.'
json.dump(RES,open(os.path.expanduser('~/Documents/Panaceamed.id/bodyexposure/qa_reports/vhf_lower_limb_vs_hubmap.json'),'w'),indent=1)
print(json.dumps(RES))

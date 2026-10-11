import {createHash} from 'node:crypto'
import {Vector3} from 'three'
// Indexed triangle positions in world space; cyclic rotations retain winding.
export function surfaceHash(mesh){
 const position=mesh.geometry.attributes.position,index=mesh.geometry.index,point=new Vector3(),faces=[]
 const at=i=>{point.fromBufferAttribute(position,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);return point.toArray().map(n=>Number(n.toFixed(6))).join(',')}
 for(let i=0;i<(index?.count??position.count);i+=3){const p=[at(i),at(i+1),at(i+2)];faces.push([p.join(';'),[p[1],p[2],p[0]].join(';'),[p[2],p[0],p[1]].join(';')].sort()[0])}
 return createHash('sha256').update(faces.sort().join('\n')).digest('hex')
}

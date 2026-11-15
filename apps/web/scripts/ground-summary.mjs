import fs from 'node:fs/promises';
const out='../../docs/ground-evaluation';
const summary=[];
for(const variant of ['baseline','baseline-repeat','3d','image']){
 const rows=JSON.parse(await fs.readFile(`${out}/${variant}.json`,'utf8'));
 for(const row of rows){
  const final=row.finalInfo||row.info;
  summary.push({variant,device:row.device,readyMs:Math.round(row.info.readyAt),resourceBytes:final.resources.reduce((n,r)=>n+r.bytes,0),textureEstimateMiB:Math.round(final.textures.reduce((n,t)=>n+(t.width||0)*(t.height||0)*4*(t.mipmap?4/3:1),0)/1048576),textures:final.memory.textures,samples:row.samples.map(s=>({name:s.name,fps:+s.fps.toFixed(1),p95:s.p95,calls:s.calls,triangles:s.triangles,reactCommits:s.reactCommits,heapMiB:+(s.heap/1048576).toFixed(1)})),groundResources:final.resources.filter(r=>/ground_ecosystem|ground-still/.test(r.url))});
 }
}
await fs.writeFile(`${out}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));

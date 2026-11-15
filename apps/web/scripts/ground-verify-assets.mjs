import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const read=async file=>{const bytes=await fs.readFile(file),n=bytes.readUInt32LE(12);return {bytes,json:JSON.parse(bytes.subarray(20,20+n)),bin:bytes.subarray(28+n)};};
const source=await read('public/models/ground_ecosystem_desktop.glb'),derived=await read('public/models/ground_ecosystem_2k.glb');
const imageViews=new Set(source.json.images.map(image=>image.bufferView));
let verified=0;
for(let i=0;i<source.json.bufferViews.length;i++)if(!imageViews.has(i)){
 const a=source.json.bufferViews[i],b=derived.json.bufferViews[i];
 assert.deepEqual(source.bin.subarray(a.byteOffset||0,(a.byteOffset||0)+a.byteLength),derived.bin.subarray(b.byteOffset||0,(b.byteOffset||0)+b.byteLength));verified++;
}
assert.deepEqual(source.json.meshes,derived.json.meshes);
assert.deepEqual(source.json.accessors,derived.json.accessors);
const evidence={nonImageBufferViewsIdentical:verified,geometryAndAccessorsIdentical:true,files:[]};
for(const file of ['public/models/main_island_desktop.glb','public/models/ground_ecosystem_desktop.glb','public/models/ground_ecosystem_2k.glb','public/images/ground-still-desktop.webp','public/images/ground-still-mobile.webp']){
 const bytes=await fs.readFile(file);evidence.files.push({file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
for(const device of ['desktop','mobile']){
 const meta=await sharp(`public/images/ground-still-${device}.webp`).metadata();assert.equal(meta.format,'webp');assert.ok(meta.width>700);
}
await fs.writeFile('../../docs/ground-evaluation/asset-verification.json',JSON.stringify(evidence,null,2));
console.log(`Verified ${verified} unchanged non-image buffer views; mesh and accessor contracts identical.\nVERDICT: PASS`);

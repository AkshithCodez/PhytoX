import fs from 'node:fs/promises';
import sharp from 'sharp';
const source=await fs.readFile('public/models/ground_ecosystem_desktop.glb');
const length=source.readUInt32LE(12),json=JSON.parse(source.subarray(20,20+length).toString());
const bin=source.subarray(28+length);
const images=new Map((json.images||[]).map((image,i)=>[image.bufferView,{image,i}]));
const chunks=[];let offset=0;const report=[];
for(let i=0;i<json.bufferViews.length;i++){
 const view=json.bufferViews[i];let bytes=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
 const entry=images.get(i);
 if(entry){
  const before=await sharp(bytes).metadata();
  if(before.width>2048||before.height>2048){
   const pipeline=sharp(bytes).resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true});
   bytes=entry.image.mimeType==='image/jpeg'?await pipeline.jpeg({quality:90}).toBuffer():await pipeline.png().toBuffer();
  }
  report.push({image:entry.i,before:[before.width,before.height],after:[Math.min(before.width,2048),Math.min(before.height,2048)],bytes:bytes.length});
 }
 const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
 view.byteOffset=offset;view.byteLength=bytes.length;chunks.push(bytes);offset+=bytes.length;
}
json.buffers[0].byteLength=offset;
let jb=Buffer.from(JSON.stringify(json));jb=Buffer.concat([jb,Buffer.alloc((4-jb.length%4)%4,32)]);
let bb=Buffer.concat(chunks);bb=Buffer.concat([bb,Buffer.alloc((4-bb.length%4)%4)]);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+jb.length+bb.length,8);header.writeUInt32LE(jb.length,12);header.writeUInt32LE(0x4e4f534a,16);
const bh=Buffer.alloc(8);bh.writeUInt32LE(bb.length);bh.writeUInt32LE(0x004e4942,4);
await fs.writeFile('public/models/ground_ecosystem_2k.glb',Buffer.concat([header,jb,bh,bb]));
await fs.writeFile('../../docs/ground-evaluation/texture-derivative.json',JSON.stringify({sourceBytes:source.length,outputBytes:28+jb.length+bb.length,images:report,geometry:'Unmodified original bufferViews; no simplification or terrain generation'},null,2));
console.log(report);

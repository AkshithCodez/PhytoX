import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const out='../../docs/ground-evaluation';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('http://127.0.0.1:3100',{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__threeRenderer?.info.render.frame>10);
await page.evaluate(()=>{
 const gl=window.__threeRenderer,render=gl.render.bind(gl);
 gl.render=(scene,camera)=>{window.__scene=scene;window.__camera=camera;render(scene,camera);};
 window.scrollTo(0,innerHeight*4.6*.51);
});
await page.waitForTimeout(2000);
const results=[];
for(const mode of ['original','no-ground-shadow','front-face','no-normal','static-shadows']){
 const config=await page.evaluate(mode=>{
  let m;window.__scene.traverse(o=>{if(o.isMesh&&o.scale.y===3.95)m=o;});
  if(mode==='original')return {side:m.material.side,transparent:m.material.transparent,alphaTest:m.material.alphaTest,normal:!!m.material.normalMap,maps:Object.entries(m.material).filter(([k,v])=>v?.isTexture).map(([k,v])=>({key:k,width:v.image?.width,height:v.image?.height}))};
  if(mode==='no-ground-shadow')m.castShadow=false;
  if(mode==='front-face'){m.material.side=0;m.material.needsUpdate=true;}
  if(mode==='no-normal'){window.__normal=m.material.normalMap;m.material.normalMap=null;m.material.needsUpdate=true;}
  if(mode==='static-shadows'){m.material.normalMap=window.__normal;m.material.needsUpdate=true;window.__threeRenderer.shadowMap.autoUpdate=false;window.__threeRenderer.shadowMap.needsUpdate=true;}
 },mode);
 await page.waitForTimeout(1200);
 const timing=await page.evaluate(async()=>{
  const times=[];let last=performance.now(),start=last;
  await new Promise(resolve=>{const tick=now=>{times.push(now-last);last=now;if(now-start<3000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  times.shift();times.sort((a,b)=>a-b);return {fps:1000/(times.reduce((a,b)=>a+b,0)/times.length),p95:times[Math.floor(times.length*.95)],calls:window.__threeRenderer.info.render.calls,triangles:window.__threeRenderer.info.render.triangles};
 });
 results.push({mode,config,timing});
 await page.screenshot({path:`${out}/ablation-${mode}.png`});
 console.log(results.at(-1));
}
await fs.writeFile(`${out}/ablations.json`,JSON.stringify(results,null,2));
await browser.close();

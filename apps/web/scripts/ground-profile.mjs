import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const label = process.argv[2] || 'baseline';
const base = process.env.PROFILE_URL || 'http://127.0.0.1:3100';
const output = path.resolve('../../docs/ground-evaluation');
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({channel:'chrome',headless:true});
const all = [];
for (const [device,width,height,dpr] of [['desktop',1440,900,1],['mobile',390,844,2]]) {
  const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.addInitScript(() => {
    window.__groundProbe={long:[],commits:0};
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,inject:()=>1,onCommitFiberRoot:()=>window.__groundProbe.commits++,onCommitFiberUnmount:()=>{}};
    new PerformanceObserver(list=>window.__groundProbe.long.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/?ground=${label}`,{waitUntil:'networkidle',timeout:120000});
  await page.waitForFunction(()=>window.__threeRenderer?.info.render.frame>10,{timeout:120000});
  await page.evaluate(()=>{
    const gl=window.__threeRenderer, original=gl.render.bind(gl);
    window.__groundProbe.render=[];
    gl.render=(scene,camera)=>{
      window.__groundProbe.scene=scene;window.__groundProbe.camera=camera;
      const start=performance.now();original(scene,camera);
      window.__groundProbe.render.push({time:performance.now(),duration:performance.now()-start,calls:gl.info.render.calls,triangles:gl.info.render.triangles});
      if(window.__groundProbe.render.length>3000)window.__groundProbe.render.shift();
    };
  });
  await page.waitForTimeout(500);
  const info=await page.evaluate(()=>{
    const p=window.__groundProbe, gl=window.__threeRenderer;
    const meshes=[];const textures=new Map();
    p.scene.traverse(o=>{
      if(o.isMesh){meshes.push({name:o.name,vertices:o.geometry.attributes.position?.count,triangles:(o.geometry.index?.count||o.geometry.attributes.position?.count)/3,instances:o.count||1,position:o.position.toArray()});}
      for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)for(const t of Object.values(m))if(t?.isTexture)textures.set(t.uuid,{width:t.image?.width,height:t.image?.height,mipmap:t.generateMipmaps});
    });
    const ctx=gl.getContext(),ext=ctx.getExtension('WEBGL_debug_renderer_info');
    return {renderer:ext?ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL):ctx.getParameter(ctx.RENDERER),meshes,textures:[...textures.values()],memory:gl.info.memory,heap:performance.memory?.usedJSHeapSize,resources:performance.getEntriesByType('resource').filter(e=>/models|textures|hdri|draco/.test(e.name)).map(e=>({url:new URL(e.name).pathname,bytes:e.encodedBodySize,duration:e.duration,end:e.responseEnd})),readyAt:performance.now()};
  });
  for(const [stage,p] of [['hero',0],['ground',.51],['regional',.71]]){
    await page.evaluate(p=>window.scrollTo(0,innerHeight*4.6*p),p);
    await page.waitForTimeout(1800);
    await page.screenshot({path:path.join(output,`${label}-${device}-${stage}.png`)});
  }
  async function sample(name,hideGround=false){
    await page.evaluate(({hideGround})=>{
      // The existing ground primary mesh has an authored scale of 5.2/3.95/5.2.
      window.__groundProbe.scene.traverse(o=>{if(o.isMesh&&Math.abs(o.scale.x-5.2)<.001&&Math.abs(o.scale.y-3.95)<.001)o.visible=!hideGround;});
      window.scrollTo(0,innerHeight*4.6*.48);
    },{hideGround});
    await page.waitForTimeout(1000);
    return await page.evaluate(async(name)=>{
      const probe=window.__groundProbe,start=performance.now(),commits=probe.commits,frames=[];
      let prev=start;
      await new Promise(resolve=>{
        const tick=now=>{frames.push(now-prev);prev=now;const t=Math.min(1,(now-start)/5000);window.scrollTo(0,innerHeight*4.6*(.48+.07*t));if(t<1)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);
      });
      const sorted=frames.slice(1).sort((a,b)=>a-b),r=probe.render.filter(r=>r.time>=start);
      const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)]??0;
      return {name,elapsed:performance.now()-start,frames:frames.length,fps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length),p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],over33:sorted.filter(x=>x>33.4).length,reactCommits:probe.commits-commits,longTasks:probe.long.filter(e=>e.start>=start),renderCount:r.length,renderCpuP50:median(r.map(x=>x.duration)),calls:median(r.map(x=>x.calls)),triangles:median(r.map(x=>x.triangles)),heap:performance.memory?.usedJSHeapSize};
    },name);
  }
  const samples=[];
  for(let i=0;i<2;i++)samples.push(await sample('ground-'+i));
  if(label.startsWith('baseline'))samples.push(await sample('primary-ground-hidden',true));
  const finalInfo=await page.evaluate(()=>{
    const textures=new Map();
    window.__groundProbe.scene.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m)for(const t of Object.values(m))if(t?.isTexture)textures.set(t.uuid,{width:t.image?.width,height:t.image?.height,mipmap:t.generateMipmaps});});
    return {textures:[...textures.values()],memory:window.__threeRenderer.info.memory,resources:performance.getEntriesByType('resource').filter(e=>/models|textures|hdri|draco|ground-still/.test(e.name)).map(e=>({url:new URL(e.name).pathname,bytes:e.encodedBodySize,duration:e.duration,end:e.responseEnd}))};
  });
  all.push({device,width,height,dpr,info,finalInfo,samples,errors});
  await fs.writeFile(path.join(output,`${label}.json`),JSON.stringify(all,null,2));
  console.log(JSON.stringify({label,device,renderer:info.renderer,samples}));
  await context.close();
}
await browser.close();

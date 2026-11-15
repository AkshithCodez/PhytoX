import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const manifest=[];
for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
 await page.goto('http://127.0.0.1:3100/?ground=3d',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__threeRenderer?.info.render.frame>10);
 await page.evaluate(()=>window.scrollTo(0,innerHeight*4.6*.51));
 await page.waitForResponse(r=>r.url().includes('ground_ecosystem_2k.glb')&&r.ok()).catch(()=>{});
 await page.waitForTimeout(2000);
 await page.addStyleTag({content:'header, header *, main, main * { visibility: hidden !important; }'});
 await page.evaluate(()=>window.__threeRenderer.setPixelRatio(2));
 await page.waitForTimeout(1000);
 const png=await page.screenshot();
 const dest=`public/images/ground-still-${name}.webp`;
 await sharp(png).webp({quality:90,effort:6}).toFile(dest);
 manifest.push({name,width:width*2,height:height*2,bytes:(await fs.stat(dest)).size,source:'Existing Meshy ecosystem texture-only2k derivative, production camera at scroll progress0.51, all HUD descendants hidden; no terrain or hero alteration',format:'WebP quality90'});
 await page.close();
}
await fs.writeFile('../../docs/ground-evaluation/still-provenance.json',JSON.stringify(manifest,null,2));
await browser.close();

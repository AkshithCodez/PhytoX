import { test, expect } from "@playwright/test";

async function ground(page: import("@playwright/test").Page, variant = "image") {
  await page.goto(`/?ground=${variant}`);
  await page.evaluate(() => window.scrollTo(0, innerHeight * 4.6 * .51));
  await expect(page.getByRole("heading", { name: /From a single leaf to a clearer picture of crop health/i })).toBeVisible();
}
for (const [width, height] of [[320,720],[390,844],[768,1024],[1440,900],[1920,1080]]) {
  test(`ground still and real hotspots at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({width,height});
    const models: string[] = [];
    page.on("request", request => { if(request.url().includes("ground_ecosystem"))models.push(request.url()); });
    await ground(page);
    await expect(page.locator("[data-ground-image] img")).toBeVisible();
    await page.waitForFunction(() => {
      const img=document.querySelector<HTMLImageElement>("[data-ground-image] img");
      return img?.complete && img.naturalWidth > 0;
    });
    const buttons=page.locator("[data-ground-hotspots] button");
    await expect(buttons).toHaveCount(3);
    for(let i=0;i<3;i++){
      await buttons.nth(i).click();
      await expect(buttons.nth(i)).toHaveAttribute("aria-expanded","true");
      const detail=page.locator(`#hs-${i+1}-detail`);
      const box=await detail.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x+box!.width).toBeLessThanOrEqual(width+1);
      await buttons.nth(i).click();
    }
    expect(models).toEqual([]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.getByRole("link",{name:"Farmer Portal",exact:true}).first()).toHaveAttribute("href","/farmer");
  });
}
test.skip("3D comparison lazily loads the derivative and preserves hotspots",async({page})=>{
  const requests:string[]=[];
  page.on("request",r=>requests.push(r.url()));
  await page.goto("/?ground=3d");
  await page.waitForTimeout(1200);
  expect(requests.some(url=>url.includes("ground_ecosystem"))).toBe(false);
  const model=page.waitForResponse(r=>r.url().includes("ground_ecosystem_2k.glb")&&r.ok());
  await page.evaluate(()=>window.scrollTo(0,innerHeight*4.6*.51));
  await model;
  await expect(page.locator("[data-ground-hotspots] button").first()).toBeVisible();
  await expect(page.locator("[data-ground-image]")).toHaveCount(0);
});
test("reduced motion keeps the image still and pauses covered WebGL",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await ground(page);
  await page.waitForFunction(()=>{
    const img=document.querySelector<HTMLImageElement>("[data-ground-image] img");return img?.complete&&img.naturalWidth>0;
  });
  await expect(page.locator("[data-ground-image]")).toHaveCSS("transform","matrix(1, 0, 0, 1, 0, 0)");
  await page.waitForFunction(() => typeof (window as unknown as {__threeRenderer?:{info:{render:{frame:number}}}}).__threeRenderer?.info.render.frame === "number");
  await page.waitForTimeout(500);
  const frame=()=>page.evaluate(()=>(window as unknown as {__threeRenderer:{info:{render:{frame:number}}}}).__threeRenderer?.info.render.frame);
  const before=await frame();await page.waitForTimeout(300);expect(await frame()).toBe(before);
  await page.evaluate(()=>window.scrollTo(0,innerHeight*4.6*.71));
  await expect.poll(frame, { timeout: 15000 }).toBeGreaterThan(before);
});
test("WebGL context loss leaves the ecosystem and farmer access usable",async({page})=>{
  await ground(page);
  await page.waitForFunction(()=>(window as unknown as {__threeRenderer?:unknown}).__threeRenderer);
  await page.evaluate(()=>{
    const gl=(window as unknown as {__threeRenderer:{getContext:()=>WebGLRenderingContext}}).__threeRenderer.getContext();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("[data-ground-image] img")).toBeVisible();
  await expect(page.getByRole("link",{name:"Farmer Portal",exact:true}).first()).toHaveAttribute("href","/farmer");
});

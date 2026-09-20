const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');
const { studioFrame, captionScale } = loadTs('src/renderer/src/scene/studio/studioFrame.ts');
const { clayRecipes, recipeIndex } = loadTs('src/renderer/src/scene/studio/clayArt.ts');

test('Crewlo default framing fits the complete artwork at desktop, narrow and expanded sizes', () => {
  for (const [w,h] of [[960,450],[800,350],[420,320]]) {
    for (const count of [0,1,3,6,14,30]) {
      const f = studioFrame(w,h,count);
      const rows = Math.ceil(Math.max(0,count-6)/4);
      const bottom = 670 + rows*240 + (rows ? 40 : 0);
      assert.ok(f.x+45*f.scale >= -0.001);
      assert.ok(f.x+1075*f.scale <= w+0.001);
      assert.ok(f.y+24*f.scale >= -0.001);
      assert.ok(f.y+bottom*f.scale <= h+0.001);
    }
  }
});
test('Crewlo camera preserves user zoom and pan; captions remain legible without crowded bench overlap',()=>{
  const fit=studioFrame(800,400,3);
  const moved=studioFrame(800,400,3,1.2,{x:20,y:-12});
  const zoom=studioFrame(800,400,3,1.2);
  assert.equal(moved.scale,fit.scale*1.2);
  assert.equal(moved.x,zoom.x+20);
  assert.equal(moved.y,zoom.y-12);
  assert.ok(captionScale(.5,3)*.5*20 >=14);
  assert.ok(captionScale(.4,14)<=1.4);
});
test('Every saved character ID keeps its stable index and a distinct sculpt recipe',()=>{
  const ids=['michael','jim','pam','dwight','kevin','angela','oscar','stanley','phyllis','andy','kelly','ryan','toby','creed','meredith'];
  assert.equal(clayRecipes.length,15);
  ids.forEach((id,index)=>assert.equal(recipeIndex(id),index));
  assert.equal(new Set(clayRecipes.map(r=>r.hairStyle+':'+r.accessory)).size,15);
});

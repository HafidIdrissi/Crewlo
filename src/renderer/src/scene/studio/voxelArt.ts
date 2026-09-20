import { clayRecipes, recipeIndex } from './clayArt'; // Saved palette/IDs only; no clay drawing code.
import type { Motion } from './voxelLife';
import type { Prop } from './voxelWorld';

export type Painter = (points:number[], color:string)=>void;
export const iso=(x:number,y:number,z=0):[number,number]=>[(x-y)*32,(x+y)*14-z*32];
const shade=(hex:string,f:number)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*f))).toString(16).padStart(2,'0')).join('');
/** One cuboid primitive supplies identical materials to scenery and portraits. */
export function block(p:Painter,x:number,y:number,z:number,w:number,d:number,h:number,c:string) {
  const v=(a:number,b:number,k:number)=>iso(a,b,k);
  p([...v(x,y+d,z),...v(x+w,y+d,z),...v(x+w,y+d,z+h),...v(x,y+d,z+h)],c);
  p([...v(x+w,y,z),...v(x+w,y+d,z),...v(x+w,y+d,z+h),...v(x+w,y,z+h)],shade(c,.76));
  p([...v(x,y,z+h),...v(x+w,y,z+h),...v(x+w,y+d,z+h),...v(x,y+d,z+h)],shade(c,1.16));
}

export function drawVoxelPerson(p:Painter,key:string,pose:Motion='idle',phase=0,facing=0) {
  const i=recipeIndex(key),r=clayRecipes[i%clayRecipes.length];
  const b=(x:number,y:number,z:number,w:number,d:number,h:number,c:string)=>{
    if(facing===1)block(p,y,-x-w,z,d,w,h,c);
    else if(facing===2)block(p,-x-w,-y-d,z,w,d,h,c);
    else if(facing===3)block(p,-y-d,x,z,d,w,h,c);
    else block(p,x,y,z,w,d,h,c);
  };
  const seated=['typing','sit','gaming'].includes(pose), walk=pose==='walking'?Math.sin(phase*8)*.16:0;
  for(const side of [-1,1]) {
    const x=side*.18-.09;
    b(x,-.1+walk*side,.1,.18,.2,seated?.3:.52,r.trousers);
    if(seated)b(x,-.36,.39,.18,.43,.18,r.trousers);
    b(x-.025,-.13+walk*side,0,.23,.32,.14,'#d4c5a8');
  }
  b(-.3,-.18,.6,.6,.36,.64,r.shirt);
  if(r.accessory==='apron')b(-.22,.185,.63,.44,.035,.5,'#d4bf98');
  if(r.accessory==='vest'){b(-.3,.185,.66,.18,.035,.5,'#d8c7ac');b(.12,.185,.66,.18,.035,.5,'#d8c7ac');}
  const handLift=['coffee','smoking'].includes(pose)?(.5+.06*Math.sin(phase*2)):pose==='attention'?.7:0;
  const working=pose==='typing'||pose==='gaming';
  for(const side of [-1,1]) {
    const armY=working?.25:(walk*side), lift=side===1?handLift:0;
    b(side<0?-.48:.3,armY-.1,(working?.94:.73)+lift,.18,working?.45:.22,working?.18:.44,r.shirt);
    b(side<0?-.48:.3,(working?.45:armY-.1),(working?.91:.59)+lift+(working?Math.sin(phase*10+side)*.035:0),.18,.21,.17,r.skin);
  }
  b(-.13,-.12,1.24,.26,.24,.14,r.skin);
  b(-.34,-.3,1.36,.68,.6,.63,r.skin);
  b(-.37,-.33,1.87,.74,.66,.16,r.hair);
  b(-.37,-.33,1.5,.74,.1,.4,r.hair);
  const hs=r.hairStyle;
  if(['bob','long','braids','waves'].includes(hs)) {
    b(-.4,-.3,hs==='bob'?1.4:1.18,.12,.6,hs==='bob'?.5:.72,r.hair);
    b(.28,-.3,hs==='bob'?1.4:1.18,.12,.6,hs==='bob'?.5:.72,r.hair);
  }
  if(['curls','waves','puffs'].includes(hs)) for(let n=0;n<3;n++)b(-.4+n*.28,-.34,1.96,.25,.55,.14+(n%2)*.08,r.hair);
  if(hs==='puffs'){b(-.57,-.23,1.8,.28,.35,.34,r.hair);b(.29,-.23,1.8,.28,.35,.34,r.hair);}
  if(['bun','topknot'].includes(hs))b(.04,-.37,2,.3,.3,.24,r.hair);
  if(hs==='cap'||hs==='beanie'){b(-.38,-.34,1.89,.76,.68,.22,hs==='cap'?'#627e70':'#b78050');b(-.4,.2,1.91,.8,.25,.08,hs==='cap'?'#627e70':'#b78050');}
  if(hs==='shaved')b(-.34,-.3,1.96,.68,.6,.03,r.skin);
  if(facing===0||facing===1) {
    for(const x of [-.2,.11])b(x,.302,1.65,.085,.02,.085,'#302d29');
    b(-.04,.302,1.5,.12,.03,.035,'#835843');
    if(r.accessory==='glasses')for(const x of [-.27,.06]){b(x,.32,1.61,.23,.035,.17,'#39454a');b(x+.04,.36,1.64,.14,.015,.1,'#b3c3c2');}
    if(r.accessory==='beard')b(-.25,.32,1.38,.5,.03,.16,r.hair);
    if(r.accessory==='freckles')for(const x of [-.27,-.18,.2,.27])b(x,.32,1.55,.025,.02,.025,'#9d664b');
  } else b(-.33,-.34,1.46,.66,.07,.45,r.hair);
  if(r.accessory==='headphones'){b(-.45,-.06,1.58,.14,.28,.28,'#58676e');b(.31,-.06,1.58,.14,.28,.28,'#58676e');b(-.42,-.06,2.04,.84,.12,.06,'#d1bb92');}
  if(r.accessory==='scarf'){b(-.32,-.19,1.18,.64,.4,.09,'#e4d3ac');b(.15,.2,.94,.1,.05,.3,'#e4d3ac');}
  if(r.accessory==='pencil'){b(.13,.2,.84,.14,.04,.2,shade(r.shirt,.8));b(.19,.25,.93,.035,.025,.22,'#ddb65d');}
  if(r.accessory==='earrings'){b(-.4,.18,1.47,.08,.07,.16,'#dab668');b(.32,.18,1.47,.08,.07,.16,'#dab668');}
  if(r.accessory==='collar'){b(-.24,.2,1.17,.17,.03,.09,'#e7dac3');b(.08,.2,1.17,.17,.03,.09,'#e7dac3');}
  if(pose==='coffee') {b(.31,.02,1.18,.2,.2,.24,'#f4e4c5');b(.35,.04,1.42,.12,.12,.01,'#644a35');}
  if(pose==='smoking')b(.36,.18,1.25,.05,.24,.045,'#e4d7bc');
  if(pose==='gaming')b(-.21,-.44,.8,.44,.19,.1,'#3e4a50');
}

export function voxelPortrait(key:string) {
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=320;
  const c=canvas.getContext('2d')!;c.translate(120,292);c.scale(3.35,3.35);
  drawVoxelPerson((pts,color)=>{c.beginPath();pts.forEach((v,i)=>{if(i%2===0)i?c.lineTo(v,pts[i+1]):c.moveTo(v,pts[i+1]);});c.closePath();c.fillStyle=color;c.fill();},key);
  return canvas;
}

export function drawProp(p:Painter,prop:Prop,active=false) {
  const {kind,w,d}=prop, b=(x:number,y:number,z:number,ww:number,dd:number,h:number,c:string)=>block(p,x,y,z,ww,dd,h,c);
  const wood='#b88b5f', light='#d3b585', dark='#39474c';
  const table=(height=.75)=>{b(.1,.1,0,.16,.16,height,wood);b(w-.26,d-.26,0,.16,.16,height,wood);b(0,0,height,w,d,.15,light);};
  switch(kind) {
    case 'desk':
      table();b(.5,.23,.9,.12,.12,.35,dark);b(.25,.1,1.16,1.05,.16,.65,dark);
      b(.31,.267,1.22,.91,.018,.51,active?'#8bc7b0':'#6c7e83');
      if(active)for(let i=0;i<3;i++)b(.4,.29,1.3+i*.11,.32+i*.12,.015,.035,'#d6ede0');
      b(.45,.62,.92,.8,.27,.07,'#5d6463');for(let i=0;i<5;i++)b(.48+i*.14,.7,1,.08,.07,.015,'#d4c9b5');
      b(1.45,.4,.9,.18,.2,.24,'#b56e51');break;
    case 'chair': b(.21,.2,0,.15,.15,.45,dark);b(0,0,.42,.7,.65,.13,'#7d9182');b(0,.55,.55,.7,.12,.63,'#7d9182');break;
    case 'meeting':case 'dining':case 'table':table();b(.5,.3,.9,.55,.4,.03,'#f0e3c9');if(kind==='meeting')b(2,.2,.9,.7,.55,.04,'#6d8c9a');break;
    case 'sofa':case 'bench':
      b(0,0,.15,w,d,.4,prop.color??wood);b(0,0,.5,w,.2,.55,prop.color??wood);
      for(let i=0;i<w;i++)b(i+.08,.24,.54,.84,.66,.14,prop.color?shade(prop.color,1.14):light);
      b(0,.05,.4,.18,.92,.4,prop.color??wood);b(w-.18,.05,.4,.18,.92,.4,prop.color??wood);break;
    case 'coffee':b(0,0,0,w,d,.8,wood);b(.2,.15,.8,.85,.6,.92,dark);b(.3,.77,1.05,.65,.03,.42,'#acb5aa');b(.5,.65,.82,.18,.2,.2,'#eee1c5');b(1.3,.3,.8,.4,.4,.4,'#e1c692');break;
    case 'snacks':b(0,0,0,w,d,.8,wood);for(let i=0;i<4;i++)b(.3+i*.6,.2,.8,.35,.45,.35,['#be795b','#b7a068','#7f9b78','#829daa'][i]);break;
    case 'shelf':b(0,0,0,w,.7,1.7,wood);for(let i=0;i<7;i++)b(.15+i*.36,.71,.5,.23,.08,.8,['#6b8792','#bb7d61','#bba464'][i%3]);b(0,.68,.43,w,.2,.08,light);break;
    case 'arcade':b(0,.1,0,1.4,.7,1.2,'#647f90');b(.1,.12,1.2,1.2,.55,.85,dark);b(.2,.69,1.35,1,.025,.55,'#a8c4ae');for(let i=0;i<4;i++)b(.3+i*.2,.72,1.42+(i%2)*.2,.12,.015,.12,'#d5ab68');b(0,.1,2.05,1.4,.7,.22,'#c08c5f');b(.5,.85,1.1,.12,.12,.2,'#ac654a');break;
    case 'tv':b(0,0,0,w,.65,.5,wood);b(.2,.15,.7,w-.4,.15,1.2,dark);b(.3,.31,.8,w-.6,.02,.98,'#718c92');b(1,.33,1,.65,.02,.5,'#a4bb98');b(2.5,.3,.5,.3,.35,.4,'#d9d6c8');break;
    case 'foosball':table(.65);b(0,0,.8,w,d,.13,'#648577');for(let i=0;i<4;i++){b(.4+i*.6,-.3,.99,.045,1.6,.045,dark);b(.34+i*.6,.4,.91,.15,.12,.25,i%2?'#b16d52':'#d6bd85');}b(0,0,.8,w,.08,.3,wood);b(0,.92,.8,w,.08,.3,wood);break;
    case 'plant':b(.15,.15,0,.6,.6,.55,'#ac7558');b(.4,.4,.55,.13,.13,.75,wood);b(.05,.2,1.05,.65,.6,.55,'#7d946c');b(.3,.05,1.45,.55,.6,.4,'#8fa47a');break;
    case 'lamp':b(.2,.2,0,.6,.6,.12,dark);b(.47,.47,.1,.08,.08,2.15,dark);b(.2,.2,2.15,.6,.6,.3,'#eed9a0');break;
    case 'ashtray':b(.35,.35,0,.3,.3,.8,'#7f8982');b(.15,.15,.8,.7,.7,.12,'#bbb7a9');b(.28,.28,.93,.44,.44,.025,'#555c57');break;
  }
}

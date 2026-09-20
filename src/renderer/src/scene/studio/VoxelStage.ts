import { Application, Container, Graphics, Text } from 'pixi.js';
import { block, iso, drawProp, drawVoxelPerson, type Painter } from './voxelArt';
import { createWorld, type VoxelWorld } from './voxelWorld';
import { VoxelLife, type Execution } from './voxelLife';

export interface SceneAgent extends Execution { name:string; character:string }
const painter=(g:Graphics):Painter=>(points,color)=>{g.poly(points).fill(color);};
export class VoxelStage {
  root=new Container(); floor=new Graphics(); objects=new Container(); captions=new Container();
  cameraMode:'overview'|'follow'='overview';
  life:VoxelLife; world:VoxelWorld; zoom=1; pan={x:0,y:0}; agents:SceneAgent[]=[]; selected:string|null=null;
  private people=new Map<string,{body:Graphics;ring:Graphics;caption:Container;name:Text;status:Text;nameTag:Text;plate:Graphics;key:string;captionKey:string}>();
  private hovered:string|null=null;
  private monitors:Graphics[]=[];
  private elapsed=0; private syncElapsed=0; private publishedAt=0; private lastCount=-1; private reduced=false;
  constructor(public app:Application, private host:HTMLElement, private select:(id:string)=>void) {
    this.world=createWorld(0);this.life=new VoxelLife(this.world);
    this.objects.sortableChildren=true;this.root.addChild(this.floor,this.objects,this.captions);app.stage.addChild(this.root);
    this.rebuild(0); app.ticker.maxFPS=30;
  }
  rebuild(count:number) {
    this.lastCount=count; this.world=createWorld(count);this.life=new VoxelLife(this.world);
    this.floor.clear();this.objects.removeChildren().forEach(c=>c.destroy({children:true}));this.captions.removeChildren().forEach(c=>c.destroy({children:true}));this.people.clear();this.monitors=[];
    const p=painter(this.floor),w=this.world;
    for(let y=0;y<w.height;y++)for(let x=0;x<w.width;x++) {
      const terrace=x>14&&y>w.split,game=x<14&&y>w.split,wood=x<14&&y<w.split;
      const palette=terrace?['#8ea478','#a0b48a']:game?['#304b69','#3b5977']:wood?['#bb8d5e','#c99b6a']:['#b76f54','#ca8366'];
      block(p,x,y,-.2,.985,.985,.2,palette[(x+y)%4===0?1:0]);
      if(wood||terrace)block(p,x+.07,y+.16,.002,.82,.025,.008,wood?'#aa794f':'#7f956c');
    }
    // Walls use the exact same collision cells as navigation; door openings stay clear.
    for(const key of w.blocked) {
      const [x,y]=key.split(',').map(Number);
      const boundary=x===0||y===0||x===27||y===w.height-1||x===14||y===w.split;
      if(!boundary)continue;
      const g=new Graphics(),gp=painter(g);
      const terrace=(x===27&&y>w.split)||(y===w.height-1&&x>14);
      const back=x===0||y===0;
      if(terrace) {
        if((x+y)%3===0)block(gp,x,y,0,.12,.12,.9,'#6f8074');
        block(gp,x,y,.72,x===27?.1:1,x===27?1:.1,.1,'#809184');
      } else if(back) {
        block(gp,x,y,0,1,1,1.35,'#ddd2b9');
        if((x+y)%5!==0)block(gp,x+.15,y+.15,1.36,.7,.7,.85,'#afc7c0');
        else block(gp,x,y,1.35,1,1,1,'#bca684');
        block(gp,x,y,2.25,1,1,.12,'#e7dcc5');
      } else block(gp,x,y,0,.8,.8,.32,'#baa88b');
      g.zIndex=(x+y)*100+60;this.objects.addChild(g);
    }
    for(const prop of w.props) {
      const g=new Graphics();g.position.set(...iso(prop.x,prop.y));g.zIndex=(prop.x+prop.y)*100+Math.max(prop.w,prop.d)*35;
      drawProp(painter(g),prop);this.objects.addChild(g);
      if(prop.desk!==undefined)this.monitors[prop.desk]=g;
    }
    // Open timber door frames over the four two-cell circulation gaps.
    for(const [x,y,axis] of [[14,4,0],[14,w.split+4,0],[6,w.split,1],[20,w.split,1]]) {
      const g=new Graphics(),gp=painter(g);
      if(axis===0){block(gp,x,y-.15,0,.12,.12,2.4,'#b69a74');block(gp,x,y+2,0,.12,.12,2.4,'#b69a74');block(gp,x,y-.15,2.4,.12,2.3,.12,'#cbb08b');}
      else {block(gp,x-.15,y,0,.12,.12,2.4,'#b69a74');block(gp,x+2,y,0,.12,.12,2.4,'#b69a74');block(gp,x-.15,y,2.4,2.3,.12,.12,'#cbb08b');}
      g.zIndex=(x+y)*100;this.objects.addChild(g);
    }
    const labels=[['01 / WORKSHOP',5,.8],['02 / COFFEE & COMPANY',20,1],['03 / PLAY ROOM',5,w.split+1],['04 / OPEN AIR',20,w.split+1],['SMOKING CORNER',26,w.split+9]] as const;
    for(const [name,x,y] of labels) {
      const t=new Text({text:name,style:{fontFamily:'Inter',fontSize:name==='SMOKING CORNER'?12:17,fontWeight:'700',fill:y>w.split&&x<14?0xe9efec:0x394636,letterSpacing:1}});
      t.anchor.set(.5);t.position.set(...iso(x,y,name==='SMOKING CORNER'?.1:2.8));this.captions.addChild(t);
    }
    this.layout();
  }
  update(agents:SceneAgent[],selected:string|null,reduced:boolean) {
    if(agents.length!==this.lastCount)this.rebuild(agents.length);
    this.agents=agents;this.selected=selected;this.reduced=reduced;
    this.life.sync(agents,this.elapsed,reduced);
    this.layout();this.draw(true);this.publish();
  }
  tick(dt:number) {
    if(document.hidden)return;
    this.elapsed+=Math.min(dt,.1)*1000;this.syncElapsed+=dt;
    if(this.syncElapsed>.2){this.life.sync(this.agents,this.elapsed,this.reduced);this.syncElapsed=0;}
    if(!this.reduced)this.life.step(dt,this.elapsed);
    if(this.cameraMode==='follow')this.frame();
    this.draw(false);
    if(this.elapsed-this.publishedAt>500){this.publish();this.publishedAt=this.elapsed;}
  }
  private publish() {
    // Read-only rendering diagnostics, useful for accessibility/automated visual verification.
    this.host.dataset.voxelActors=JSON.stringify([...this.life.actors.values()].map(a=>({id:a.id,x:a.x,y:a.y,mode:a.mode,label:a.label,destination:a.destination?.id})));
  }
  private draw(force:boolean) {
    const alive=new Set(this.agents.map(a=>a.id));
    for(const [id,v] of this.people)if(!alive.has(id)){v.body.destroy();v.ring.destroy();v.caption.destroy({children:true});v.nameTag.destroy();this.people.delete(id);}
    this.agents.forEach((agent,index)=>{
      const a=this.life.actors.get(agent.id);if(!a)return;
      let view=this.people.get(agent.id);
      if(!view) {
        const body=new Graphics(),ring=new Graphics(),caption=new Container(),plate=new Graphics();
        const nameTag=new Text({text:agent.name,style:{fontFamily:'Inter',fontSize:12,fontWeight:'600',fill:0x303b34,stroke:{color:0xfffaf0,width:3}}});
        const name=new Text({text:agent.name,style:{fontFamily:'Inter',fontSize:14,fontWeight:'600',fill:0x303b34}});
        const status=new Text({text:'',style:{fontFamily:'Inter',fontSize:12,fill:0x526657}});
        nameTag.anchor.set(.5);name.anchor.set(.5);status.anchor.set(.5);name.y=9;status.y=26;
        const hover=()=>{this.hovered=agent.id;};const leave=()=>{if(this.hovered===agent.id)this.hovered=null;};
        caption.addChild(plate,name,status);caption.eventMode='static';caption.cursor='pointer';caption.on('pointertap',()=>this.select(agent.id));caption.on('pointerover',hover);caption.on('pointerout',leave);
        nameTag.eventMode='static';nameTag.cursor='pointer';nameTag.on('pointertap',()=>this.select(agent.id));nameTag.on('pointerover',hover);nameTag.on('pointerout',leave);
        body.eventMode='static';body.cursor='pointer';body.on('pointertap',()=>this.select(agent.id));body.on('pointerover',hover);body.on('pointerout',leave);
        this.objects.addChild(ring,body);this.captions.addChild(nameTag,caption);
        view={body,ring,caption,plate,name,status,nameTag,key:'',captionKey:''};this.people.set(agent.id,view);
      }
      const [x,y]=iso(a.x+.4,a.y+.35);
      view.body.position.set(x,y);view.body.scale.set(1.18);view.body.zIndex=(a.x+a.y)*100+85;
      view.ring.position.set(...iso(a.x,a.y));view.ring.zIndex=(a.x+a.y)*100-5;
      const phase=this.reduced?0:Math.floor(this.elapsed/100)/10;
      const animated=['walking','typing','coffee','gaming','smoking'].includes(a.mode);
      const key=`${agent.character}|${a.mode}|${a.facing}|${animated?phase:0}|${agent.id===this.selected}`;
      if(force||view.key!==key) {
        view.body.clear();drawVoxelPerson(painter(view.body),agent.character,a.mode,phase,a.facing);
        if(a.mode==='smoking'&&!this.reduced)for(let i=0;i<3;i++) {
          const rise=((phase*.6+i*.35)%1.6);block(painter(view.body),.35+rise*.12,.35,1.5+rise,.08,.08,.08,'#c6c8bf');
        }
        view.ring.clear();if(agent.id===this.selected)block(painter(view.ring),-.2,-.2,.02,1.2,1.2,.045,'#c18c53');
        view.key=key;
      }
      const warning=a.mode==='attention';
      const text=(warning?'! ':a.label==='Finished'?'✓ ':'')+a.label;
      if(view.captionKey!==agent.name+'|'+text) {
      view.captionKey=agent.name+'|'+text;
      view.name.text=agent.name.length>21?agent.name.slice(0,20)+'…':agent.name;
      view.status.text=text;view.status.style.fill=warning?0xa34831:0x526657;
      const width=Math.max(view.name.width,view.status.width)+14;
      view.plate.clear().rect(-width/2,-1,width,37).fill({color:0xfffaf0,alpha:.94});
      }
      const detailed=agent.id===this.selected||agent.id===this.hovered;
      view.nameTag.text=agent.name.length>16?agent.name.slice(0,15)+'…':agent.name;
      view.nameTag.position.set(x,y+12/this.root.scale.x);view.nameTag.scale.set(1/this.root.scale.x);view.nameTag.visible=!detailed;
      view.caption.position.set(x,y-92-42/this.root.scale.x);view.caption.scale.set(1/this.root.scale.x);view.caption.visible=detailed;
      const desk=this.monitors[index], prop=this.world.props.find(p=>p.desk===index);
      const active=a.mode==='typing';
      if(desk&&prop && (force||desk.label!==String(active))) {desk.clear();drawProp(painter(desk),prop,active);desk.label=String(active);}
    });
    // Screen-space label packing keeps close neighbours readable at every zoom.
    const placed:Array<{x:number;y:number;w:number}>=[];
    const scale=this.root.scale.x;
    for(const v of [...this.people.values()].filter(v=>v.caption.visible).sort((a,b)=>a.caption.y-b.caption.y)) {
      const width=Math.max(v.name.width,v.status.width)+14;
      const x=v.caption.x*scale;
      let y=v.caption.y*scale;
      for(let attempt=0;attempt<this.people.size;attempt++) {
        const conflict=placed.find(p=>Math.abs(x-p.x)<(width+p.w)/2+4&&Math.abs(y-p.y)<41);
        if(!conflict)break;
        y=conflict.y+41;
      }
      v.caption.y=y/scale;placed.push({x,y,w:width});
    }
  }
  layout() {
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    this.app.renderer.resize(w,h);
    this.frame();
  }
  private frame() {
    const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;
    const width=(this.world.width+this.world.height)*32+50,height=(this.world.width+this.world.height)*14+130;
    const actor=this.selected?this.life.actors.get(this.selected):undefined;
    const following=this.cameraMode==='follow'&&actor;
    const scale=(following?Math.max(1.35,Math.min(2.2,w/480,h/310)):Math.min(w/width,h/height))*this.zoom;
    this.root.scale.set(scale);
    if(following){
      const [x,y]=iso(actor.x+.4,actor.y+.35);
      this.root.position.set(w*.46-x*scale+this.pan.x,h*.52-(y-28)*scale+this.pan.y);
    }else this.root.position.set((w-width*scale)/2+(this.world.height*32+25)*scale+this.pan.x,(h-height*scale)/2+100*scale+this.pan.y);
    this.host.dataset.cameraMode=following?'follow':'overview';
    this.host.dataset.cameraScale=scale.toFixed(3);
    for(const v of this.people.values()){v.caption.scale.set(1/scale);v.nameTag.scale.set(1/scale);}
  }
}

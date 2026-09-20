/** Original Crewlo block workplace. Coordinates are walkable floor cells. */
export type Point = { x: number; y: number };
export type Leisure = 'coffee' | 'sit' | 'gaming' | 'smoking';
export type Prop = Point & { kind: string; w: number; d: number; color?: string; desk?: number };
export type Destination = Point & { id: string; activity: Leisure; facing: number };
export interface VoxelWorld { width: number; height: number; split: number; blocked: Set<string>; props: Prop[]; desks: Point[]; destinations: Destination[] }
export const cell = (p: Point) => `${Math.round(p.x)},${Math.round(p.y)}`;
export function createWorld(agentCount: number): VoxelWorld {
  const count = Math.max(6, agentCount), split = Math.max(10, Math.ceil(count / 3) * 3 + 2);
  const world: VoxelWorld = { width: 28, height: split + 11, split, blocked: new Set(), props: [], desks: [], destinations: [] };
  function prop(kind: string, x: number, y: number, w = 1, d = 1, solid = true, color?: string, desk?: number) {
    world.props.push({ kind, x, y, w, d, color, desk });
    if (solid) for (let a = x; a < x+w; a++) for (let b = y; b < y+d; b++) world.blocked.add(`${a},${b}`);
  }
  for (let x = 0; x < world.width; x++) for (let y = 0; y < world.height; y++) {
    if (x === 0 || y === 0 || x === 27 || y === world.height-1) world.blocked.add(`${x},${y}`);
    if (x === 14 && ![4,5,split+4,split+5].includes(y)) world.blocked.add(`${x},${y}`);
    if (y === split && ![6,7,20,21].includes(x)) world.blocked.add(`${x},${y}`);
  }
  for (let i=0;i<count;i++) {
    const x=2+(i%3)*4, y=1+Math.floor(i/3)*3;
    prop('desk',x,y,2,1,true,undefined,i);
    world.desks.push({x:x+1,y:y+1});
    prop('chair',x+1,y+1,1,1,false);
  }
  prop('meeting',8,split-2,4,1); prop('chair',9,split-1,1,1,false); prop('chair',11,split-1,1,1,false);
  prop('coffee',17,1,2,1); prop('snacks',22,1,3,1); prop('sofa',23,3,3,1,true,'#ac7556');
  prop('dining',18,6,3,1); prop('chair',19,7,1,1,false);
  prop('plant',26,1); prop('shelf',16,8,3,1); prop('lamp',25,7);
  prop('arcade',2,split+2,2,1); prop('tv',8,split+2,3,1); prop('sofa',8,split+4,3,1,true,'#637e92');
  prop('foosball',3,split+7,3,1); prop('plant',12,split+8); prop('lamp',1,split+6);
  prop('bench',17,split+4,3,1); prop('table',21,split+6,2,1); prop('ashtray',26,split+8);
  for (const [x,y] of [[16,split+1],[25,split+1],[16,split+9],[23,split+9],[16,split+6],[26,split+3],[26,split+5],[18,split+9],[20,split+2],[23,split+2]]) prop('plant',x,y);
  const spots: Array<[string,number,number,Leisure,number]> = [
    ['coffee',17,3,'coffee',2],['break-sofa',24,3,'sit',2],['dining',19,7,'sit',2],
    ['arcade',3,split+3,'gaming',2],['console',9,split+4,'gaming',2],['foosball',4,split+8,'gaming',2],
    ['terrace-bench',18,split+4,'sit',2],['terrace-table',21,split+7,'sit',2],['smoking-corner',25,split+8,'smoking',1],
  ];
  for(const [,x,y] of spots) world.blocked.delete(`${x},${y}`); // Seat cells are explicit walk-on interaction slots.
  world.destinations=spots.map(([id,x,y,activity,facing])=>({id,x,y,activity,facing}));
  return world;
}

/** Cardinal BFS: no diagonals through furniture corners. Occupancy is supplied by the cosmetic scheduler. */
export function findPath(world: VoxelWorld, from: Point, to: Point, occupied = new Set<string>()): Point[] | null {
  const start=cell(from), end=cell(to);
  if (world.blocked.has(end)) return null;
  const queue=[{x:Math.round(from.x),y:Math.round(from.y)}], prev=new Map<string,string>();
  prev.set(start,'');
  for(let i=0;i<queue.length;i++) {
    const p=queue[i], key=cell(p);
    if(key===end) {
      const result: Point[]=[]; let k=end;
      while(k!==start) { const [x,y]=k.split(',').map(Number); result.unshift({x,y}); k=prev.get(k)!; }
      const center=queue[0];
      if(Math.hypot(center.x-from.x,center.y-from.y)>.001)result.unshift(center);
      return result;
    }
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const n={x:p.x+dx,y:p.y+dy}, nk=cell(n);
      if(n.x<1||n.y<1||n.x>=world.width-1||n.y>=world.height-1||prev.has(nk)||world.blocked.has(nk)||occupied.has(nk)) continue;
      prev.set(nk,key);queue.push(n);
    }
  }
  return null;
}

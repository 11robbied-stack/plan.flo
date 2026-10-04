export type DrawingPoint = {x:number;y:number};
export const drawingUnits = {mm:0.001,cm:0.01,m:1,in:0.0254,ft:0.3048} as const;
export type DrawingUnit = keyof typeof drawingUnits;
export function drawingDistance(a:DrawingPoint,b:DrawingPoint){return Math.hypot(b.x-a.x,b.y-a.y)}
/** Convert a pointer through the transformed, letterboxed drawing into drawing coordinates. */
export function drawingPoint(clientX:number,clientY:number,box:{left:number;top:number;width:number;height:number},plane:{width:number;height:number}):DrawingPoint|null{
 const scale=Math.min(box.width/plane.width,box.height/plane.height);
 if(!Number.isFinite(scale)||scale<=0)return null;
 const x=(clientX-box.left-(box.width-plane.width*scale)/2)/scale;
 const y=(clientY-box.top-(box.height-plane.height*scale)/2)/scale;
 return x<0||y<0||x>plane.width||y>plane.height?null:{x,y};
}
export function metresPerDrawingUnit(a:DrawingPoint,b:DrawingPoint,length:number,unit:DrawingUnit){
 const distance=drawingDistance(a,b);
 return Number.isFinite(length)&&length>0&&distance>=1?length*drawingUnits[unit]/distance:null;
}
export function formatDrawingDistance(metres:number,unit:DrawingUnit,precision:number){return `${(metres/drawingUnits[unit]).toFixed(precision)} ${unit}`}

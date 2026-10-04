'use client';
import {useRef,useState,type ReactNode,type PointerEvent} from 'react';
import {Hand,ZoomIn,ZoomOut,Scan,Ruler,Settings2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '@/components/ui/dialog';
import {drawingDistance,drawingPoint,drawingUnits,formatDrawingDistance,metresPerDrawingUnit,type DrawingPoint,type DrawingUnit} from './drawing-measurement';

type Mark = {id:string;created:string;status:string;data:string};
type Props = {children:ReactNode;tool:string;onTool:(tool:string)=>void;marks:Mark[];editable:boolean;saving:boolean;colour:string;onErase:(id:string)=>Promise<unknown>;onSave:(data:Record<string,unknown>)=>Promise<unknown>};
const read=(mark:Mark)=>{try{return JSON.parse(mark.data)}catch{return {}}};
const validScale=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)&&value>0;
const pointPair=(value:any):value is DrawingPoint[]=>Array.isArray(value)&&value.length===2&&value.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y));
export function DrawingNavigation({children,tool,onTool,marks,editable,saving,colour,onSave,onErase}:Props){
 const viewport=useRef<HTMLDivElement>(null),surface=useRef<HTMLDivElement>(null);
 const [zoom,setZoom]=useState(1),[offset,setOffset]=useState({x:0,y:0});
 const [plane,setPlane]=useState({width:1400,height:1000});
 const calibration=marks.filter(m=>m.status!=='Erased'&&read(m).tool==='Scale'&&validScale(read(m).metresPerUnit)).sort((a,b)=>b.created.localeCompare(a.created))[0];
 const scale=calibration?read(calibration):null;
 const [unit,setUnit]=useState<DrawingUnit>('m'),[precision,setPrecision]=useState(2),[constraint,setConstraint]=useState('Free');
 const [start,setStart]=useState<DrawingPoint|null>(null),[end,setEnd]=useState<DrawingPoint|null>(null);
 const [reference,setReference]=useState<DrawingPoint[]|null>(null),[length,setLength]=useState(''),[referenceUnit,setReferenceUnit]=useState<DrawingUnit>('m');
 const [message,setMessage]=useState(''),[settings,setSettings]=useState(false),[busy,setBusy]=useState(false),[dragging,setDragging]=useState(false);
 const gesture=useRef<{id:number;x:number;y:number;offset:{x:number;y:number};point:DrawingPoint|null;second:boolean}|null>(null);
 const locked=saving||busy;
 const ownTool=['Pan','Scale','Measure'].includes(tool);
 function cancel(){gesture.current=null;setDragging(false);setStart(null);setEnd(null)}
 function choose(next:string){cancel();setMessage('');onTool(next)}
 function changeZoom(next:number){cancel();const z=Math.max(1,Math.min(8,next));setZoom(z);setOffset(p=>{const b=viewport.current?.getBoundingClientRect();if(!b||z===1)return {x:0,y:0};return {x:Math.max(-b.width*(z-1)/2,Math.min(b.width*(z-1)/2,p.x)),y:Math.max(-b.height*(z-1)/2,Math.min(b.height*(z-1)/2,p.y))}})}
 function point(e:PointerEvent){return surface.current?drawingPoint(e.clientX,e.clientY,surface.current.getBoundingClientRect(),plane):null}
 function constrained(p:DrawingPoint,a:DrawingPoint|null){return !a||tool==='Scale'||constraint==='Free'?p:constraint==='Horizontal'?{x:p.x,y:a.y}:{x:a.x,y:p.y}}
 async function finish(a:DrawingPoint,b:DrawingPoint){
  if(drawingDistance(a,b)<1){setMessage('Choose two different points on the drawing.');return}
  setStart(null);setEnd(null);
  if(tool==='Scale'){setReference([a,b]);setLength('');setReferenceUnit(unit);return}
  if(!scale){setMessage('Set the scale on this page before measuring.');return}
  const metres=drawingDistance(a,b)*scale.metresPerUnit;
  setBusy(true);
  try{const result=await onSave({tool:'Measure',points:[a,b],metres,metresPerUnit:scale.metresPerUnit,calibrationId:calibration!.id,unit,precision,colour,geometryVersion:1});if(result)setMessage(`Saved distance: ${formatDrawingDistance(metres,unit,precision)}`);else setMessage('Measurement was not saved. Please try again.')}catch{setMessage('Measurement was not saved. Please try again.')}finally{setBusy(false)}
 }
 function down(e:PointerEvent){
  if(!ownTool)return;
  e.stopPropagation();if(e.button!==0||!e.isPrimary||locked)return;
  if(tool!=='Pan'&&(!editable||tool==='Measure'&&!scale))return;
  const pdf=surface.current?.querySelector('canvas[data-render-status]');
  if(tool!=='Pan'&&pdf&&pdf.getAttribute('data-render-status')!=='ready'){setMessage('Wait for the drawing preview to load before setting scale or measuring.');return}
  const image=surface.current?.querySelector('img');
  if(tool!=='Pan'&&image&&(!image.complete||!image.naturalWidth)){setMessage('Wait for the drawing image to load before setting scale or measuring.');return}
  const p=point(e);if(tool!=='Pan'&&!p)return;
  setMessage('');e.preventDefault();(e.currentTarget as HTMLElement).focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);
  gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,offset,point:p,second:!!start};
  if(tool==='Pan')setDragging(true);else if(!start){setStart(p);setEnd(p)}
 }
 function move(e:PointerEvent){
  if(!ownTool)return;e.stopPropagation();
  const g=gesture.current;
  if(tool==='Pan'&&g?.id===e.pointerId){const b=viewport.current!.getBoundingClientRect();setOffset({x:Math.max(-b.width*(zoom-1)/2,Math.min(b.width*(zoom-1)/2,g.offset.x+e.clientX-g.x)),y:Math.max(-b.height*(zoom-1)/2,Math.min(b.height*(zoom-1)/2,g.offset.y+e.clientY-g.y))});return}
  const p=point(e);if(start&&p)setEnd(constrained(p,start));
 }
 function up(e:PointerEvent){
  if(!ownTool)return;e.stopPropagation();const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  gesture.current=null;setDragging(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(tool==='Pan')return;
  const p=point(e);if(!p){cancel();return}
  const a=start||g.point;if(a&&(g.second||Math.hypot(e.clientX-g.x,e.clientY-g.y)>5))void finish(a,constrained(p,a));
 }
 async function applyScale(e:React.FormEvent){
  e.preventDefault();if(!reference||locked||!editable)return;
  const ratio=metresPerDrawingUnit(reference[0],reference[1],Number(length),referenceUnit);
  if(!ratio||!Number.isFinite(ratio)){setMessage('Enter a positive, finite known distance.');return}
  setBusy(true);
  try{const result=await onSave({tool:'Scale',points:reference,metresPerUnit:ratio,referenceLength:Number(length),referenceUnit,geometryVersion:1});if(result){setReference(null);choose('Measure');setMessage('Scale saved for this revision and page. Select two points to measure.')}else setMessage('Scale was not saved. Please try again.')}catch{setMessage('Scale was not saved. Please try again.')}finally{setBusy(false)}
 }
 const measurements=marks.filter(m=>m.status!=='Erased'&&read(m).tool==='Measure'&&validScale(read(m).metres)&&pointPair(read(m).points));
 function line(a:DrawingPoint,b:DrawingPoint,label:string,key:string,ink:string,id?:string){return <g key={key} data-measurement={id} data-markup={tool==='Erase'?id:undefined} style={{pointerEvents:tool==='Erase'&&id?'auto':'none'}} onPointerDown={e=>{if(tool==='Erase'&&id&&editable&&!locked){e.stopPropagation();void onErase(id)}}}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ink} strokeWidth={3} vectorEffect="non-scaling-stroke"/><circle cx={a.x} cy={a.y} r={5} fill={ink}/><circle cx={b.x} cy={b.y} r={5} fill={ink}/><text x={(a.x+b.x)/2} y={(a.y+b.y)/2-14} textAnchor="middle" fontSize={22} fontWeight={700} stroke="white" strokeWidth={5} paintOrder="stroke" fill={ink}>{label}</text></g>}
 return <div className="drawing-navigation">
  <div className="drawing-navigation-toolbar" role="toolbar" aria-label="Plan navigation and measurement">
   <button type="button" aria-label="Zoom out" title="Zoom out" disabled={zoom<=1} onClick={()=>changeZoom(zoom/1.25)}><ZoomOut size={19}/></button>
   <output aria-label="Drawing zoom">{Math.round(zoom*100)}%</output>
   <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom>=8} onClick={()=>changeZoom(zoom*1.25)}><ZoomIn size={19}/></button>
   <button type="button" onClick={()=>{changeZoom(1);setOffset({x:0,y:0})}} title="Fit drawing"><Scan size={18}/> Fit</button>
   <button type="button" aria-pressed={tool==='Pan'} onClick={()=>choose('Pan')}><Hand size={18}/> Pan</button>
   <span className="drawing-tool-divider"/>
   <button type="button" aria-pressed={tool==='Scale'} disabled={!editable||locked} onClick={()=>choose('Scale')}><Ruler size={18}/> Set scale</button>
   <button type="button" aria-pressed={tool==='Measure'} disabled={!editable||locked||!scale} onClick={()=>choose('Measure')}><Ruler size={18}/> Measure</button>
   <button type="button" aria-expanded={settings} onClick={()=>setSettings(v=>!v)}><Settings2 size={18}/> Measurement settings</button>
  </div>
  {settings&&<div className="drawing-measurement-settings">
   <label>Display units<select aria-label="Display units" value={unit} onChange={e=>setUnit(e.target.value as DrawingUnit)}>{Object.keys(drawingUnits).map(u=><option key={u}>{u}</option>)}</select></label>
   <label>Decimal places<select aria-label="Decimal places" value={precision} onChange={e=>setPrecision(Number(e.target.value))}>{[0,1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>
   <label>Measurement direction<select aria-label="Measurement direction" value={constraint} onChange={e=>{cancel();setConstraint(e.target.value)}}>{['Free','Horizontal','Vertical'].map(v=><option key={v}>{v}</option>)}</select></label>
   <span>Settings apply to displayed distances. Saved measurements retain their calibrated length.</span>
  </div>}
  <div className="drawing-scale-status">{scale?`Page scale: reference ${scale.referenceLength} ${scale.referenceUnit}.`:'Scale not set for this revision and page.'} {tool==='Pan'?'Drag to move the plan. Zoom in to explore details.':tool==='Scale'?'Select two ends of a known distance, then enter its length.':tool==='Measure'?'Select two points, or drag between them, to measure.':''} {start&&<button type="button" onClick={cancel}>Cancel line</button>}</div>
  {message&&<p className="drawing-measurement-message" role="status">{message}</p>}
  <div className="drawing-viewport" ref={viewport} tabIndex={0} aria-label="Drawing viewport" onKeyDown={e=>{if(e.key==='Escape'){cancel();setReference(null)}}} onPointerDownCapture={down} onPointerMoveCapture={move} onPointerUpCapture={up} onPointerCancelCapture={()=>cancel()} style={{touchAction:ownTool?'none':undefined,cursor:tool==='Pan'?(dragging?'grabbing':'grab'):undefined}}>
   <div className="drawing-transformed-surface" ref={surface} style={{transform:`translate(${offset.x}px, ${offset.y}px) scale(${zoom})`}} onLoadCapture={e=>{const image=e.target as HTMLImageElement;if(image.tagName==='IMG'&&image.naturalWidth)setPlane({width:1400,height:1400*image.naturalHeight/image.naturalWidth})}}>
    {children}
    <svg className="measurement-layer" viewBox={`0 0 ${plane.width} ${plane.height}`} aria-label="Drawing measurements" style={{pointerEvents:'none'}}>
     {measurements.map(m=>{const d=read(m);return line(d.points[0],d.points[1],formatDrawingDistance(d.metres,unit,precision),m.id,d.colour||'#2563ff',m.id)})}
     {ownTool&&start&&end&&line(start,end,tool==='Scale'?'Known distance':scale?formatDrawingDistance(drawingDistance(start,end)*scale.metresPerUnit,unit,precision):'','preview',colour)}
     {reference&&line(reference[0],reference[1],'Known distance','reference',colour)}
    </svg>
   </div>
  </div>
  {measurements.length>0&&<details className="drawing-measurement-list"><summary>Measurements ({measurements.length})</summary><ol>{measurements.map(m=>{const d=read(m);return <li key={m.id}>{formatDrawingDistance(d.metres,unit,precision)}{d.calibrationId!==calibration?.id&&' · Earlier calibration'}</li>})}</ol><small>Use Erase to remove a measurement. Changing scale applies to new measurements.</small></details>}
  <Dialog open={!!reference} onOpenChange={open=>{if(!open&&!busy)setReference(null)}}><DialogContent className="modal"><DialogHeader><DialogTitle>Set drawing scale</DialogTitle><DialogDescription>Enter the real length of the line you selected. Scale applies only to this drawing revision and page. Existing measurements keep their original calibration.</DialogDescription></DialogHeader><form className="form-grid" onSubmit={applyScale}>{message&&<p role="status">{message}</p>}<label className="field">Known distance<input aria-label="Known distance" type="number" min="0.000001" step="any" required value={length} onChange={e=>setLength(e.target.value)} autoFocus/></label><label className="field">Reference units<select aria-label="Reference units" value={referenceUnit} onChange={e=>setReferenceUnit(e.target.value as DrawingUnit)}>{Object.keys(drawingUnits).map(u=><option key={u}>{u}</option>)}</select></label><div className="modal-actions"><Button type="button" variant="outline" disabled={busy} onClick={()=>setReference(null)}>Cancel</Button><Button type="submit" disabled={locked||!Number.isFinite(Number(length))||Number(length)<=0}>Save scale</Button></div></form></DialogContent></Dialog>
 </div>;
}

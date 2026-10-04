import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../app/drawing-measurement.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {drawingPoint,drawingDistance,metresPerDrawingUnit,formatDrawingDistance}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const plane={width:1400,height:1000};
const a={x:300,y:400},b={x:600,y:800};
assert.equal(drawingDistance(a,b),500);
assert.equal(metresPerDrawingUnit(a,b,5,'m'),.01);
assert.equal(metresPerDrawingUnit(a,b,5000,'mm'),.01);
assert.equal(metresPerDrawingUnit(a,b,0,'m'),null);
assert.equal(metresPerDrawingUnit(a,a,5,'m'),null);
assert.equal(metresPerDrawingUnit(a,b,Infinity,'m'),null);
assert.equal(formatDrawingDistance(.3048,'ft',2),'1.00 ft');
assert.equal(formatDrawingDistance(.0254,'in',3),'1.000 in');
assert.equal(formatDrawingDistance(5,'mm',0),'5000 mm');
// The same sheet point survives zoom/pan, portrait and landscape viewports.
for(const box of [{left:0,top:0,width:700,height:550},{left:-120,top:-90,width:1750,height:1375},{left:50,top:80,width:320,height:480}]){
 const factor=Math.min(box.width/plane.width,box.height/plane.height);
 const mapped=drawingPoint(box.left+(box.width-plane.width*factor)/2+a.x*factor,box.top+(box.height-plane.height*factor)/2+a.y*factor,box,plane);
 assert.ok(Math.abs(mapped.x-a.x)<1e-8&&Math.abs(mapped.y-a.y)<1e-8);
}
assert.equal(drawingPoint(0,0,{left:0,top:0,width:700,height:550},plane),null);
assert.equal(drawingPoint(0,0,{left:0,top:0,width:0,height:0},plane),null);
console.log('Drawing measurement checks passed: calibration, units, invalid input, zoom/pan, resize and letterboxing.');

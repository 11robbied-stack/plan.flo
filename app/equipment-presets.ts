export const equipmentPresets=[
 {id:'scissor-lift',name:'Scissor lift',checks:[
 'Operator manual and warning labels available and legible',
 'Scissor arms, pivots, retaining pins and safety prop condition',
 'Platform rails, entry gate and extension deck condition',
 'Pothole protection and chassis covers condition',
 'Tyres, wheels and wheel fasteners condition',
 'Hydraulic lines, cylinders and fluid levels checked',
 'Battery connections, wiring and charging lead condition',
 'Ground and platform controls tested per operator manual',
 'Emergency stops and emergency lowering tested per manual',
 'Drive, steering, braking and alarms tested per manual',
 'Outriggers or stabilisers checked where fitted',
 'Work area, ground conditions and overhead hazards assessed'
 ],source:'https://www.genielift.com/en/aerialpros/daily-pre-operation-inspections'},
 {id:'boom-lift',name:'Boom lift',checks:[
 'Operator manual and capacity labels available and legible',
 'Boom sections, joints, pins and turntable condition',
 'Basket rails, gate and anchorage points condition',
 'Tyres, wheels, axles and fasteners condition',
 'Hydraulic lines, cylinders and fluid levels checked',
 'Battery or engine compartment checked for damage and leaks',
 'Ground and platform controls tested per operator manual',
 'Emergency stops and auxiliary lowering tested per manual',
 'Footswitch, drive enable and alarms tested per manual',
 'Steering, brakes and platform functions tested per manual',
 'Required fall protection checked per machine instructions',
 'Work area, ground conditions and overhead hazards assessed'
 ],source:'https://www.genielift.com/en/aerialpros/daily-to-do-s-perform-function-tests-on-genie-mewps'},
 {id:'excavator',name:'Excavator',checks:[
 'Operator manual and machine warning labels available',
 'Tracks, rollers, sprockets and undercarriage condition',
 'Track tension checked against machine instructions',
 'Boom, dipper, pins and cylinder condition',
 'Bucket teeth, cutting edges and attachment condition',
 'Quick hitch and attachment retention checked per manual',
 'Hydraulic hoses, fittings and seals checked for leaks',
 'Engine oil, coolant and hydraulic levels checked per manual',
 'Cooling pack and filter indicators checked',
 'Cab, seat belt, access steps and handrails condition',
 'Controls, isolation lever, horn and warning devices checked',
 'Work zone, swing clearance and service locations reviewed'
 ],source:'https://www.cat.com/en_US/articles/ci-articles/your-six-step-excavator-maintenance-checklist.html'},
 {id:'skid-steer',name:'Skid steer',checks:[
 'Operator manual and warning labels available',
 'Tyres or tracks, wheels and drive components condition',
 'Lift arms, pivots, pins and cylinder condition',
 'Bucket or attachment condition and coupling security',
 'Hydraulic hoses and auxiliary couplings checked for leaks',
 'Engine oil, coolant and hydraulic levels checked per manual',
 'Cooling pack and engine compartment checked for debris',
 'Cab protection, door and emergency exit condition',
 'Seat belt, seat bar and control interlocks checked per manual',
 'Drive, steering, parking brake and controls checked per manual',
 'Horn, reversing warning and visibility aids checked',
 'Work area, pedestrian separation and ground conditions reviewed'
 ],source:'https://www.bobcat.com/na/en/parts-service/service/machine-inspection'}
] as const;
export const equipmentName=(id:string)=>equipmentPresets.find(p=>p.id===id)?.name||'Other equipment';
export function presetChecks(id:string){return (equipmentPresets.find(p=>p.id===id)?.checks||[]).map(label=>({label,result:'Not checked'}))}
export function newEquipmentDraft(kind:string,equipmentType:string,source?:any){const data=source?.data||{};return {kind,title:source?.title||equipmentName(equipmentType),data:{templateId:source?.kind==='ewp-template'?source.id:data.templateId||'',equipmentType,assetId:data.assetId||'',make:data.make||'',model:data.model||'',serial:data.serial||'',location:data.location||'',operator:'',date:'',tester:'',nextDue:'',result:'',notes:'',templateTitle:source?.title||'',checks:source?(data.checks||[]).map((c:any)=>({label:c.label,result:'Not checked'})):presetChecks(equipmentType),fileIds:[]}}}

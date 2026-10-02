/** Reject empty/mislabeled drawings before storing anything. This is not malware scanning. */
export async function validDrawingUpload(file:File, imagesOnly=false):Promise<boolean> {
  if(!file.size || file.size>20*1024*1024) return false;
  const extensions:Record<string,RegExp>={
    'application/pdf':/\.pdf$/i,'image/png':/\.png$/i,
    'image/jpeg':/\.jpe?g$/i,'image/webp':/\.webp$/i,
  };
  if(!extensions[file.type]?.test(file.name)||imagesOnly&&file.type==='application/pdf') return false;
  const b=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const text=(start:number,end:number)=>new TextDecoder().decode(b.slice(start,end));
  if(file.type==='application/pdf') return text(0,5)==='%PDF-';
  if(file.type==='image/png') return b.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v);
  if(file.type==='image/jpeg') return b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255;
  return b.length>=12&&text(0,4)==='RIFF'&&text(8,12)==='WEBP';
}

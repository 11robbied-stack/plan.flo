'use client';
import {useEffect,useRef,useState} from 'react';
import type {PDFDocumentLoadingTask,RenderTask} from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/** Render authorized PDF bytes without depending on the browser's native PDF plugin. */
export function DrawingPdf({url,page,onPages}:{url:string;page:number;onPages:(pages:number)=>void}){
 const ref=useRef<HTMLCanvasElement>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  let cancelled=false;
  let task:PDFDocumentLoadingTask|undefined,render:RenderTask|undefined;
  const canvas=ref.current!;
  (async()=>{
   const pdf=await import('pdfjs-dist');
   if(cancelled)return;
   pdf.GlobalWorkerOptions.workerSrc=workerUrl;
   task=pdf.getDocument({url});
   const document=await task.promise;
   if(cancelled)return;
   onPages(document.numPages);
   const sheet=await document.getPage(Math.min(page,document.numPages));
   if(cancelled)return;
   const size=sheet.getViewport({scale:1});
   const viewport=sheet.getViewport({scale:Math.min(1400/size.width,1000/size.height)});
   const buffer=window.document.createElement('canvas');
   buffer.width=Math.ceil(viewport.width);buffer.height=Math.ceil(viewport.height);
   render=sheet.render({canvas:buffer,canvasContext:buffer.getContext('2d')!,viewport});
   await render.promise;
   if(cancelled)return;
   const context=canvas.getContext('2d')!;
   context.clearRect(0,0,1400,1000);
   context.drawImage(buffer,(1400-buffer.width)/2,(1000-buffer.height)/2);
   setStatus('ready');
  })().catch(()=>{if(!cancelled)setStatus('error')});
  return()=>{cancelled=true;render?.cancel();void task?.destroy()};
 },[url,page,onPages]);
 return <><canvas className="drawing-pdf-canvas" ref={ref} width={1400} height={1000} aria-label={`Drawing PDF page ${page}`} data-render-status={status}/>{status==='loading'&&<p className="drawing-preview-status" role="status">Loading drawing…</p>}{status==='error'&&<p className="drawing-preview-status" role="alert">Could not preview this PDF. Use Open original to download it, or upload a valid PDF.</p>}</>;
}

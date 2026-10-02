'use client';
import {useState} from 'react';

export function CompanyHeaderLogo({company,logoFileId}:{company:string;logoFileId:string}){
 const [failed,setFailed]=useState(false);
 if(logoFileId&&!failed)return <div className="company-header-logo"><img src={'/api/file/'+encodeURIComponent(logoFileId)} alt={company?`${company} logo`:'Company logo'} onError={()=>setFailed(true)}/></div>;
 return company?<span className="company-header-name" title={company}>{company}</span>:null;
}

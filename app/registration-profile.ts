export const registrationFields=['firstName','surname','businessName','abn','address','phone','rec'] as const;
export type RegistrationProfile=Record<typeof registrationFields[number],string>;
export class RegistrationError extends Error {}
function field(value:unknown,label:string,max:number,required=true){
 const text=typeof value==='string'?value.trim():'';
 if(required&&!text)throw new RegistrationError(`Enter ${label}.`);
 if(text.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text))throw new RegistrationError(`${label} must be no more than ${max} characters and contain valid text.`);
 return text;
}
/** ABR modulus-89 format check only: no lookup, registration or accreditation claim. */
export function validAbn(value:string){
 if(!/^[\d\s]+$/.test(value))return false;
 const digits=value.replace(/\s/g,'');if(!/^\d{11}$/.test(digits))return false;
 return [...digits].reduce((sum,n,i)=>sum+(Number(n)-(i===0?1:0))*[10,1,3,5,7,9,11,13,15,17,19][i],0)%89===0;
}
export function companyProfile(input:Record<string,unknown>,required=true){
 const businessName=field(input.businessName,'the business or sole trader name',160,required);
 const abn=field(input.abn,'the ABN',30,required);
 if(abn&&!validAbn(abn))throw new RegistrationError('Enter an 11-digit ABN with a valid checksum.');
 const address=field(input.address,'the address',500,required);
 const phone=field(input.phone,'the phone number',40,required);
 if(phone&&(!/^\+?[\d ()-]+$/.test(phone)||!/^\d{8,15}$/.test(phone.replace(/\D/g,''))))throw new RegistrationError('Enter a phone number containing 8 to 15 digits.');
 const rec=field(input.rec,'the REC number',60,required);
 if(rec&&!/^[a-zA-Z0-9][a-zA-Z0-9 ./-]*$/.test(rec))throw new RegistrationError('Enter the REC number using letters, numbers, spaces, slashes or hyphens.');
 return {businessName,abn:abn.replace(/\s/g,''),address,phone,rec};
}
export function registrationProfile(input:Record<string,unknown>,requireBusiness=true):RegistrationProfile{
 const fullName=typeof input.fullName==='string'?input.fullName.trim():'';
 const firstName=field(fullName||input.firstName,'your name',160);
 const surname=fullName?'':field(input.surname,'your surname',80,false);
 const profile=companyProfile(input,false);
 if(!profile.phone)throw new RegistrationError('Enter the phone number.');
 if(requireBusiness&&!profile.businessName)throw new RegistrationError('Enter the organisation / company.');
 if(requireBusiness&&!profile.rec)throw new RegistrationError('Enter the REC number.');
 return {firstName,surname,...profile};
}

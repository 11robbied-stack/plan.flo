import {getChatGPTUser} from './chatgpt-auth';
import {getCompanyAccess,companyDb} from './company-access';
// Logging failure must never turn a successful upload into an apparent failure.
export async function trackUpload(route:string,status:number){try{const user=await getChatGPTUser();if(!user)return;const access=await getCompanyAccess(user);if(access.blocked)return;await companyDb().prepare('INSERT INTO upload_outcomes(id,owner,route,status,created) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),access.owner,route,status,new Date().toISOString()).run();}catch(e){console.error('Upload outcome tracking unavailable',e)}}

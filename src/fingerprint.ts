// Hash every byte in bounded chunks so large films never enter memory at once.
export async function clipFingerprint(file:Blob){
 const size=4*1024*1024;const parts=new Uint8Array(Math.ceil(file.size/size)*32);
 for(let i=0;i<file.size;i+=size){const bytes=await file.slice(i,i+size).arrayBuffer();parts.set(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),i/size*32);}
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',parts));
 return Array.from(digest,v=>v.toString(16).padStart(2,'0')).join('');
}

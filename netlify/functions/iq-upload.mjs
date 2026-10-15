import {PAIRED_PUBLIC_JWK} from './_shared/iq-uploader-public-key.mjs';
import {getStore} from '@netlify/blobs';
import {createUploadHandler} from './_shared/iq-upload.mjs';
export default createUploadHandler({publicKey:()=>JSON.stringify(PAIRED_PUBLIC_JWK),getStore:()=>getStore({name:'ott-radar',consistency:'strong'})});
export const config={path:'/.netlify/functions/iq-upload',method:['GET','POST']};

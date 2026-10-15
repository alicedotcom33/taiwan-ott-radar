import {getStore} from '@netlify/blobs';
import {createUploadHandler} from './_shared/iq-upload.mjs';
export default createUploadHandler({publicKey:()=>Netlify.env.get('IQ_UPLOADER_PUBLIC_JWK'),getStore:()=>getStore({name:'ott-radar',consistency:'strong'})});
export const config={path:'/.netlify/functions/iq-upload',method:['GET','POST']};

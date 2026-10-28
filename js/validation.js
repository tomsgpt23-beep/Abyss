export function validateCatalogue(value){
 if(!value||value.version!==1||!Array.isArray(value.books)||value.books.length>10000)throw Error('Expected version 1 and a books array (maximum 10,000).');
 const ids=new Set(),positions=new Set();
 for(const b of value.books){
  if(!b||typeof b!=='object')throw Error('Invalid book record.');
  for(const k of ['id','title','author','publication'])if(typeof b[k]!=='string'||!b[k].trim())throw Error(`Missing ${k}.`);
  if(!/^[a-zA-Z0-9_-]+$/.test(b.id)||(b.id.startsWith('demo-')||['__proto__','constructor','prototype'].includes(b.id))||ids.has(b.id))throw Error('Book IDs must be unique, safe, and must not start with demo-.');ids.add(b.id);
  if(!Number.isInteger(b.position)||b.position<1||positions.has(b.position))throw Error('Positions must be unique positive integers.');positions.add(b.position);
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.publication))throw Error('Publication must use YYYY-MM.');
  if(b.isbn10!==null&&b.isbn10!==undefined&&(typeof b.isbn10!=='string'||b.isbn10.length>40))throw Error('ISBN must be a string or null.');
  if(b.isbnUnreliable!==undefined&&typeof b.isbnUnreliable!=='boolean')throw Error('isbnUnreliable must be boolean.');
  if(!b.sourceUrl||!isHttp(b.sourceUrl))throw Error('Each canonical record requires an HTTP(S) sourceUrl.');
  if(b.verificationNotes!==undefined&&(!Array.isArray(b.verificationNotes)||b.verificationNotes.some(n=>typeof n!=='string')))throw Error('verificationNotes must be an array of strings.');
  for(const k of ['classification','description','imprint'])if(b[k]!==undefined&&typeof b[k]!=='string')throw Error(`Invalid ${k}.`);
 }
 return value;
}
function isHttp(url){try{return ['http:','https:'].includes(new URL(url).protocol);}catch{return false;}}
export function validateArtwork(value){
 if(!value||value.version!==1||!value.books||typeof value.books!=='object'||Array.isArray(value.books))throw Error('Expected version 1 and a books object.');
 for(const [id,images] of Object.entries(value.books)){
  if(!/^[a-zA-Z0-9_-]+$/.test(id)||!Array.isArray(images))throw Error('Artwork must map book IDs to arrays.');
  for(const a of images){if(!a||typeof a.type!=='string'||!a.type||typeof a.url!=='string'||!a.url)throw Error('Each image requires type and url.');
   if(!isHttp(a.url)&&(!/^(?:\.?\/?)[a-zA-Z0-9_./ -]+\.(png|jpe?g|webp|svg|avif)$/i.test(a.url)||a.url.startsWith('//')||a.url.includes('..')))throw Error('Use HTTP(S) or a safe relative image path.');
   for(const k of ['credit','source'])if(a[k]!==undefined&&typeof a[k]!=='string')throw Error(`Invalid artwork ${k}.`);
  }
 }
 return value;
}

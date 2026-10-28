import {normalizeISBN,validISBN,bookISBNs} from './isbn.js';
const ORIGIN='https://openlibrary.org';
export const ENRICHMENT_KEY='abyss-enrichment-v1';
const fieldsAllowed=['editionId','title','subtitle','authors','publishers','publishDate','pages','isbn10','isbn13','physicalFormat','works','languages'];
const safeId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]+$/.test(id)&&!['__proto__','constructor','prototype'].includes(id);
export function editionCandidate(raw,book,authors=[]){
 if(!raw||typeof raw!=='object'||!/^\/books\/OL\d+M$/.test(raw.key))throw Error('Open Library returned an invalid edition.');
 const source=ORIGIN+raw.key,fields={};
 const add=(key,value)=>{if(value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length))fields[key]={value,source};};
 add('editionId',raw.key.split('/').pop());add('title',typeof raw.title==='string'?raw.title:undefined);add('subtitle',typeof raw.subtitle==='string'?raw.subtitle:undefined);
 add('authors',authors.length?authors:(raw.authors||[]).filter(a=>/^\/authors\/OL\d+A$/.test(a.key)).map(a=>({name:a.name||'Name not supplied',key:a.key,source:ORIGIN+a.key})));
 add('publishers',Array.isArray(raw.publishers)?raw.publishers.filter(p=>typeof p==='string'):undefined);add('publishDate',typeof raw.publish_date==='string'?raw.publish_date:undefined);add('pages',Number.isInteger(raw.number_of_pages)?raw.number_of_pages:undefined);
 add('isbn10',Array.isArray(raw.isbn_10)?raw.isbn_10.filter(s=>typeof s==='string').map(normalizeISBN):undefined);add('isbn13',Array.isArray(raw.isbn_13)?raw.isbn_13.filter(s=>typeof s==='string').map(normalizeISBN):undefined);add('physicalFormat',typeof raw.physical_format==='string'?raw.physical_format:undefined);
 add('works',(raw.works||[]).map(w=>w.key).filter(k=>typeof k==='string'));add('languages',(raw.languages||[]).map(w=>w.key).filter(k=>typeof k==='string'));
 const returned=[...(fields.isbn10?.value||[]),...(fields.isbn13?.value||[])],requested=bookISBNs(book),warnings=[];
 if(!returned.some(s=>requested.includes(s)))warnings.push('Returned edition does not confirm the requested ISBN.');
 if(book.isbnUnreliable)warnings.push('Canonical ISBN is flagged as unreliable or duplicated.');
 const title=s=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
 if(!fields.title||title(fields.title.value)!==title(book.title))warnings.push('Title conflicts with the canonical title.');
 if(!fields.publishers?.value.some(p=>/\bdell\b/i.test(p)))warnings.push('Dell publisher is not confirmed.');
 if(!fields.publishDate||!fields.publishDate.value.includes(book.publication.slice(0,4)))warnings.push('Publication year differs or is not supplied.');
 if(!authors.length||!authors.some(a=>title(book.author).includes(title(a.name))))warnings.push('Author credit differs or could not be confirmed.');
 warnings.push('Dell Abyss imprint and original cover must be checked manually; an ISBN match alone is insufficient.');
 const covers=[...new Set((raw.covers||[]).filter(n=>Number.isSafeInteger(n)&&n>0))].slice(0,10).map(id=>({id:String(id),type:'front',url:`https://covers.openlibrary.org/b/id/${id}-L.jpg?default=false`,thumbnail:`https://covers.openlibrary.org/b/id/${id}-M.jpg?default=false`,source,edition:raw.key,credit:'Open Library Covers API; original artwork rights remain with the rights holder. Artist not supplied.'}));
 return {editionId:raw.key,sourceUrl:source,fields,warnings,covers};
}
export function validateEnrichment(value,ids){
 if(!value||value.version!==1||!value.books||typeof value.books!=='object'||Array.isArray(value.books))throw Error('Expected version 1 enrichment books object.');
 for(const [id,row] of Object.entries(value.books)){
  if(!safeId(id)||(ids&&!ids.includes(id))||!row||typeof row!=='object')throw Error('Unknown or invalid enrichment record.');
  if(!['found','missing','invalid','error'].includes(row.status))throw Error('Invalid lookup status.');
  if(!['pending','approved','rejected'].includes(row.metadataDecision))throw Error('Invalid metadata decision.');
  if(typeof row.isbn!=='string'||typeof row.checkedAt!=='string'||typeof row.message!=='string')throw Error('Invalid lookup metadata.');
  if(!row.coverDecisions||typeof row.coverDecisions!=='object'||Array.isArray(row.coverDecisions))throw Error('Invalid artwork decisions.');
  const c=row.candidate;
  if(row.status==='found'&&!c)throw Error('Found lookup requires a candidate.');
  if(!c&&(row.metadataDecision==='approved'||Object.keys(row.coverDecisions).length))throw Error('Approval requires a candidate.');
  if(c){
   if(!/^\/books\/OL\d+M$/.test(c.editionId)||c.sourceUrl!==ORIGIN+c.editionId||!c.fields||Array.isArray(c.fields)||!Array.isArray(c.warnings)||c.warnings.some(w=>typeof w!=='string')||!Array.isArray(c.covers))throw Error('Invalid edition candidate.');
   for(const [field,item] of Object.entries(c.fields)){if(!fieldsAllowed.includes(field)||!item||item.source!==c.sourceUrl||item.value===undefined)throw Error('Invalid field attribution.');if(JSON.stringify(item.value).length>50000)throw Error('Oversized field.');}
   for(const image of c.covers){if(!/^\d+$/.test(image.id)||image.url!==`https://covers.openlibrary.org/b/id/${image.id}-L.jpg?default=false`||image.thumbnail!==`https://covers.openlibrary.org/b/id/${image.id}-M.jpg?default=false`||image.source!==c.sourceUrl||image.edition!==c.editionId||typeof image.credit!=='string')throw Error('Invalid cover provenance.');}
   for(const [cover,decision] of Object.entries(row.coverDecisions))if(!c.covers.some(i=>i.id===cover)||!['approved','rejected'].includes(decision))throw Error('Invalid cover decision.');
  }
 }
 return value;
}
// One request at a time, at most one per 1.1 seconds. Cache edition and author
// responses (including 404s) for seven days; errors are never cached.
export function createOpenLibraryClient({fetcher=globalThis.fetch,storage,interval=1100,now=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),timeout=15000}={}){
 if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
 let chain=Promise.resolve(),last=-Infinity;
 function request(path){const work=async()=>{const url=ORIGIN+path,cacheKey='abyss-ol-cache:'+path;try{const hit=JSON.parse(storage?.getItem(cacheKey)||'null');if(hit&&hit.expires>now())return hit.value;}catch{}
  await sleep(Math.max(0,last+interval-now()));last=now();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetcher(url,{signal:controller.signal,headers:{Accept:'application/json'}});if(response.status!==404&&!response.ok)throw Error(`Open Library HTTP ${response.status}${response.status===429?' — rate limited; stop and try later.':''}`);const value=response.status===404?null:await response.json();try{storage?.setItem(cacheKey,JSON.stringify({expires:now()+7*86400000,value}));}catch{}return value;}finally{clearTimeout(timer);}};
 const result=chain.then(work);chain=result.catch(()=>{});return result;}
 return {async lookup(book){const isbn=bookISBNs(book).find(validISBN)||'';const row={isbn,checkedAt:new Date(now()).toISOString(),status:'invalid',message:'Missing or invalid ISBN; manual review required.',metadataDecision:'pending',coverDecisions:{}};
  if(!isbn)return row;
  try{const raw=await request(`/isbn/${encodeURIComponent(isbn)}.json`);if(!raw)return {...row,status:'missing',message:'No Open Library edition found for this ISBN.'};
   const authors=[];for(const author of (raw.authors||[]).slice(0,8)){if(!/^\/authors\/OL\d+A$/.test(author.key))continue;try{const a=await request(author.key+'.json');if(a&&typeof a.name==='string')authors.push({name:a.name,key:author.key,source:ORIGIN+author.key});}catch(error){if(/429/.test(error.message))throw error;/* Missing author data remains explicitly flagged in the comparison. */}}
   return {...row,status:'found',message:'Edition candidate found; manual comparison required.',candidate:editionCandidate(raw,book,authors)};
  }catch(error){return {...row,status:'error',message:error.name==='AbortError'?'Open Library request timed out.':`Lookup failed: ${error.message}`};}
 }};
}
export function approvedArtwork(row){return row?.candidate?.covers.filter(c=>row.coverDecisions[c.id]==='approved')||[];}

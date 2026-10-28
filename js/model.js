export const blank=()=>({owned:false,read:false,wanted:false,condition:'',price:'',date:'',notes:''});
export function validateCollection(data,ids){
 if(!data||data.version!==1||!data.books||Array.isArray(data.books)||typeof data.books!=='object')throw Error('Expected a version 1 collection backup.');
 const result={};
 for(const [id,value] of Object.entries(data.books)){
  if(['__proto__','constructor','prototype'].includes(id)||!ids.includes(id))throw Error(`Unknown book: ${id}`);
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid collection record.');
  const row=blank();
  for(const key of ['owned','read','wanted']){if(typeof value[key]!=='boolean')throw Error(`Invalid ${key}`);row[key]=value[key];}
  for(const key of ['condition','price','date','notes']){if(typeof value[key]!=='string')throw Error(`Invalid ${key}`);row[key]=value[key];}
  if(row.price!==''&&(!Number.isFinite(Number(row.price))||Number(row.price)<0))throw Error('Invalid purchase price.');
  if(row.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(Date.parse(row.date))||new Date(row.date).toISOString().slice(0,10)!==row.date))throw Error('Invalid purchase date.');
  result[id]=row;
 }
 return result;
}
export function selectBooks(books,collection,query='',filter='all',sort='chronological'){
 const q=query.trim().toLowerCase(), isbnQuery=q.replace(/[\s-]/g,'');
 return books.filter(b=>[b.title,b.author,b.isbn10||''].join(' ').toLowerCase().includes(q)||(/^\d[\dxX-\s]+$/.test(q)&&String(b.isbn10||'').replace(/[\s-]/g,'').toLowerCase().includes(isbnQuery))).filter(b=>filter==='all'||(filter==='missing'?!collection[b.id]?.owned:collection[b.id]?.[filter])).sort((a,b)=>sort==='alphabetical'?a.title.localeCompare(b.title):a.position-b.position);
}
export function sellerLink(seller,book){return seller.url+encodeURIComponent(book.isbn10&&!book.isbnUnreliable?book.isbn10:`${book.title} ${book.author}`);}

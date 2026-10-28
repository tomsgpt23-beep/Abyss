// Keep identifiers as strings: leading zeroes and ISBN-10 check digit X matter.
export function normalizeISBN(value){return typeof value==='string'?value.replace(/[\s-]/g,'').toUpperCase():'';}
export function validISBN(value){const s=normalizeISBN(value);if(/^\d{9}[\dX]$/.test(s))return [...s].reduce((n,c,i)=>n+(10-i)*(c==='X'?10:Number(c)),0)%11===0;if(/^97[89]\d{10}$/.test(s))return [...s].reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0)%10===0;return false;}
export function bookISBNs(book){return [...new Set([book.isbn10,book.isbn13].map(normalizeISBN).filter(Boolean))];}
export function usableISBN(book){return book.isbnUnreliable?'':bookISBNs(book).find(validISBN)||'';}
export function normalizeCatalogue(data){return {...data,books:data.books.map(b=>({...b,...('isbn10' in b?{isbn10:b.isbn10===null?null:normalizeISBN(b.isbn10)}:{}),...('isbn13' in b?{isbn13:b.isbn13===null?null:normalizeISBN(b.isbn13)}:{})}))};}

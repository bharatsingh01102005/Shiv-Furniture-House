import {api} from './http';
export const ProductsAPI={
  list:({search='',category=''}={})=>{const qs=new URLSearchParams(); if(search) qs.set('search',search); if(category) qs.set('category',category); const q=qs.toString(); return api(`/api/products${q?`?${q}`:''}`);},
  create:(payload)=>api('/api/products',{method:'POST',body:payload}),
  update:(id,payload)=>api(`/api/products/${id}`,{method:'PUT',body:payload}),
  remove:(id)=>api(`/api/products/${id}`,{method:'DELETE',body:{}})
};

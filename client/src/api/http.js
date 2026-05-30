const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function api(path,{method='GET',body}={}){
  const res=await fetch(`${API_BASE}${path}`,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,credentials:'include'});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.message||'Request failed');
  return data;
}

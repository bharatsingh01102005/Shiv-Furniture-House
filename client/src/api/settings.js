import {api} from './http';
export const SettingsAPI={
  public:()=>api('/api/settings/public'),
  adminGet:()=>api('/api/settings/admin'),
  adminUpdate:(payload)=>api('/api/settings/admin',{method:'PUT',body:payload})
};

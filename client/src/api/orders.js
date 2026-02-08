import {api} from './http';
export const OrdersAPI={
  myOrders:()=>api('/api/orders'),
  deliveryQuote:(params)=>api('/api/orders/delivery-quote',{method:'POST',body:params}),
  create:(items,transactionId='',shippingAddress)=>api('/api/orders/create',{method:'POST',body:{items,transactionId,shippingAddress}}),
  adminAll:()=>api('/api/orders/admin/all'),
  adminSetStatus:(id,status,adminRemark='',rejectReason='')=>api(`/api/orders/admin/${id}/status`,{method:'PUT',body:{status,adminRemark,rejectReason}})
};

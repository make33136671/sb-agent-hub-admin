import { requestClient } from '#/api/request';

export async function getOrderList(params?: {
  memberId?: number;
  status?: number;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get('/Order/List', { params });
}

export async function getMyOrders(params?: {
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get('/Order/MyOrders', { params });
}

export async function getOrderDetail(orderNo: string) {
  return requestClient.get('/Order/Detail', { params: { orderNo } });
}

export async function createOrder(data: {
  memberId: number;
  packageId: number;
  orderType: number;
  paymentMethod?: string;
  remark?: string;
}) {
  return requestClient.post('/Order/Create', data);
}

export async function confirmPayment(orderNo: string, transactionId?: string) {
  return requestClient.post('/Order/ConfirmPayment', { orderNo, transactionId });
}

export async function cancelOrder(orderNo: string) {
  return requestClient.post('/Order/Cancel', null, { params: { orderNo } });
}

export async function getCurrentPackage(memberId: number) {
  return requestClient.get('/Order/CurrentPackage', { params: { memberId } });
}

export async function getPaymentMethods() {
  return requestClient.get('/Payment/Methods');
}

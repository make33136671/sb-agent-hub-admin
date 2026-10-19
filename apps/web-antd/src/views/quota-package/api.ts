import { requestClient } from '#/api/request';

export async function getPackageList(enabledOnly = false) {
  return requestClient.get('/QuotaPackage/List', { params: { enabledOnly } });
}

export async function getPackageDetail(id: number) {
  return requestClient.get('/QuotaPackage/Detail', { params: { id } });
}

export async function createPackage(data: any) {
  return requestClient.post('/QuotaPackage/Create', data);
}

export async function updatePackage(data: any) {
  return requestClient.post('/QuotaPackage/Update', data);
}

export async function deletePackage(id: number) {
  return requestClient.post('/QuotaPackage/Delete', null, { params: { id } });
}

export async function applyPackage(packageId: number, memberId: number) {
  return requestClient.post('/QuotaPackage/Apply', { packageId, memberId });
}

export async function getPackageComparison() {
  return requestClient.get('/QuotaPackage/Comparison');
}

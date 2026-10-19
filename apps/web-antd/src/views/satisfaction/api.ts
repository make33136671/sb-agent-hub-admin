import { requestClient } from '#/api/request';

export async function getRatingList(params?: { agentId?: number; page?: number; pageSize?: number }) {
  return requestClient.get('/Satisfaction/List', { params });
}

export async function getStatistics(agentId?: number) {
  return requestClient.get('/Satisfaction/Statistics', { params: { agentId } });
}

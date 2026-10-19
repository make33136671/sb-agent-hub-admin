import { requestClient } from '#/api/request';

export async function getRuleList(platformId?: number, triggerType?: number) {
  return requestClient.get('/AutoReply/List', { params: { platformId, triggerType } });
}

export async function createRule(data: {
  platformId: number;
  triggerType: number;
  keywords: string;
  matchType: number;
  replyContent: string;
  replyType: number;
  priority: number;
}) {
  return requestClient.post('/AutoReply/Create', data);
}

export async function updateRule(data: {
  id: number;
  triggerType: number;
  keywords: string;
  matchType: number;
  replyContent: string;
  replyType: number;
  priority: number;
  isEnabled: boolean;
}) {
  return requestClient.post('/AutoReply/Update', data);
}

export async function deleteRule(id: number) {
  return requestClient.post('/AutoReply/Delete', { id }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

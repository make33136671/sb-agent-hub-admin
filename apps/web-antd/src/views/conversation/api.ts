import { requestClient } from '#/api/request';

export async function getConversationList(params: any) {
  return requestClient.get('/Conversation/List', { params });
}

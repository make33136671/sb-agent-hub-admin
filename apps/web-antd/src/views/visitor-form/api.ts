import { requestClient } from '#/api/request';

export async function getFormList(platformId?: number) {
  return requestClient.get('/VisitorForm/List', { params: { platformId } });
}

export async function getFormDetail(id: number) {
  return requestClient.get('/VisitorForm/Detail', { params: { id } });
}

export async function createForm(data: {
  platformId: number;
  formName: string;
  formFields: string;
  isRequired: boolean;
}) {
  return requestClient.post('/VisitorForm/Create', data);
}

export async function updateForm(data: {
  id: number;
  formName: string;
  formFields: string;
  isRequired: boolean;
  isEnabled: boolean;
}) {
  return requestClient.post('/VisitorForm/Update', data);
}

export async function deleteForm(id: number) {
  return requestClient.post('/VisitorForm/Delete', { id }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
}

export async function getSubmissions(formId: number, page = 1, pageSize = 20) {
  return requestClient.get('/VisitorForm/Submissions', {
    params: { formId, page, pageSize },
  });
}

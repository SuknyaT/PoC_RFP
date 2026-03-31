import api from './client';
import { Proposal } from '../types';

export const proposalApi = {
  generate: (rfpId: string) =>
    api.post<Proposal>(`/rfps/${rfpId}/proposals`),

  list: (rfpId: string) =>
    api.get<Proposal[]>(`/rfps/${rfpId}/proposals`),

  get: (rfpId: string, proposalId: string) =>
    api.get<Proposal>(`/rfps/${rfpId}/proposals/${proposalId}`),

  update: (rfpId: string, proposalId: string, data: Partial<Proposal>) =>
    api.patch<Proposal>(`/rfps/${rfpId}/proposals/${proposalId}`, data),

  downloadPdf: (rfpId: string, proposalId: string) =>
    api.get(`/rfps/${rfpId}/proposals/${proposalId}/pdf`, { responseType: 'blob' }),

  regenerateSection: (rfpId: string, proposalId: string, sectionKey: string) =>
    api.post<Proposal>(`/rfps/${rfpId}/proposals/${proposalId}/regenerate-section`, { sectionKey }),
};

import api from './client';
import { Rfp, RfpRequirement } from '../types';

export const rfpApi = {
  list: (params?: { status?: string; industry?: string }) =>
    api.get<Rfp[]>('/rfps', { params }),

  get: (id: string) =>
    api.get<Rfp>(`/rfps/${id}`),

  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Rfp>('/rfps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  parse: (id: string) =>
    api.post<Rfp>(`/rfps/${id}/parse`),

  update: (id: string, data: Partial<Rfp>) =>
    api.patch<Rfp>(`/rfps/${id}`, data),

  delete: (id: string) =>
    api.delete(`/rfps/${id}`),

  analyzeScoring: (id: string) =>
    api.post(`/rfps/${id}/analyze-scoring`),

  // Requirements
  getRequirements: (rfpId: string, params?: { status?: string; category?: string }) =>
    api.get<RfpRequirement[]>(`/rfps/${rfpId}/requirements`, { params }),

  extractRequirements: (rfpId: string) =>
    api.post<RfpRequirement[]>(`/rfps/${rfpId}/requirements/extract`),

  updateRequirement: (rfpId: string, requirementId: string, data: { status?: string; notes?: string }) =>
    api.patch<RfpRequirement>(`/rfps/${rfpId}/requirements/${requirementId}`, data),
};

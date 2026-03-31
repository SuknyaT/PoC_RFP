import api from './client';
import { Competitor, RfpCompetitor } from '../types';

export interface SuggestedCompetitor {
  name: string;
  industries: string[];
  strengths: string;
  weaknesses: string;
  typicalBidStyle: string;
  relevance_reason: string;
  existingId: string | null;
  isNew: boolean;
}

export const competitorApi = {
  list: () =>
    api.get<Competitor[]>('/competitors'),

  get: (id: string) =>
    api.get<Competitor>(`/competitors/${id}`),

  create: (data: Partial<Competitor>) =>
    api.post<Competitor>('/competitors', data),

  update: (id: string, data: Partial<Competitor>) =>
    api.patch<Competitor>(`/competitors/${id}`, data),

  delete: (id: string) =>
    api.delete(`/competitors/${id}`),

  linkToRfp: (rfpId: string, competitorIds: string[]) =>
    api.post(`/rfps/${rfpId}/competitors`, { competitorIds }),

  getRfpCompetitors: (rfpId: string) =>
    api.get<RfpCompetitor[]>(`/rfps/${rfpId}/competitors`),

  discoverForRfp: (rfpId: string) =>
    api.get<SuggestedCompetitor[]>(`/rfps/${rfpId}/competitors/discover`),

  addSuggested: (rfpId: string, data: { name: string; industries: string[]; strengths: string; weaknesses: string; typicalBidStyle: string }) =>
    api.post<Competitor>(`/rfps/${rfpId}/competitors/add-suggested`, data),
};

import api from './client';
import { HistoricalBid } from '../types';

export const historicalApi = {
  list: (params?: { industry?: string; outcome?: string }) =>
    api.get<HistoricalBid[]>('/historical-bids', { params }),

  create: (data: Partial<HistoricalBid>) =>
    api.post<HistoricalBid>('/historical-bids', data),

  update: (id: string, data: Partial<HistoricalBid>) =>
    api.patch<HistoricalBid>(`/historical-bids/${id}`, data),

  delete: (id: string) =>
    api.delete(`/historical-bids/${id}`),

  findSimilar: (rfpId: string) =>
    api.get<HistoricalBid[]>(`/historical-bids/similar/${rfpId}`),
};

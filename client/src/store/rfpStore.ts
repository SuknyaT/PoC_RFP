import { create } from 'zustand';
import { Rfp } from '../types';
import { rfpApi } from '../api/rfp.api';

interface RfpState {
  rfps: Rfp[];
  currentRfp: Rfp | null;
  loading: boolean;
  fetchRfps: (filters?: { status?: string; industry?: string }) => Promise<void>;
  fetchRfp: (id: string) => Promise<void>;
  uploadRfp: (file: File) => Promise<Rfp>;
  parseRfp: (id: string) => Promise<void>;
}

export const useRfpStore = create<RfpState>((set) => ({
  rfps: [],
  currentRfp: null,
  loading: false,

  fetchRfps: async (filters) => {
    set({ loading: true });
    const { data } = await rfpApi.list(filters);
    set({ rfps: data, loading: false });
  },

  fetchRfp: async (id) => {
    set({ loading: true });
    const { data } = await rfpApi.get(id);
    set({ currentRfp: data, loading: false });
  },

  uploadRfp: async (file) => {
    const { data } = await rfpApi.upload(file);
    set((state) => ({ rfps: [data, ...state.rfps] }));
    return data;
  },

  parseRfp: async (id) => {
    set({ loading: true });
    const { data } = await rfpApi.parse(id);
    set({ currentRfp: data, loading: false });
  },
}));

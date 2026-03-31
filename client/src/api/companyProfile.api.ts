import api from './client';
import { CompanyProfile } from '../types';

export const companyProfileApi = {
  get: () =>
    api.get<CompanyProfile | null>('/company-profile'),

  save: (data: Partial<CompanyProfile>) =>
    api.put<CompanyProfile>('/company-profile', data),

  delete: () =>
    api.delete('/company-profile'),
};

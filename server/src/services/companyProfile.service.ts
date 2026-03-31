import { prisma } from '../config/database.js';

export async function getCompanyProfile() {
  // Singleton — return the first (and only) profile
  return prisma.companyProfile.findFirst();
}

export async function upsertCompanyProfile(data: {
  companyName: string;
  tagline?: string;
  foundedYear?: number;
  headquarters?: string;
  employeeCount?: number;
  annualRevenue?: string;
  industries?: string[];
  certifications?: string[];
  awards?: string[];
  keyClients?: string[];
  officeLocations?: string[];
  safetyRecord?: string;
  insuranceCoverage?: string;
  keyMetrics?: Record<string, unknown>;
  slaDefaults?: Record<string, unknown>;
  differentiators?: Record<string, unknown>;
}) {
  const existing = await prisma.companyProfile.findFirst();
  if (existing) {
    return prisma.companyProfile.update({ where: { id: existing.id }, data });
  }
  return prisma.companyProfile.create({ data });
}

export async function deleteCompanyProfile() {
  const existing = await prisma.companyProfile.findFirst();
  if (existing) {
    return prisma.companyProfile.delete({ where: { id: existing.id } });
  }
  return null;
}

import { prisma } from '../config/database.js';
import { extractRequirements } from './ai/requirementExtractor.ai.js';

export async function extractAndSaveRequirements(rfpId: string) {
  const rfp = await prisma.rfp.findUniqueOrThrow({ where: { id: rfpId } });
  if (!rfp.rawText) throw new Error('RFP has no raw text to extract requirements from');

  const extracted = await extractRequirements(rfp.rawText);

  // Clear existing requirements
  await prisma.rfpRequirement.deleteMany({ where: { rfpId } });

  // Create new ones
  await prisma.rfpRequirement.createMany({
    data: extracted.map((r, i) => ({
      rfpId,
      requirement: r.requirement,
      category: r.category,
      priority: r.priority,
      status: 'pending',
      sortOrder: i,
    })),
  });

  return prisma.rfpRequirement.findMany({
    where: { rfpId },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getRequirements(rfpId: string, filters?: { status?: string; category?: string }) {
  return prisma.rfpRequirement.findMany({
    where: {
      rfpId,
      ...(filters?.status && filters.status !== 'all' ? { status: filters.status } : {}),
      ...(filters?.category && filters.category !== 'all' ? { category: filters.category } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function updateRequirement(id: string, data: { status?: string; notes?: string }) {
  return prisma.rfpRequirement.update({ where: { id }, data });
}

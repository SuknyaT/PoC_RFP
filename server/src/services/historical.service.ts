import { prisma } from '../config/database.js';

export async function listHistoricalBids(filters?: {
  industry?: string;
  outcome?: string;
  isOurBid?: boolean;
}) {
  return prisma.historicalBid.findMany({
    where: {
      ...(filters?.industry && { industry: filters.industry }),
      ...(filters?.outcome && { outcome: filters.outcome }),
      ...(filters?.isOurBid !== undefined && { isOurBid: filters.isOurBid }),
    },
    include: { competitor: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createHistoricalBid(data: {
  rfpTitle?: string;
  clientName?: string;
  industry?: string;
  year?: number;
  bidderName?: string;
  isOurBid?: boolean;
  flatGuarantee?: number;
  profitSharePct?: number;
  otherTerms?: unknown;
  outcome?: string;
  winningBidSummary?: string;
  scoreReceived?: number;
  lessonsLearned?: string;
  competitorId?: string;
}) {
  const { competitorId, otherTerms, ...rest } = data;
  return prisma.historicalBid.create({
    data: {
      ...rest,
      ...(otherTerms !== undefined ? { otherTerms: JSON.parse(JSON.stringify(otherTerms)) } : {}),
      ...(competitorId ? { competitor: { connect: { id: competitorId } } } : {}),
    },
  });
}

export async function updateHistoricalBid(id: string, data: Record<string, unknown>) {
  return prisma.historicalBid.update({ where: { id }, data });
}

export async function deleteHistoricalBid(id: string) {
  return prisma.historicalBid.delete({ where: { id } });
}

export async function findSimilarBids(rfpId: string) {
  const rfp = await prisma.rfp.findUniqueOrThrow({ where: { id: rfpId } });

  return prisma.historicalBid.findMany({
    where: {
      OR: [
        { industry: rfp.industry },
        { clientName: rfp.clientName },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

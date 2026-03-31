import { prisma } from '../config/database.js';
import { analyzeCompetitors } from './ai/competitorAnalyzer.ai.js';
import { suggestCompetitors, SuggestedCompetitor } from './ai/competitorSuggestor.ai.js';

export async function listCompetitors() {
  return prisma.competitor.findMany({ orderBy: { name: 'asc' } });
}

export async function getCompetitor(id: string) {
  return prisma.competitor.findUniqueOrThrow({ where: { id } });
}

export async function createCompetitor(data: {
  name: string;
  industries: string[];
  strengths?: string;
  weaknesses?: string;
  typicalBidStyle?: string;
  notes?: string;
}) {
  return prisma.competitor.create({ data });
}

export async function updateCompetitor(id: string, data: Record<string, unknown>) {
  return prisma.competitor.update({ where: { id }, data });
}

export async function deleteCompetitor(id: string) {
  return prisma.competitor.delete({ where: { id } });
}

export async function linkCompetitorToRfp(rfpId: string, competitorIds: string[]) {
  const rfp = await prisma.rfp.findUniqueOrThrow({ where: { id: rfpId } });

  // Remove existing links
  await prisma.rfpCompetitor.deleteMany({ where: { rfpId } });

  // Get competitor profiles
  const competitors = await prisma.competitor.findMany({
    where: { id: { in: competitorIds } },
  });

  // Get competitor historical bids
  const competitorBids = await prisma.historicalBid.findMany({
    where: {
      isOurBid: false,
      competitorId: { in: competitorIds },
    },
    take: 20,
  });

  // Run AI analysis
  const analysis = await analyzeCompetitors(
    { title: rfp.title, industry: rfp.industry, projectScope: rfp.projectScope },
    competitors.map(c => ({
      name: c.name,
      strengths: c.strengths,
      weaknesses: c.weaknesses,
      typicalBidStyle: c.typicalBidStyle,
    })),
    competitorBids.map(b => ({
      bidderName: b.bidderName,
      rfpTitle: b.rfpTitle,
      flatGuarantee: b.flatGuarantee ? Number(b.flatGuarantee) : null,
      profitSharePct: b.profitSharePct ? Number(b.profitSharePct) : null,
      outcome: b.outcome,
    }))
  );

  // Save links with analysis
  const rfpCompetitors = await Promise.all(
    competitors.map(async (competitor) => {
      const competitorAnalysis = analysis.find(
        a => a.competitor_name.toLowerCase() === competitor.name.toLowerCase()
      );
      return prisma.rfpCompetitor.create({
        data: {
          rfpId,
          competitorId: competitor.id,
          expectedStrategy: competitorAnalysis?.predicted_strategy,
          threatLevel: competitorAnalysis?.threat_level,
        },
        include: { competitor: true },
      });
    })
  );

  return { rfpCompetitors, analysis };
}

export async function getRfpCompetitors(rfpId: string) {
  return prisma.rfpCompetitor.findMany({
    where: { rfpId },
    include: { competitor: true },
  });
}

export async function discoverCompetitors(rfpId: string) {
  const rfp = await prisma.rfp.findUniqueOrThrow({ where: { id: rfpId } });

  // Get AI suggestions
  const suggestions = await suggestCompetitors({
    title: rfp.title,
    clientName: rfp.clientName,
    industry: rfp.industry,
    projectScope: rfp.projectScope,
    location: rfp.location,
    estimatedValue: rfp.estimatedValue?.toString() ?? null,
  });

  // Match suggestions against existing DB competitors
  const existingCompetitors = await prisma.competitor.findMany();
  const existingNames = new Map(
    existingCompetitors.map(c => [c.name.toLowerCase(), c])
  );

  const results = suggestions.map(s => {
    const existing = existingNames.get(s.name.toLowerCase());
    return {
      ...s,
      existingId: existing?.id ?? null,
      isNew: !existing,
    };
  });

  return results;
}

export async function addSuggestedCompetitor(data: {
  name: string;
  industries: string[];
  strengths: string;
  weaknesses: string;
  typicalBidStyle: string;
}) {
  // Check if already exists (case-insensitive)
  const existing = await prisma.competitor.findFirst({
    where: { name: { equals: data.name, mode: 'insensitive' } },
  });
  if (existing) return existing;
  return prisma.competitor.create({ data });
}

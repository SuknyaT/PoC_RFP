import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prisma } from '../config/database.js';

export async function getStats(_req: AuthRequest, res: Response) {
  try {
    const [totalRfps, totalProposals, wonBids, lostBids] = await Promise.all([
      prisma.rfp.count(),
      prisma.proposal.count(),
      prisma.rfp.count({ where: { status: 'won' } }),
      prisma.rfp.count({ where: { status: 'lost' } }),
    ]);

    const winRate = wonBids + lostBids > 0
      ? Math.round((wonBids / (wonBids + lostBids)) * 100)
      : 0;

    res.json({
      totalRfps,
      totalProposals,
      wonBids,
      lostBids,
      winRate,
      activeRfps: totalRfps - wonBids - lostBids,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get stats';
    res.status(500).json({ error: message });
  }
}

export async function getPipeline(_req: AuthRequest, res: Response) {
  try {
    const pipeline = await prisma.rfp.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    res.json(pipeline.map(p => ({ status: p.status, count: p._count.id })));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get pipeline';
    res.status(500).json({ error: message });
  }
}

export async function getIndustryStats(_req: AuthRequest, res: Response) {
  try {
    const rfps = await prisma.rfp.findMany({
      where: { industry: { not: null } },
      select: { industry: true, status: true },
    });

    const byIndustry = new Map<string, { total: number; won: number }>();
    for (const rfp of rfps) {
      const ind = rfp.industry!;
      const entry = byIndustry.get(ind) || { total: 0, won: 0 };
      entry.total++;
      if (rfp.status === 'won') entry.won++;
      byIndustry.set(ind, entry);
    }

    const result = [...byIndustry.entries()].map(([industry, { total, won }]) => ({
      industry,
      total,
      won,
      winRate: total > 0 ? Math.round((won / total) * 100) : 0,
    }));

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get industry stats';
    res.status(500).json({ error: message });
  }
}

export async function getScoreTrends(_req: AuthRequest, res: Response) {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { predictedScore: { not: null } },
      select: { predictedScore: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byMonth = new Map<string, { total: number; count: number }>();
    for (const p of proposals) {
      const month = p.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const entry = byMonth.get(month) || { total: 0, count: 0 };
      entry.total += Number(p.predictedScore);
      entry.count++;
      byMonth.set(month, entry);
    }

    const result = [...byMonth.entries()].map(([month, { total, count }]) => ({
      month,
      avgScore: Math.round((total / count) * 10) / 10,
      count,
    }));

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get score trends';
    res.status(500).json({ error: message });
  }
}

export async function getTopCompetitors(_req: AuthRequest, res: Response) {
  try {
    const rfpCompetitors = await prisma.rfpCompetitor.findMany({
      include: { competitor: { select: { name: true } } },
    });

    const byCompetitor = new Map<string, { encounters: number; threats: string[] }>();
    for (const rc of rfpCompetitors) {
      const name = rc.competitor.name;
      const entry = byCompetitor.get(name) || { encounters: 0, threats: [] };
      entry.encounters++;
      if (rc.threatLevel) entry.threats.push(rc.threatLevel);
      byCompetitor.set(name, entry);
    }

    const result = [...byCompetitor.entries()]
      .map(([name, { encounters, threats }]) => {
        const highCount = threats.filter(t => t === 'high').length;
        const medCount = threats.filter(t => t === 'medium').length;
        const threatLevel = highCount > medCount ? 'high' : medCount > 0 ? 'medium' : 'low';
        return { name, encounters, threatLevel };
      })
      .sort((a, b) => b.encounters - a.encounters)
      .slice(0, 10);

    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get top competitors';
    res.status(500).json({ error: message });
  }
}

export async function getRecentActivity(_req: AuthRequest, res: Response) {
  try {
    const [recentRfps, recentProposals] = await Promise.all([
      prisma.rfp.findMany({
        select: { id: true, title: true, status: true, createdAt: true, clientName: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.proposal.findMany({
        select: { id: true, version: true, createdAt: true, rfp: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const activities = [
      ...recentRfps.map(r => ({
        id: r.id,
        type: r.status === 'analyzed' ? 'rfp_parsed' as const : 'rfp_created' as const,
        title: r.title,
        detail: r.clientName || r.status,
        timestamp: r.createdAt.toISOString(),
      })),
      ...recentProposals.map(p => ({
        id: p.id,
        type: 'proposal_generated' as const,
        title: `Proposal v${p.version}`,
        detail: p.rfp.title,
        timestamp: p.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

    res.json(activities);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get recent activity';
    res.status(500).json({ error: message });
  }
}

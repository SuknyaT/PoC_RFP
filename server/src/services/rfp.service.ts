import { prisma } from '../config/database.js';
import { extractTextFromFile } from '../utils/pdfParser.js';
import { parseRfpDocument } from './ai/rfpParser.ai.js';
import { analyzeScoring } from './ai/scoringAnalyzer.ai.js';
import { linkCompetitorToRfp } from './competitor.service.js';
import { extractAndSaveRequirements } from './requirement.service.js';

export async function createRfp(file: Express.Multer.File, userId: string) {
  const rfp = await prisma.rfp.create({
    data: {
      title: file.originalname.replace(/\.[^/.]+$/, ''),
      originalFilename: file.originalname,
      filePath: file.path,
      status: 'draft',
      createdBy: userId,
    },
  });
  return rfp;
}

export async function parseRfp(rfpId: string) {
  const rfp = await prisma.rfp.findUniqueOrThrow({ where: { id: rfpId } });

  if (!rfp.filePath || !rfp.originalFilename) {
    throw new Error('No file associated with this RFP');
  }

  // Update status to parsing
  await prisma.rfp.update({ where: { id: rfpId }, data: { status: 'parsing' } });

  // Extract text from file
  const rawText = await extractTextFromFile(rfp.filePath, rfp.originalFilename);

  // Parse with AI
  const parsed = await parseRfpDocument(rawText);

  // Update RFP with parsed data
  const updated = await prisma.rfp.update({
    where: { id: rfpId },
    data: {
      title: parsed.title || rfp.title,
      clientName: parsed.client_name,
      industry: parsed.industry,
      projectScope: parsed.project_scope,
      submissionDeadline: parsed.submission_deadline ? new Date(parsed.submission_deadline) : null,
      contractDuration: parsed.contract_duration,
      estimatedValue: parsed.estimated_value,
      location: parsed.location,
      rawText,
      status: 'analyzed',
    },
  });

  // Create scoring criteria
  if (parsed.scoring_criteria.length > 0) {
    await prisma.scoringCriteria.deleteMany({ where: { rfpId } });
    await prisma.scoringCriteria.createMany({
      data: parsed.scoring_criteria.map((c, i) => ({
        rfpId,
        criterionName: c.name,
        maxPoints: c.max_points,
        weightPct: c.weight_pct,
        description: c.description,
        sortOrder: i,
      })),
    });
  }

  // Auto-extract requirements in background
  extractAndSaveRequirements(rfpId).catch(err =>
    console.error('Auto requirement extraction failed:', err)
  );

  // Auto-link competitors by matching industry
  if (updated.industry) {
    const matchedCompetitors = await prisma.competitor.findMany({
      where: { industries: { has: updated.industry } },
    });
    if (matchedCompetitors.length > 0) {
      // Run in background — don't block the parse response
      linkCompetitorToRfp(rfpId, matchedCompetitors.map(c => c.id)).catch(err =>
        console.error('Auto competitor analysis failed:', err)
      );
    }
  }

  return updated;
}

export async function listRfps(filters?: { status?: string; industry?: string }) {
  return prisma.rfp.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.industry && { industry: filters.industry }),
    },
    include: { scoringCriteria: true, _count: { select: { proposals: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getRfpById(id: string) {
  return prisma.rfp.findUniqueOrThrow({
    where: { id },
    include: {
      scoringCriteria: { orderBy: { sortOrder: 'asc' } },
      rfpCompetitors: { include: { competitor: true } },
      proposals: { orderBy: { version: 'desc' } },
      requirements: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

export async function updateRfp(id: string, data: Record<string, unknown>) {
  return prisma.rfp.update({ where: { id }, data });
}

export async function deleteRfp(id: string) {
  return prisma.rfp.delete({ where: { id } });
}

export async function analyzeScoringCriteria(rfpId: string) {
  const rfp = await prisma.rfp.findUniqueOrThrow({
    where: { id: rfpId },
    include: { scoringCriteria: true },
  });

  const historicalWinners = await prisma.historicalBid.findMany({
    where: { industry: rfp.industry, outcome: 'won' },
    take: 10,
  });

  const strategies = await analyzeScoring(
    rfp.scoringCriteria.map(c => ({
      name: c.criterionName,
      maxPoints: c.maxPoints,
      description: c.description,
    })),
    historicalWinners.map(h => ({
      rfpTitle: h.rfpTitle || '',
      industry: h.industry || '',
      scoreReceived: h.scoreReceived ? Number(h.scoreReceived) : null,
      lessonsLearned: h.lessonsLearned,
    }))
  );

  // Update criteria with AI strategies
  for (const strategy of strategies) {
    const criterion = rfp.scoringCriteria.find(
      c => c.criterionName.toLowerCase() === strategy.criterion_name.toLowerCase()
    );
    if (criterion) {
      await prisma.scoringCriteria.update({
        where: { id: criterion.id },
        data: { aiStrategy: strategy.strategy },
      });
    }
  }

  return strategies;
}

import { prisma } from '../config/database.js';
import { generateProposal, regenerateSection, snakeToCamelKey, type ProposalContext } from './ai/proposalGenerator.ai.js';
import { getCompanyProfile } from './companyProfile.service.js';

async function buildProposalContext(rfpId: string): Promise<ProposalContext> {
  const rfp = await prisma.rfp.findUniqueOrThrow({
    where: { id: rfpId },
    include: {
      scoringCriteria: true,
      rfpCompetitors: { include: { competitor: true } },
    },
  });

  const historicalWinners = await prisma.historicalBid.findMany({
    where: {
      OR: [
        { industry: rfp.industry },
        { clientName: rfp.clientName },
      ],
      outcome: 'won',
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const companyProfile = await getCompanyProfile();

  return {
    rfp: {
      title: rfp.title,
      clientName: rfp.clientName,
      industry: rfp.industry,
      projectScope: rfp.projectScope,
      contractDuration: rfp.contractDuration,
      estimatedValue: rfp.estimatedValue?.toString() ?? null,
      location: rfp.location,
    },
    scoringCriteria: rfp.scoringCriteria.map(c => ({
      criterionName: c.criterionName,
      maxPoints: c.maxPoints,
      weightPct: c.weightPct?.toString() ?? null,
      description: c.description,
      aiStrategy: c.aiStrategy,
    })),
    competitorAnalysis: rfp.rfpCompetitors.map(rc => ({
      competitorName: rc.competitor.name,
      predictedStrategy: rc.expectedStrategy || 'Unknown',
      threatLevel: rc.threatLevel || 'medium',
    })),
    historicalWinners: historicalWinners.map(h => ({
      rfpTitle: h.rfpTitle,
      industry: h.industry,
      flatGuarantee: h.flatGuarantee?.toString() ?? null,
      profitSharePct: h.profitSharePct?.toString() ?? null,
      outcome: h.outcome,
      lessonsLearned: h.lessonsLearned,
      otherTerms: h.otherTerms as Record<string, unknown> | null,
    })),
    companyProfile: companyProfile ? {
      companyName: companyProfile.companyName,
      tagline: companyProfile.tagline,
      foundedYear: companyProfile.foundedYear,
      headquarters: companyProfile.headquarters,
      employeeCount: companyProfile.employeeCount,
      annualRevenue: companyProfile.annualRevenue,
      industries: companyProfile.industries,
      certifications: companyProfile.certifications,
      awards: companyProfile.awards,
      keyClients: companyProfile.keyClients,
      officeLocations: companyProfile.officeLocations,
      safetyRecord: companyProfile.safetyRecord,
      insuranceCoverage: companyProfile.insuranceCoverage,
      keyMetrics: companyProfile.keyMetrics as Record<string, unknown> | null,
      slaDefaults: companyProfile.slaDefaults as Record<string, unknown> | null,
      differentiators: companyProfile.differentiators as Record<string, unknown> | null,
    } : null,
  };
}

export async function createProposal(rfpId: string, userId: string) {
  const context = await buildProposalContext(rfpId);

  const latestProposal = await prisma.proposal.findFirst({
    where: { rfpId },
    orderBy: { version: 'desc' },
  });
  const nextVersion = (latestProposal?.version ?? 0) + 1;

  const generated = await generateProposal(context);

  const proposal = await prisma.proposal.create({
    data: {
      rfpId,
      version: nextVersion,
      status: 'draft',
      executiveSummary: generated.executive_summary,
      companyOverview: generated.company_overview,
      experienceSection: generated.experience_section,
      approachSection: generated.approach_section,
      projectTimeline: generated.project_timeline,
      teamStructure: generated.team_structure,
      revenueProposal: generated.revenue_proposal,
      costOverview: generated.cost_overview,
      riskMitigation: generated.risk_mitigation,
      valueProposition: generated.value_proposition,
      complianceStatement: generated.compliance_statement,
      competitiveAdvantages: generated.competitive_advantages,
      termsAndConditions: generated.terms_and_conditions,
      recommendedFlatGuarantee: generated.recommended_flat_guarantee,
      recommendedProfitShare: generated.recommended_profit_share,
      annualEscalationPct: generated.annual_escalation_pct,
      yearWiseProjections: JSON.parse(JSON.stringify(generated.year_wise_projections)),
      scoringBreakdown: JSON.parse(JSON.stringify(generated.scoring_breakdown)),
      revenueModelRationale: generated.revenue_model_rationale,
      predictedScore: generated.predicted_score,
      optimizationNotes: generated.optimization_notes,
      fullContent: JSON.parse(JSON.stringify(generated)),
      createdBy: userId,
    },
  });

  await prisma.rfp.update({
    where: { id: rfpId },
    data: { status: 'proposal_draft' },
  });

  return proposal;
}

export async function regenerateProposalSection(proposalId: string, sectionKey: string) {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { rfp: true },
  });

  const context = await buildProposalContext(proposal.rfpId);
  const newValue = await regenerateSection(context, sectionKey);
  const camelKey = snakeToCamelKey(sectionKey);

  return prisma.proposal.update({
    where: { id: proposalId },
    data: { [camelKey]: newValue },
    include: { rfp: true },
  });
}

export async function getProposals(rfpId: string) {
  return prisma.proposal.findMany({
    where: { rfpId },
    orderBy: { version: 'desc' },
  });
}

export async function getProposal(proposalId: string) {
  return prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: { rfp: true },
  });
}

export async function updateProposal(proposalId: string, data: Record<string, unknown>) {
  return prisma.proposal.update({ where: { id: proposalId }, data });
}

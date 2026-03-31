import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import * as proposalService from '../services/proposal.service.js';
import { generateProposalPdf } from '../utils/pdfGenerator.js';
import { getParam } from '../utils/params.js';

export async function createProposal(req: AuthRequest, res: Response) {
  try {
    const proposal = await proposalService.createProposal(getParam(req.params.id), req.userId!);
    res.status(201).json(proposal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate proposal';
    res.status(500).json({ error: message });
  }
}

export async function listProposals(req: AuthRequest, res: Response) {
  try {
    const proposals = await proposalService.getProposals(getParam(req.params.id));
    res.json(proposals);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list proposals';
    res.status(500).json({ error: message });
  }
}

export async function getProposal(req: AuthRequest, res: Response) {
  try {
    const proposal = await proposalService.getProposal(getParam(req.params.pid));
    res.json(proposal);
  } catch {
    res.status(404).json({ error: 'Proposal not found' });
  }
}

export async function updateProposal(req: AuthRequest, res: Response) {
  try {
    const proposal = await proposalService.updateProposal(getParam(req.params.pid), req.body);
    res.json(proposal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update proposal';
    res.status(500).json({ error: message });
  }
}

export async function regenerateSection(req: AuthRequest, res: Response) {
  try {
    const { sectionKey } = req.body;
    if (!sectionKey) {
      res.status(400).json({ error: 'sectionKey is required' });
      return;
    }
    const proposal = await proposalService.regenerateProposalSection(
      getParam(req.params.pid),
      sectionKey
    );
    res.json(proposal);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate section';
    res.status(500).json({ error: message });
  }
}

export async function exportPdf(req: AuthRequest, res: Response) {
  try {
    const proposal = await proposalService.getProposal(getParam(req.params.pid));
    const rfp = proposal.rfp;

    const pdfData = {
      rfpTitle: rfp.title,
      clientName: rfp.clientName || 'Client',
      version: proposal.version,
      predictedScore: proposal.predictedScore ? Number(proposal.predictedScore) : null,
      executiveSummary: proposal.executiveSummary,
      companyOverview: proposal.companyOverview,
      experienceSection: proposal.experienceSection,
      approachSection: proposal.approachSection,
      projectTimeline: proposal.projectTimeline,
      teamStructure: proposal.teamStructure,
      revenueProposal: proposal.revenueProposal,
      costOverview: proposal.costOverview,
      riskMitigation: proposal.riskMitigation,
      valueProposition: proposal.valueProposition,
      complianceStatement: proposal.complianceStatement,
      competitiveAdvantages: proposal.competitiveAdvantages,
      termsAndConditions: proposal.termsAndConditions,
      recommendedFlatGuarantee: proposal.recommendedFlatGuarantee ? Number(proposal.recommendedFlatGuarantee) : null,
      recommendedProfitShare: proposal.recommendedProfitShare ? Number(proposal.recommendedProfitShare) : null,
      annualEscalationPct: proposal.annualEscalationPct ? Number(proposal.annualEscalationPct) : null,
      yearWiseProjections: proposal.yearWiseProjections as any[] | null,
      scoringBreakdown: proposal.scoringBreakdown as any[] | null,
      revenueModelRationale: proposal.revenueModelRationale,
      optimizationNotes: proposal.optimizationNotes,
      createdAt: proposal.createdAt.toISOString(),
    };

    const doc = generateProposalPdf(pdfData);
    const filename = `Proposal-${rfp.title.replace(/[^a-zA-Z0-9]/g, '_')}-v${proposal.version}.pdf`;

    const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    doc.pipe(res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export PDF';
    res.status(500).json({ error: message });
  }
}

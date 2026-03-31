export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Rfp {
  id: string;
  title: string;
  clientName: string | null;
  industry: string | null;
  status: string;
  projectScope: string | null;
  submissionDeadline: string | null;
  contractDuration: string | null;
  estimatedValue: number | null;
  location: string | null;
  originalFilename: string | null;
  rawText: string | null;
  createdAt: string;
  updatedAt: string;
  scoringCriteria: ScoringCriteria[];
  proposals: Proposal[];
  rfpCompetitors: RfpCompetitor[];
  requirements?: RfpRequirement[];
  _count?: { proposals: number };
}

export interface ScoringCriteria {
  id: string;
  rfpId: string;
  criterionName: string;
  maxPoints: number | null;
  weightPct: number | null;
  description: string | null;
  aiStrategy: string | null;
  sortOrder: number;
}

export interface Competitor {
  id: string;
  name: string;
  industries: string[];
  strengths: string | null;
  weaknesses: string | null;
  typicalBidStyle: string | null;
  notes: string | null;
  createdAt: string;
}

export interface RfpCompetitor {
  id: string;
  rfpId: string;
  competitorId: string;
  expectedStrategy: string | null;
  threatLevel: string | null;
  competitor: Competitor;
}

export interface HistoricalBid {
  id: string;
  rfpTitle: string | null;
  clientName: string | null;
  industry: string | null;
  year: number | null;
  bidderName: string | null;
  isOurBid: boolean;
  flatGuarantee: number | null;
  profitSharePct: number | null;
  otherTerms: Record<string, unknown> | null;
  outcome: string | null;
  winningBidSummary: string | null;
  scoreReceived: number | null;
  lessonsLearned: string | null;
  createdAt: string;
}

export interface YearProjection {
  year: number;
  guaranteed_amount: number;
  projected_revenue: number;
  profit_share_amount: number;
  total_to_client: number;
}

export interface ScoringItem {
  criterion: string;
  max_points: number;
  estimated_points: number;
  justification: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  risk_factors: string[];
  improvement_actions: string[];
  competitor_comparison: string;
}

export interface CostSubItem {
  item: string;
  cost: number;
}

export interface CostLineItem {
  category: string;
  description: string;
  annual_cost: number;
  percentage_of_total: number;
  sub_items: CostSubItem[];
}

export interface CostBreakdown {
  summary: string;
  total_annual_cost: number;
  margin_percentage: number;
  line_items: CostLineItem[];
}

export interface Proposal {
  id: string;
  rfpId: string;
  version: number;
  status: string;
  recommendedFlatGuarantee: number | null;
  recommendedProfitShare: number | null;
  annualEscalationPct: number | null;
  revenueModelRationale: string | null;
  executiveSummary: string | null;
  companyOverview: string | null;
  experienceSection: string | null;
  approachSection: string | null;
  projectTimeline: string | null;
  teamStructure: string | null;
  revenueProposal: string | null;
  costOverview: string | null;
  riskMitigation: string | null;
  valueProposition: string | null;
  complianceStatement: string | null;
  competitiveAdvantages: string | null;
  termsAndConditions: string | null;
  yearWiseProjections: YearProjection[] | null;
  scoringBreakdown: ScoringItem[] | null;
  fullContent: Record<string, unknown> | null;
  predictedScore: number | null;
  optimizationNotes: string | null;
  createdAt: string;
  updatedAt: string;
  rfp?: Rfp;
}

export interface CompanyProfile {
  id: string;
  companyName: string;
  tagline: string | null;
  foundedYear: number | null;
  headquarters: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  industries: string[];
  certifications: string[];
  awards: string[];
  keyClients: string[];
  officeLocations: string[];
  safetyRecord: string | null;
  insuranceCoverage: string | null;
  keyMetrics: Record<string, unknown> | null;
  slaDefaults: Record<string, unknown> | null;
  differentiators: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RfpRequirement {
  id: string;
  rfpId: string;
  requirement: string;
  category: string | null;
  priority: string;
  status: string;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface IndustryWinRate {
  industry: string;
  total: number;
  won: number;
  winRate: number;
}

export interface ScoreTrend {
  month: string;
  avgScore: number;
  count: number;
}

export interface TopCompetitor {
  name: string;
  encounters: number;
  threatLevel: string;
}

export interface RecentActivity {
  id: string;
  type: 'rfp_created' | 'rfp_parsed' | 'proposal_generated' | 'competitor_added';
  title: string;
  detail: string;
  timestamp: string;
}

export interface DashboardStats {
  totalRfps: number;
  totalProposals: number;
  wonBids: number;
  lostBids: number;
  winRate: number;
  activeRfps: number;
}

export interface PipelineItem {
  status: string;
  count: number;
}

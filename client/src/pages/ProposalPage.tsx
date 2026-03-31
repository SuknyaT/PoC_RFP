import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, DollarSign, Download, FileText, Users, Clock,
  Shield, Target, CheckCircle, TrendingUp, AlertTriangle, Award,
  Building, BarChart3, BookOpen, RefreshCw, ArrowUpRight, Calendar, Percent, PiggyBank, Landmark, Info
} from 'lucide-react';
import { proposalApi } from '../api/proposal.api';
import { Proposal, YearProjection, ScoringItem, CostBreakdown } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const sectionConfig = [
  { key: 'executiveSummary', title: '1. Executive Summary', icon: FileText },
  { key: 'companyOverview', title: '2. Company Overview', icon: Building },
  { key: 'experienceSection', title: '3. Experience & Track Record', icon: Award },
  { key: 'approachSection', title: '4. Technical Approach & Methodology', icon: Target },
  { key: 'projectTimeline', title: '5. Project Timeline & Milestones', icon: Clock },
  { key: 'teamStructure', title: '6. Team Structure & Key Personnel', icon: Users },
  { key: 'revenueProposal', title: '7. Financial Proposal', icon: DollarSign },
  { key: 'costOverview', title: '8. Cost Overview & Breakdown', icon: BarChart3 },
  { key: 'riskMitigation', title: '11. Risk Mitigation Plan', icon: AlertTriangle },
  { key: 'valueProposition', title: '12. Value Proposition', icon: TrendingUp },
  { key: 'competitiveAdvantages', title: '13. Competitive Advantages', icon: Shield },
  { key: 'complianceStatement', title: '14. Compliance Statement', icon: CheckCircle },
  { key: 'termsAndConditions', title: '15. Terms & Conditions', icon: BookOpen },
];

type EditableFields = Record<string, string>;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export default function ProposalPage() {
  const { id: rfpId, pid: proposalId } = useParams<{ id: string; pid: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editData, setEditData] = useState<EditableFields>({});
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

  useEffect(() => {
    if (rfpId && proposalId) {
      proposalApi.get(rfpId, proposalId).then(({ data }) => {
        setProposal(data);
        const fields: EditableFields = {};
        sectionConfig.forEach(({ key }) => {
          fields[key] = (data as unknown as Record<string, unknown>)[key] as string || '';
        });
        setEditData(fields);
        setLoading(false);
      });
    }
  }, [rfpId, proposalId]);

  const handleSave = async () => {
    if (!rfpId || !proposalId) return;
    setSaving(true);
    try {
      const { data } = await proposalApi.update(rfpId, proposalId, editData as Partial<Proposal>);
      setProposal(data);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (camelKey: string) => {
    if (!rfpId || !proposalId) return;
    // Convert camelCase to snake_case for the API
    const snakeKey = camelKey.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    setRegeneratingKey(camelKey);
    try {
      const { data } = await proposalApi.regenerateSection(rfpId, proposalId, snakeKey);
      setProposal(data);
      setEditData(prev => ({
        ...prev,
        [camelKey]: (data as unknown as Record<string, unknown>)[camelKey] as string || '',
      }));
    } finally {
      setRegeneratingKey(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!rfpId || !proposalId) return;
    setDownloading(true);
    try {
      const { data } = await proposalApi.downloadPdf(rfpId, proposalId);
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposal-v${proposal?.version || 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  if (loading || !proposal) return <LoadingSpinner size="lg" />;

  const projections = proposal.yearWiseProjections as YearProjection[] | null;
  const scoring = proposal.scoringBreakdown as ScoringItem[] | null;
  const costBreakdown = (proposal.fullContent as Record<string, unknown>)?.cost_breakdown as CostBreakdown | null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/rfps/${rfpId}`} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Proposal v{proposal.version}</h2>
            <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">{proposal.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download size={18} /> {downloading ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'sections', label: 'Proposal Sections' },
          { id: 'financials', label: 'Financial Projections' },
          { id: 'scoring', label: 'Scoring Strategy' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Enhanced Revenue Model Section */}
          {(() => {
            const mag = proposal.recommendedFlatGuarantee ? Number(proposal.recommendedFlatGuarantee) : null;
            const profitShare = proposal.recommendedProfitShare ? Number(proposal.recommendedProfitShare) : null;
            const escalation = proposal.annualEscalationPct ? Number(proposal.annualEscalationPct) : null;
            const score = proposal.predictedScore ? Number(proposal.predictedScore) : null;
            const rfpValue = proposal.rfp?.estimatedValue ? Number(proposal.rfp.estimatedValue) : null;
            const contractDuration = proposal.rfp?.contractDuration;
            const contractYears = contractDuration ? parseInt(contractDuration) || 5 : 5;

            // Calculate derived metrics
            const totalContractGuarantee = mag && escalation != null
              ? Array.from({ length: contractYears }, (_, i) => mag * Math.pow(1 + escalation / 100, i)).reduce((s, v) => s + v, 0)
              : mag ? mag * contractYears : null;

            const yearlyGuarantees = mag && escalation != null
              ? Array.from({ length: contractYears }, (_, i) => ({
                  year: i + 1,
                  amount: mag * Math.pow(1 + escalation / 100, i),
                }))
              : mag ? Array.from({ length: contractYears }, (_, i) => ({ year: i + 1, amount: mag })) : [];

            const finalYearMAG = yearlyGuarantees.length > 0 ? yearlyGuarantees[yearlyGuarantees.length - 1].amount : null;
            const magGrowth = mag && finalYearMAG ? ((finalYearMAG - mag) / mag) * 100 : null;
            const magAsPercentOfValue = mag && rfpValue && rfpValue > 0 ? (mag / rfpValue) * 100 : null;

            const totalProfitShare = projections
              ? projections.reduce((s, r) => s + (r.profit_share_amount || 0), 0)
              : null;
            const totalToClient = projections
              ? projections.reduce((s, r) => s + (r.total_to_client || 0), 0)
              : null;

            const maxGuarantee = yearlyGuarantees.length > 0 ? Math.max(...yearlyGuarantees.map(y => y.amount)) : 0;

            return (
              <>
                {/* Top-level KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Landmark size={16} className="text-green-600" />
                      <p className="text-sm text-green-600 font-medium">Annual Guarantee (MAG)</p>
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {mag ? formatCurrency(mag) : 'N/A'}
                    </p>
                    {magAsPercentOfValue != null && (
                      <p className="text-xs text-green-600 mt-1">
                        {magAsPercentOfValue.toFixed(1)}% of estimated contract value
                      </p>
                    )}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Percent size={16} className="text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">Revenue Share</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-800">
                      {profitShare != null ? `${profitShare}%` : 'N/A'}
                    </p>
                    {totalProfitShare != null && totalProfitShare > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Est. total: {formatCurrency(totalProfitShare)} over {contractYears}yr
                      </p>
                    )}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-indigo-500">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpRight size={16} className="text-indigo-600" />
                      <p className="text-sm text-indigo-600 font-medium">Annual Escalation</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-800">
                      {escalation != null ? `${escalation}%` : 'N/A'}
                    </p>
                    {magGrowth != null && magGrowth > 0 && (
                      <p className="text-xs text-indigo-600 mt-1">
                        +{magGrowth.toFixed(1)}% MAG growth over contract
                      </p>
                    )}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={16} className="text-purple-600" />
                      <p className="text-sm text-purple-600 font-medium">Predicted Score</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-800">
                      {score ? `${score.toFixed(1)} / 100` : 'N/A'}
                    </p>
                    {score != null && (
                      <p className="text-xs text-purple-600 mt-1">
                        {score >= 80 ? 'Strong competitive position' : score >= 60 ? 'Moderate win probability' : 'Needs optimization'}
                      </p>
                    )}
                  </div>
                </div>

                {/* MAG Deep Dive */}
                {mag && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <DollarSign size={20} className="text-green-600" />
                      <h3 className="text-lg font-semibold">MAG Breakdown & Analysis</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Summary Metrics */}
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <PiggyBank size={16} className="text-gray-600" />
                            <p className="text-sm font-semibold text-gray-700">Contract Summary</p>
                          </div>
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Year 1 MAG</span>
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(mag)}</span>
                            </div>
                            {finalYearMAG && finalYearMAG !== mag && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Year {contractYears} MAG</span>
                                <span className="text-sm font-bold text-gray-900">{formatCurrency(finalYearMAG)}</span>
                              </div>
                            )}
                            {totalContractGuarantee && (
                              <>
                                <div className="border-t border-gray-200 my-1" />
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-gray-500">Total Guaranteed</span>
                                  <span className="text-sm font-bold text-green-700">{formatCurrency(totalContractGuarantee)}</span>
                                </div>
                              </>
                            )}
                            {totalToClient != null && totalToClient > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Total to Client (incl. share)</span>
                                <span className="text-sm font-bold text-blue-700">{formatCurrency(totalToClient)}</span>
                              </div>
                            )}
                            {rfpValue && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Est. Contract Value</span>
                                <span className="text-sm font-bold text-gray-700">{formatCurrency(rfpValue)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={14} className="text-green-600" />
                            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Contract Terms</p>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">Duration</span>
                              <span className="font-medium text-green-800">{contractDuration || `${contractYears} years`}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">Escalation</span>
                              <span className="font-medium text-green-800">{escalation != null ? `${escalation}% per year` : 'None'}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-green-600">Revenue Share</span>
                              <span className="font-medium text-green-800">{profitShare != null ? `${profitShare}%` : 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Center: Year-by-Year MAG Bar Chart */}
                      <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700">Year-by-Year MAG Trajectory</p>
                            {magGrowth != null && magGrowth > 0 && (
                              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                <TrendingUp size={10} /> +{magGrowth.toFixed(1)}% over contract
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {yearlyGuarantees.map(({ year, amount }) => {
                              const barPct = maxGuarantee > 0 ? (amount / maxGuarantee) * 100 : 0;
                              const growthFromY1 = mag ? ((amount - mag) / mag) * 100 : 0;
                              return (
                                <div key={year} className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-500 w-12">Year {year}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-7 relative overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-green-400 to-green-600"
                                      style={{ width: `${barPct}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-gray-800">
                                      {formatCurrency(amount)}
                                    </span>
                                  </div>
                                  {year > 1 && growthFromY1 > 0 && (
                                    <span className="text-xs text-green-600 font-medium w-14 text-right">+{growthFromY1.toFixed(1)}%</span>
                                  )}
                                  {year === 1 && (
                                    <span className="text-xs text-gray-400 font-medium w-14 text-right">Base</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Total bar */}
                          {totalContractGuarantee && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-700 w-12">TOTAL</span>
                                <div className="flex-1 bg-green-100 rounded-full h-7 relative overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-600 w-full" />
                                  <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white">
                                    {formatCurrency(totalContractGuarantee)}
                                  </span>
                                </div>
                                <span className="w-14" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Revenue Model Rationale */}
                {proposal.revenueModelRationale && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={18} className="text-amber-600" />
                      <h3 className="text-lg font-semibold">Revenue Model Rationale</h3>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{proposal.revenueModelRationale}</p>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* MAG Cost Breakdown */}
          {costBreakdown && costBreakdown.line_items && costBreakdown.line_items.length > 0 && (() => {
            const totalCost = costBreakdown.total_annual_cost || costBreakdown.line_items.reduce((s, li) => s + li.annual_cost, 0);
            const mag = proposal.recommendedFlatGuarantee ? Number(proposal.recommendedFlatGuarantee) : 0;
            const margin = mag > 0 && totalCost > 0 ? mag - totalCost : 0;
            const marginPct = costBreakdown.margin_percentage || (mag > 0 ? (margin / mag) * 100 : 0);

            const categoryColors = [
              { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500', light: 'text-blue-600' },
              { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500', light: 'text-emerald-600' },
              { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500', light: 'text-violet-600' },
              { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500', light: 'text-amber-600' },
              { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500', light: 'text-rose-600' },
              { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', bar: 'bg-cyan-500', light: 'text-cyan-600' },
              { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500', light: 'text-orange-600' },
              { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', bar: 'bg-indigo-500', light: 'text-indigo-600' },
            ];

            return (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-green-600" />
                    <h3 className="text-lg font-semibold">MAG Cost Breakdown</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Total Cost: <span className="font-bold text-gray-900">{formatCurrency(totalCost)}</span>
                    </span>
                    <span className="text-gray-500">
                      Margin: <span className="font-bold text-green-700">{formatCurrency(margin)} ({marginPct.toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>

                {/* Summary */}
                {costBreakdown.summary && (
                  <p className="text-sm text-gray-600 mb-5 bg-gray-50 rounded-lg p-3">{costBreakdown.summary}</p>
                )}

                {/* Visual distribution bar */}
                <div className="flex rounded-full overflow-hidden h-4 mb-4">
                  {costBreakdown.line_items.map((li, i) => {
                    const pct = totalCost > 0 ? (li.annual_cost / totalCost) * 100 : 0;
                    const color = categoryColors[i % categoryColors.length];
                    return (
                      <div
                        key={i}
                        className={`${color.bar} transition-all duration-300 ${i > 0 ? 'border-l border-white/30' : ''}`}
                        style={{ width: `${pct}%` }}
                        title={`${li.category}: ${formatCurrency(li.annual_cost)} (${pct.toFixed(1)}%)`}
                      />
                    );
                  })}
                  {margin > 0 && (
                    <div
                      className="bg-green-400 border-l border-white/30"
                      style={{ width: `${(margin / mag) * 100}%` }}
                      title={`Margin: ${formatCurrency(margin)} (${marginPct.toFixed(1)}%)`}
                    />
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
                  {costBreakdown.line_items.map((li, i) => {
                    const color = categoryColors[i % categoryColors.length];
                    return (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-2.5 h-2.5 rounded-full ${color.bar}`} />
                        {li.category}
                      </div>
                    );
                  })}
                  {margin > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      Profit Margin
                    </div>
                  )}
                </div>

                {/* Cost Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {costBreakdown.line_items.map((li, i) => {
                    const color = categoryColors[i % categoryColors.length];
                    const pct = totalCost > 0 ? (li.annual_cost / totalCost) * 100 : 0;

                    return (
                      <div key={i} className={`border rounded-xl overflow-hidden ${color.border}`}>
                        <div className={`${color.bg} p-4`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-semibold text-sm ${color.text}`}>{li.category}</span>
                            <span className={`text-xs font-bold ${color.text}`}>{pct.toFixed(1)}%</span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">{formatCurrency(li.annual_cost)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{li.description}</p>

                          {/* Progress bar within category */}
                          <div className="mt-2 bg-white/60 rounded-full h-1.5">
                            <div className={`${color.bar} h-full rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Sub-items */}
                        {li.sub_items && li.sub_items.length > 0 && (
                          <div className="p-3 bg-white space-y-1.5">
                            {li.sub_items.map((sub, si) => (
                              <div key={si} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{sub.item}</span>
                                <span className="font-medium text-gray-900">{formatCurrency(sub.cost)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Margin card */}
                  {margin > 0 && (
                    <div className="border rounded-xl overflow-hidden border-green-200">
                      <div className="bg-green-50 p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-green-700">Profit Margin</span>
                          <span className="text-xs font-bold text-green-700">{marginPct.toFixed(1)}%</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(margin)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Built into MAG to ensure sustainable operations and reinvestment</p>
                        <div className="mt-2 bg-white/60 rounded-full h-1.5">
                          <div className="bg-green-400 h-full rounded-full" style={{ width: `${marginPct}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* MAG Equation */}
                <div className="mt-5 bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-center gap-3 text-sm flex-wrap">
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Total Annual Cost</p>
                      <p className="font-bold text-gray-900">{formatCurrency(totalCost)}</p>
                    </div>
                    <span className="text-xl text-gray-400 font-light">+</span>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">Margin ({marginPct.toFixed(1)}%)</p>
                      <p className="font-bold text-green-700">{formatCurrency(margin)}</p>
                    </div>
                    <span className="text-xl text-gray-400 font-light">=</span>
                    <div className="text-center bg-green-100 rounded-lg px-4 py-2">
                      <p className="text-xs text-green-600 font-medium">Annual Guarantee (MAG)</p>
                      <p className="font-bold text-green-800 text-lg">{formatCurrency(mag)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Quick Preview of all sections */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Proposal Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectionConfig.map(({ key, title, icon: Icon }) => {
                const hasContent = !!(proposal as unknown as Record<string, unknown>)[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      hasContent ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className={hasContent ? 'text-green-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${hasContent ? 'text-green-800' : 'text-gray-500'}`}>
                      {title}
                    </span>
                    {hasContent && <CheckCircle size={14} className="text-green-500 ml-auto" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimization Notes */}
          {proposal.optimizationNotes && (
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">AI Optimization Notes</h3>
              <p className="text-amber-700 whitespace-pre-wrap">{proposal.optimizationNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {sectionConfig.map(({ key, title, icon: Icon }) => (
            <div key={key} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={18} className="text-blue-600" />
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <button
                  onClick={() => handleRegenerate(key)}
                  disabled={regeneratingKey === key}
                  className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 disabled:opacity-50 font-medium"
                >
                  <RefreshCw size={12} className={regeneratingKey === key ? 'animate-spin' : ''} />
                  {regeneratingKey === key ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
              <textarea
                value={editData[key] || ''}
                onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
                placeholder={`Enter ${title.toLowerCase()} content...`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Financial Projections Tab */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {projections && projections.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Year-Wise Financial Projections</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-blue-200">
                      <th className="text-left py-3 px-4 font-semibold text-blue-800">Year</th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-800">Guarantee</th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-800">Projected Revenue</th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-800">Profit Share</th>
                      <th className="text-right py-3 px-4 font-semibold text-blue-800">Total to Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((row) => (
                      <tr key={row.year} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">Year {row.year}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(row.guaranteed_amount)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(row.projected_revenue)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(row.profit_share_amount)}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(row.total_to_client)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-blue-200 bg-blue-50">
                      <td className="py-3 px-4 font-bold text-blue-800">TOTAL</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-800">
                        {formatCurrency(projections.reduce((s, r) => s + r.guaranteed_amount, 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-800">
                        {formatCurrency(projections.reduce((s, r) => s + r.projected_revenue, 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-800">
                        {formatCurrency(projections.reduce((s, r) => s + r.profit_share_amount, 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-blue-800">
                        {formatCurrency(projections.reduce((s, r) => s + r.total_to_client, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No financial projections available. Generate a new proposal to see projections.</p>
            </div>
          )}
        </div>
      )}

      {/* Scoring Strategy Tab */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          {scoring && scoring.length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">Total Score</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {scoring.reduce((s, item) => s + item.estimated_points, 0)} / {scoring.reduce((s, item) => s + item.max_points, 0)}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">Win Probability</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Math.round((scoring.reduce((s, i) => s + i.estimated_points, 0) / Math.max(scoring.reduce((s, i) => s + i.max_points, 0), 1)) * 100)}%
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">High Confidence</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {scoring.filter(i => i.confidence === 'high').length} / {scoring.length}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                  <p className="text-sm text-gray-500 mb-1">Improvement Areas</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {scoring.filter(i => (i.estimated_points / Math.max(i.max_points, 1)) < 0.8).length}
                  </p>
                </div>
              </div>

              {/* Scoring Breakdown */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-5">Scoring Breakdown</h3>
                <div className="space-y-4">
                  {scoring.map((item, i) => {
                    const pct = item.max_points > 0 ? (item.estimated_points / item.max_points) * 100 : 0;
                    const confidenceColor = item.confidence === 'high' ? 'bg-green-100 text-green-700' : item.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                    const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                    const hasRichData = item.evidence?.length > 0 || item.risk_factors?.length > 0 || item.improvement_actions?.length > 0 || item.competitor_comparison;

                    return (
                      <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <span className="font-semibold text-gray-900">{item.criterion}</span>
                              {item.confidence && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${confidenceColor}`}>
                                  {item.confidence}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-blue-700">
                              {item.estimated_points} / {item.max_points} pts
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600">{item.justification}</p>
                        </div>

                        {/* Rich Data Panels */}
                        {hasRichData && (
                          <div className="border-t border-gray-100 bg-gray-50 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Evidence */}
                            {item.evidence && item.evidence.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-green-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <CheckCircle size={13} className="text-green-600" />
                                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Evidence & Proof Points</span>
                                </div>
                                <ul className="space-y-1">
                                  {item.evidence.map((e, ei) => (
                                    <li key={ei} className="text-xs text-gray-700 flex gap-1.5">
                                      <span className="text-green-500 mt-0.5 flex-shrink-0">&#x2713;</span>
                                      {e}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Competitor Comparison */}
                            {item.competitor_comparison && (
                              <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Users size={13} className="text-blue-600" />
                                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">vs Competitors</span>
                                </div>
                                <p className="text-xs text-gray-700">{item.competitor_comparison}</p>
                              </div>
                            )}

                            {/* Risk Factors */}
                            {item.risk_factors && item.risk_factors.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-red-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <AlertTriangle size={13} className="text-red-500" />
                                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Risk Factors</span>
                                </div>
                                <ul className="space-y-1">
                                  {item.risk_factors.map((r, ri) => (
                                    <li key={ri} className="text-xs text-gray-700 flex gap-1.5">
                                      <span className="text-red-400 mt-0.5 flex-shrink-0">&#x26A0;</span>
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Improvement Actions */}
                            {item.improvement_actions && item.improvement_actions.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-amber-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <TrendingUp size={13} className="text-amber-600" />
                                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">To Improve Score</span>
                                </div>
                                <ul className="space-y-1">
                                  {item.improvement_actions.map((a, ai) => (
                                    <li key={ai} className="text-xs text-gray-700 flex gap-1.5">
                                      <span className="text-amber-500 mt-0.5 flex-shrink-0">&#x2794;</span>
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
              <Target size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No scoring breakdown available. Generate a new proposal to see scoring strategy.</p>
            </div>
          )}

          {proposal.optimizationNotes && (
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Optimization Strategy</h3>
              <p className="text-amber-700 whitespace-pre-wrap">{proposal.optimizationNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Zap, Users, Brain, Trash2, Plus, X, Shield, Target, ChevronDown, ChevronUp, Lightbulb, Trophy, Sparkles, Check, Loader2, ClipboardList, Filter } from 'lucide-react';
import { useRfpStore } from '../store/rfpStore';
import { rfpApi } from '../api/rfp.api';
import { proposalApi } from '../api/proposal.api';
import { competitorApi, SuggestedCompetitor } from '../api/competitor.api';
import { Proposal, Competitor, RfpRequirement } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  parsing: 'bg-yellow-100 text-yellow-700',
  analyzed: 'bg-blue-100 text-blue-700',
  proposal_draft: 'bg-purple-100 text-purple-700',
  submitted: 'bg-orange-100 text-orange-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export default function RfpDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentRfp, loading, fetchRfp, parseRfp } = useRfpStore();
  const [generating, setGenerating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [allCompetitors, setAllCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<string[]>([]);
  const [linkingCompetitors, setLinkingCompetitors] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);

  // AI Discovery state
  const [modalTab, setModalTab] = useState<'existing' | 'discover'>('discover');
  const [discovering, setDiscovering] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedCompetitor[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Map<number, string>>(new Map());

  // Requirements state
  const [extractingReqs, setExtractingReqs] = useState(false);
  const [reqFilter, setReqFilter] = useState<{ status: string; category: string }>({ status: 'all', category: 'all' });

  useEffect(() => {
    if (id) fetchRfp(id);
  }, [id, fetchRfp]);

  const handleParse = async () => {
    if (id) await parseRfp(id);
  };

  const handleAnalyzeScoring = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      await rfpApi.analyzeScoring(id);
      await fetchRfp(id);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { data } = await proposalApi.generate(id);
      navigate(`/rfps/${id}/proposals/${data.id}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenCompetitorModal = async () => {
    try {
      const { data } = await competitorApi.list();
      setAllCompetitors(data);
      const alreadyLinked = rfp?.rfpCompetitors?.map(rc => rc.competitorId) || [];
      setSelectedCompetitorIds(alreadyLinked);
      setSuggestions([]);
      setSelectedSuggestions(new Set());
      setAddedIds(new Map());
      setModalTab('discover');
      setShowCompetitorModal(true);
    } catch (err) {
      console.error('Failed to load competitors', err);
    }
  };

  const toggleCompetitor = (competitorId: string) => {
    setSelectedCompetitorIds(prev =>
      prev.includes(competitorId)
        ? prev.filter(id => id !== competitorId)
        : [...prev, competitorId]
    );
  };

  const handleLinkCompetitors = async () => {
    if (!id || selectedCompetitorIds.length === 0) return;
    setLinkingCompetitors(true);
    try {
      await competitorApi.linkToRfp(id, selectedCompetitorIds);
      await fetchRfp(id);
      setShowCompetitorModal(false);
    } catch (err) {
      console.error('Failed to link competitors', err);
    } finally {
      setLinkingCompetitors(false);
    }
  };

  const handleDiscover = async () => {
    if (!id) return;
    setDiscovering(true);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    setAddedIds(new Map());
    try {
      const { data } = await competitorApi.discoverForRfp(id);
      setSuggestions(data);
      // Auto-select all
      setSelectedSuggestions(new Set(data.map((_, i) => i)));
    } catch (err) {
      console.error('Failed to discover competitors', err);
    } finally {
      setDiscovering(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAddSelectedSuggestions = async () => {
    if (!id) return;
    const toAdd = [...selectedSuggestions].filter(i => !addedIds.has(i));
    const newIds: string[] = [];

    for (const idx of toAdd) {
      const s = suggestions[idx];
      setAddingIndex(idx);
      try {
        let compId: string;
        if (s.existingId) {
          compId = s.existingId;
        } else {
          const { data } = await competitorApi.addSuggested(id, {
            name: s.name,
            industries: s.industries,
            strengths: s.strengths,
            weaknesses: s.weaknesses,
            typicalBidStyle: s.typicalBidStyle,
          });
          compId = data.id;
        }
        newIds.push(compId);
        setAddedIds(prev => new Map(prev).set(idx, compId));
      } catch (err) {
        console.error(`Failed to add ${s.name}`, err);
      }
    }
    setAddingIndex(null);

    // Also include already-added ones
    const allIds = [...new Set([
      ...selectedCompetitorIds,
      ...newIds,
      ...[...addedIds.values()],
    ])];
    setSelectedCompetitorIds(allIds);

    // Refresh the competitor list
    const { data } = await competitorApi.list();
    setAllCompetitors(data);

    // Switch to existing tab to let user review & link
    setModalTab('existing');
  };

  const handleExtractRequirements = async () => {
    if (!id) return;
    setExtractingReqs(true);
    try {
      await rfpApi.extractRequirements(id);
      await fetchRfp(id);
    } finally {
      setExtractingReqs(false);
    }
  };

  const handleUpdateRequirement = async (reqId: string, data: { status?: string; notes?: string }) => {
    if (!id) return;
    await rfpApi.updateRequirement(id, reqId, data);
    await fetchRfp(id);
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this RFP?')) return;
    await rfpApi.delete(id);
    navigate('/rfps');
  };

  if (loading || !currentRfp) return <LoadingSpinner size="lg" />;

  const rfp = currentRfp;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{rfp.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[rfp.status] || 'bg-gray-100'}`}>
              {rfp.status.replace('_', ' ')}
            </span>
            {rfp.clientName && <span className="text-gray-500">{rfp.clientName}</span>}
            {rfp.industry && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm">{rfp.industry}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {rfp.status === 'draft' && (
            <button onClick={handleParse} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Brain size={18} /> Parse with AI
            </button>
          )}
          {rfp.status === 'analyzed' && (
            <>
              <button
                onClick={handleAnalyzeScoring}
                disabled={analyzing}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Zap size={18} /> {analyzing ? 'Analyzing...' : 'Analyze Scoring'}
              </button>
              <button
                onClick={handleGenerateProposal}
                disabled={generating}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <FileText size={18} /> {generating ? 'Generating...' : 'Generate Proposal'}
              </button>
            </>
          )}
          <button onClick={handleDelete} className="flex items-center gap-2 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFP Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">RFP Details</h3>
            <dl className="grid grid-cols-2 gap-4">
              {[
                ['Client', rfp.clientName],
                ['Industry', rfp.industry],
                ['Location', rfp.location],
                ['Contract Duration', rfp.contractDuration],
                ['Estimated Value', rfp.estimatedValue ? `$${Number(rfp.estimatedValue).toLocaleString()}` : null],
                ['Deadline', rfp.submissionDeadline ? new Date(rfp.submissionDeadline).toLocaleDateString() : null],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-sm text-gray-500">{label}</dt>
                  <dd className="text-gray-900 font-medium">{value || 'Not specified'}</dd>
                </div>
              ))}
            </dl>
            {rfp.projectScope && (
              <div className="mt-4">
                <dt className="text-sm text-gray-500">Project Scope</dt>
                <dd className="text-gray-900 mt-1 whitespace-pre-wrap">{rfp.projectScope}</dd>
              </div>
            )}
          </div>

          {/* Scoring Criteria */}
          {rfp.scoringCriteria && rfp.scoringCriteria.length > 0 && (() => {
            const totalPoints = rfp.scoringCriteria.reduce((sum, c) => sum + (c.maxPoints ?? 0), 0);
            const hasAnyStrategy = rfp.scoringCriteria.some(c => c.aiStrategy);
            const barColors = [
              'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
              'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500',
            ];
            const lightColors = [
              'bg-blue-50 border-blue-200', 'bg-emerald-50 border-emerald-200', 'bg-violet-50 border-violet-200', 'bg-amber-50 border-amber-200',
              'bg-rose-50 border-rose-200', 'bg-cyan-50 border-cyan-200', 'bg-orange-50 border-orange-200', 'bg-indigo-50 border-indigo-200',
            ];
            const textColors = [
              'text-blue-700', 'text-emerald-700', 'text-violet-700', 'text-amber-700',
              'text-rose-700', 'text-cyan-700', 'text-orange-700', 'text-indigo-700',
            ];

            return (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Target size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold">Scoring Criteria</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Trophy size={14} />
                      <span className="font-semibold text-gray-900">{totalPoints}</span> total points
                    </div>
                    {rfp.status === 'analyzed' && !hasAnyStrategy && (
                      <button
                        onClick={handleAnalyzeScoring}
                        disabled={analyzing}
                        className="flex items-center gap-1.5 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 disabled:opacity-50 font-medium"
                      >
                        <Zap size={12} /> {analyzing ? 'Analyzing...' : 'Get AI Strategies'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Points distribution bar */}
                <div className="flex rounded-full overflow-hidden h-3 mb-1">
                  {rfp.scoringCriteria.map((c, i) => {
                    const pct = totalPoints > 0 ? ((c.maxPoints ?? 0) / totalPoints) * 100 : 0;
                    return (
                      <div
                        key={c.id}
                        className={`${barColors[i % barColors.length]} transition-all duration-300 ${i > 0 ? 'border-l border-white/30' : ''}`}
                        style={{ width: `${pct}%` }}
                        title={`${c.criterionName}: ${c.maxPoints} pts (${Number(c.weightPct || pct).toFixed(0)}%)`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
                  {rfp.scoringCriteria.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${barColors[i % barColors.length]}`} />
                      {c.criterionName}
                    </div>
                  ))}
                </div>

                {/* Criteria cards */}
                <div className="space-y-3">
                  {rfp.scoringCriteria.map((c, i) => {
                    const pct = totalPoints > 0 ? ((c.maxPoints ?? 0) / totalPoints) * 100 : 0;
                    const isExpanded = expandedCriteria === c.id;
                    const hasStrategy = !!c.aiStrategy;

                    return (
                      <div
                        key={c.id}
                        className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                          isExpanded ? lightColors[i % lightColors.length] : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedCriteria(isExpanded ? null : c.id)}
                          className="w-full text-left p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5">
                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg ${barColors[i % barColors.length]} text-white text-sm font-bold flex items-center justify-center`}>
                                  {c.maxPoints ?? 0}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-semibold text-gray-900">{c.criterionName}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {c.weightPct ? `${Number(c.weightPct).toFixed(0)}% weight` : `${pct.toFixed(0)}% of total`}
                                    {c.maxPoints != null && ` · ${c.maxPoints} points`}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasStrategy && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <Lightbulb size={10} /> Strategy
                                </span>
                              )}
                              {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`${barColors[i % barColors.length]} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${textColors[i % textColors.length]}`}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3">
                            {c.description && (
                              <div className="bg-white/70 rounded-lg p-3">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</div>
                                <p className="text-sm text-gray-700 leading-relaxed">{c.description}</p>
                              </div>
                            )}
                            {c.aiStrategy && (
                              <div className="bg-white/70 rounded-lg p-3 border border-green-200">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Lightbulb size={12} className="text-green-600" />
                                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">AI Recommended Strategy</span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{c.aiStrategy}</p>
                              </div>
                            )}
                            {!c.description && !c.aiStrategy && (
                              <p className="text-sm text-gray-400 italic">No additional details available.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {/* Requirements Checklist */}
          {rfp.status !== 'draft' && (() => {
            const requirements = rfp.requirements || [];
            const categories = [...new Set(requirements.map(r => r.category).filter(Boolean))] as string[];
            const filtered = requirements.filter(r => {
              if (reqFilter.status !== 'all' && r.status !== reqFilter.status) return false;
              if (reqFilter.category !== 'all' && r.category !== reqFilter.category) return false;
              return true;
            });
            const completedCount = requirements.filter(r => r.status === 'met').length;
            const totalCount = requirements.length;

            const statusOptions = [
              { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
              { value: 'met', label: 'Met', color: 'bg-green-100 text-green-700' },
              { value: 'partial', label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
              { value: 'not_met', label: 'Not Met', color: 'bg-red-100 text-red-700' },
              { value: 'not_applicable', label: 'N/A', color: 'bg-gray-100 text-gray-500' },
            ];

            const priorityColor = (p: string) =>
              p === 'high' ? 'bg-red-100 text-red-700' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';

            return (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={20} className="text-indigo-600" />
                    <h3 className="text-lg font-semibold">Requirements Checklist</h3>
                    {totalCount > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        {completedCount}/{totalCount} met
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleExtractRequirements}
                    disabled={extractingReqs}
                    className="flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-200 disabled:opacity-50 font-medium"
                  >
                    {extractingReqs ? (
                      <><Loader2 size={12} className="animate-spin" /> Extracting...</>
                    ) : (
                      <><Brain size={12} /> {totalCount > 0 ? 'Re-extract' : 'Extract Requirements'}</>
                    )}
                  </button>
                </div>

                {totalCount > 0 && (
                  <>
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex rounded-full overflow-hidden h-2 bg-gray-100">
                        <div
                          className="bg-green-500 transition-all duration-300"
                          style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-yellow-400 transition-all duration-300"
                          style={{ width: `${totalCount > 0 ? (requirements.filter(r => r.status === 'partial').length / totalCount) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Filter size={14} className="text-gray-400" />
                        <select
                          value={reqFilter.status}
                          onChange={(e) => setReqFilter(f => ({ ...f, status: e.target.value }))}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                        >
                          <option value="all">All Status</option>
                          {statusOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <select
                        value={reqFilter.category}
                        onChange={(e) => setReqFilter(f => ({ ...f, category: e.target.value }))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Requirements list */}
                    <div className="space-y-2">
                      {filtered.map((req) => (
                        <div key={req.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <select
                              value={req.status}
                              onChange={(e) => handleUpdateRequirement(req.id, { status: e.target.value })}
                              className={`text-xs font-medium rounded-lg px-2 py-1 border-0 cursor-pointer ${
                                statusOptions.find(s => s.value === req.status)?.color || 'bg-gray-100'
                              }`}
                            >
                              {statusOptions.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{req.requirement}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                {req.category && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{req.category}</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColor(req.priority)}`}>
                                  {req.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filtered.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">No requirements match the selected filters.</p>
                    )}
                  </>
                )}

                {totalCount === 0 && !extractingReqs && (
                  <div className="text-center py-8">
                    <ClipboardList size={40} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No requirements extracted yet. Click "Extract Requirements" to analyze the RFP.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Competitors */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Competitors</h3>
              <button
                onClick={handleOpenCompetitorModal}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus size={16} /> {rfp.rfpCompetitors?.length ? 'Edit' : 'Add'}
              </button>
            </div>
            {rfp.rfpCompetitors && rfp.rfpCompetitors.length > 0 ? (
              <div className="space-y-3">
                {rfp.rfpCompetitors.map((rc) => (
                  <div key={rc.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{rc.competitor.name}</div>
                      {rc.threatLevel && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          rc.threatLevel === 'high' ? 'bg-red-100 text-red-700' :
                          rc.threatLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rc.threatLevel} threat
                        </span>
                      )}
                    </div>
                    {rc.expectedStrategy && (
                      <p className="text-sm text-gray-500 mt-2">{rc.expectedStrategy}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Shield size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm mb-3">No competitors linked yet.</p>
                <button
                  onClick={handleOpenCompetitorModal}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Discover Competitors
                </button>
              </div>
            )}
          </div>

          {/* Competitor Modal */}
          {showCompetitorModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b">
                  <h3 className="text-lg font-semibold">Manage Competitors</h3>
                  <button onClick={() => setShowCompetitorModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                  <button
                    onClick={() => setModalTab('discover')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      modalTab === 'discover'
                        ? 'border-purple-600 text-purple-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Sparkles size={16} /> AI Discovery
                  </button>
                  <button
                    onClick={() => setModalTab('existing')}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                      modalTab === 'existing'
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users size={16} /> Existing ({allCompetitors.length})
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {modalTab === 'discover' ? (
                    <div>
                      {suggestions.length === 0 && !discovering && (
                        <div className="text-center py-10">
                          <Sparkles size={40} className="mx-auto text-purple-300 mb-3" />
                          <h4 className="font-semibold text-gray-900 mb-1">AI Competitor Discovery</h4>
                          <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                            Let AI analyze this RFP and suggest real companies that would likely compete for this project.
                          </p>
                          <button
                            onClick={handleDiscover}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                          >
                            <Sparkles size={16} /> Discover Competitors
                          </button>
                        </div>
                      )}

                      {discovering && (
                        <div className="text-center py-10">
                          <Loader2 size={32} className="mx-auto text-purple-500 mb-3 animate-spin" />
                          <p className="text-sm text-gray-600">Analyzing RFP and identifying potential competitors...</p>
                        </div>
                      )}

                      {suggestions.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-500">
                              Found <span className="font-semibold text-gray-900">{suggestions.length}</span> potential competitors
                            </p>
                            <button
                              onClick={handleDiscover}
                              disabled={discovering}
                              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                            >
                              Re-discover
                            </button>
                          </div>
                          <div className="space-y-2">
                            {suggestions.map((s, idx) => {
                              const isSelected = selectedSuggestions.has(idx);
                              const isAdded = addedIds.has(idx);
                              const isAdding = addingIndex === idx;

                              return (
                                <div
                                  key={idx}
                                  className={`border rounded-lg p-3 transition-colors ${
                                    isAdded
                                      ? 'border-green-300 bg-green-50'
                                      : isSelected
                                      ? 'border-purple-300 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected || isAdded}
                                      onChange={() => !isAdded && toggleSuggestion(idx)}
                                      disabled={isAdded}
                                      className="mt-1 h-4 w-4 text-purple-600 rounded border-gray-300"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-gray-900">{s.name}</span>
                                        {s.existingId && (
                                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">in DB</span>
                                        )}
                                        {s.isNew && (
                                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">new</span>
                                        )}
                                        {isAdded && (
                                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                            <Check size={10} /> added
                                          </span>
                                        )}
                                        {isAdding && (
                                          <Loader2 size={12} className="text-purple-500 animate-spin" />
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {s.industries.map(ind => (
                                          <span key={ind} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ind}</span>
                                        ))}
                                      </div>
                                      <p className="text-xs text-purple-600 mt-1">{s.relevance_reason}</p>
                                      <p className="text-xs text-gray-500 mt-0.5">{s.strengths}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {rfp.industry && (
                        <p className="text-sm text-gray-500 mb-3">
                          Showing competitors relevant to <span className="font-medium text-gray-700">{rfp.industry}</span> industry. AI will analyze their strategy against this RFP.
                        </p>
                      )}
                      <div className="space-y-2">
                        {[...allCompetitors]
                          .sort((a, b) => {
                            const aMatch = rfp.industry && a.industries?.includes(rfp.industry) ? 0 : 1;
                            const bMatch = rfp.industry && b.industries?.includes(rfp.industry) ? 0 : 1;
                            return aMatch - bMatch || a.name.localeCompare(b.name);
                          })
                          .map((comp) => {
                            const isIndustryMatch = rfp.industry && comp.industries?.includes(rfp.industry);
                            const isSelected = selectedCompetitorIds.includes(comp.id);
                            return (
                              <label
                                key={comp.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                  isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCompetitor(comp.id)}
                                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{comp.name}</span>
                                    {isIndustryMatch && (
                                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">match</span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {comp.industries?.map(ind => (
                                      <span key={ind} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{ind}</span>
                                    ))}
                                  </div>
                                  {comp.strengths && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{comp.strengths}</p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t bg-gray-50 rounded-b-xl">
                  <span className="text-sm text-gray-500">
                    {modalTab === 'discover'
                      ? `${selectedSuggestions.size} suggestions selected`
                      : `${selectedCompetitorIds.length} competitors selected`
                    }
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCompetitorModal(false)}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    {modalTab === 'discover' ? (
                      <button
                        onClick={handleAddSelectedSuggestions}
                        disabled={selectedSuggestions.size === 0 || addingIndex !== null}
                        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {addingIndex !== null ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus size={16} /> Add to DB & Select
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleLinkCompetitors}
                        disabled={linkingCompetitors || selectedCompetitorIds.length === 0}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {linkingCompetitors ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain size={16} /> Analyze & Link
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proposals */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Proposals</h3>
            {rfp.proposals && rfp.proposals.length > 0 ? (
              <div className="space-y-2">
                {rfp.proposals.map((p: Proposal) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/rfps/${rfp.id}/proposals/${p.id}`)}
                    className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Version {p.version}</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{p.status}</span>
                    </div>
                    {p.predictedScore && (
                      <p className="text-sm text-gray-500 mt-1">Predicted Score: {Number(p.predictedScore).toFixed(1)}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No proposals generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

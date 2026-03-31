import { useEffect, useState } from 'react';
import { FileText, Trophy, XCircle, TrendingUp, Clock, Users, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import api from '../api/client';
import { DashboardStats, PipelineItem, IndustryWinRate, ScoreTrend, TopCompetitor, RecentActivity } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

const activityIcons: Record<string, typeof FileText> = {
  rfp_created: FileText,
  rfp_parsed: Zap,
  proposal_generated: Trophy,
  competitor_added: Users,
};

const activityColors: Record<string, string> = {
  rfp_created: 'bg-blue-100 text-blue-600',
  rfp_parsed: 'bg-purple-100 text-purple-600',
  proposal_generated: 'bg-green-100 text-green-600',
  competitor_added: 'bg-amber-100 text-amber-600',
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [industryStats, setIndustryStats] = useState<IndustryWinRate[]>([]);
  const [scoreTrends, setScoreTrends] = useState<ScoreTrend[]>([]);
  const [topCompetitors, setTopCompetitors] = useState<TopCompetitor[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/dashboard/stats'),
      api.get<PipelineItem[]>('/dashboard/pipeline'),
      api.get<IndustryWinRate[]>('/dashboard/industry-stats'),
      api.get<ScoreTrend[]>('/dashboard/score-trends'),
      api.get<TopCompetitor[]>('/dashboard/top-competitors'),
      api.get<RecentActivity[]>('/dashboard/recent-activity'),
    ]).then(([statsRes, pipelineRes, industryRes, scoreRes, compRes, activityRes]) => {
      setStats(statsRes.data);
      setPipeline(pipelineRes.data);
      setIndustryStats(industryRes.data);
      setScoreTrends(scoreRes.data);
      setTopCompetitors(compRes.data);
      setRecentActivity(activityRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const statCards = [
    { label: 'Total RFPs', value: stats?.totalRfps ?? 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Won Bids', value: stats?.wonBids ?? 0, icon: Trophy, color: 'bg-green-500' },
    { label: 'Lost Bids', value: stats?.lostBids ?? 0, icon: XCircle, color: 'bg-red-500' },
    { label: 'Win Rate', value: `${stats?.winRate ?? 0}%`, icon: TrendingUp, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
              </div>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Pipeline + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">RFP Pipeline</h3>
          {pipeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data yet. Upload your first RFP to get started.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          {pipeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pipeline}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ status, count }) => `${status} (${count})`}
                >
                  {pipeline.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No data yet.</p>
          )}
        </div>
      </div>

      {/* Row 2: Industry Win Rate + Score Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Win Rate by Industry</h3>
          {industryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={industryStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis type="category" dataKey="industry" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Win Rate']} />
                <Legend />
                <Bar dataKey="winRate" name="Win Rate %" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No industry data available yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Proposal Score Trends</h3>
          {scoreTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={scoreTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  name="Avg Score"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No score data available yet.</p>
          )}
        </div>
      </div>

      {/* Row 3: Top Competitors + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top Competitors</h3>
          {topCompetitors.length > 0 ? (
            <div className="space-y-3">
              {topCompetitors.map((comp, i) => {
                const maxEnc = topCompetitors[0].encounters;
                const barWidth = maxEnc > 0 ? (comp.encounters / maxEnc) * 100 : 0;
                const threatColor = comp.threatLevel === 'high'
                  ? 'bg-red-100 text-red-700'
                  : comp.threatLevel === 'medium'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-green-100 text-green-700';

                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-32 truncate">{comp.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                        {comp.encounters} RFPs
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${threatColor}`}>
                      {comp.threatLevel}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No competitor data yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-gray-400" />
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type] || FileText;
                const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-600';
                return (
                  <div key={activity.id + activity.timestamp} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${colorClass}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.detail}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(activity.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Clock } from 'lucide-react';
import { useRfpStore } from '../store/rfpStore';
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

export default function RfpListPage() {
  const { rfps, loading, fetchRfps } = useRfpStore();

  useEffect(() => {
    fetchRfps();
  }, [fetchRfps]);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">RFPs</h2>
        <Link
          to="/rfps/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} /> Upload RFP
        </Link>
      </div>

      {rfps.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No RFPs yet</h3>
          <p className="text-gray-500 mt-1">Upload your first RFP document to get started.</p>
          <Link
            to="/rfps/new"
            className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} /> Upload RFP
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {rfps.map((rfp) => (
            <Link
              key={rfp.id}
              to={`/rfps/${rfp.id}`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{rfp.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {rfp.clientName && <span>{rfp.clientName}</span>}
                    {rfp.industry && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{rfp.industry}</span>
                    )}
                    {rfp.estimatedValue && (
                      <span>${Number(rfp.estimatedValue).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock size={14} />
                    <span>{new Date(rfp.createdAt).toLocaleDateString()}</span>
                    {rfp._count?.proposals !== undefined && (
                      <span>| {rfp._count.proposals} proposal(s)</span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[rfp.status] || 'bg-gray-100'}`}>
                  {rfp.status.replace('_', ' ')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

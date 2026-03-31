import { useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { historicalApi } from '../api/historical.api';
import { HistoricalBid } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function HistoricalDataPage() {
  const [bids, setBids] = useState<HistoricalBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rfpTitle: '', clientName: '', industry: '', year: new Date().getFullYear(),
    bidderName: '', isOurBid: true, flatGuarantee: '', profitSharePct: '',
    outcome: '', winningBidSummary: '', scoreReceived: '', lessonsLearned: '',
  });

  const fetchBids = async () => {
    const { data } = await historicalApi.list();
    setBids(data);
    setLoading(false);
  };

  useEffect(() => { fetchBids(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await historicalApi.create({
      ...form,
      flatGuarantee: form.flatGuarantee ? Number(form.flatGuarantee) : undefined,
      profitSharePct: form.profitSharePct ? Number(form.profitSharePct) : undefined,
      scoreReceived: form.scoreReceived ? Number(form.scoreReceived) : undefined,
    });
    setShowForm(false);
    setForm({
      rfpTitle: '', clientName: '', industry: '', year: new Date().getFullYear(),
      bidderName: '', isOurBid: true, flatGuarantee: '', profitSharePct: '',
      outcome: '', winningBidSummary: '', scoreReceived: '', lessonsLearned: '',
    });
    fetchBids();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bid record?')) return;
    await historicalApi.delete(id);
    fetchBids();
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Historical Bids</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Bid Record
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Historical Bid</h3>
            <button onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RFP Title</label>
              <input value={form.rfpTitle} onChange={(e) => setForm({ ...form, rfpTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bidder Name</label>
              <input value={form.bidderName} onChange={(e) => setForm({ ...form, bidderName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Our Bid?</label>
              <select value={form.isOurBid ? 'yes' : 'no'}
                onChange={(e) => setForm({ ...form, isOurBid: e.target.value === 'yes' })}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="yes">Yes - Our Company</option>
                <option value="no">No - Competitor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flat Guarantee ($)</label>
              <input type="number" value={form.flatGuarantee}
                onChange={(e) => setForm({ ...form, flatGuarantee: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profit Share (%)</label>
              <input type="number" step="0.1" value={form.profitSharePct}
                onChange={(e) => setForm({ ...form, profitSharePct: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select...</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Score Received</label>
              <input type="number" step="0.1" value={form.scoreReceived}
                onChange={(e) => setForm({ ...form, scoreReceived: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Lessons Learned</label>
              <textarea value={form.lessonsLearned}
                onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" rows={2} />
            </div>
            <div className="md:col-span-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </form>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No historical bids recorded yet. Add past bid data to improve AI proposal generation.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm text-gray-500">
                <th className="px-6 py-3">RFP Title</th>
                <th className="px-6 py-3">Industry</th>
                <th className="px-6 py-3">Year</th>
                <th className="px-6 py-3">Bidder</th>
                <th className="px-6 py-3">Guarantee</th>
                <th className="px-6 py-3">Share %</th>
                <th className="px-6 py-3">Outcome</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{b.rfpTitle || '-'}</td>
                  <td className="px-6 py-4">{b.industry || '-'}</td>
                  <td className="px-6 py-4">{b.year || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={b.isOurBid ? 'text-blue-600 font-medium' : ''}>{b.bidderName || '-'}</span>
                  </td>
                  <td className="px-6 py-4">{b.flatGuarantee ? `$${Number(b.flatGuarantee).toLocaleString()}` : '-'}</td>
                  <td className="px-6 py-4">{b.profitSharePct ? `${b.profitSharePct}%` : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.outcome === 'won' ? 'bg-green-100 text-green-700' :
                      b.outcome === 'lost' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {b.outcome || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { competitorApi } from '../api/competitor.api';
import { Competitor } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [form, setForm] = useState({
    name: '', industries: '', strengths: '', weaknesses: '', typicalBidStyle: '', notes: '',
  });

  const fetchCompetitors = async () => {
    const { data } = await competitorApi.list();
    setCompetitors(data);
    setLoading(false);
  };

  useEffect(() => { fetchCompetitors(); }, []);

  const resetForm = () => {
    setForm({ name: '', industries: '', strengths: '', weaknesses: '', typicalBidStyle: '', notes: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      industries: form.industries.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editing) {
      await competitorApi.update(editing.id, payload);
    } else {
      await competitorApi.create(payload);
    }
    resetForm();
    fetchCompetitors();
  };

  const handleEdit = (c: Competitor) => {
    setForm({
      name: c.name,
      industries: c.industries.join(', '),
      strengths: c.strengths || '',
      weaknesses: c.weaknesses || '',
      typicalBidStyle: c.typicalBidStyle || '',
      notes: c.notes || '',
    });
    setEditing(c);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this competitor?')) return;
    await competitorApi.delete(id);
    fetchCompetitors();
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Competitors</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Competitor
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'Add'} Competitor</h3>
            <button onClick={resetForm}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industries (comma-separated)</label>
              <input
                value={form.industries} onChange={(e) => setForm({ ...form, industries: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" placeholder="airport, construction, logistics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
              <textarea
                value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weaknesses</label>
              <textarea
                value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" rows={3}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Typical Bid Style</label>
              <textarea
                value={form.typicalBidStyle} onChange={(e) => setForm({ ...form, typicalBidStyle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg" rows={2}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Competitor List */}
      {competitors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No competitors added yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {competitors.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <div className="flex gap-2 mt-1">
                    {c.industries.map((ind) => (
                      <span key={ind} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{ind}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                {c.strengths && <div><span className="text-gray-500">Strengths: </span><span>{c.strengths}</span></div>}
                {c.weaknesses && <div><span className="text-gray-500">Weaknesses: </span><span>{c.weaknesses}</span></div>}
              </div>
              {c.typicalBidStyle && <p className="text-sm text-gray-600 mt-2">Bid style: {c.typicalBidStyle}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

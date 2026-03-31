import { useEffect, useState } from 'react';
import { Building2, Save, Plus, X, Award, Shield, MapPin, Briefcase, TrendingUp, Target } from 'lucide-react';
import { companyProfileApi } from '../api/companyProfile.api';
import { CompanyProfile } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';

const emptyProfile: Partial<CompanyProfile> = {
  companyName: '',
  tagline: '',
  foundedYear: undefined,
  headquarters: '',
  employeeCount: undefined,
  annualRevenue: '',
  industries: [],
  certifications: [],
  awards: [],
  keyClients: [],
  officeLocations: [],
  safetyRecord: '',
  insuranceCoverage: '',
  keyMetrics: {},
  slaDefaults: {},
  differentiators: {},
};

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInput('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-2.5 py-1 rounded-lg">
            {tag}
            <button onClick={() => onChange(values.filter(v => v !== tag))} className="hover:text-blue-900">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function KeyValueEditor({ data, onChange, keyPlaceholder, valuePlaceholder }: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addEntry = () => {
    const k = newKey.trim();
    const v = newValue.trim();
    if (k && v) {
      onChange({ ...data, [k]: isNaN(Number(v)) ? v : Number(v) });
      setNewKey('');
      setNewValue('');
    }
  };

  const entries = Object.entries(data);

  return (
    <div className="space-y-2">
      {entries.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          {entries.map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{String(val)}</span>
                <button
                  onClick={() => { const copy = { ...data }; delete copy[key]; onChange(copy); }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={keyPlaceholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEntry())}
          placeholder={valuePlaceholder}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button onClick={addEntry} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<Partial<CompanyProfile>>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await companyProfileApi.get();
      if (data) setProfile(data);
    } catch {
      // No profile yet, use empty
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.companyName) return;
    setSaving(true);
    try {
      const { data } = await companyProfileApi.save(profile);
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Building2 size={28} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
          </div>
          <p className="text-gray-500 mt-1 ml-10">This data is automatically used by AI when generating proposals — fill in once, reuse everywhere.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !profile.companyName}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          <Save size={18} />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-gray-500" /> Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                value={profile.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                placeholder="e.g., Acme Infrastructure Solutions Pvt Ltd"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline / Mission</label>
              <input
                value={profile.tagline || ''}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="e.g., Building India's future with innovation and integrity"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
              <input
                type="number"
                value={profile.foundedYear || ''}
                onChange={(e) => updateField('foundedYear', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 2005"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters</label>
              <input
                value={profile.headquarters || ''}
                onChange={(e) => updateField('headquarters', e.target.value)}
                placeholder="e.g., Mumbai, Maharashtra, India"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
              <input
                type="number"
                value={profile.employeeCount || ''}
                onChange={(e) => updateField('employeeCount', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="e.g., 5000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue</label>
              <input
                value={profile.annualRevenue || ''}
                onChange={(e) => updateField('annualRevenue', e.target.value)}
                placeholder="e.g., INR 2,500 Crores ($300M USD)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Industries & Locations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-gray-500" /> Industries & Presence
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industries Served</label>
              <TagInput
                values={profile.industries || []}
                onChange={(v) => updateField('industries', v)}
                placeholder="Add industry (e.g., airport, healthcare, construction)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office Locations</label>
              <TagInput
                values={profile.officeLocations || []}
                onChange={(v) => updateField('officeLocations', v)}
                placeholder="Add location (e.g., Mumbai, Delhi, Chennai)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Clients</label>
              <TagInput
                values={profile.keyClients || []}
                onChange={(v) => updateField('keyClients', v)}
                placeholder="Add client name (e.g., AAI, Reliance, Flipkart)"
              />
            </div>
          </div>
        </div>

        {/* Certifications & Awards */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award size={18} className="text-gray-500" /> Certifications & Awards
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
              <TagInput
                values={profile.certifications || []}
                onChange={(v) => updateField('certifications', v)}
                placeholder="Add certification (e.g., ISO 27001, CMMI Level 5, LEED AP)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Awards & Recognition</label>
              <TagInput
                values={profile.awards || []}
                onChange={(v) => updateField('awards', v)}
                placeholder="Add award (e.g., Best Infrastructure Company 2025)"
              />
            </div>
          </div>
        </div>

        {/* Safety & Insurance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield size={18} className="text-gray-500" /> Safety & Compliance
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Safety Record</label>
              <textarea
                value={profile.safetyRecord || ''}
                onChange={(e) => updateField('safetyRecord', e.target.value)}
                placeholder="e.g., Zero fatalities across 15 years of operation. LTIFR of 0.12. ISO 45001 certified since 2018."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance & Bonding</label>
              <textarea
                value={profile.insuranceCoverage || ''}
                onChange={(e) => updateField('insuranceCoverage', e.target.value)}
                placeholder="e.g., Professional Liability $50M, General Liability $25M, Performance Bond capacity $200M"
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-gray-500" /> Key Performance Metrics
          </h3>
          <p className="text-sm text-gray-500 mb-4">Numbers the AI will cite as proof points in proposals. Use snake_case keys.</p>
          <KeyValueEditor
            data={(profile.keyMetrics as Record<string, unknown>) || {}}
            onChange={(d) => updateField('keyMetrics', d)}
            keyPlaceholder="e.g., projects_completed"
            valuePlaceholder="e.g., 150"
          />
        </div>

        {/* SLA Defaults */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Shield size={18} className="text-gray-500" /> Standard SLA Commitments
          </h3>
          <p className="text-sm text-gray-500 mb-4">Default SLA values the AI will propose in contracts.</p>
          <KeyValueEditor
            data={(profile.slaDefaults as Record<string, unknown>) || {}}
            onChange={(d) => updateField('slaDefaults', d)}
            keyPlaceholder="e.g., system_uptime_pct"
            valuePlaceholder="e.g., 99.9"
          />
        </div>

        {/* Differentiators */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Target size={18} className="text-gray-500" /> Key Differentiators
          </h3>
          <p className="text-sm text-gray-500 mb-4">What makes you unique — the AI will weave these into proposal narratives.</p>
          <KeyValueEditor
            data={(profile.differentiators as Record<string, unknown>) || {}}
            onChange={(d) => updateField('differentiators', d)}
            keyPlaceholder="e.g., ai_powered_analytics"
            valuePlaceholder="e.g., Proprietary AI platform processing 8.5M data points/day"
          />
        </div>
      </div>
    </div>
  );
}

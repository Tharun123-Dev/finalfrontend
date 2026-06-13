/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Landmark, Compass } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface BranchFormState {
  name: string;
  latitude: number | '';
  longitude: number | '';
  radiusMeters: number;
  trackingIntervalSec: number;
  maxAccuracyMeters: number;
  maxIdleMinutes: number;
}

const EMPTY_FORM: BranchFormState = {
  name: '',
  latitude: '',
  longitude: '',
  radiusMeters: 30,
  trackingIntervalSec: 300,
  maxAccuracyMeters: 100,
  maxIdleMinutes: 30,
};

export default function BranchForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const fetchBranch = async () => {
      try {
        const res = await rolesApi.get<any[]>('/office-locations');
        const b = res.data.find((x) => String(x.id) === String(id));
        if (b) {
          setForm({
            name: b.name,
            latitude: b.latitude,
            longitude: b.longitude,
            radiusMeters: b.radiusMeters,
            trackingIntervalSec: b.trackingIntervalSec,
            maxAccuracyMeters: b.maxAccuracyMeters,
            maxIdleMinutes: b.maxIdleMinutes,
          });
        } else {
          setError('Branch not found.');
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load branch details.');
      } finally {
        setFetching(false);
      }
    };
    fetchBranch();
  }, [id, isEdit]);

  const upd = (k: keyof BranchFormState, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isEdit) {
        await rolesApi.put(`/office-locations/${id}`, form);
      } else {
        await rolesApi.post('/office-locations', form);
      }
      setSuccess(isEdit ? 'Branch updated.' : 'Branch created.');
      setTimeout(() => navigate('/hrms/branches'), 900);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save branch.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <EntityFormPage
      title={isEdit ? 'Edit Branch' : 'Create Branch'}
      subtitle="Branches"
      backRoute="/hrms/branches"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save Changes' : 'Create Branch'}
      loading={loading}
      error={error}
      success={success}
    >
      <div className="space-y-6 text-xs">
        {/* Section: Location Details */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-4 h-4" /> Location Details
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Head Office"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.name}
                onChange={(e) => upd('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Latitude *</label>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  placeholder="e.g. 28.6139"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.latitude}
                  onChange={(e) => upd('latitude', e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Longitude *</label>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  placeholder="e.g. 77.2090"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={form.longitude}
                  onChange={(e) => upd('longitude', e.target.value === '' ? '' : parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Geofencing & Tracking */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4" /> Geofencing & Tracking
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Geofence Radius (meters) *</label>
              <input
                type="number"
                required
                min="5"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.radiusMeters}
                onChange={(e) => upd('radiusMeters', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tracking Interval (seconds) *</label>
              <input
                type="number"
                required
                min="10"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.trackingIntervalSec}
                onChange={(e) => upd('trackingIntervalSec', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Max GPS Accuracy (meters) *</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.maxAccuracyMeters}
                onChange={(e) => upd('maxAccuracyMeters', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Max Idle Duration (minutes) *</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.maxIdleMinutes}
                onChange={(e) => upd('maxIdleMinutes', parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        </div>
      </div>
    </EntityFormPage>
  );
}

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, MapPin, RefreshCw } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';

interface OfficeLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  trackingIntervalSec: number;
  maxAccuracyMeters: number;
  maxIdleMinutes: number;
}

export default function BranchList() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchBranches = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<OfficeLocation[]>('/office-locations', { signal });
      setBranches(res.data || []);
    } catch (err: any) {
      if (err.name === 'CanceledError') return;
      setError(err.response?.data?.message || err.message || 'Failed to load branches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    fetchBranches(c.signal);
    return () => c.abort();
  }, [fetchBranches]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this branch location?')) return;
    try {
      await rolesApi.delete(`/office-locations/${id}`);
      setBranches((prev) => prev.filter((b) => b.id !== id));
      showToast('success', 'Branch deleted successfully.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Failed to delete branch.');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? branches.filter((b) => b.name?.toLowerCase().includes(q)) : branches;
  }, [branches, search]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <EntityListPage
        title="Branches"
        description="Manage office locations and geofencing configurations."
        addLabel="Add Branch"
        addRoute="/hrms/branches/create"
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
        headerActions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
            onClick={() => { fetchBranches(); }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Branch Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Coordinates</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Radius</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Tracking Config</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span>{b.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                    {b.latitude}, {b.longitude}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                      {b.radiusMeters}m
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    <div className="space-y-0.5">
                      <div>Interval: <span className="font-semibold text-foreground">{b.trackingIntervalSec}s</span></div>
                      <div className="text-[11px]">Accuracy: {b.maxAccuracyMeters}m · Idle: {b.maxIdleMinutes}m</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline transition-colors"
                        onClick={() => navigate(`/hrms/branches/edit/${b.id}`)}
                      >
                        <Edit className="w-3.5 h-3.5 text-primary" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-destructive hover:underline transition-colors"
                        onClick={() => handleDelete(b.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                    {search ? `No branches matching "${search}"` : 'No branches found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>
    </div>
  );
}

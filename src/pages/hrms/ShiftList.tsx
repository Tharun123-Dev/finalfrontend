/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Clock, RefreshCw } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';

interface Office {
  id: number;
  name: string;
}

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  minHalfDayMinutes: number;
  minFullDayMinutes: number;
  office?: Office;
}

const fmt = (t?: string) => (t ? t.substring(0, 5) : '—');

export default function ShiftList() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchShifts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<Shift[]>('/shifts', { signal });
      setShifts(res.data || []);
    } catch (err: any) {
      if (err.name === 'CanceledError') return;
      setError(err.response?.data?.message || err.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    fetchShifts(c.signal);
    return () => c.abort();
  }, [fetchShifts]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await rolesApi.delete(`/shifts/${id}`);
      setShifts((prev) => prev.filter((s) => s.id !== id));
      showToast('success', 'Shift deleted.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Failed to delete shift.');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? shifts.filter((s) => s.name?.toLowerCase().includes(q)) : shifts;
  }, [shifts, search]);

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
        title="Attendance Shifts"
        description="Define shift timings and break schedules"
        addLabel="Add Shift"
        addRoute="/hrms/shifts/create"
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
        headerActions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
            onClick={() => { fetchShifts(); }}
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
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Shift Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Timing</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Grace</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Office</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-semibold text-primary font-mono">
                      {fmt(s.startTime)} – {fmt(s.endTime)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                    {s.graceMinutes} min
                  </td>
                  <td className="py-3.5 px-4 text-xs text-foreground">
                    {s.office?.name || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline transition-colors"
                        onClick={() => navigate(`/hrms/shifts/edit/${s.id}`)}
                      >
                        <Edit className="w-3.5 h-3.5 text-primary" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-destructive hover:underline transition-colors"
                        onClick={() => handleDelete(s.id)}
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
                    {search ? `No shifts matching "${search}"` : 'No shifts found.'}
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

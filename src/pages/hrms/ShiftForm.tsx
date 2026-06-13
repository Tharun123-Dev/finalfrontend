/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface Office {
  id: number;
  name: string;
}

interface ShiftFormState {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  minHalfDayMinutes: number;
  minFullDayMinutes: number;
  shortBreakStartTime: string;
  shortBreakEndTime: string;
  longBreakStartTime: string;
  longBreakEndTime: string;
  office: { id: string | number };
}

const EMPTY_FORM: ShiftFormState = {
  name: '',
  startTime: '09:00',
  endTime: '18:00',
  graceMinutes: 15,
  minHalfDayMinutes: 240,
  minFullDayMinutes: 480,
  shortBreakStartTime: '',
  shortBreakEndTime: '',
  longBreakStartTime: '',
  longBreakEndTime: '',
  office: { id: '' },
};

export default function ShiftForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<ShiftFormState>(EMPTY_FORM);
  const [branches, setBranches] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const init = async () => {
      try {
        const brRes = await rolesApi.get<Office[]>('/office-locations', { signal: ctrl.signal });
        setBranches(brRes.data || []);
        if (isEdit) {
          const shiftRes = await rolesApi.get<any[]>('/shifts', { signal: ctrl.signal });
          const s = shiftRes.data.find((x) => String(x.id) === String(id));
          if (s) {
            setForm({
              name: s.name,
              startTime: s.startTime?.substring(0, 5) || '09:00',
              endTime: s.endTime?.substring(0, 5) || '18:00',
              graceMinutes: s.graceMinutes,
              minHalfDayMinutes: s.minHalfDayMinutes,
              minFullDayMinutes: s.minFullDayMinutes,
              shortBreakStartTime: s.shortBreakStartTime?.substring(0, 5) || '',
              shortBreakEndTime: s.shortBreakEndTime?.substring(0, 5) || '',
              longBreakStartTime: s.longBreakStartTime?.substring(0, 5) || '',
              longBreakEndTime: s.longBreakEndTime?.substring(0, 5) || '',
              office: { id: s.office?.id || '' },
            });
          } else {
            setError('Shift not found.');
          }
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          console.error(err);
          setError('Failed to load data.');
        }
      } finally {
        setFetching(false);
      }
    };
    init();
    return () => ctrl.abort();
  }, [id, isEdit]);

  const upd = (k: keyof ShiftFormState, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const pad = (t: string) => (t ? t + ':00' : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const payload = {
      ...form,
      startTime: pad(form.startTime),
      endTime: pad(form.endTime),
      shortBreakStartTime: pad(form.shortBreakStartTime),
      shortBreakEndTime: pad(form.shortBreakEndTime),
      longBreakStartTime: pad(form.longBreakStartTime),
      longBreakEndTime: pad(form.longBreakEndTime),
      office: form.office.id ? { id: Number(form.office.id) } : null,
    };

    try {
      if (isEdit) {
        await rolesApi.put(`/shifts/${id}`, payload);
      } else {
        await rolesApi.post('/shifts', payload);
      }
      setSuccess(isEdit ? 'Shift updated.' : 'Shift created.');
      setTimeout(() => navigate('/hrms/shifts'), 900);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save shift.');
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
      title={isEdit ? 'Edit Shift' : 'Create Shift'}
      subtitle="Attendance Shifts"
      backRoute="/hrms/shifts"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save Changes' : 'Create Shift'}
      loading={loading}
      error={error}
      success={success}
    >
      <div className="space-y-6 text-xs">
        {/* Section: Shift Details */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Shift Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Shift Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Morning Shift"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.name}
                onChange={(e) => upd('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Assigned Office / Branch *</label>
              <select
                required
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.office.id}
                onChange={(e) => upd('office', { id: e.target.value })}
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Time *</label>
              <input
                type="time"
                required
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.startTime}
                onChange={(e) => upd('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Time *</label>
              <input
                type="time"
                required
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.endTime}
                onChange={(e) => upd('endTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Grace (min) *</label>
              <input
                type="number"
                required
                min="0"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.graceMinutes}
                onChange={(e) => upd('graceMinutes', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Half Day (min) *</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.minHalfDayMinutes}
                onChange={(e) => upd('minHalfDayMinutes', parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Day (min) *</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.minFullDayMinutes}
                onChange={(e) => upd('minFullDayMinutes', parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Section: Break Schedule */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4" /> Break Schedule (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Short Break Start</label>
              <input
                type="time"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.shortBreakStartTime}
                onChange={(e) => upd('shortBreakStartTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Short Break End</label>
              <input
                type="time"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.shortBreakEndTime}
                onChange={(e) => upd('shortBreakEndTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Long Break Start</label>
              <input
                type="time"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.longBreakStartTime}
                onChange={(e) => upd('longBreakStartTime', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Long Break End</label>
              <input
                type="time"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.longBreakEndTime}
                onChange={(e) => upd('longBreakEndTime', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </EntityFormPage>
  );
}

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CalendarClock,
  ClipboardList,
  MessageCircle,
  Phone,
  Plus,
  UserPlus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/context/ToastContext';
import { useLead } from '@/modules/leads/hooks/useLead';
import {
  useAssignLeadCounselorMutation,
  useCreateFollowUpMutation,
  useGetFollowUpsQuery,
  useGetLeadOptionsQuery,
  useGetLeadUsersQuery,
  useUpdateLeadMutation,
} from '@/modules/leads/services/leadsApi';
import {
  formatDateTime,
  getLeadCounselor,
  getLeadCourse,
  getLeadName,
  getLeadNotes,
  getLeadSource,
  optionLabel,
  optionValue,
} from '@/modules/leads/utils/leadUi';

const splitNote = (note = '') => {
  const match = note.match(/^\[(.+?)\]\s*(.*)$/);
  return {
    method: match?.[1] || 'other',
    body: match?.[2] || note,
  };
};

export default function LeadDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: lead, isLoading, isError } = useLead(id);
  const { data: users = [] } = useGetLeadUsersQuery();
  const { data: options } = useGetLeadOptionsQuery();
  const { data: followups = [] } = useGetFollowUpsQuery(id, { skip: !id });
  const [assignLead, { isLoading: assigning }] = useAssignLeadCounselorMutation();
  const [createFollowUp, { isLoading: logging }] = useCreateFollowUpMutation();
  const [updateLead] = useUpdateLeadMutation();
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [logValues, setLogValues] = useState({
    contact_method: '',
    status: '',
    note: '',
    scheduled_at: '',
  });

  const contactMethods = options?.contact_methods || [];
  const statuses = options?.statuses || [];

  const detailCards = useMemo(() => {
    if (!lead) return [];
    return [
      {
        title: 'Basic Info',
        rows: [
          ['Student Full Name *', getLeadName(lead)],
          ['Email Address *', lead.email || 'N/A'],
          ['Phone Number *', lead.phone || 'N/A'],
        ],
      },
      { title: 'Academic Info', rows: [['Course Of Interest *', getLeadCourse(lead)]] },
      { title: 'Marketing Info', rows: [['Source', getLeadSource(lead)]] },
      { title: 'Administration', rows: [['Internal Notes', getLeadNotes(lead) || 'N/A']] },
      {
        title: 'Lead Management',
        rows: [
          ['Status', lead.status || 'New'],
          ['Assigned Counselor', getLeadCounselor(lead)],
        ],
      },
    ];
  }, [lead]);

  const sortedFollowups = useMemo(
    () => [...followups].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [followups]
  );

  const handleAssign = async () => {
    if (!selectedCounselor) return;
    try {
      await assignLead({ leadId: id, counselorId: selectedCounselor }).unwrap();
      toast.success('Assigned', 'Lead counselor has been updated.');
      setSelectedCounselor('');
    } catch (err) {
      toast.error('Error', err?.data?.detail || 'Unable to assign counselor.');
    }
  };

  const handleLog = async (event) => {
    event.preventDefault();
    const note = logValues.note.trim();
    if (!note) {
      toast.error('Missing note', 'Discussion summary is required.');
      return;
    }

    try {
      const method = optionLabel(contactMethods.find((item) => optionValue(item) === logValues.contact_method)) || logValues.contact_method;
      await createFollowUp({
        lead_id: Number(id),
        note: method ? `[${method}] ${note}` : note,
        scheduled_at: logValues.scheduled_at ? new Date(logValues.scheduled_at).toISOString() : null,
        completed: false,
      }).unwrap();

      if (logValues.status) {
        await updateLead({ id, status: logValues.status }).unwrap();
      }

      toast.success('Logged', 'Discussion and next reminder have been saved.');
      setModalOpen(false);
      setLogValues({ contact_method: '', status: '', note: '', scheduled_at: '' });
    } catch (err) {
      toast.error('Error', err?.data?.detail || 'Failed to log discussion.');
    }
  };

  if (isLoading) return <div className="p-6 text-slate-500">Loading lead...</div>;
  if (isError || !lead) return <div className="p-6 text-rose-600">Error loading lead.</div>;

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-slate-400">Counselor Assignment</p>
            <p className="mt-1 text-slate-500">Assign this lead to a counselor. The counselor will see it after login and can add follow ups.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedCounselor}
              onChange={(event) => setSelectedCounselor(event.target.value)}
              className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 sm:min-w-[360px]"
            >
              <option value="">Current: {getLeadCounselor(lead)}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
              ))}
            </select>
            <Button className="h-12 gap-2 rounded-xl bg-violet-600 px-6 text-white hover:bg-violet-700" onClick={handleAssign} disabled={!selectedCounselor || assigning}>
              <UserPlus className="h-4 w-4" />
              Assign
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[minmax(320px,0.9fr)_minmax(520px,1.85fr)]">
        <div className="space-y-7">
          {detailCards.map((card) => (
            <Card key={card.title} className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                <ClipboardList className="h-4 w-4" />
                {card.title}
              </h3>
              <div className="space-y-4">
                {card.rows.map(([label, value]) => (
                  <div key={label} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="text-xs font-bold uppercase text-slate-400">{label}</div>
                    <div className="mt-2 text-sm font-bold text-slate-800">{value}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <Card className="rounded-3xl bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Discussion History</h2>
              <p className="mt-1 text-sm text-slate-400">Chronological counselor engagement actions logged</p>
            </div>
            <Button className="gap-2 rounded-xl bg-violet-600 px-5 text-white hover:bg-violet-700" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Log Conversation
            </Button>
          </div>

          <div className="relative space-y-7 border-l border-slate-200 pl-5">
            {sortedFollowups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">No discussions logged yet.</div>
            ) : sortedFollowups.map((followup) => {
              const note = splitNote(followup.note);
              return (
                <div key={followup.id} className="relative">
                  <span className="absolute -left-[27px] top-4 h-3.5 w-3.5 rounded-full bg-violet-600 ring-4 ring-white" />
                  <div className={`rounded-2xl border p-5 ${followup.completed ? 'bg-slate-50 border-slate-200' : 'bg-cyan-50/60 border-cyan-100'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-600 shadow-sm">
                          {note.method.toLowerCase().includes('call') ? <Phone className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                        </span>
                        <div className="font-bold text-slate-800">{note.method} Contacted</div>
                      </div>
                      <span className="text-sm font-bold text-slate-400">{formatDateTime(followup.created_at)}</span>
                    </div>
                    <p className="mt-5 text-slate-600">{note.body}</p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
                      <span className="text-xs font-bold uppercase text-slate-400">Counselor: Admin</span>
                      {followup.scheduled_at && (
                        <span className="text-xs font-bold text-orange-600">Reminder scheduled: {formatDateTime(followup.scheduled_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <form onSubmit={handleLog} className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-7">
              <h2 className="text-xl font-bold text-slate-900">Log Discussion for {getLeadName(lead)}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
            <div className="grid gap-5 p-7 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-bold text-slate-700">
                <span>Contact Method</span>
                <select value={logValues.contact_method} onChange={(event) => setLogValues((prev) => ({ ...prev, contact_method: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium">
                  <option value="">Phone Call</option>
                  {contactMethods.map((item) => <option key={optionValue(item)} value={optionValue(item)}>{optionLabel(item)}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700">
                <span>Update Lead Status (Optional)</span>
                <select value={logValues.status} onChange={(event) => setLogValues((prev) => ({ ...prev, status: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium">
                  <option value="">Keep current ({lead.status || 'New'})</option>
                  {statuses.map((item) => <option key={optionValue(item)} value={optionValue(item)}>{optionLabel(item)}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700 sm:col-span-2">
                <span>Discussion Summary Notes *</span>
                <textarea value={logValues.note} onChange={(event) => setLogValues((prev) => ({ ...prev, note: event.target.value }))} rows={3} placeholder="What was discussed? e.g., Requested prospectus, compared pricing, promised weekend slots..." className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100" />
              </label>
              <label className="space-y-2 text-sm font-bold text-slate-700 sm:col-span-2">
                <span>Schedule Next Callback Reminder (Optional)</span>
                <input type="datetime-local" value={logValues.scheduled_at} onChange={(event) => setLogValues((prev) => ({ ...prev, scheduled_at: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 p-7">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={logging} className="rounded-xl bg-violet-600 text-white hover:bg-violet-700">Log & Update</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

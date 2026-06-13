/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface AuditRecord {
  id: number | string;
  vendorId: number | string;
  vendorName: string;
  categoryName?: string;
  auditDate: string;
  score: number;
  status: 'Compliant' | 'Non-Compliant' | 'Pending Review' | 'Critical';
  reviewer: string;
  notes?: string;
}

interface Vendor {
  id: number | string;
  vendorName: string;
}

const statusBadge = {
  Compliant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Non-Compliant': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  'Pending Review': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold animate-pulse',
};

export default function RiskCompliance() {
  const { searchQuery } = useAppStore();
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selected, setSelected] = useState<AuditRecord | null>(null);

  const [newAudit, setNewAudit] = useState({ vendorId: '', score: '', reviewer: '', notes: '' });

  const fetchAudits = async () => {
    try {
      const res = await rolesApi.get('/vendor-audits');
      if (res.data.success) setAudits(res.data.data);
    } catch (e) { console.error("Error fetching audits", e); }
  };

  const fetchVendors = async () => {
    try {
      const response = await rolesApi.get('/vendors');
      if (response.data.success) setVendors(response.data.data.content || response.data.data);
    } catch (error) { console.error("Error fetching vendors", error); }
  };

  useEffect(() => {
    fetchAudits();
    fetchVendors();
  }, []);

  const openView = (aud: AuditRecord) => { setSelected(aud); setIsViewOpen(true); };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Delete this audit record?')) {
      try {
        await rolesApi.delete(`/vendor-audits/${id}`);
        fetchAudits();
        setIsViewOpen(false);
        setSelected(null);
      } catch (e) { console.error("Error deleting audit", e); }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numScore = parseInt(newAudit.score) || 0;
      let status: AuditRecord['status'] = 'Compliant';
      if (numScore < 50) status = 'Critical';
      else if (numScore < 75) status = 'Non-Compliant';

      const payload = {
        vendorId: newAudit.vendorId,
        score: numScore,
        auditDate: new Date().toISOString().split('T')[0],
        reviewer: newAudit.reviewer,
        status,
        notes: newAudit.notes || '',
      };
      await rolesApi.post('/vendor-audits', payload);
      fetchAudits();
      setNewAudit({ vendorId: '', score: '', reviewer: '', notes: '' });
      setIsAddOpen(false);
    } catch (e) { console.error("Error creating audit", e); }
  };

  const filteredAudits = audits.filter(a =>
    (a.vendorName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.reviewer || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Risk &amp; Compliance</h2>
          <p className="text-slate-400 text-sm mt-1">Monitor audits and compliance posture</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center cursor-pointer">
          <Plus size={16} className="mr-2" /> Log Audit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-4 sm:p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">Risk Logs</h3>
          <div className="space-y-4">
            {filteredAudits.length > 0 ? filteredAudits.map((a) => (
              <div key={a.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl hover:bg-slate-800/60 hover:border-slate-600 transition-all group cursor-pointer" onClick={() => openView(a)}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center">
                    <div className="p-3 bg-rose-500/10 text-rose-400 rounded-lg mr-4 shrink-0">
                      {a.status === 'Compliant' ? <ShieldCheck size={22} className="text-emerald-400" /> : <AlertCircle size={22} />}
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-200">{a.vendorName}</h4>
                      <p className="text-sm text-slate-400">Score: {a.score}/100 · Reviewed by {a.reviewer}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 ml-14 sm:ml-0">
                    <span className="text-xs text-slate-400">{a.auditDate}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadge[a.status]}`}>{a.status}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-slate-400">No audit logs found matching "{searchQuery}"</div>
            )}
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
            <AlertCircle className="text-rose-400 mr-2" size={20} /> Non-Compliant List
          </h3>
          <div className="space-y-4">
            {audits.filter(a => a.status === 'Critical' || a.status === 'Non-Compliant').length > 0 ? (
              audits.filter(a => a.status === 'Critical' || a.status === 'Non-Compliant').map((a) => (
                <div key={a.id} className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
                  <h4 className="font-medium text-rose-300 text-sm">{a.vendorName}</h4>
                  <p className="text-slate-300 text-sm mt-1">Audit Score: {a.score}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Logged on {a.auditDate}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm">All audited vendors are compliant.</div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Audit Details">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start justify-between border-b border-slate-700/50 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-50">{selected.vendorName}</h3>
                <p className="text-sm text-cyan-400 mt-0.5">Score: {selected.score}/100</p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusBadge[selected.status]}`}>{selected.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500 text-xs mb-0.5">Auditor/Reviewer</p><p className="text-slate-200 font-medium">{selected.reviewer}</p></div>
              <div><p className="text-slate-500 text-xs mb-0.5">Audit Date</p><p className="text-slate-200">{selected.auditDate}</p></div>
            </div>
            {selected.notes && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{selected.notes}</p>
              </div>
            )}
            <div className="pt-2 flex justify-between items-center border-t border-slate-700/50">
              <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                <Trash2 size={15} /> Delete Log
              </button>
              <button onClick={() => setIsViewOpen(false)} className="btn-secondary cursor-pointer">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log New Audit">
        <form className="space-y-4" onSubmit={handleAdd}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Vendor *</label>
            <select className="input-field text-foreground bg-background border-border" required value={newAudit.vendorId} onChange={(e) => setNewAudit({ ...newAudit, vendorId: e.target.value })}>
              <option value="" className="bg-background">Select Vendor...</option>
              {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Score (0-100) *</label>
              <input type="number" min="0" max="100" className="input-field" required placeholder="85" value={newAudit.score} onChange={(e) => setNewAudit({ ...newAudit, score: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Reviewer Name *</label>
              <input type="text" className="input-field" required placeholder="John Doe" value={newAudit.reviewer} onChange={(e) => setNewAudit({ ...newAudit, reviewer: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea rows={3} className="input-field resize-none" placeholder="Details of audit findings..." value={newAudit.notes} onChange={(e) => setNewAudit({ ...newAudit, notes: e.target.value })} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50 mt-4">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary cursor-pointer">Cancel</button>
            <button type="submit" className="btn-primary cursor-pointer">Log Audit</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

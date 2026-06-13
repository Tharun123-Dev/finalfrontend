/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import rolesApi from '@/services/rolesApi';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, DollarSign, Upload, FileUp, Eye, Edit2, Trash2, Download } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import Modal from '@/components/ui/Modal';

interface Invoice {
  id: number | string;
  invoiceNumber: string;
  vendorId: number | string;
  vendorName: string;
  amount: string;
  amountValue?: number;
  date: string;
  dueDate: string;
  poRef: string;
  status: 'Paid' | 'Approved' | 'Pending' | 'Rejected' | 'Partially Paid';
  notes?: string;
  receiptUrl?: string;
}

interface Vendor {
  id: number | string;
  vendorName: string;
}

const statusStyle = {
  Paid: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', label: 'Paid' },
  Approved: { badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', label: 'Approved' },
  Pending: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', label: 'Pending' },
  Rejected: { badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', label: 'Rejected' },
  'Partially Paid': { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'Partially Paid' },
};

const mockInvoices: Invoice[] = [
  { id: 1, invoiceNumber: 'INV-2026-004', vendorId: 1, vendorName: 'Acme Supply Solutions LLC', amount: '$12,500', amountValue: 12500, date: '2026-06-08', dueDate: '2026-07-15', poRef: 'PO-1024', status: 'Paid', notes: 'Procurement of server rack hardware & network switches.', receiptUrl: '/vendor/invoices/1/receipt' },
  { id: 2, invoiceNumber: 'INV-2026-005', vendorId: 2, vendorName: 'Apex Globals Ltd', amount: '$8,400', amountValue: 8400, date: '2026-06-09', dueDate: '2026-07-20', poRef: 'PO-1025', status: 'Approved', notes: 'Office space leasing deposit.' },
  { id: 3, invoiceNumber: 'INV-2026-006', vendorId: 1, vendorName: 'Acme Supply Solutions LLC', amount: '$4,200', amountValue: 4200, date: '2026-06-09', dueDate: '2026-07-25', poRef: 'PO-1026', status: 'Pending', notes: 'Consulting fees for cloud migration.' }
];

const mockVendors: Vendor[] = [
  { id: 1, vendorName: 'Acme Supply Solutions LLC' },
  { id: 2, vendorName: 'Apex Globals Ltd' }
];

export default function Invoices() {
  const { searchQuery } = useAppStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [newInvoice, setNewInvoice] = useState({ vendorId: '', amount: '', poRef: '', dueDate: '', notes: '' });

  const fetchInvoices = async () => {
    try {
      const res = await rolesApi.get('/vendor-invoices');
      if (res.data.success) setInvoices(res.data.data);
    } catch (e) {
      console.warn("Error fetching invoices, falling back to mock data", e);
      setInvoices(mockInvoices);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await rolesApi.get('/vendors');
      if (response.data.success) setVendors(response.data.data.content || response.data.data);
    } catch (error) {
      console.warn("Error fetching vendors, falling back to mock data", error);
      setVendors(mockVendors);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchVendors();
  }, []);

  const openView = (inv: Invoice) => { setSelected(inv); setIsViewOpen(true); };
  const openEdit = (inv: Invoice) => { setEditInvoice({ ...inv }); setIsViewOpen(false); setIsEditOpen(true); };

  const handleDelete = async (id: number | string) => {
    if (window.confirm('Delete this invoice?')) {
      try {
        await rolesApi.delete(`/vendor-invoices/${id}`);
        fetchInvoices();
        setIsViewOpen(false);
        setSelected(null);
      } catch (e) {
        console.warn("Error deleting invoice, updating local state", e);
        setInvoices(prev => prev.filter(i => i.id !== id));
        setIsViewOpen(false);
        setSelected(null);
      }
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: Invoice['status']) => {
    try {
      const invToUpdate = invoices.find(i => i.id === id);
      if (invToUpdate) {
        await rolesApi.put(`/vendor-invoices/${id}`, { ...invToUpdate, status: newStatus });
        fetchInvoices();
        setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch (e) {
      console.warn("Error updating invoice status, updating local state", e);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        vendorId: newInvoice.vendorId,
        amount: newInvoice.amount,
        date: new Date().toISOString().split('T')[0],
        dueDate: newInvoice.dueDate || 'TBD',
        poRef: newInvoice.poRef || '—',
        status: 'Pending',
        notes: newInvoice.notes || '',
      };
      const res = await rolesApi.post('/vendor-invoices', payload);

      if (res.data.success && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await rolesApi.post(`/vendor-invoices/${res.data.data.id}/upload-receipt`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      fetchInvoices();
      setNewInvoice({ vendorId: '', amount: '', poRef: '', dueDate: '', notes: '' });
      setSelectedFile(null);
      setIsUploadOpen(false);
    } catch (e) {
      console.warn("Error creating invoice, falling back to local state updates", e);
      const vendor = vendors.find(v => String(v.id) === String(newInvoice.vendorId));
      const newlyAdded: Invoice = {
        id: `local_${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(Math.random() * 1000)}`,
        vendorId: newInvoice.vendorId,
        vendorName: vendor ? vendor.vendorName : 'Acme Supply Solutions LLC',
        amount: `$${newInvoice.amount}`,
        amountValue: parseFloat(newInvoice.amount) || 0,
        date: new Date().toISOString().split('T')[0],
        dueDate: newInvoice.dueDate || 'TBD',
        poRef: newInvoice.poRef || '—',
        status: 'Pending',
        notes: newInvoice.notes || '',
        receiptUrl: '/vendor/invoices/1/receipt'
      };
      setInvoices(prev => [newlyAdded, ...prev]);
      setNewInvoice({ vendorId: '', amount: '', poRef: '', dueDate: '', notes: '' });
      setSelectedFile(null);
      setIsUploadOpen(false);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInvoice) return;
    try {
      await rolesApi.put(`/vendor-invoices/${editInvoice.id}`, editInvoice);
      fetchInvoices();
      setIsEditOpen(false);
      setEditInvoice(null);
    } catch (e) {
      console.warn("Error editing invoice, updating local state", e);
      setInvoices(prev => prev.map(i => i.id === editInvoice.id ? editInvoice : i));
      setIsEditOpen(false);
      setEditInvoice(null);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const searchLower = (searchQuery || '').toLowerCase();
    if (!searchLower) return true;
    return (inv.invoiceNumber || '').toLowerCase().includes(searchLower) ||
      (inv.vendorName || '').toLowerCase().includes(searchLower) ||
      (inv.status || '').toLowerCase().includes(searchLower);
  });

  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (i.amountValue || 0), 0);
  const totalPending = invoices.filter(i => i.status === 'Pending').reduce((sum, i) => sum + (i.amountValue || 0), 0);
  const totalApproved = invoices.filter(i => i.status === 'Approved').reduce((sum, i) => sum + (i.amountValue || 0), 0);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const getReceiptUrl = (id: string | number) => {
    return `/vendor/invoices/${id}/receipt`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-50">Invoices &amp; Payments</h2>
          <p className="text-slate-400 text-sm mt-1">Track financial transactions and approvals</p>
        </div>
        <button onClick={() => setIsUploadOpen(true)} className="btn-primary flex items-center shrink-0 w-full sm:w-auto justify-center cursor-pointer">
          <Upload size={16} className="mr-2" /> Upload Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { label: 'Total Paid (MTD)', value: formatCurrency(totalPaid), icon: DollarSign, color: 'text-emerald-500' },
          { label: 'Pending Approval', value: formatCurrency(totalPending), icon: FileText, color: 'text-amber-500' },
          { label: 'Approved, Unpaid', value: formatCurrency(totalApproved), icon: CheckCircle2, color: 'text-cyan-500' },
        ].map((c, i) => (
          <div key={i} className="glass-card p-5 border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm mb-1">{c.label}</p>
                <h3 className="text-2xl font-bold text-slate-50">{c.value}</h3>
              </div>
              <c.icon className={c.color} size={32} />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-border/50 bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Invoice ID</th>
                <th className="p-4 font-medium">Vendor</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium hidden sm:table-cell">Due Date</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredInvoices.length > 0 ? filteredInvoices.map((inv) => {
                const s = statusStyle[inv.status] || statusStyle.Pending;
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 font-mono text-sm text-cyan-400">{inv.invoiceNumber}</td>
                    <td className="p-4 text-sm text-slate-200">{inv.vendorName}</td>
                    <td className="p-4 text-sm font-semibold text-slate-50">{inv.amount}</td>
                    <td className="p-4 text-sm text-slate-400 hidden sm:table-cell">{inv.dueDate}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.badge}`}>{inv.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(inv.status === 'Paid' || inv.status === 'Approved' || inv.receiptUrl) && (
                          <a href={getReceiptUrl(inv.id)} target="_blank" rel="noreferrer" className="btn-icon text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 p-2 rounded" title="View / Print Receipt">
                            <Download size={16} />
                          </a>
                        )}
                        <button onClick={() => openView(inv)} className="btn-icon" title="View details"><Eye size={16} /></button>
                        <button onClick={() => openEdit(inv)} className="btn-icon" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(inv.id)} className="btn-icon text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">No invoices found matching "{searchQuery}"</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Invoice Details">
        {selected && (() => {
          const s = statusStyle[selected.status] || statusStyle.Pending;
          return (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-700/50 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400 block mb-1">{selected.invoiceNumber}</span>
                  <h3 className="text-xl font-bold text-slate-50">{selected.vendorName}</h3>
                </div>
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${s.badge}`}>{selected.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500 text-xs mb-0.5">Amount</p><p className="text-slate-50 font-bold text-lg">{selected.amount}</p></div>
                <div><p className="text-slate-500 text-xs mb-0.5">PO Reference</p><p className="text-slate-200 font-mono">{selected.poRef}</p></div>
                <div><p className="text-slate-500 text-xs mb-0.5">Invoice Date</p><p className="text-slate-200">{selected.date}</p></div>
                <div><p className="text-slate-500 text-xs mb-0.5">Due Date</p><p className="text-slate-200">{selected.dueDate}</p></div>
              </div>

              {selected.notes && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-300">{selected.notes}</p>
                </div>
              )}

              {(selected.status === 'Paid' || selected.status === 'Approved' || selected.receiptUrl) && (
                <div className="mt-4">
                  <a href={getReceiptUrl(selected.id)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                    <Download size={16} /> View / Print Payment Receipt
                  </a>
                </div>
              )}

              <div className="border-t border-slate-700/50 pt-4">
                <p className="text-xs text-slate-500 mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {(['Pending', 'Approved', 'Partially Paid', 'Paid', 'Rejected'] as Invoice['status'][]).filter(st => st !== selected.status).map(st => (
                    <button key={st} onClick={() => handleStatusChange(selected.id, st)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-700/50">
                <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                  <Trash2 size={15} /> Delete
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setIsViewOpen(false)} className="btn-secondary cursor-pointer">Close</button>
                  <button onClick={() => openEdit(selected)} className="btn-primary flex items-center gap-2 cursor-pointer"><Edit2 size={15} /> Edit</button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {editInvoice && (
        <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditInvoice(null); }} title="Edit Invoice">
          <form className="space-y-4" onSubmit={handleEditSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Vendor *</label>
                <select className="input-field text-foreground bg-background border-border" required value={editInvoice.vendorId} onChange={(e) => setEditInvoice({ ...editInvoice, vendorId: e.target.value })}>
                  <option value="" className="bg-background">Select Vendor...</option>
                  {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Amount</label>
                <input type="text" className="input-field" placeholder="$0" value={editInvoice.amount} onChange={(e) => setEditInvoice({ ...editInvoice, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">PO Reference</label>
                <input type="text" className="input-field" value={editInvoice.poRef} onChange={(e) => setEditInvoice({ ...editInvoice, poRef: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
                <input type="date" className="input-field" value={editInvoice.dueDate} onChange={(e) => setEditInvoice({ ...editInvoice, dueDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea rows={3} className="input-field resize-none" value={editInvoice.notes || ''} onChange={(e) => setEditInvoice({ ...editInvoice, notes: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50 mt-4">
              <button type="button" onClick={() => { setIsEditOpen(false); setEditInvoice(null); }} className="btn-secondary cursor-pointer">Cancel</button>
              <button type="submit" className="btn-primary cursor-pointer">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload Invoice Receipt">
        <form className="space-y-4" onSubmit={handleAddInvoice}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Vendor *</label>
              <select className="input-field text-foreground bg-background border-border" required value={newInvoice.vendorId} onChange={(e) => setNewInvoice({ ...newInvoice, vendorId: e.target.value })}>
                <option value="" className="bg-background">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id} className="bg-background">{v.vendorName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Invoice Amount *</label>
              <input type="text" className="input-field" required placeholder="e.g. $12,500" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">PO Reference (Optional)</label>
              <input type="text" className="input-field" placeholder="e.g. PO-1024" value={newInvoice.poRef} onChange={(e) => setNewInvoice({ ...newInvoice, poRef: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
              <input type="date" className="input-field text-slate-400" value={newInvoice.dueDate} onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Receipt Attachment</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-cyan-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <FileUp className="mx-auto text-slate-500 mb-2" size={32} />
                {selectedFile ? (
                  <p className="text-sm font-medium text-cyan-400">{selectedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-slate-300 font-medium">Click to select files</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, PNG, or JPG (Max 5MB)</p>
                  </>
                )}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
              <textarea rows={3} className="input-field resize-none" placeholder="Any payment terms, billing remarks..." value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-700/50 mt-4">
            <button type="button" onClick={() => setIsUploadOpen(false)} className="btn-secondary cursor-pointer">Cancel</button>
            <button type="submit" className="btn-primary cursor-pointer">Submit Invoice</button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

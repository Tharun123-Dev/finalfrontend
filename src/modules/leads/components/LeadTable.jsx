// src/modules/leads/components/LeadTable.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeleteLeadMutation } from '@/modules/leads/services/leadsApi';
import { useToast } from '@/context/ToastContext';
import {
  formatShortDate,
  getLeadCounselor,
  getLeadCourse,
  getLeadName,
  getLeadSource,
  statusClass,
} from '@/modules/leads/utils/leadUi';

export default function LeadTable({ leads }) {
  const [deleteLead, { isLoading: isDeleting }] = useDeleteLeadMutation();
  const toast = useToast();

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete lead: "${name}"?`)) return;
    try {
      await deleteLead(id).unwrap();
      toast.success('Deleted', `Lead "${name}" has been deleted.`);
    } catch (err) {
      toast.error('Error', err?.data?.detail || 'Failed to delete lead.');
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-slate-100">
          <TableHead className="w-[240px] text-xs font-bold uppercase text-slate-400">Student Name</TableHead>
          <TableHead className="w-[220px] text-xs font-bold uppercase text-slate-400">Course of Interest</TableHead>
          <TableHead className="w-[190px] text-xs font-bold uppercase text-slate-400">Assigned Counselor</TableHead>
          <TableHead className="w-[150px] text-xs font-bold uppercase text-slate-400">Source</TableHead>
          <TableHead className="w-[140px] text-xs font-bold uppercase text-slate-400">Date Created</TableHead>
          <TableHead className="w-[170px] text-xs font-bold uppercase text-slate-400">Status</TableHead>
          <TableHead className="w-[120px] text-right text-xs font-bold uppercase text-slate-400">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const name = getLeadName(lead);
          return (
          <TableRow key={lead.id} className="group border-slate-100 hover:bg-slate-50/80 transition-colors">
            <TableCell>
              <div className="font-semibold text-slate-900">{name}</div>
              <div className="text-xs text-slate-400">{lead.email || 'No email'}</div>
            </TableCell>
            <TableCell className="font-medium text-slate-600">{getLeadCourse(lead)}</TableCell>
            <TableCell className="font-medium text-slate-600">{getLeadCounselor(lead)}</TableCell>
            <TableCell className="text-slate-500">{getLeadSource(lead)}</TableCell>
            <TableCell className="text-slate-500">{formatShortDate(lead.created_at)}</TableCell>
            <TableCell>
              <Badge variant="outline" className={`gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${statusClass(lead.status)}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {lead.status || 'New'}
              </Badge>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap">
              <Link to={`/leads/${lead.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={`/leads/${lead.id}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(lead.id, name)}
                disabled={isDeleting}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        )})}
      </TableBody>
    </Table>
  );
}

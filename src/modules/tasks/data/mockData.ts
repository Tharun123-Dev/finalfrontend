import { Member, Task, Notification } from '../types';

export const MEMBERS: Member[] = [
  { id: 'usr-1', name: 'Dr. Aris Thorne', role: 'Academic Registrar', email: 'aris.thorne@edu.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-2', name: 'Sarah Jenkins', role: 'Lead Admissions Counselor', email: 'sarah.j@edu.com', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-3', name: 'Michael Chang', role: 'IT Director & Dev Lead', email: 'm.chang@edu.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-4', name: 'Emma Watson', role: 'HR Operations Manager', email: 'emma.w@edu.com', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-5', name: 'Kabir Dev', role: 'Admissions Counselor', email: 'kabir.d@edu.com', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { id: 'usr-6', name: 'Priya Patel', role: 'Admissions Counselor', email: 'priya.p@edu.com', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
];

export const RELATED_MODULES: string[] = [
  'Lead Intake Form',
  'Counselor Admission Quotas',
  'Student Fee Portal',
  'HR Staff Recruitment',
  'Academic Course Scheduling',
  'Alumni Relations Campaign',
  'Exam Assessment System',
];

export const TAGS: string[] = [
  'Admissions',
  'IT Support',
  'HR Operations',
  'Database',
  'Student Support',
  'Finance',
  'Marketing',
  'Bugs/Fixes',
];

const getRelativeDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

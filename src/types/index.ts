export interface RFP {
  id: string;
  client: string;
  content?: string;
  mission: string;
  location: string;
  maxRate: number | null;
  createdAt: string | null;
  startDate: string | null;
  status: 'À traiter' | 'Traité';
  assignedTo: string;
  isRead: boolean;
}

export interface SalesRep {
  id: string;
  code: string;
  name: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Prospect {
  id: string;
  textContent?: string;
  fileName?: string;
  fileUrl?: string;
  fileContent?: string;
  targetAccount: string;
  availability: string;
  dailyRate: number | null;
  salaryExpectations: number | null;
  rateExpectations: number | null;
  residence: string;
  mobility: string;
  phone: string;
  email: string;
  status: 'À traiter' | 'Traité';
  assignedTo: string;
  isRead: boolean;
}

export interface RFPFormData {
  content: string;
  assignedTo: string;
}
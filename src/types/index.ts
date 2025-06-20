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
  created_at: string;
}

export interface RFPFormData {
  content: string;
  assignedTo: string;
}
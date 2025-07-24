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
  comments?: string;
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

export interface BoondmanagerProspect {
  id: string;
  textContent?: string;
  fileName?: string;
  fileUrl?: string;
  fileContent?: string;
  selectedNeedId: string;
  selectedNeedTitle: string;
  availability: string;
  dailyRate: number | null;
  salaryExpectations: number | null;
  residence: string;
  mobility: string;
  phone: string;
  email: string;
  status: 'À traiter' | 'Traité';
  assignedTo: string;
  isRead: boolean;
}

export interface Need {
  id: string;
  title: string;
  client: string;
  status: 'Ouvert' | 'En cours' | 'Pourvu' | 'Annulé';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
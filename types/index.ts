export interface IMRNItem {
  _id?: string;
  itemNo: number;
  description: string;
  requestQty: number;
  unit?: string;
  issueQty?: number;
  remarks?: string;
  isIssued?: boolean;
  issuedAt?: string | Date;
}

export type MRNStatus =
  | 'PENDING_SUPERVISOR'
  | 'SUPERVISOR_APPROVED'
  | 'NIRANJAN_APPROVED'
  | 'VINOD_APPROVED'
  | 'APPROVED'
  | 'ISSUED'
  | 'PARTIALLY_ISSUED'
  | 'REJECTED';

export interface IApprovalDetail {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string | Date;
  comments?: string;
  withoutNiranjan?: boolean;
}

export interface IStoresIssueDetail {
  issued: boolean;
  issuedBy?: string;
  issuedAt?: string | Date;
  storesRemarks?: string;
}

export interface IMRN {
  _id?: string;
  mrnNo: string;
  department: string;
  requestedBy: string;
  shift?: string;
  date: string | Date;
  priority?: 'Normal' | 'High' | 'Urgent';
  generalRemarks?: string;
  items: IMRNItem[];
  status: MRNStatus;
  supervisorApproval?: IApprovalDetail;
  niranjanApproval?: IApprovalDetail;
  vinodApproval?: IApprovalDetail;
  storesIssue?: IStoresIssueDetail;
  isLocked?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ISupervisor {
  name: string;
  email?: string;
  phone?: string;
}

export interface IDepartment {
  _id?: string;
  name: string;
  code?: string;
  category?: string;
  supervisors: ISupervisor[];
  active?: boolean;
}

export type UserRole =
  | 'admin'
  | 'management_niranjan'
  | 'management_vinod'
  | 'stores'
  | 'supervisor'
  | 'department';

export interface CurrentUser {
  id: string;
  name: string;
  role: UserRole;
  username?: string;
  department?: string;
  isSupervisor?: boolean;
  isAuthenticated?: boolean;
}

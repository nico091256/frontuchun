// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────
export type Role = 'INITIATOR' | 'APPROVER' | 'ADMIN' | 'EXECUTOR' | 'SECRETARY';

export type DocumentStatus =
  | 'DRAFT'
  | 'IN_APPROVAL'
  | 'APPROVED'
  | 'IN_EXECUTION'
  | 'COMPLETED'
  | 'REJECTED'
  | 'EXPIRED';

export type DocumentType = 'INCOMING' | 'OUTGOING' | 'INTERNAL';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type StepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'SKIPPED';

export type Permission =
  | 'DOC_CREATE'
  | 'DOC_APPROVE'
  | 'DOC_EXECUTE'
  | 'REPORTS_VIEW'
  | 'USERS_MANAGE'
  | 'DOC_DELETE'
  | 'INCOMING_MANAGE'
  | 'TEMPLATES_MANAGE';


// ─────────────────────────────────────────────
// ATTACHMENT
// ─────────────────────────────────────────────
export interface DocumentAttachment {
  id: number;
  documentId: number;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  uploadedById?: number;
  createdAt: string;
}

// ─────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  department?: string;
  position?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  permissions?: Permission[];
  telegramChatId?: string;
  createdAt: string;
  _count?: {
    createdDocuments: number;
    approvalSteps: number;
    notifications: number;
  };
}

// ─────────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────────
export interface Document {
  id: number;
  docNumber: string;
  title: string;
  description: string;
  category: string;
  docType: DocumentType;
  senderOrg?: string;
  senderDocNumber?: string;
  senderDate?: string;
  resolution?: string;
  recipientOrg?: string;
  deliveryMethod?: string;
  parentDocId?: number;
  parentDoc?: Pick<Document, 'id' | 'docNumber' | 'title' | 'docType' | 'status' | 'priority'>;
  childDocs?: Array<Pick<Document, 'id' | 'docNumber' | 'title' | 'docType' | 'status' | 'priority' | 'createdAt'>>;
  attachments?: DocumentAttachment[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: DocumentStatus;
  priority: Priority;
  overallDeadline?: string;
  executionNote?: string;
  executionFileUrl?: string;
  executionFileName?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  completedAt?: string;
  executorViewedAt?: string;
  creatorId: number;
  executorId?: number;
  creator?: Pick<User, 'id' | 'fullName' | 'email' | 'department' | 'position'>;
  executor?: Pick<User, 'id' | 'fullName' | 'department'>;
  approvalSteps?: ApprovalStep[];
  history?: TaskHistory[];
  _count?: { history: number; attachments?: number; childDocs?: number };
}

// ─────────────────────────────────────────────
// APPROVAL STEP
// ─────────────────────────────────────────────
export interface ApprovalStep {
  id: number;
  stepOrder: number;
  stepStatus: StepStatus;
  stepDeadline?: string;
  approverId: number;
  approver: Pick<User, 'id' | 'fullName' | 'email' | 'department' | 'position'>;
  comment?: string;
  actionDate?: string;
  reminderSent: boolean;
  documentId: number;
  document?: Pick<Document, 'id' | 'docNumber' | 'title' | 'status' | 'priority' | 'overallDeadline'> & {
    creator: Pick<User, 'id' | 'fullName' | 'email' | 'department'>;
  };
  createdAt: string;
}

// ─────────────────────────────────────────────
// TASK HISTORY
// ─────────────────────────────────────────────
export interface TaskHistory {
  id: number;
  actionName: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedById?: number;
  performedBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  documentId: number;
  createdAt: string;
}

// ─────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────
export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  userId: number;
  documentId?: number;
  document?: Pick<Document, 'id' | 'docNumber' | 'title'>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// API RESPONSE
// ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginForm {
  email: string;
  password: string;
}

// ─────────────────────────────────────────────
// DOCUMENT FORM
// ─────────────────────────────────────────────
export interface ApproverEntry {
  approverId: number;
  approverName?: string;
  stepDeadline?: string;
}

export interface CreateDocumentForm {
  title: string;
  description: string;
  category: string;
  priority: Priority;
  overallDeadline?: string;
  approvers: ApproverEntry[];
  file?: File;
}

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────
export interface DocumentStats {
  total: number;
  draft: number;
  inApproval: number;
  inExecution: number;
  approved: number;
  rejected: number;
  completed: number;
  expired: number;
  byDocType?: {
    incoming: number;
    outgoing: number;
    internal: number;
  };
  byCategory?: { name: string; value: number }[];
}

// ─────────────────────────────────────────────
// KPI
// ─────────────────────────────────────────────
export interface KpiData {
  creator: {
    totalCreated: number;
    totalRejected: number;
    successRate: number;
  };
  approver: {
    totalSteps: number;
    onTime: number;
    late: number;
    onTimeRate: number;
  };
  executor: {
    totalExecutions: number;
    onTime: number;
    late: number;
    onTimeRate: number;
  };
  overallRate: number;
}

export interface UserKpiEntry {
  user: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'department' | 'position' | 'isActive'>;
  kpi: KpiData;
}

export interface DocumentTemplate {
  id: number;
  title: string;
  category: string;
  docType: DocumentType;
  content: string;
  defaultPriority: Priority;
  description?: string | null;
  createdById?: number | null;
  createdBy?: Pick<User, 'id' | 'fullName' | 'department'> | null;
  createdAt: string;
  updatedAt: string;
}


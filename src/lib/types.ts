export type RoleKey =
  | 'ceo'
  | 'vp'
  | 'marketing_lead'
  | 'executive_followup'
  | 'national_director'
  | 'warehouse_sales'
  | 'cfo'
  | 'executive_office'
  | 'logistics';

export type OpportunityStatus =
  | 'new'
  | 'under_review'
  | 'qualified'
  | 'in_progress'
  | 'won'
  | 'lost'
  | 'withdrawn';

export type TenderStatus =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'cancelled';

export type TenderStageKey =
  | 'intake'
  | 'qualification'
  | 'technical'
  | 'financial'
  | 'submission'
  | 'presentation'
  | 'result';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'high' | 'critical';
export type AlertType = 'deadline' | 'delay' | 'assignment' | 'escalation' | 'reminder' | 'system';

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  title: string;
  role_key: RoleKey;
  department_id: string | null;
  department_name?: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialties: string[];
  is_active: boolean;
  hire_date: string;
}

export interface Role {
  key: RoleKey;
  name: string;
  name_en: string;
  level: number;
  is_admin: boolean;
  description: string;
}

export interface Department {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Permission {
  key: string;
  label: string;
  category: string;
  description: string;
  is_stage_permission: boolean;
}

export interface Opportunity {
  id: string;
  reference: string | null;
  title: string;
  client: string | null;
  entity: string | null;
  city: string | null;
  value: number | null;
  currency: string;
  deadline: string | null;
  publication_date: string | null;
  description: string | null;
  requirements: string | null;
  category: string | null;
  is_external: boolean;
  suggested_by: string | null;
  external_platform: string | null;
  external_url: string | null;
  status: OpportunityStatus;
  attractiveness_score: number | null;
  win_probability: number | null;
  risk_level: RiskLevel;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  suggested_by_member?: TeamMember | null;
  created_by_member?: TeamMember | null;
  assignments?: OpportunityAssignment[];
}

export interface OpportunityAssignment {
  id: string;
  opportunity_id: string;
  team_member_id: string;
  role_in_project: string;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  team_member?: TeamMember;
}

export interface Tender {
  id: string;
  opportunity_id: string | null;
  reference: string | null;
  title: string;
  client: string | null;
  entity: string | null;
  value: number | null;
  currency: string;
  submission_deadline: string | null;
  presentation_date: string | null;
  current_stage: TenderStageKey;
  status: TenderStatus;
  win_probability: number | null;
  risk_level: RiskLevel;
  ai_analysis: Record<string, unknown> | null;
  assigned_lead: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_lead_member?: TeamMember | null;
  stages?: TenderStage[];
  tasks?: Task[];
}

export interface TenderStage {
  id: string;
  tender_id: string;
  stage_key: TenderStageKey;
  stage_label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  sort_order: number;
  started_at: string | null;
  completed_at: string | null;
  owner_id: string | null;
  notes: string | null;
  owner?: TeamMember | null;
}

export interface TenderChecklist {
  id: string;
  tender_id: string;
  type: 'technical' | 'financial' | 'operational' | 'procurement';
  item: string;
  is_checked: boolean;
  checked_by: string | null;
  checked_at: string | null;
  notes: string | null;
  sort_order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  opportunity_id: string | null;
  tender_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  assigned_to_member?: TeamMember | null;
  tender?: { title: string; id: string } | null;
  opportunity?: { title: string; id: string } | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string | null;
  category: string | null;
  opportunity_id: string | null;
  tender_id: string | null;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  current_version: number;
  uploaded_by: string | null;
  tags: string[];
  description: string | null;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  uploaded_by_member?: TeamMember | null;
}

export interface AccountabilityAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  related_type: string | null;
  related_id: string | null;
  target_member: string | null;
  due_date: string | null;
  is_read: boolean;
  read_at: string | null;
  escalation_level: number;
  created_by: string | null;
  created_at: string;
  target_member_obj?: TeamMember | null;
}

export interface LessonLearned {
  id: string;
  title: string;
  category: string;
  outcome: 'positive' | 'negative' | 'neutral';
  context: string | null;
  recommendation: string | null;
  related_opportunity_id: string | null;
  related_tender_id: string | null;
  severity: 'info' | 'warning' | 'important' | 'critical';
  shared_with_all: boolean;
  author_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: TeamMember | null;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  period: string | null;
  status: 'draft' | 'published' | 'archived';
  data: Record<string, unknown> | null;
  content: string | null;
  generated_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalPlatform {
  id: string;
  name: string;
  base_url: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  last_synced_at: string | null;
}

export type PermissionKey =
  | 'dashboard' | 'opportunity_radar' | 'tender_management' | 'ai_advisor'
  | 'tasks' | 'team' | 'documents' | 'accountability' | 'lessons' | 'reports'
  | 'settings'
  | 'stage_intake' | 'stage_qualification' | 'stage_technical' | 'stage_financial'
  | 'stage_submission' | 'stage_presentation' | 'stage_result'
  | 'manage_users' | 'manage_permissions' | 'manage_opportunities'
  | 'assign_tasks' | 'propose_external';

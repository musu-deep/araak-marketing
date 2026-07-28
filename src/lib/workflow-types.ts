import type { Opportunity, Task, TeamMember, Tender } from './types';

export type WorkflowStatus = 'draft' | 'active' | 'at_risk' | 'completed' | 'cancelled';
export type WorkflowStageStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type WorkflowHandoffStatus = 'pending' | 'in_transit' | 'received' | 'returned';

export interface WorkflowTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  project_type: string;
  buffer_percent: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  template_id: string;
  tender_id: string | null;
  opportunity_id: string | null;
  title: string;
  reference: string | null;
  project_type: string;
  received_at: string;
  submission_deadline: string;
  status: WorkflowStatus;
  overall_progress: number;
  current_stage_key: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStageInstance {
  id: string;
  workflow_id: string;
  template_stage_id: string | null;
  stage_key: string;
  stage_name: string;
  owner_role_key: string;
  owner_id: string | null;
  sort_order: number;
  duration_weight: number;
  planned_start: string;
  planned_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: WorkflowStageStatus;
  progress_percent: number;
  expected_output: string | null;
  delay_reason: string | null;
  notes: string | null;
  color: string;
  is_approval: boolean;
  is_critical: boolean;
  created_at: string;
  updated_at: string;
  owner?: TeamMember | null;
}

export interface WorkflowHandoff {
  id: string;
  workflow_id: string;
  from_stage_id: string;
  to_stage_id: string;
  from_member_id: string | null;
  to_member_id: string | null;
  planned_handoff_at: string;
  sent_at: string | null;
  received_at: string | null;
  status: WorkflowHandoffStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledWorkflowTask extends Task {
  start_at: string | null;
  due_at: string | null;
  estimated_hours: number | null;
  progress_percent: number;
  expected_output: string | null;
  workflow_id: string | null;
  workflow_stage_id: string | null;
  task_type: 'standalone' | 'workflow_stage' | 'handoff' | 'approval';
}

export interface WorkflowSourceTender extends Pick<Tender, 'id' | 'title' | 'reference' | 'submission_deadline'> {}
export interface WorkflowSourceOpportunity extends Pick<Opportunity, 'id' | 'title' | 'reference' | 'deadline' | 'publication_date'> {}

export interface WorkflowSnapshot {
  workflow: WorkflowInstance;
  stages: WorkflowStageInstance[];
  handoffs: WorkflowHandoff[];
  tasks: ScheduledWorkflowTask[];
}

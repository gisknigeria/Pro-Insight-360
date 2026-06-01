export interface Evaluation {
  id: string;
  title: string;
  client: string;
  status: "active" | "draft" | "completed" | "archived";
  progress: number;
  responses: number;
  total: number;
  deadline: string;
}

export interface ScoreSummary {
  digitalReadiness: number;
  gisReadiness: number;
  categories: { name: string; score: number }[];
}

export interface Conflict {
  id: string;
  question: string;
  severity: "high" | "medium" | "low";
  respondents: string[];
  values: string[];
}

export interface AIStatus {
  diagnosesGenerated: number;
  pendingReview: number;
  approved: number;
  lastGenerated: string;
}

export interface FormAssignment {
  id: string;
  formName: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  dueDate: string;
  progress: number;
}

export interface RespondentStats {
  totalRespondents: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

export interface DepartmentScore {
  name: string;
  digitalReadiness: number;
  gisReadiness: number;
  completionRate: number;
}
export type IssueSeverity = 'critical' | 'warning' | 'info';

export type IssueType =
  | 'target_leakage'
  | 'class_imbalance'
  | 'missing_data'
  | 'outliers'
  | 'duplicates'
  | 'wrong_dtype'
  | 'high_cardinality'
  | 'low_variance'
  | 'correlation'
  | 'other';

export type ChartType = 'bar' | 'donut' | 'scatter' | 'histogram' | 'none';

export interface Issue {
  id: string;
  severity: IssueSeverity;
  type: IssueType;
  title: string;
  column: string | null;
  description: string;
  fix_code: string;
  chartType?: ChartType;
  chartData?: Record<string, unknown>[];
}

export interface DatasetStats {
  [column: string]: {
    dtype?: string;
    missing_pct?: number;
    unique_count?: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    [key: string]: unknown;
  };
}

export interface AnalyzeResult {
  quality_score: number;
  issues: Issue[];
  stats: DatasetStats;
  sample_data: Record<string, unknown>[];
  summary: string;
  ready_for_training: boolean;
  critical_count: number;
  row_count: number;
  col_count: number;
}

export type DatasetStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DatasetSummary {
  id: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  colCount: number;
  format: string;
  status: DatasetStatus;
  qualityScore: number | null;
  issueCount: number | null;
  criticalCount: number | null;
  summary: string | null;
  issues: Issue[] | null;
  stats: DatasetStats | null;
  createdAt: string;
  completedAt: string | null;
}

export type Plan = 'FREE' | 'PRO';

export type TaskType = 'classification' | 'regression' | 'ranking';

export interface DashboardStats {
  totalDatasets: number;
  avgQualityScore: number;
  totalIssues: number;
  mostCommonIssueType: string | null;
  topIssues: { type: string; count: number }[];
}

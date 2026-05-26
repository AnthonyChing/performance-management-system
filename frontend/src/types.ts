export type StatusType = '進行中' | '待審核' | '草稿' | '已完成' | '待處理';
export type GradeType = 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C';

export interface Goal {
  id: string;
  title: string;
  status: StatusType;
  progress: number;
  dueDate: string;
  description?: string;
}

export interface KPI {
  id: string;
  name: string;
  description: string;
  weight: number;
  target: string;
  actual?: string;
  score?: number;
}

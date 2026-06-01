import type { TeamMember } from '../evaluations/types';

export type { TeamMember };

export interface HistoricalRecord {
  id: string;
  period: string; // maps to cycle name
  memberName: string; // subordinate's name
  role: string; // subordinate's job title
  score: number; // overall calculated score
  overallGrade: string; // final evaluation grade rating
  highlightKpis: string[]; // KPIs accomplishments
  comments: string; // supervisor comments
  teamId: string; // department / team ID
}

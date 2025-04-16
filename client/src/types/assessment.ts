export interface Assessment {
  id: number;
  title: string;
  description?: string;
  status: string;
  roleId: number;
  timeLimit?: number;
  passingScore: number;
  targetLevel?: string;
  dueDate?: string;
  targetCompetencies?: (number | { id: number })[];
  customCompetencies?: string[];
  createdAt: string;
  updatedAt: string;
  createdById: number;
  // ...other fields as needed
}

export interface Role {
  id: number;
  title: string;
  department: string;
}

export interface Competency {
  id: number;
  name: string;
}

export interface AssessmentQuestion {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  competencyId: number;
  competency?: Competency;
}

export interface AssessmentSession {
  id: number;
  assessmentId: number;
  userId: number;
  status: string;
  completedAt?: string;
  startedAt?: string;
}

export interface AssessmentAnswer {
  id: number;
  sessionId: number;
  questionId: number;
  answer: string;
  isCorrect: boolean;
}

export interface AssessmentReport {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendedLearning: string[];
  competencyResults: Array<{
    name: string;
    score: number;
    feedback: string;
  }>;
  level: string;
} 
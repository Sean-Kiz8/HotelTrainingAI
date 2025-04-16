export interface LearningPath {
  id: number;
  userId: number;
  createdById: number;
  position: string;
  level: string;
  targetSkills: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  courses?: LearningPathCourse[];
}

export interface LearningPathCourse {
  id: number;
  courseId: number;
  order: number;
  priority: string;
  course: {
    id: number;
    title: string;
    description: string;
  };
}

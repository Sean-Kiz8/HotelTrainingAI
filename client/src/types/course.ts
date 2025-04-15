// Define types for course-related data structures

export interface ILesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  content?: string;
  order: number;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IModule {
  id: number;
  courseId: number;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lessons?: ILesson[];
}

export interface ICourse {
  id: number;
  title: string;
  description: string;
  department: string;
  instructor: string;
  level: string;
  duration?: number;
  status: string;
  thumbnailUrl?: string;
  participantCount: number;
  completionRate?: number;
  createdAt: string;
  updatedAt: string;
  modules?: IModule[];
}
import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  activities, type Activity, type InsertActivity,
  chatMessages, type ChatMessage, type InsertChatMessage
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course | undefined>;
  listCourses(): Promise<Course[]>;
  listCoursesByDepartment(department: string): Promise<Course[]>;
  
  // Enrollment operations
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollmentData: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  completeEnrollment(id: number): Promise<Enrollment | undefined>;
  listEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  listRecentActivities(limit: number): Promise<Activity[]>;
  
  // Chat operations
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  updateChatResponse(id: number, response: string): Promise<ChatMessage | undefined>;
  listChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private activities: Map<number, Activity>;
  private chatMessages: Map<number, ChatMessage>;
  
  private userId: number;
  private courseId: number;
  private enrollmentId: number;
  private activityId: number;
  private chatMessageId: number;
  
  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.activities = new Map();
    this.chatMessages = new Map();
    
    this.userId = 1;
    this.courseId = 1;
    this.enrollmentId = 1;
    this.activityId = 1;
    this.chatMessageId = 1;
    
    // Add admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      name: "Елена Смирнова",
      email: "admin@hotellearn.com",
      role: "admin",
      department: "Training",
      position: "Training Manager",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80"
    });
    
    // Add some initial courses for demo
    this.createCourse({
      title: "Стандарты обслуживания номеров",
      description: "Обучение персонала правилам и стандартам обслуживания гостиничных номеров.",
      department: "Обслуживание номеров",
      image: "room_service",
      content: { modules: [{ title: "Введение", content: "Содержание модуля..." }] },
      createdById: 1,
      active: true
    });
    
    this.createCourse({
      title: "Обслуживание гостей ресторана",
      description: "Правила сервировки, общения с гостями и стандарты подачи блюд.",
      department: "Ресторан",
      image: "restaurant",
      content: { modules: [{ title: "Введение", content: "Содержание модуля..." }] },
      createdById: 1,
      active: true
    });
    
    this.createCourse({
      title: "Введение для новых сотрудников",
      description: "Базовая информация о гостинице, правилах работы и корпоративной культуре.",
      department: "Адаптация",
      image: "people",
      content: { modules: [{ title: "Введение", content: "Содержание модуля..." }] },
      createdById: 1,
      active: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseId++;
    const newCourse: Course = { 
      ...course, 
      id, 
      participantCount: 0,
      rating: 0,
      ratingCount: 0
    };
    this.courses.set(id, newCourse);
    
    // Create activity for course creation
    await this.createActivity({
      userId: course.createdById,
      courseId: id,
      type: "created_course"
    });
    
    return newCourse;
  }
  
  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseData };
    this.courses.set(id, updatedCourse);
    
    // Create activity for course update
    if (courseData.createdById) {
      await this.createActivity({
        userId: courseData.createdById,
        courseId: id,
        type: "updated_course"
      });
    }
    
    return updatedCourse;
  }
  
  async listCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async listCoursesByDepartment(department: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.department === department
    );
  }
  
  // Enrollment operations
  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    return Array.from(this.enrollments.values()).find(
      (enrollment) => enrollment.userId === userId && enrollment.courseId === courseId
    );
  }
  
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentId++;
    const now = new Date();
    
    const newEnrollment: Enrollment = { 
      ...enrollment, 
      id, 
      startDate: now,
      completionDate: null
    };
    
    this.enrollments.set(id, newEnrollment);
    
    // Update course participant count
    const course = this.courses.get(enrollment.courseId);
    if (course) {
      this.courses.set(course.id, {
        ...course,
        participantCount: course.participantCount + 1
      });
    }
    
    // Create activity for enrollment
    await this.createActivity({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      type: "started_course"
    });
    
    return newEnrollment;
  }
  
  async updateEnrollment(id: number, enrollmentData: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async completeEnrollment(id: number): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const now = new Date();
    const completedEnrollment = { 
      ...enrollment, 
      completed: true, 
      progress: 100,
      completionDate: now 
    };
    
    this.enrollments.set(id, completedEnrollment);
    
    // Create activity for course completion
    await this.createActivity({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      type: "completed_course"
    });
    
    return completedEnrollment;
  }
  
  async listEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.userId === userId
    );
  }
  
  async listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.courseId === courseId
    );
  }
  
  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    
    const newActivity: Activity = { 
      ...activity, 
      id, 
      timestamp: now 
    };
    
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  async listRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
  
  // Chat operations
  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.chatMessageId++;
    const now = new Date();
    
    const newChatMessage: ChatMessage = { 
      ...chatMessage, 
      id, 
      timestamp: now 
    };
    
    this.chatMessages.set(id, newChatMessage);
    return newChatMessage;
  }
  
  async updateChatResponse(id: number, response: string): Promise<ChatMessage | undefined> {
    const chatMessage = this.chatMessages.get(id);
    if (!chatMessage) return undefined;
    
    const updatedChatMessage = { ...chatMessage, response };
    this.chatMessages.set(id, updatedChatMessage);
    return updatedChatMessage;
  }
  
  async listChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((message) => message.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();

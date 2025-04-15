import {
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  activities, type Activity, type InsertActivity,
  chatMessages, type ChatMessage, type InsertChatMessage,
  mediaFiles, type MediaFile, type InsertMediaFile,
  modules, type Module, type InsertModule,
  lessons, type Lesson, type InsertLesson,
  lessonMedia, type LessonMedia, type InsertLessonMedia,
  lessonProgress, type LessonProgress, type InsertLessonProgress,
  // Импорты для геймификации
  achievements, type Achievement, type InsertAchievement,
  userAchievements, type UserAchievement, type InsertUserAchievement,
  rewards, type Reward, type InsertReward,
  userRewards, type UserReward, type InsertUserReward,
  userLevels, type UserLevel, type InsertUserLevel,
  // Импорты для персональных учебных путей
  learningPaths, type LearningPath, type InsertLearningPath,
  learningPathCourses, type LearningPathCourse, type InsertLearningPathCourse,
  // Импорты для системы оценки навыков сотрудников
  employeeRoles, type EmployeeRole, type InsertEmployeeRole,
  competencies, type Competency, type InsertCompetency,
  assessments, type Assessment, type InsertAssessment,
  assessmentQuestions, type AssessmentQuestion, type InsertAssessmentQuestion,
  assessmentSessions, type AssessmentSession, type InsertAssessmentSession,
  assessmentAnswers, type AssessmentAnswer, type InsertAssessmentAnswer,
  // Импорты для микро-обучающего контента
  microLearningContent, type MicroLearningContent, type InsertMicroLearningContent,
  microLearningAssignments, type MicroLearningAssignment, type InsertMicroLearningAssignment,
  microLearningProgress, type MicroLearningProgress, type InsertMicroLearningProgress
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;

  // Дополнительный метод для получения всех учебных планов
  listAllLearningPaths(): Promise<LearningPath[]>;

  // Media operations
  getMediaFile(id: number): Promise<MediaFile | undefined>;
  createMediaFile(mediaFile: InsertMediaFile): Promise<MediaFile>;
  updateMediaFile(id: number, mediaFileData: Partial<InsertMediaFile>): Promise<MediaFile | undefined>;
  deleteMediaFile(id: number): Promise<boolean>;
  listMediaFiles(limit?: number, offset?: number): Promise<MediaFile[]>;
  listMediaFilesByType(mediaType: string, limit?: number, offset?: number): Promise<MediaFile[]>;

  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course | undefined>;
  listCourses(): Promise<Course[]>;
  listCoursesByDepartment(department: string): Promise<Course[]>;

  // Module operations
  getModule(id: number): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: number, moduleData: Partial<InsertModule>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;
  listModulesByCourse(courseId: number): Promise<Module[]>;

  // Lesson operations
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lessonData: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  listLessonsByModule(moduleId: number): Promise<Lesson[]>;

  // Lesson media operations
  getLessonMedia(id: number): Promise<LessonMedia | undefined>;
  createLessonMedia(lessonMedia: InsertLessonMedia): Promise<LessonMedia>;
  deleteLessonMedia(id: number): Promise<boolean>;
  listMediaByLesson(lessonId: number): Promise<LessonMedia[]>;

  // Enrollment operations
  getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollmentData: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  completeEnrollment(id: number): Promise<Enrollment | undefined>;
  listEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;

  // Lesson progress operations
  getLessonProgress(enrollmentId: number, lessonId: number): Promise<LessonProgress | undefined>;
  createLessonProgress(lessonProgress: InsertLessonProgress): Promise<LessonProgress>;
  updateLessonProgress(id: number, progressData: Partial<InsertLessonProgress>): Promise<LessonProgress | undefined>;
  completeLessonProgress(id: number): Promise<LessonProgress | undefined>;
  listLessonProgressByEnrollment(enrollmentId: number): Promise<LessonProgress[]>;

  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  listRecentActivities(limit: number): Promise<Activity[]>;

  // Chat operations
  createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage>;
  updateChatResponse(id: number, response: string): Promise<ChatMessage | undefined>;
  listChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]>;

  // Геймификация - Достижения
  getAchievement(id: number): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement | undefined>;
  deleteAchievement(id: number): Promise<boolean>;
  listAchievements(): Promise<Achievement[]>;
  listAchievementsByType(type: string): Promise<Achievement[]>;

  // Геймификация - Достижения пользователей
  getUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  listUserAchievementsByUser(userId: number): Promise<UserAchievement[]>;

  // Геймификация - Вознаграждения
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  updateReward(id: number, rewardData: Partial<InsertReward>): Promise<Reward | undefined>;
  deleteReward(id: number): Promise<boolean>;
  listRewards(): Promise<Reward[]>;
  listActiveRewards(): Promise<Reward[]>;

  // Геймификация - Вознаграждения пользователей
  getUserReward(userId: number, rewardId: number): Promise<UserReward | undefined>;
  createUserReward(userReward: InsertUserReward): Promise<UserReward>;
  listUserRewardsByUser(userId: number): Promise<UserReward[]>;

  // Геймификация - Уровни пользователей
  getUserLevel(userId: number): Promise<UserLevel | undefined>;
  createUserLevel(userLevel: InsertUserLevel): Promise<UserLevel>;
  updateUserLevel(userId: number, userLevelData: Partial<InsertUserLevel>): Promise<UserLevel | undefined>;
  addUserPoints(userId: number, points: number): Promise<UserLevel | undefined>;
  getLeaderboard(limit?: number): Promise<UserLevel[]>;

  // AI Personal Learning Path operations
  getLearningPath(id: number): Promise<LearningPath | undefined>;
  createLearningPath(learningPath: InsertLearningPath): Promise<LearningPath>;
  updateLearningPath(id: number, learningPathData: Partial<InsertLearningPath>): Promise<LearningPath | undefined>;
  completeLearningPath(id: number): Promise<LearningPath | undefined>;
  deleteLearningPath(id: number): Promise<boolean>;
  listLearningPathsByUser(userId: number): Promise<LearningPath[]>;
  listLearningPathsByCreator(createdById: number): Promise<LearningPath[]>;

  // Learning Path Courses operations
  getLearningPathCourse(id: number): Promise<LearningPathCourse | undefined>;
  createLearningPathCourse(learningPathCourse: InsertLearningPathCourse): Promise<LearningPathCourse>;
  updateLearningPathCourse(id: number, learningPathCourseData: Partial<InsertLearningPathCourse>): Promise<LearningPathCourse | undefined>;
  completeLearningPathCourse(id: number): Promise<LearningPathCourse | undefined>;
  deleteLearningPathCourse(id: number): Promise<boolean>;
  listCoursesByLearningPath(learningPathId: number): Promise<LearningPathCourse[]>;
  listDetailedCoursesByLearningPath(learningPathId: number): Promise<(LearningPathCourse & { course: Course })[]>;

  // ================ Операции с системой оценки навыков сотрудников ================

  // Операции с ролями сотрудников
  getEmployeeRole(id: number): Promise<EmployeeRole | undefined>;
  createEmployeeRole(role: InsertEmployeeRole): Promise<EmployeeRole>;
  updateEmployeeRole(id: number, roleData: Partial<InsertEmployeeRole>): Promise<EmployeeRole | undefined>;
  deleteEmployeeRole(id: number): Promise<boolean>;
  listEmployeeRoles(): Promise<EmployeeRole[]>;
  listEmployeeRolesByDepartment(department: string): Promise<EmployeeRole[]>;

  // Операции с компетенциями
  getCompetency(id: number): Promise<Competency | undefined>;
  createCompetency(competency: InsertCompetency): Promise<Competency>;
  updateCompetency(id: number, competencyData: Partial<InsertCompetency>): Promise<Competency | undefined>;
  deleteCompetency(id: number): Promise<boolean>;
  listCompetencies(): Promise<Competency[]>;
  listCompetenciesByCategory(category: string): Promise<Competency[]>;

  // Операции с ассесментами
  getAssessment(id: number): Promise<Assessment | undefined>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessmentData: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  listAssessments(): Promise<Assessment[]>;
  listAssessmentsByRole(roleId: number): Promise<Assessment[]>;

  // Операции с вопросами для ассесментов
  getAssessmentQuestion(id: number): Promise<AssessmentQuestion | undefined>;
  createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  updateAssessmentQuestion(id: number, questionData: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion | undefined>;
  deleteAssessmentQuestion(id: number): Promise<boolean>;
  listAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]>;
  listAssessmentQuestionsByDifficulty(assessmentId: number, difficulty: string): Promise<AssessmentQuestion[]>;
  listAssessmentQuestionsByCompetency(assessmentId: number, competencyId: number): Promise<AssessmentQuestion[]>;

  // Операции с сессиями прохождения ассесментов
  getAssessmentSession(id: number): Promise<AssessmentSession | undefined>;
  createAssessmentSession(session: InsertAssessmentSession): Promise<AssessmentSession>;
  updateAssessmentSession(id: number, sessionData: Partial<InsertAssessmentSession>): Promise<AssessmentSession | undefined>;
  completeAssessmentSession(id: number, results: any): Promise<AssessmentSession>;
  listAssessmentSessionsByUser(userId: number): Promise<AssessmentSession[]>;
  listAssessmentSessionsByAssessment(assessmentId: number): Promise<AssessmentSession[]>;

  // Операции с ответами пользователя
  getAssessmentAnswer(id: number): Promise<AssessmentAnswer | undefined>;
  createAssessmentAnswer(answer: InsertAssessmentAnswer): Promise<AssessmentAnswer>;
  updateAssessmentAnswer(id: number, answerData: Partial<InsertAssessmentAnswer>): Promise<AssessmentAnswer | undefined>;
  listAssessmentAnswersBySession(sessionId: number): Promise<AssessmentAnswer[]>;

  // Генерация умных ассесментов
  generateAssessmentQuestions(assessmentId: number, count: number): Promise<AssessmentQuestion[]>;

  // Аналитика по ассесментам
  getAssessmentStatistics(assessmentId: number): Promise<any>;
  getUserAssessmentResults(userId: number): Promise<any>;
  getDepartmentAssessmentResults(department: string): Promise<any>;

  // ================ Операции с микро-обучающим контентом ================

  // Операции с микро-обучающим контентом
  getMicroLearningContent(id: number): Promise<MicroLearningContent | undefined>;
  createMicroLearningContent(content: InsertMicroLearningContent): Promise<MicroLearningContent>;
  updateMicroLearningContent(id: number, contentData: Partial<InsertMicroLearningContent>): Promise<MicroLearningContent | undefined>;
  deleteMicroLearningContent(id: number): Promise<boolean>;
  listMicroLearningContent(): Promise<MicroLearningContent[]>;
  listMicroLearningContentByCompetency(competencyId: number): Promise<MicroLearningContent[]>;
  listMicroLearningContentByTargetLevel(level: string): Promise<MicroLearningContent[]>;

  // Операции с назначениями микро-обучающего контента
  getMicroLearningAssignment(id: number): Promise<MicroLearningAssignment | undefined>;
  createMicroLearningAssignment(assignment: InsertMicroLearningAssignment): Promise<MicroLearningAssignment>;
  updateMicroLearningAssignment(id: number, assignmentData: Partial<InsertMicroLearningAssignment>): Promise<MicroLearningAssignment | undefined>;
  completeMicroLearningAssignment(id: number, feedback?: string, rating?: number): Promise<MicroLearningAssignment | undefined>;
  listMicroLearningAssignmentsByUser(userId: number): Promise<MicroLearningAssignment[]>;
  listMicroLearningAssignmentsByContent(contentId: number): Promise<MicroLearningAssignment[]>;

  // Операции с прогрессом по микро-обучающему контенту
  getMicroLearningProgress(id: number): Promise<MicroLearningProgress | undefined>;
  createMicroLearningProgress(progress: InsertMicroLearningProgress): Promise<MicroLearningProgress>;
  updateMicroLearningProgress(id: number, progressData: Partial<InsertMicroLearningProgress>): Promise<MicroLearningProgress | undefined>;
  completeMicroLearningProgress(id: number, quizScore?: number): Promise<MicroLearningProgress | undefined>;
  listMicroLearningProgress(): Promise<MicroLearningProgress[]>;

  // Генерация микро-обучающего контента на основе результатов ассесмента
  generateMicroLearningContent(assessmentSessionId: number, options?: { type?: string, count?: number }): Promise<MicroLearningContent[]>;

  // Рекомендации микро-обучающего контента
  recommendMicroLearningForUser(userId: number, count?: number): Promise<MicroLearningContent[]>;
  recommendMicroLearningByCompetency(competencyId: number, count?: number): Promise<MicroLearningContent[]>;

  // Аналитика по микро-обучающему контенту
  getMicroLearningStatistics(): Promise<any>;
  getUserMicroLearningStatistics(userId: number): Promise<any>;
  getCompetencyMicroLearningStatistics(competencyId: number): Promise<any>;
}

import { db } from "./db";
import { eq, and, or, desc, like, sql, inArray } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Media operations
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [mediaFile] = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return mediaFile;
  }

  async createMediaFile(mediaFile: InsertMediaFile): Promise<MediaFile> {
    const [newMediaFile] = await db.insert(mediaFiles).values(mediaFile).returning();
    return newMediaFile;
  }

  async updateMediaFile(id: number, mediaFileData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [updatedMediaFile] = await db
      .update(mediaFiles)
      .set(mediaFileData)
      .where(eq(mediaFiles.id, id))
      .returning();
    return updatedMediaFile;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return !!result;
  }

  async listMediaFiles(limit: number = 20, offset: number = 0): Promise<MediaFile[]> {
    return await db
      .select()
      .from(mediaFiles)
      .orderBy(desc(mediaFiles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async listMediaFilesByType(mediaType: string, limit: number = 20, offset: number = 0): Promise<MediaFile[]> {
    return await db
      .select()
      .from(mediaFiles)
      .where(sql`${mediaFiles.mediaType} = ${mediaType}`)
      .orderBy(desc(mediaFiles.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();

    // Create activity for course creation
    await this.createActivity({
      userId: course.createdById,
      courseId: newCourse.id,
      type: "created_course"
    });

    return newCourse;
  }

  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(courseData)
      .where(eq(courses.id, id))
      .returning();

    // Create activity for course update
    if (courseData.createdById && updatedCourse) {
      await this.createActivity({
        userId: courseData.createdById,
        courseId: id,
        type: "updated_course"
      });
    }

    return updatedCourse;
  }

  async listCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async listCoursesByDepartment(department: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.department, department));
  }

  // Module operations
  async getModule(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  async updateModule(id: number, moduleData: Partial<InsertModule>): Promise<Module | undefined> {
    const [updatedModule] = await db
      .update(modules)
      .set(moduleData)
      .where(eq(modules.id, id))
      .returning();
    return updatedModule;
  }

  async deleteModule(id: number): Promise<boolean> {
    const result = await db.delete(modules).where(eq(modules.id, id));
    return !!result;
  }

  async listModulesByCourse(courseId: number): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(modules.order);
  }

  // Lesson operations
  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: number, lessonData: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updatedLesson] = await db
      .update(lessons)
      .set(lessonData)
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }

  async deleteLesson(id: number): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return !!result;
  }

  async listLessonsByModule(moduleId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .orderBy(lessons.order);
  }

  // Lesson media operations
  async getLessonMedia(id: number): Promise<LessonMedia | undefined> {
    const [lessonMediaItem] = await db.select().from(lessonMedia).where(eq(lessonMedia.id, id));
    return lessonMediaItem;
  }

  async createLessonMedia(lessonMediaItem: InsertLessonMedia): Promise<LessonMedia> {
    const [newLessonMedia] = await db.insert(lessonMedia).values(lessonMediaItem).returning();
    return newLessonMedia;
  }

  async deleteLessonMedia(id: number): Promise<boolean> {
    const result = await db.delete(lessonMedia).where(eq(lessonMedia.id, id));
    return !!result;
  }

  async listMediaByLesson(lessonId: number): Promise<LessonMedia[]> {
    return await db
      .select()
      .from(lessonMedia)
      .where(eq(lessonMedia.lessonId, lessonId))
      .orderBy(lessonMedia.order);
  }

  // Enrollment operations
  async getEnrollment(userId: number, courseId: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId)
        )
      );
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();

    // Increment course participant count
    await db
      .update(courses)
      .set({
        participantCount: sql`${courses.participantCount} + 1`
      })
      .where(eq(courses.id, enrollment.courseId));

    // Create activity for enrollment
    await this.createActivity({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      type: "started_course"
    });

    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollmentData: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set(enrollmentData)
      .where(eq(enrollments.id, id))
      .returning();
    return updatedEnrollment;
  }

  async completeEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id));

    if (!enrollment) return undefined;

    const [completedEnrollment] = await db
      .update(enrollments)
      .set({
        completed: true,
        progress: 100,
        completionDate: new Date()
      })
      .where(eq(enrollments.id, id))
      .returning();

    // Create activity for course completion
    await this.createActivity({
      userId: enrollment.userId,
      courseId: enrollment.courseId,
      type: "completed_course"
    });

    return completedEnrollment;
  }

  async listEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.userId, userId));
  }

  async listEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId));
  }

  // Lesson progress operations
  async getLessonProgress(enrollmentId: number, lessonId: number): Promise<LessonProgress | undefined> {
    const [progress] = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.enrollmentId, enrollmentId),
          eq(lessonProgress.lessonId, lessonId)
        )
      );
    return progress;
  }

  async createLessonProgress(progress: InsertLessonProgress): Promise<LessonProgress> {
    const [newProgress] = await db.insert(lessonProgress).values(progress).returning();
    return newProgress;
  }

  async updateLessonProgress(id: number, progressData: Partial<InsertLessonProgress>): Promise<LessonProgress | undefined> {
    const [updatedProgress] = await db
      .update(lessonProgress)
      .set(progressData)
      .where(eq(lessonProgress.id, id))
      .returning();
    return updatedProgress;
  }

  async completeLessonProgress(id: number): Promise<LessonProgress | undefined> {
    const [completedProgress] = await db
      .update(lessonProgress)
      .set({
        completed: true,
        completedAt: new Date()
      })
      .where(eq(lessonProgress.id, id))
      .returning();
    return completedProgress;
  }

  async listLessonProgressByEnrollment(enrollmentId: number): Promise<LessonProgress[]> {
    return await db
      .select()
      .from(lessonProgress)
      .where(eq(lessonProgress.enrollmentId, enrollmentId));
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async listRecentActivities(limit: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp))
      .limit(limit);
  }

  // Chat operations
  async createChatMessage(chatMessage: InsertChatMessage): Promise<ChatMessage> {
    const [newChatMessage] = await db.insert(chatMessages).values(chatMessage).returning();
    return newChatMessage;
  }

  async updateChatResponse(id: number, response: string): Promise<ChatMessage | undefined> {
    const [updatedChatMessage] = await db
      .update(chatMessages)
      .set({ response })
      .where(eq(chatMessages.id, id))
      .returning();
    return updatedChatMessage;
  }

  async listChatMessagesByUser(userId: number, limit: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  // Геймификация - Достижения
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, id));
    return achievement;
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const [newAchievement] = await db.insert(achievements).values(achievement).returning();
    return newAchievement;
  }

  async updateAchievement(id: number, achievementData: Partial<InsertAchievement>): Promise<Achievement | undefined> {
    const [updatedAchievement] = await db
      .update(achievements)
      .set(achievementData)
      .where(eq(achievements.id, id))
      .returning();
    return updatedAchievement;
  }

  async deleteAchievement(id: number): Promise<boolean> {
    const result = await db.delete(achievements).where(eq(achievements.id, id));
    return !!result;
  }

  async listAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async listAchievementsByType(type: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.type, type as any));
  }

  // Геймификация - Достижения пользователей
  async getUserAchievement(userId: number, achievementId: number): Promise<UserAchievement | undefined> {
    const [userAchievement] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
    return userAchievement;
  }

  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    // Проверяем, существует ли уже такое достижение у пользователя
    const existingAchievement = await this.getUserAchievement(
      userAchievement.userId,
      userAchievement.achievementId
    );

    if (existingAchievement) {
      return existingAchievement;
    }

    const [newUserAchievement] = await db.insert(userAchievements).values(userAchievement).returning();

    // Получаем информацию о достижении
    const achievement = await this.getAchievement(userAchievement.achievementId);

    if (achievement) {
      // Добавляем очки пользователю
      await this.addUserPoints(userAchievement.userId, achievement.pointsAwarded);

      // Создаем активность
      await this.createActivity({
        userId: userAchievement.userId,
        type: "achievement_earned"
      });
    }

    return newUserAchievement;
  }

  async listUserAchievementsByUser(userId: number): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  // Геймификация - Вознаграждения
  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const [newReward] = await db.insert(rewards).values(reward).returning();
    return newReward;
  }

  async updateReward(id: number, rewardData: Partial<InsertReward>): Promise<Reward | undefined> {
    const [updatedReward] = await db
      .update(rewards)
      .set(rewardData)
      .where(eq(rewards.id, id))
      .returning();
    return updatedReward;
  }

  async deleteReward(id: number): Promise<boolean> {
    const result = await db.delete(rewards).where(eq(rewards.id, id));
    return !!result;
  }

  async listRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }

  async listActiveRewards(): Promise<Reward[]> {
    return await db
      .select()
      .from(rewards)
      .where(eq(rewards.active, true));
  }

  // Геймификация - Вознаграждения пользователей
  async getUserReward(userId: number, rewardId: number): Promise<UserReward | undefined> {
    const [userReward] = await db
      .select()
      .from(userRewards)
      .where(
        and(
          eq(userRewards.userId, userId),
          eq(userRewards.rewardId, rewardId)
        )
      );
    return userReward;
  }

  async createUserReward(userReward: InsertUserReward): Promise<UserReward> {
    const [newUserReward] = await db.insert(userRewards).values(userReward).returning();

    // Создаем активность
    await this.createActivity({
      userId: userReward.userId,
      type: "reward_claimed"
    });

    return newUserReward;
  }

  async listUserRewardsByUser(userId: number): Promise<UserReward[]> {
    return await db
      .select()
      .from(userRewards)
      .where(eq(userRewards.userId, userId));
  }

  // Геймификация - Уровни пользователей
  async getUserLevel(userId: number): Promise<UserLevel | undefined> {
    const [userLevel] = await db
      .select()
      .from(userLevels)
      .where(eq(userLevels.userId, userId));
    return userLevel;
  }

  async createUserLevel(userLevel: InsertUserLevel): Promise<UserLevel> {
    const [newUserLevel] = await db.insert(userLevels).values(userLevel).returning();
    return newUserLevel;
  }

  async updateUserLevel(userId: number, userLevelData: Partial<InsertUserLevel>): Promise<UserLevel | undefined> {
    const [updatedUserLevel] = await db
      .update(userLevels)
      .set(userLevelData)
      .where(eq(userLevels.userId, userId))
      .returning();
    return updatedUserLevel;
  }

  async addUserPoints(userId: number, points: number): Promise<UserLevel | undefined> {
    // Получаем текущий уровень пользователя
    let userLevel = await this.getUserLevel(userId);

    // Если уровень не существует, создаем его
    if (!userLevel) {
      userLevel = await this.createUserLevel({
        userId,
        level: 1,
        points: 0,
        nextLevelPoints: 100
      });
    }

    // Вычисляем новое количество очков
    const newPoints = userLevel.points + points;

    // Проверяем, достиг ли пользователь нового уровня
    if (newPoints >= userLevel.nextLevelPoints) {
      const newLevel = userLevel.level + 1;
      const nextLevelPoints = 100 * Math.pow(1.5, newLevel);

      // Обновляем уровень пользователя
      return await this.updateUserLevel(userId, {
        level: newLevel,
        points: newPoints,
        nextLevelPoints: Math.round(nextLevelPoints)
      });
    } else {
      // Просто обновляем очки
      return await this.updateUserLevel(userId, {
        points: newPoints
      });
    }
  }

  async getLeaderboard(limit: number = 10): Promise<UserLevel[]> {
    return await db
      .select()
      .from(userLevels)
      .orderBy(desc(userLevels.points))
      .limit(limit);
  }

  // AI Personal Learning Path operations
  async getLearningPath(id: number): Promise<LearningPath | undefined> {
    const [learningPath] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return learningPath;
  }

  async createLearningPath(learningPath: InsertLearningPath): Promise<LearningPath> {
    const [newLearningPath] = await db.insert(learningPaths).values(learningPath).returning();

    // Создаем активность для создания персонального плана обучения
    await this.createActivity({
      userId: learningPath.createdById,
      type: "created_learning_path"
    });

    return newLearningPath;
  }

  async updateLearningPath(id: number, learningPathData: Partial<InsertLearningPath>): Promise<LearningPath | undefined> {
    const [updatedLearningPath] = await db
      .update(learningPaths)
      .set({
        ...learningPathData,
        updatedAt: new Date()
      })
      .where(eq(learningPaths.id, id))
      .returning();
    return updatedLearningPath;
  }

  async completeLearningPath(id: number): Promise<LearningPath | undefined> {
    const [learningPath] = await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.id, id));

    if (!learningPath) return undefined;

    const [completedLearningPath] = await db
      .update(learningPaths)
      .set({
        status: "completed",
        progress: 100,
        updatedAt: new Date()
      })
      .where(eq(learningPaths.id, id))
      .returning();

    // Создаем активность для завершения персонального плана обучения
    await this.createActivity({
      userId: learningPath.userId,
      type: "completed_learning_path"
    });

    return completedLearningPath;
  }

  async deleteLearningPath(id: number): Promise<boolean> {
    // Сначала удаляем все связанные курсы
    await db.delete(learningPathCourses).where(eq(learningPathCourses.learningPathId, id));

    // Затем удаляем сам план обучения
    const result = await db.delete(learningPaths).where(eq(learningPaths.id, id));
    return !!result;
  }

  async listLearningPathsByUser(userId: number): Promise<LearningPath[]> {
    return await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.userId, userId))
      .orderBy(desc(learningPaths.createdAt));
  }

  async listLearningPathsByCreator(createdById: number): Promise<LearningPath[]> {
    return await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.createdById, createdById))
      .orderBy(desc(learningPaths.createdAt));
  }

  // Дополнительный метод для получения всех учебных планов
  async listAllLearningPaths(): Promise<LearningPath[]> {
    return await db
      .select()
      .from(learningPaths)
      .orderBy(desc(learningPaths.createdAt));
  }

  // Learning Path Courses operations
  async getLearningPathCourse(id: number): Promise<LearningPathCourse | undefined> {
    const [learningPathCourse] = await db.select().from(learningPathCourses).where(eq(learningPathCourses.id, id));
    return learningPathCourse;
  }

  async createLearningPathCourse(learningPathCourse: InsertLearningPathCourse): Promise<LearningPathCourse> {
    const [newLearningPathCourse] = await db.insert(learningPathCourses).values(learningPathCourse).returning();

    // Обновляем статус плана обучения
    await this.updateLearningPathProgress(learningPathCourse.learningPathId);

    return newLearningPathCourse;
  }

  async updateLearningPathCourse(id: number, learningPathCourseData: Partial<InsertLearningPathCourse>): Promise<LearningPathCourse | undefined> {
    const [oldLearningPathCourse] = await db
      .select()
      .from(learningPathCourses)
      .where(eq(learningPathCourses.id, id));

    if (!oldLearningPathCourse) return undefined;

    const [updatedLearningPathCourse] = await db
      .update(learningPathCourses)
      .set(learningPathCourseData)
      .where(eq(learningPathCourses.id, id))
      .returning();

    // Обновляем статус плана обучения
    await this.updateLearningPathProgress(oldLearningPathCourse.learningPathId);

    return updatedLearningPathCourse;
  }

  async completeLearningPathCourse(id: number): Promise<LearningPathCourse | undefined> {
    const [learningPathCourse] = await db
      .select()
      .from(learningPathCourses)
      .where(eq(learningPathCourses.id, id));

    if (!learningPathCourse) return undefined;

    const [completedLearningPathCourse] = await db
      .update(learningPathCourses)
      .set({
        completed: true
      })
      .where(eq(learningPathCourses.id, id))
      .returning();

    // Обновляем статус плана обучения
    await this.updateLearningPathProgress(learningPathCourse.learningPathId);

    return completedLearningPathCourse;
  }

  async deleteLearningPathCourse(id: number): Promise<boolean> {
    const [learningPathCourse] = await db
      .select()
      .from(learningPathCourses)
      .where(eq(learningPathCourses.id, id));

    if (!learningPathCourse) return false;

    const result = await db.delete(learningPathCourses).where(eq(learningPathCourses.id, id));

    // Обновляем статус плана обучения
    await this.updateLearningPathProgress(learningPathCourse.learningPathId);

    return !!result;
  }

  async listCoursesByLearningPath(learningPathId: number): Promise<LearningPathCourse[]> {
    return await db
      .select()
      .from(learningPathCourses)
      .where(eq(learningPathCourses.learningPathId, learningPathId))
      .orderBy(learningPathCourses.order);
  }

  async listDetailedCoursesByLearningPath(learningPathId: number): Promise<(LearningPathCourse & { course: Course })[]> {
    // Используем другое имя переменной, чтобы избежать конфликта с импортом таблицы
    const pathCourses = await db
      .select()
      .from(learningPathCourses)
      .where(eq(learningPathCourses.learningPathId, learningPathId))
      .orderBy(learningPathCourses.order);

    // Получаем подробную информацию о каждом курсе
    const detailedCourses = await Promise.all(
      pathCourses.map(async (lpc) => {
        const course = await this.getCourse(lpc.courseId);
        return {
          ...lpc,
          course: course!
        };
      })
    );

    return detailedCourses;
  }

  // Вспомогательный метод для обновления прогресса учебного плана
  private async updateLearningPathProgress(learningPathId: number): Promise<void> {
    const learningPathCourses = await this.listCoursesByLearningPath(learningPathId);
    const totalCourses = learningPathCourses.length;

    if (totalCourses === 0) return;

    const completedCourses = learningPathCourses.filter(course => course.completed).length;
    const progress = Math.floor((completedCourses / totalCourses) * 100);

    // Обновляем прогресс в плане обучения
    await db
      .update(learningPaths)
      .set({
        progress,
        status: progress === 100 ? "completed" : "active",
        updatedAt: new Date()
      })
      .where(eq(learningPaths.id, learningPathId));
  }

  // ================ Операции с системой оценки навыков сотрудников ================

  // Операции с ролями сотрудников
  async getEmployeeRole(id: number): Promise<EmployeeRole | undefined> {
    const [role] = await db.select().from(employeeRoles).where(eq(employeeRoles.id, id));
    return role;
  }

  async createEmployeeRole(role: InsertEmployeeRole): Promise<EmployeeRole> {
    const [newRole] = await db.insert(employeeRoles).values(role).returning();
    return newRole;
  }

  async updateEmployeeRole(id: number, roleData: Partial<InsertEmployeeRole>): Promise<EmployeeRole | undefined> {
    const [updatedRole] = await db
      .update(employeeRoles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(employeeRoles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteEmployeeRole(id: number): Promise<boolean> {
    const result = await db.delete(employeeRoles).where(eq(employeeRoles.id, id));
    return !!result;
  }

  async listEmployeeRoles(): Promise<EmployeeRole[]> {
    return await db
      .select()
      .from(employeeRoles)
      .where(eq(employeeRoles.active, true))
      .orderBy(employeeRoles.title);
  }

  async listEmployeeRolesByDepartment(department: string): Promise<EmployeeRole[]> {
    return await db
      .select()
      .from(employeeRoles)
      .where(and(
        eq(employeeRoles.department, department),
        eq(employeeRoles.active, true)
      ))
      .orderBy(employeeRoles.title);
  }

  // Операции с компетенциями
  async getCompetency(id: number): Promise<Competency | undefined> {
    const [competency] = await db.select().from(competencies).where(eq(competencies.id, id));
    return competency;
  }

  async createCompetency(competency: InsertCompetency): Promise<Competency> {
    const [newCompetency] = await db.insert(competencies).values(competency).returning();
    return newCompetency;
  }

  async updateCompetency(id: number, competencyData: Partial<InsertCompetency>): Promise<Competency | undefined> {
    const [updatedCompetency] = await db
      .update(competencies)
      .set({ ...competencyData, updatedAt: new Date() })
      .where(eq(competencies.id, id))
      .returning();
    return updatedCompetency;
  }

  async deleteCompetency(id: number): Promise<boolean> {
    const result = await db.delete(competencies).where(eq(competencies.id, id));
    return !!result;
  }

  async listCompetencies(): Promise<Competency[]> {
    return await db
      .select()
      .from(competencies)
      .orderBy(competencies.name);
  }

  async listCompetenciesByCategory(category: string): Promise<Competency[]> {
    return await db
      .select()
      .from(competencies)
      .where(eq(competencies.category, category))
      .orderBy(competencies.name);
  }

  // Операции с ассесментами
  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment;
  }

  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db.insert(assessments).values(assessment).returning();
    return newAssessment;
  }

  async updateAssessment(id: number, assessmentData: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set({ ...assessmentData, updatedAt: new Date() })
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }

  async deleteAssessment(id: number): Promise<boolean> {
    const result = await db.delete(assessments).where(eq(assessments.id, id));
    return !!result;
  }

  async listAssessments(): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .orderBy(desc(assessments.createdAt));
  }

  async listAssessmentsByRole(roleId: number): Promise<Assessment[]> {
    return await db
      .select()
      .from(assessments)
      .where(eq(assessments.roleId, roleId))
      .orderBy(desc(assessments.createdAt));
  }

  // Операции с вопросами для ассесментов
  async getAssessmentQuestion(id: number): Promise<AssessmentQuestion | undefined> {
    const [question] = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.id, id));
    return question;
  }

  async createAssessmentQuestion(question: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const [newQuestion] = await db.insert(assessmentQuestions).values(question).returning();
    return newQuestion;
  }

  async updateAssessmentQuestion(id: number, questionData: Partial<InsertAssessmentQuestion>): Promise<AssessmentQuestion | undefined> {
    const [updatedQuestion] = await db
      .update(assessmentQuestions)
      .set({ ...questionData, updatedAt: new Date() })
      .where(eq(assessmentQuestions.id, id))
      .returning();
    return updatedQuestion;
  }

  async deleteAssessmentQuestion(id: number): Promise<boolean> {
    const result = await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, id));
    return !!result;
  }

  async listAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, assessmentId));
  }

  async listAssessmentQuestionsByDifficulty(assessmentId: number, difficulty: string): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .where(and(
        eq(assessmentQuestions.assessmentId, assessmentId),
        sql`${assessmentQuestions.difficulty} = ${difficulty}`
      ));
  }

  async listAssessmentQuestionsByCompetency(assessmentId: number, competencyId: number): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .where(and(
        eq(assessmentQuestions.assessmentId, assessmentId),
        eq(assessmentQuestions.competencyId, competencyId)
      ));
  }

  // Операции с сессиями прохождения ассесментов
  async getAssessmentSession(id: number): Promise<AssessmentSession | undefined> {
    const [session] = await db.select().from(assessmentSessions).where(eq(assessmentSessions.id, id));
    return session;
  }

  async createAssessmentSession(session: InsertAssessmentSession): Promise<AssessmentSession> {
    // Получаем данные о сотруднике и ассесменте
    const user = await this.getUser(session.userId);
    const assessment = await this.getAssessment(session.assessmentId);

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (!assessment) {
      throw new Error('Ассесмент не найден');
    }

    // Проверяем, что у сотрудника нет активной сессии для этого ассесмента
    const existingSessions = await db
      .select()
      .from(assessmentSessions)
      .where(
        and(
          eq(assessmentSessions.userId, session.userId),
          eq(assessmentSessions.assessmentId, session.assessmentId),
          or(
            eq(assessmentSessions.status, 'created'),
            eq(assessmentSessions.status, 'in_progress')
          )
        )
      );

    if (existingSessions.length > 0) {
      // Если уже есть активная сессия, возвращаем ее
      return existingSessions[0];
    }

    // Создаем сессию
    const [newSession] = await db.insert(assessmentSessions).values(session).returning();

    // Создаем активность для назначения ассесмента
    await this.createActivity({
      userId: session.userId,
      type: "assigned_assessment",
      timestamp: new Date()
    });

    return newSession;
  }

  async updateAssessmentSession(id: number, sessionData: Partial<InsertAssessmentSession>): Promise<AssessmentSession | undefined> {
    const [updatedSession] = await db
      .update(assessmentSessions)
      .set(sessionData)
      .where(eq(assessmentSessions.id, id))
      .returning();
    return updatedSession;
  }

  async completeAssessmentSession(id: number, results: any): Promise<AssessmentSession> {
    // Получаем все ответы пользователя
    const answers = await this.listAssessmentAnswersBySession(id);

    // Получаем сессию
    const [session] = await db.select().from(assessmentSessions).where(eq(assessmentSessions.id, id));

    if (!session) {
      throw new Error('Сессия не найдена');
    }

    // Получаем все вопросы ассесмента
    const questions = await this.listAssessmentQuestions(session.assessmentId);

    // Подсчитываем общий балл
    const totalPossiblePoints = questions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = answers.reduce((sum, a) => sum + (a.points || 0), 0);

    // Подсчитываем процент правильных ответов
    const scorePercentage = totalPossiblePoints > 0
      ? Math.floor((earnedPoints / totalPossiblePoints) * 100)
      : 0;

    // Определяем уровень сотрудника на основе процента
    let level: 'junior' | 'middle' | 'senior' = 'junior';
    if (scorePercentage >= 80) {
      level = 'senior';
    } else if (scorePercentage >= 60) {
      level = 'middle';
    }

    // Анализируем результаты по компетенциям
    const competencyResults: {[key: number]: {id: number, name: string, score: number, maxScore: number, percentage: number}} = {};

    // Группируем вопросы по компетенциям
    for (const question of questions) {
      const competencyId = question.competencyId;

      if (!competencyResults[competencyId]) {
        const competency = await this.getCompetency(competencyId);
        if (competency) {
          competencyResults[competencyId] = {
            id: competencyId,
            name: competency.name,
            score: 0,
            maxScore: 0,
            percentage: 0
          };
        }
      }

      if (competencyResults[competencyId]) {
        competencyResults[competencyId].maxScore += question.points;
      }
    }

    // Добавляем заработанные баллы на основе ответов
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && answer.isCorrect && competencyResults[question.competencyId]) {
        competencyResults[question.competencyId].score += answer.points || 0;
      }
    }

    // Расчитываем проценты для каждой компетенции
    for (const competencyId in competencyResults) {
      const result = competencyResults[competencyId];
      result.percentage = result.maxScore > 0
        ? Math.floor((result.score / result.maxScore) * 100)
        : 0;
    }

    // Обновляем сессию с результатами
    const [completedSession] = await db
      .update(assessmentSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        score: earnedPoints,
        scorePercentage,
        timeSpent: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
        competenciesResult: competencyResults,
        level
      })
      .where(eq(assessmentSessions.id, id))
      .returning();

    // ИДЕЯ: На основе результатов можно автоматически создать персональный план обучения
    // TODO: Автоматическое создание плана обучения на основе результатов

    if (!completedSession) {
      throw new Error('Не удалось обновить сессию');
    }

    return completedSession;
  }

  async listAssessmentSessionsByUser(userId: number): Promise<AssessmentSession[]> {
    return await db
      .select()
      .from(assessmentSessions)
      .where(eq(assessmentSessions.userId, userId))
      .orderBy(desc(assessmentSessions.startedAt));
  }

  async listAssessmentSessionsByAssessment(assessmentId: number): Promise<AssessmentSession[]> {
    return await db
      .select()
      .from(assessmentSessions)
      .where(eq(assessmentSessions.assessmentId, assessmentId))
      .orderBy(desc(assessmentSessions.startedAt));
  }

  // Операции с ответами пользователя
  async getAssessmentAnswer(id: number): Promise<AssessmentAnswer | undefined> {
    const [answer] = await db.select().from(assessmentAnswers).where(eq(assessmentAnswers.id, id));
    return answer;
  }

  async createAssessmentAnswer(answer: InsertAssessmentAnswer): Promise<AssessmentAnswer> {
    // Получаем вопрос, на который отвечают
    const [question] = await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.id, answer.questionId));

    if (!question) {
      throw new Error('Вопрос не найден');
    }

    // Проверяем правильность ответа
    let isCorrect = false;
    let points = 0;

    // Сравниваем ответы в зависимости от типа вопроса
    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      isCorrect = answer.answer === question.correctAnswer;
    } else if (question.type === 'text_answer') {
      // Для текстовых ответов можно использовать более гибкую проверку
      // Например, проверять на наличие ключевых слов
      const userAnswer = answer.answer.toLowerCase().trim();
      const correctAnswer = question.correctAnswer?.toLowerCase().trim() || '';

      // Простая проверка - совпадает ли ответ хотя бы частично
      isCorrect = userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer);
    } else if (question.type === 'image_based') {
      // Для вопросов с изображениями просто сравниваем ответы
      isCorrect = answer.answer === question.correctAnswer;
    }

    // Если ответ правильный, начисляем баллы
    if (isCorrect) {
      points = question.points;
    }

    // Создаем запись об ответе с указанием правильности и баллов
    const answerData = {
      ...answer,
      isCorrect,
      points
    };

    const [newAnswer] = await db.insert(assessmentAnswers).values(answerData).returning();
    return newAnswer;
  }

  async updateAssessmentAnswer(id: number, answerData: Partial<InsertAssessmentAnswer>): Promise<AssessmentAnswer | undefined> {
    const [updatedAnswer] = await db
      .update(assessmentAnswers)
      .set(answerData)
      .where(eq(assessmentAnswers.id, id))
      .returning();
    return updatedAnswer;
  }

  async listAssessmentAnswersBySession(sessionId: number): Promise<AssessmentAnswer[]> {
    return await db
      .select()
      .from(assessmentAnswers)
      .where(eq(assessmentAnswers.sessionId, sessionId))
      .orderBy(assessmentAnswers.answeredAt);
  }

  // Генерация вопросов для ассесмента с помощью ИИ
  async generateAssessmentQuestions(assessmentId: number, count: number): Promise<AssessmentQuestion[]> {
    // Получаем информацию об ассесменте
    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) {
      throw new Error('Ассесмент не найден');
    }

    // Получаем роль, для которой создается ассесмент
    const role = await this.getEmployeeRole(assessment.roleId);
    if (!role) {
      throw new Error('Роль не найдена');
    }

    // Получаем целевые компетенции
    let competenciesToUse = [];

    if (assessment.targetCompetencies && Array.isArray(assessment.targetCompetencies)) {
      // Если в ассесменте указаны конкретные компетенции
      const competencyIds = assessment.targetCompetencies.map(c => c.id || c);
      competenciesToUse = await Promise.all(
        competencyIds.map(async (id) => await this.getCompetency(typeof id === 'object' ? id.id : id))
      );
      competenciesToUse = competenciesToUse.filter(Boolean); // Удаляем null/undefined
    }

    // Если компетенции не указаны, берем все компетенции для данной роли
    if (competenciesToUse.length === 0) {
      if (role.requiredCompetencies && Array.isArray(role.requiredCompetencies)) {
        const competencyIds = role.requiredCompetencies.map(c => c.id || c);
        competenciesToUse = await Promise.all(
          competencyIds.map(async (id) => await this.getCompetency(typeof id === 'object' ? id.id : id))
        );
        competenciesToUse = competenciesToUse.filter(Boolean);
      }
    }

    // Если и в роли нет компетенций, берем все доступные компетенции
    if (competenciesToUse.length === 0) {
      competenciesToUse = await this.listCompetencies();
    }

    if (competenciesToUse.length === 0) {
      throw new Error('Не найдены компетенции для генерации вопросов');
    }

    // Используем функцию из utils/openai.ts для генерации вопросов
    const { generateAssessmentQuestions } = await import('./utils/openai');

    try {
      const result = await generateAssessmentQuestions(
        role.title,
        role.department,
        competenciesToUse,
        count,
        true // Включаем объяснения к ответам
      );

      // Создаем вопросы в базе данных
      const createdQuestions = [];

      for (const questionData of result.questions) {
        const insertData: InsertAssessmentQuestion = {
          assessmentId,
          text: questionData.text,
          type: questionData.type as any,
          options: questionData.options ? questionData.options : undefined,
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation,
          points: questionData.points,
          competencyId: questionData.competencyId,
          difficulty: questionData.difficulty as any,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const newQuestion = await this.createAssessmentQuestion(insertData);
        createdQuestions.push(newQuestion);
      }

      return createdQuestions;
    } catch (error) {
      console.error('Ошибка при генерации вопросов:', error);
      throw new Error(`Не удалось сгенерировать вопросы: ${error.message}`);
    }

    // TODO: Добавить настоящую интеграцию с OpenAI

    // В реальном сценарии мы бы получили ответ от API и обработали его
    // Сейчас просто возвращаем пустой массив
    return [];
  }

  // Аналитика по ассесментам
  async getAssessmentStatistics(assessmentId: number): Promise<any> {
    const sessions = await this.listAssessmentSessionsByAssessment(assessmentId);

    // Базовая статистика
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const averageScore = sessions.reduce((sum, s) => sum + (s.scorePercentage || 0), 0) / totalSessions || 0;

    // Распределение по уровням
    const levelDistribution = {
      junior: sessions.filter(s => s.level === 'junior').length,
      middle: sessions.filter(s => s.level === 'middle').length,
      senior: sessions.filter(s => s.level === 'senior').length
    };

    // Статистика по компетенциям
    const competencyStats: { [key: number]: { name: string, averageScore: number, count: number } } = {};

    for (const session of sessions) {
      if (session.competenciesResult) {
        const results = session.competenciesResult as any;

        for (const competencyId in results) {
          const result = results[competencyId];

          if (!competencyStats[competencyId]) {
            competencyStats[competencyId] = {
              name: result.name,
              averageScore: 0,
              count: 0
            };
          }

          competencyStats[competencyId].averageScore += result.percentage;
          competencyStats[competencyId].count++;
        }
      }
    }

    // Рассчитываем средние баллы по компетенциям
    for (const competencyId in competencyStats) {
      const stat = competencyStats[competencyId];
      stat.averageScore = stat.count > 0 ? stat.averageScore / stat.count : 0;
    }

    return {
      totalSessions,
      completedSessions,
      averageScore,
      levelDistribution,
      competencyStats
    };
  }

  async getUserAssessmentResults(userId: number): Promise<any> {
    const sessions = await this.listAssessmentSessionsByUser(userId);

    const results = [];

    for (const session of sessions) {
      const assessment = await this.getAssessment(session.assessmentId);
      const role = assessment ? await this.getEmployeeRole(assessment.roleId) : null;

      results.push({
        sessionId: session.id,
        assessmentId: session.assessmentId,
        assessmentTitle: assessment?.title || 'Неизвестный ассесмент',
        role: role?.title || 'Неизвестная роль',
        status: session.status,
        score: session.score,
        scorePercentage: session.scorePercentage,
        level: session.level,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        timeSpent: session.timeSpent,
        competenciesResult: session.competenciesResult
      });
    }

    return results;
  }

  async getDepartmentAssessmentResults(department: string): Promise<any> {
    // Получаем роли в данном департаменте
    const roles = await this.listEmployeeRolesByDepartment(department);

    const departmentResults = {
      department,
      roleResults: [],
      overall: {
        totalSessions: 0,
        completedSessions: 0,
        averageScore: 0,
        levelDistribution: {
          junior: 0,
          middle: 0,
          senior: 0
        }
      }
    } as any;

    let totalScoreSum = 0;

    // Получаем результаты по каждой роли
    for (const role of roles) {
      // Получаем ассесменты для этой роли
      const assessmentsForRole = await this.listAssessmentsByRole(role.id);

      const roleResult = {
        roleId: role.id,
        roleTitle: role.title,
        assessments: [],
        totalSessions: 0,
        completedSessions: 0,
        averageScore: 0
      } as any;

      // Для каждого ассесмента получаем статистику
      for (const assessment of assessmentsForRole) {
        const stats = await this.getAssessmentStatistics(assessment.id);

        roleResult.assessments.push({
          assessmentId: assessment.id,
          title: assessment.title,
          ...stats
        });

        // Добавляем к общей статистике роли
        roleResult.totalSessions += stats.totalSessions;
        roleResult.completedSessions += stats.completedSessions;
        totalScoreSum += stats.averageScore * stats.completedSessions;

        // Добавляем к общей статистике департамента
        departmentResults.overall.totalSessions += stats.totalSessions;
        departmentResults.overall.completedSessions += stats.completedSessions;
        departmentResults.overall.levelDistribution.junior += stats.levelDistribution.junior;
        departmentResults.overall.levelDistribution.middle += stats.levelDistribution.middle;
        departmentResults.overall.levelDistribution.senior += stats.levelDistribution.senior;
      }

      // Рассчитываем средний балл для роли
      roleResult.averageScore = roleResult.completedSessions > 0
        ? totalScoreSum / roleResult.completedSessions
        : 0;

      departmentResults.roleResults.push(roleResult);
    }

    // Рассчитываем средний балл для департамента
    departmentResults.overall.averageScore = departmentResults.overall.completedSessions > 0
      ? totalScoreSum / departmentResults.overall.completedSessions
      : 0;

    return departmentResults;
  }

  // ================ Реализация операций с микро-обучающим контентом ================

  // Операции с микро-обучающим контентом
  async getMicroLearningContent(id: number): Promise<MicroLearningContent | undefined> {
    const [content] = await db.select().from(microLearningContent).where(eq(microLearningContent.id, id));
    return content;
  }

  async createMicroLearningContent(content: InsertMicroLearningContent): Promise<MicroLearningContent> {
    const [newContent] = await db.insert(microLearningContent).values(content).returning();
    return newContent;
  }

  async updateMicroLearningContent(id: number, contentData: Partial<InsertMicroLearningContent>): Promise<MicroLearningContent | undefined> {
    const [updatedContent] = await db
      .update(microLearningContent)
      .set(contentData)
      .where(eq(microLearningContent.id, id))
      .returning();
    return updatedContent;
  }

  async deleteMicroLearningContent(id: number): Promise<boolean> {
    const result = await db.delete(microLearningContent).where(eq(microLearningContent.id, id));
    return !!result;
  }

  async listMicroLearningContent(): Promise<MicroLearningContent[]> {
    return await db.select().from(microLearningContent);
  }

  async listMicroLearningContentByCompetency(competencyId: number): Promise<MicroLearningContent[]> {
    return await db
      .select()
      .from(microLearningContent)
      .where(eq(microLearningContent.competency_id, competencyId));
  }

  async listMicroLearningContentByTargetLevel(level: string): Promise<MicroLearningContent[]> {
    return await db
      .select()
      .from(microLearningContent)
      .where(eq(microLearningContent.target_level, level as any));
  }

  // Операции с назначениями микро-обучающего контента
  async getMicroLearningAssignment(id: number): Promise<MicroLearningAssignment | undefined> {
    const [assignment] = await db.select().from(microLearningAssignments).where(eq(microLearningAssignments.id, id));
    return assignment;
  }

  async createMicroLearningAssignment(assignment: InsertMicroLearningAssignment): Promise<MicroLearningAssignment> {
    const [newAssignment] = await db.insert(microLearningAssignments).values(assignment).returning();

    // Создаем активность
    await this.createActivity({
      userId: assignment.user_id,
      type: "assigned_micro_learning"
    });

    return newAssignment;
  }

  async updateMicroLearningAssignment(id: number, assignmentData: Partial<InsertMicroLearningAssignment>): Promise<MicroLearningAssignment | undefined> {
    const [updatedAssignment] = await db
      .update(microLearningAssignments)
      .set(assignmentData)
      .where(eq(microLearningAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async completeMicroLearningAssignment(id: number, feedback?: string, rating?: number): Promise<MicroLearningAssignment | undefined> {
    const [assignment] = await db.select().from(microLearningAssignments).where(eq(microLearningAssignments.id, id));

    if (!assignment) return undefined;

    const updateData: Partial<InsertMicroLearningAssignment> = {
      is_completed: true,
      completed_at: new Date()
    };

    if (feedback) {
      updateData.user_feedback = feedback;
    }

    if (rating) {
      updateData.effectiveness_rating = rating;
    }

    const [completedAssignment] = await db
      .update(microLearningAssignments)
      .set(updateData)
      .where(eq(microLearningAssignments.id, id))
      .returning();

    // Создаем активность
    await this.createActivity({
      userId: assignment.user_id,
      type: "completed_micro_learning"
    });

    return completedAssignment;
  }

  async listMicroLearningAssignmentsByUser(userId: number): Promise<MicroLearningAssignment[]> {
    return await db
      .select()
      .from(microLearningAssignments)
      .where(eq(microLearningAssignments.user_id, userId))
      .orderBy(desc(microLearningAssignments.assigned_at));
  }

  async listMicroLearningAssignmentsByContent(contentId: number): Promise<MicroLearningAssignment[]> {
    return await db
      .select()
      .from(microLearningAssignments)
      .where(eq(microLearningAssignments.content_id, contentId));
  }

  // Операции с прогрессом по микро-обучающему контенту
  async getMicroLearningProgress(id: number): Promise<MicroLearningProgress | undefined> {
    const [progress] = await db.select().from(microLearningProgress).where(eq(microLearningProgress.id, id));
    return progress;
  }
  
  async listMicroLearningProgress(): Promise<MicroLearningProgress[]> {
    return await db.select().from(microLearningProgress);
  }

  async createMicroLearningProgress(progress: InsertMicroLearningProgress): Promise<MicroLearningProgress> {
    const [newProgress] = await db.insert(microLearningProgress).values(progress).returning();
    return newProgress;
  }

  async updateMicroLearningProgress(id: number, progressData: Partial<InsertMicroLearningProgress>): Promise<MicroLearningProgress | undefined> {
    const [updatedProgress] = await db
      .update(microLearningProgress)
      .set(progressData)
      .where(eq(microLearningProgress.id, id))
      .returning();
    return updatedProgress;
  }

  async completeMicroLearningProgress(id: number, quizScore?: number): Promise<MicroLearningProgress | undefined> {
    const updateData: Partial<InsertMicroLearningProgress> = {
      progress_percentage: 100,
      completed_at: new Date()
    };

    if (quizScore !== undefined) {
      updateData.quiz_score = quizScore;
    }

    const [completedProgress] = await db
      .update(microLearningProgress)
      .set(updateData)
      .where(eq(microLearningProgress.id, id))
      .returning();

    return completedProgress;
  }

  // Генерация микро-обучающего контента на основе результатов ассесмента
  async generateMicroLearningContent(assessmentSessionId: number, options: { type?: string, count?: number } = {}): Promise<MicroLearningContent[]> {
    const { type = 'text', count = 3 } = options;

    // Получаем данные о сессии ассесмента
    const [session] = await db
      .select({
        session: assessmentSessions,
        assessment: assessments,
        role: employeeRoles
      })
      .from(assessmentSessions)
      .where(eq(assessmentSessions.id, assessmentSessionId))
      .innerJoin(assessments, eq(assessmentSessions.assessment_id, assessments.id))
      .innerJoin(employeeRoles, eq(assessments.role_id, employeeRoles.id));

    if (!session || !session.session.competencies_result) {
      throw new Error("Сессия оценки не найдена или не содержит результатов по компетенциям");
    }

    // Находим компетенции, по которым самые низкие результаты
    const competenciesResults = Object.entries(session.session.competencies_result)
      .map(([id, result]) => ({
        id: parseInt(id),
        name: result.name,
        percentage: result.percentage
      }))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, count);

    if (competenciesResults.length === 0) {
      return [];
    }

    const microLearningContents: MicroLearningContent[] = [];

    // Для каждой компетенции генерируем микро-обучающий контент
    for (const compResult of competenciesResults) {
      // Получаем детали компетенции
      const [competency] = await db
        .select()
        .from(competencies)
        .where(eq(competencies.id, compResult.id));

      if (!competency) continue;

      // Создаем микро-обучающий контент
      const content = await this.createMicroLearningContent({
        title: `Улучшение навыка "${competency.name}"`,
        type: type as any,
        content: `# Микро-обучение по компетенции "${competency.name}"

## Описание
${competency.description}

## Ключевые аспекты
- Важность навыка ${competency.name} для роли ${session.role.title}
- Практические рекомендации по развитию
- Успешные практики в отельном бизнесе

## Упражнения для улучшения
1. Регулярная практика определенных аспектов навыка
2. Наблюдение за коллегами с высоким уровнем этого навыка
3. Применение полученных знаний в реальных рабочих ситуациях

## Рекомендации
Уделяйте особое внимание развитию этого навыка, так как результаты оценки показали, что это одна из областей, требующих улучшения.`,
        competency_id: compResult.id,
        target_level: session.session.level as any,
        duration_minutes: 10,
        created_by_id: 1, // По умолчанию создатель - администратор
        keywords: [competency.name, competency.category, session.role.title, session.role.department]
      });

      microLearningContents.push(content);

      // Назначаем микро-обучающий контент пользователю
      await this.createMicroLearningAssignment({
        user_id: session.session.user_id,
        content_id: content.id,
        assessment_session_id: assessmentSessionId,
        competency_id: compResult.id
      });
    }

    return microLearningContents;
  }

  // Рекомендации микро-обучающего контента
  async recommendMicroLearningForUser(userId: number, count: number = 5): Promise<MicroLearningContent[]> {
    try {
      // Получаем последнюю сессию оценки пользователя
      const [lastSession] = await db
        .select()
        .from(assessmentSessions)
        .where(eq(assessmentSessions.userId, userId))
        .orderBy(desc(assessmentSessions.completedAt))
        .limit(1);

      if (!lastSession) {
        // Если нет данных о сессии, возвращаем случайный контент
        return await db
          .select()
          .from(microLearningContent)
          .limit(count);
      }

      // Если есть сессия, рекомендуем контент по компетенциям с низким результатом
      const weakCompetencies = [];
      
      // Безопасно обрабатываем результаты компетенций
      if (lastSession.competenciesResult && typeof lastSession.competenciesResult === 'object') {
        for (const [id, result] of Object.entries(lastSession.competenciesResult)) {
          if (result && typeof result === 'object' && 'percentage' in result) {
            const percentage = (result as any).percentage;
            if (percentage < 70) {
              weakCompetencies.push(parseInt(id));
            }
          }
        }
      }

      if (weakCompetencies.length === 0) {
        // Если нет слабых компетенций, возвращаем контент по уровню
        return await db
          .select()
          .from(microLearningContent)
          .where(eq(microLearningContent.target_level, lastSession.level || 'junior'))
          .limit(count);
      }

      // Безопасно формируем запрос для слабых компетенций
      if (weakCompetencies.length === 1) {
        // Если только одна слабая компетенция
        return await db
          .select()
          .from(microLearningContent)
          .where(eq(microLearningContent.competency_id, weakCompetencies[0]))
          .limit(count);
      } else {
        // Если несколько слабых компетенций, используем sql шаблон
        return await db
          .select()
          .from(microLearningContent)
          .where(sql`${microLearningContent.competency_id} IN (${sql.join(weakCompetencies)})`)
          .limit(count);
      }
    } catch (error) {
      console.error("Error in recommendMicroLearningForUser:", error);
      // Возвращаем пустой массив в случае ошибки
      return [];
    }
  }

  async recommendMicroLearningByCompetency(competencyId: number, count: number = 3): Promise<MicroLearningContent[]> {
    // Получаем контент по указанной компетенции
    const content = await db
      .select()
      .from(microLearningContent)
      .where(eq(microLearningContent.competency_id, competencyId))
      .limit(count);

    return content;
  }

  // Аналитика по микро-обучающему контенту
  async getMicroLearningStatistics(): Promise<any> {
    try {
      // Получаем общую статистику по микро-обучающему контенту
      const [totalContent] = await db
        .select({ count: sql`count(*)` })
        .from(microLearningContent);

      const [totalAssignments] = await db
        .select({ count: sql`count(*)` })
        .from(microLearningAssignments);

      // Безопасно проверяем количество назначений и завершенных назначений
      let completedAssignmentsCount = 0;
      if (totalAssignments && parseInt(totalAssignments.count.toString()) > 0) {
        const [completedAssignments] = await db
          .select({ count: sql`count(*)` })
          .from(microLearningAssignments)
          .where(eq(microLearningAssignments.is_completed, true));
          
        if (completedAssignments) {
          completedAssignmentsCount = parseInt(completedAssignments.count.toString());
        }
      }

      // Статистика по типам контента (только если есть контент)
      let contentByType = [];
      if (totalContent && parseInt(totalContent.count.toString()) > 0) {
        contentByType = await db
          .select({
            type: microLearningContent.type,
            count: sql`count(*)`
          })
          .from(microLearningContent)
          .groupBy(microLearningContent.type);
      }

      // Статистика по целевым уровням (только если есть контент)
      let contentByLevel = [];
      if (totalContent && parseInt(totalContent.count.toString()) > 0) {
        contentByLevel = await db
          .select({
            level: microLearningContent.target_level,
            count: sql`count(*)`
          })
          .from(microLearningContent)
          .groupBy(microLearningContent.target_level);
      }

      // Статистика по компетенциям (только если есть контент и компетенции)
      let contentByCompetency = [];
      if (totalContent && parseInt(totalContent.count.toString()) > 0) {
        contentByCompetency = await db
          .select({
            competencyId: competencies.id,
            name: competencies.name,
            category: competencies.category,
            count: sql`count(*)`
          })
          .from(microLearningContent)
          .innerJoin(competencies, eq(microLearningContent.competency_id, competencies.id))
          .groupBy(competencies.id, competencies.name, competencies.category);
      }

      // Преобразуем строковые значения count в числа
      const totalContentCount = totalContent ? parseInt(totalContent.count.toString()) : 0;
      const totalAssignmentsCount = totalAssignments ? parseInt(totalAssignments.count.toString()) : 0;
      
      // Вычисляем процент завершения
      const completionRate = totalAssignmentsCount > 0 
        ? (completedAssignmentsCount / totalAssignmentsCount) * 100 
        : 0;

      return {
        totalContent: totalContentCount,
        totalAssignments: totalAssignmentsCount,
        completedAssignments: completedAssignmentsCount,
        completionRate: completionRate,
        contentByType: contentByType.map(item => ({
          type: item.type,
          count: parseInt(item.count.toString())
        })),
        contentByLevel: contentByLevel.map(item => ({
          level: item.level,
          count: parseInt(item.count.toString())
        })),
        contentByCompetency: contentByCompetency
      };
    } catch (error) {
      console.error("Error in getMicroLearningStatistics:", error);
      return {
        totalContent: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        completionRate: 0,
        contentByType: [],
        contentByLevel: [],
        contentByCompetency: []
      };
    }
  }

  async getUserMicroLearningStatistics(userId: number): Promise<any> {
    // Получаем назначения для пользователя
    const assignments = await db
      .select({
        assignment: microLearningAssignments,
        content: microLearningContent,
        competency: competencies
      })
      .from(microLearningAssignments)
      .where(eq(microLearningAssignments.user_id, userId))
      .innerJoin(microLearningContent, eq(microLearningAssignments.content_id, microLearningContent.id))
      .leftJoin(competencies, eq(microLearningContent.competency_id, competencies.id));

    // Получаем прогресс по заданиям
    const assignmentIds = assignments.map(a => a.assignment.id);

    let progress = [];
    if (assignmentIds.length > 0) {
      progress = await db
        .select()
        .from(microLearningProgress)
        .where(sql`${microLearningProgress.assignment_id} IN (${sql.join(assignmentIds)})`);
    }

    // Статистика по компетенциям
    const competencyStats: { [key: string]: any } = {};

    for (const assignment of assignments) {
      if (!assignment.competency) continue;

      const compId = assignment.competency.id.toString();

      if (!competencyStats[compId]) {
        competencyStats[compId] = {
          id: assignment.competency.id,
          name: assignment.competency.name,
          category: assignment.competency.category,
          totalAssignments: 0,
          completedAssignments: 0,
          averageRating: 0,
          totalRating: 0
        };
      }

      competencyStats[compId].totalAssignments++;

      if (assignment.assignment.is_completed) {
        competencyStats[compId].completedAssignments++;
      }

      if (assignment.assignment.effectiveness_rating) {
        competencyStats[compId].totalRating += assignment.assignment.effectiveness_rating;
        competencyStats[compId].averageRating = competencyStats[compId].totalRating / competencyStats[compId].completedAssignments;
      }
    }

    return {
      userId,
      totalAssignments: assignments.length,
      completedAssignments: assignments.filter(a => a.assignment.is_completed).length,
      completionRate: assignments.length ? (assignments.filter(a => a.assignment.is_completed).length / assignments.length) * 100 : 0,
      averageRating: assignments.filter(a => a.assignment.effectiveness_rating !== null).length ?
        assignments.reduce((sum, a) => sum + (a.assignment.effectiveness_rating || 0), 0) /
        assignments.filter(a => a.assignment.effectiveness_rating !== null).length : 0,
      competencyStats: Object.values(competencyStats),
      contentTypes: [...new Set(assignments.map(a => a.content.type))],
      recentAssignments: assignments
        .sort((a, b) => new Date(b.assignment.assigned_at).getTime() - new Date(a.assignment.assigned_at).getTime())
        .slice(0, 5)
        .map(a => ({
          id: a.assignment.id,
          contentId: a.content.id,
          title: a.content.title,
          type: a.content.type,
          assignedAt: a.assignment.assigned_at,
          isCompleted: a.assignment.is_completed,
          completedAt: a.assignment.completed_at
        }))
    };
  }

  async getCompetencyMicroLearningStatistics(competencyId: number): Promise<any> {
    // Получаем данные о компетенции
    const [competency] = await db.select().from(competencies).where(eq(competencies.id, competencyId));

    if (!competency) {
      throw new Error("Компетенция не найдена");
    }

    // Получаем микро-обучающий контент для этой компетенции
    const content = await db
      .select()
      .from(microLearningContent)
      .where(eq(microLearningContent.competency_id, competencyId));

    // Получаем назначения для этого контента
    const contentIds = content.map(c => c.id);

    let assignments = [];
    if (contentIds.length > 0) {
      assignments = await db
        .select()
        .from(microLearningAssignments)
        .where(sql`${microLearningAssignments.content_id} IN (${contentIds.join(',')})`);
    }

    // Статистика по типам контента
    const contentByType: { [key: string]: number } = {};

    for (const c of content) {
      contentByType[c.type] = (contentByType[c.type] || 0) + 1;
    }

    // Статистика по целевым уровням
    const contentByLevel: { [key: string]: number } = {};

    for (const c of content) {
      contentByLevel[c.target_level] = (contentByLevel[c.target_level] || 0) + 1;
    }

    // Статистика по эффективности обучения
    const effectivenessRatings = assignments
      .filter(a => a.effectiveness_rating !== null)
      .map(a => a.effectiveness_rating);

    const averageEffectiveness = effectivenessRatings.length
      ? effectivenessRatings.reduce((sum, rating) => sum + rating, 0) / effectivenessRatings.length
      : 0;

    return {
      competencyId,
      name: competency.name,
      category: competency.category,
      description: competency.description,
      contentCount: content.length,
      assignmentsCount: assignments.length,
      completedAssignmentsCount: assignments.filter(a => a.is_completed).length,
      completionRate: assignments.length ? (assignments.filter(a => a.is_completed).length / assignments.length) * 100 : 0,
      averageEffectiveness,
      contentByType,
      contentByLevel,
      mostPopularContent: content
        .map(c => ({
          contentId: c.id,
          title: c.title,
          assignmentsCount: assignments.filter(a => a.content_id === c.id).length,
          completionsCount: assignments.filter(a => a.content_id === c.id && a.is_completed).length,
          averageRating: assignments.filter(a => a.content_id === c.id && a.effectiveness_rating !== null).length
            ? assignments
                .filter(a => a.content_id === c.id && a.effectiveness_rating !== null)
                .reduce((sum, a) => sum + a.effectiveness_rating, 0) /
              assignments.filter(a => a.content_id === c.id && a.effectiveness_rating !== null).length
            : 0
        }))
        .sort((a, b) => b.assignmentsCount - a.assignmentsCount)
        .slice(0, 5)
    };
  }
}

// Use PostgreSQL database instead of in-memory storage
export const storage = new DatabaseStorage();

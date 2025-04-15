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
  learningPathCourses, type LearningPathCourse, type InsertLearningPathCourse
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  
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
}

import { db } from "./db";
import { eq, and, desc, like, sql } from "drizzle-orm";

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
      .orderBy([desc(userLevels.level), desc(userLevels.points)])
      .limit(limit);
  }
}

// Use PostgreSQL database instead of in-memory storage
export const storage = new DatabaseStorage();

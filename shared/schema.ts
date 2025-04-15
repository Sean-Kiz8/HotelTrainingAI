import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum для типов медиафайлов
export const mediaTypeEnum = pgEnum("media_type", [
  "image", 
  "video", 
  "audio", 
  "document", 
  "presentation"
]);

// Enum для уровней сотрудников в обучении
export const employeeLevelEnum = pgEnum("employee_level", [
  "junior",
  "middle",
  "senior"
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("staff"), // admin or staff
  department: text("department"),
  position: text("position"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Media files table
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  mediaType: mediaTypeEnum("media_type").notNull(),
  path: text("path").notNull(),
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  metadata: jsonb("metadata"),
  uploadedById: integer("uploaded_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  department: text("department").notNull(),
  image: text("image"),
  content: jsonb("content"),
  createdById: integer("created_by_id").notNull(),
  active: boolean("active").notNull().default(true),
  participantCount: integer("participant_count").notNull().default(0),
  rating: integer("rating").default(0),
  ratingCount: integer("rating_count").default(0),
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  participantCount: true,
  rating: true,
  ratingCount: true,
});

// Course modules table
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  duration: text("duration"),
  order: integer("order").notNull().default(0),
  type: text("type").notNull(), // video, text, quiz, assignment
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Lesson media relation table
export const lessonMedia = pgTable("lesson_media", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull(),
  mediaId: integer("media_id").notNull(),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLessonMediaSchema = createInsertSchema(lessonMedia).omit({
  id: true,
  createdAt: true,
});

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  startDate: timestamp("start_date").notNull().defaultNow(),
  completionDate: timestamp("completion_date"),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  startDate: true,
  completionDate: true,
});

// Lesson progress table
export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  score: integer("score"),
  timeSpent: integer("time_spent"),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({
  id: true,
  lastAccessedAt: true,
  completedAt: true,
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id"),
  type: text("type").notNull(), // completed_course, created_course, started_course, updated_course
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// Геймификация
export const achievementTypes = pgEnum("achievement_type", [
  "course_completion", // Завершение курса
  "module_completion", // Завершение модуля
  "perfect_score",     // Идеальный результат в тесте
  "fast_completion",   // Быстрое завершение
  "consistent_learner" // Регулярное обучение
]);

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: achievementTypes("type").notNull(),
  icon: text("icon"), // Название иконки из lucide-react
  pointsAwarded: integer("points_awarded").notNull().default(0),
  badgeColor: text("badge_color").default("primary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  metadata: jsonb("metadata"),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const rewardTypes = pgEnum("reward_type", [
  "badge",     // Значок
  "certificate", // Сертификат
  "points",    // Очки
  "bonus"      // Бонус (например, выходной)
]);

export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: rewardTypes("type").notNull(),
  pointsRequired: integer("points_required").default(0),
  image: text("image"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  createdAt: true,
});

export const userRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rewardId: integer("reward_id").notNull(),
  claimedAt: timestamp("claimed_at").notNull().defaultNow(),
  status: text("status").default("claimed"),
});

export const insertUserRewardSchema = createInsertSchema(userRewards).omit({
  id: true,
  claimedAt: true,
});

// Таблица для рейтинга и уровней сотрудников
export const userLevels = pgTable("user_levels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  level: integer("level").notNull().default(1),
  points: integer("points").notNull().default(0),
  nextLevelPoints: integer("next_level_points").notNull().default(100),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
});

export const insertUserLevelSchema = createInsertSchema(userLevels).omit({
  id: true,
  lastActivity: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type LessonMedia = typeof lessonMedia.$inferSelect;
export type InsertLessonMedia = z.infer<typeof insertLessonMediaSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type UserReward = typeof userRewards.$inferSelect;
export type InsertUserReward = z.infer<typeof insertUserRewardSchema>;

export type UserLevel = typeof userLevels.$inferSelect;
export type InsertUserLevel = z.infer<typeof insertUserLevelSchema>;

// AI-генерированные персональные планы обучения
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Для кого создан план обучения
  createdById: integer("created_by_id").notNull(), // Кто создал план обучения
  position: text("position").notNull(), // Должность сотрудника
  level: employeeLevelEnum("level").notNull(), // Уровень сотрудника (junior, middle, senior)
  targetSkills: text("target_skills").notNull(), // Целевые навыки через запятую
  status: text("status").notNull().default("active"), // active, completed, canceled
  progress: integer("progress").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  progress: true,
  createdAt: true,
  updatedAt: true,
});

// Курсы, включенные в персональный план обучения
export const learningPathCourses = pgTable("learning_path_courses", {
  id: serial("id").primaryKey(),
  learningPathId: integer("learning_path_id").notNull(),
  courseId: integer("course_id").notNull(),
  order: integer("order").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  priority: text("priority").notNull().default("normal"), // high, normal, low
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLearningPathCourseSchema = createInsertSchema(learningPathCourses).omit({
  id: true,
  createdAt: true,
});

export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;

export type LearningPathCourse = typeof learningPathCourses.$inferSelect;
export type InsertLearningPathCourse = z.infer<typeof insertLearningPathCourseSchema>;

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

// Enum для типов вопросов в ассесментах
export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "true_false",
  "text_answer",
  "image_based"
]);

// Enum для уровней сложности вопросов
export const difficultyLevelEnum = pgEnum("difficulty_level", [
  "easy",
  "medium",
  "hard"
]);

// Enum для статусов ассесмента
export const assessmentStatusEnum = pgEnum("assessment_status", [
  "created",
  "in_progress",
  "completed"
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
  preferences: jsonb("preferences"), // Для хранения настроек пользователя
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

// Таблица для настроек пользователя
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  courseCompletions: boolean("course_completions").notNull().default(true),
  newCourses: boolean("new_courses").notNull().default(true),
  systemUpdates: boolean("system_updates").notNull().default(false),
  preferences: jsonb("preferences"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  updatedAt: true,
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

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;

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

// ================ Система оценки компетенций сотрудников ================

// Таблица ролей сотрудников и их компетенций
export const employeeRoles = pgTable("employee_roles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // Название роли (например, "Администратор ресепшн", "Официант")
  description: text("description"),
  department: text("department").notNull(), // Отдел
  requiredCompetencies: jsonb("required_competencies"), // Список необходимых компетенций и их уровень
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

export const insertEmployeeRoleSchema = createInsertSchema(employeeRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Таблица компетенций (скилов)
export const competencies = pgTable("competencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Категория компетенции (технические, soft skills и т.д.)
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCompetencySchema = createInsertSchema(competencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Таблица ассесментов
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  roleId: integer("role_id").notNull(), // Для какой роли проводится ассесмент
  status: assessmentStatusEnum("status").notNull().default("created"),
  targetCompetencies: jsonb("target_competencies"), // Список оцениваемых компетенций
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  timeLimit: integer("time_limit"), // Ограничение по времени в минутах (null - без ограничения)
  passingScore: integer("passing_score").notNull().default(70), // Проходной балл в процентах
  dueDate: timestamp("due_date"), // Дата, до которой ассесмент должен быть завершен
  targetLevel: employeeLevelEnum("target_level"), // Целевой уровень сотрудника для ассесмента
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Таблица вопросов для ассесментов
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  text: text("text").notNull(), // Текст вопроса
  type: questionTypeEnum("type").notNull(), // Тип вопроса
  options: jsonb("options"), // Варианты ответов для multiple_choice и true_false
  correctAnswer: text("correct_answer"), // Правильный ответ
  explanation: text("explanation"), // Объяснение правильного ответа
  points: integer("points").notNull().default(1), // Количество баллов за правильный ответ
  mediaId: integer("media_id"), // Связь с медиафайлом, если вопрос содержит изображение
  competencyId: integer("competency_id").notNull(), // Какую компетенцию оценивает вопрос
  difficulty: difficultyLevelEnum("difficulty").notNull(), // Уровень сложности
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Таблица сессий прохождения ассесментов
export const assessmentSessions = pgTable("assessment_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  assessmentId: integer("assessment_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  status: assessmentStatusEnum("status").notNull().default("created"),
  score: integer("score"), // Итоговый балл
  scorePercentage: integer("score_percentage"), // Процент правильных ответов
  timeSpent: integer("time_spent"), // Время в секундах, затраченное на прохождение
  competenciesResult: jsonb("competencies_result"), // Детальный результат по компетенциям
  level: employeeLevelEnum("level"), // Определенный уровень сотрудника
  recommendedLearningPathId: integer("recommended_learning_path_id"), // Рекомендованный план обучения
});

export const insertAssessmentSessionSchema = createInsertSchema(assessmentSessions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
  score: true,
  scorePercentage: true,
  timeSpent: true,
  competenciesResult: true,
  level: true,
  recommendedLearningPathId: true,
});

// Таблица ответов пользователя на вопросы ассесмента
export const assessmentAnswers = pgTable("assessment_answers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull(), // Ответ пользователя
  isCorrect: boolean("is_correct"), // Правильный ли ответ
  points: integer("points").default(0), // Полученные баллы
  timeSpent: integer("time_spent"), // Время в секундах, затраченное на ответ
  answeredAt: timestamp("answered_at").notNull().defaultNow(),
});

export const insertAssessmentAnswerSchema = createInsertSchema(assessmentAnswers).omit({
  id: true,
  answeredAt: true,
});

// Type definitions для новых таблиц
export type EmployeeRole = typeof employeeRoles.$inferSelect;
export type InsertEmployeeRole = z.infer<typeof insertEmployeeRoleSchema>;

export type Competency = typeof competencies.$inferSelect;
export type InsertCompetency = z.infer<typeof insertCompetencySchema>;

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;

export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type InsertAssessmentSession = z.infer<typeof insertAssessmentSessionSchema>;

export type AssessmentAnswer = typeof assessmentAnswers.$inferSelect;
export type InsertAssessmentAnswer = z.infer<typeof insertAssessmentAnswerSchema>;

// Enum для типов ресурсов курса
export const courseResourceTypeEnum = pgEnum("course_resource_type", [
  "attachment",
  "reference",
  "example",
  "practice"
]);

// Таблица ресурсов курса (связь курса с медиафайлами)
export const courseResources = pgTable("course_resources", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  mediaId: integer("media_id").notNull().references(() => mediaFiles.id),
  type: courseResourceTypeEnum("type").notNull().default("attachment"),
  description: text("description"),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseResourceSchema = createInsertSchema(courseResources).omit({
  id: true,
  createdAt: true,
});

// Enum для типов микро-обучающего контента
export const microLearningTypeEnum = pgEnum("micro_learning_type", [
  "text",
  "video",
  "quiz",
  "interactive"
]);

// Микро-обучающий контент
export const microLearningContent = pgTable("micro_learning_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: microLearningTypeEnum("type").notNull(),
  content: text("content").notNull(),
  media_id: integer("media_id").references(() => mediaFiles.id),
  competency_id: integer("competency_id").references(() => competencies.id),
  target_level: employeeLevelEnum("target_level").notNull(),
  duration_minutes: integer("duration_minutes").notNull().default(5),
  created_by_id: integer("created_by_id").notNull().references(() => users.id),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  has_quiz: boolean("has_quiz").notNull().default(false),
  keywords: text("keywords").array(),
});

export const insertMicroLearningContentSchema = createInsertSchema(microLearningContent).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Назначение микро-обучающего контента пользователям
export const microLearningAssignments = pgTable("micro_learning_assignments", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  content_id: integer("content_id").notNull().references(() => microLearningContent.id),
  assessment_session_id: integer("assessment_session_id").references(() => assessmentSessions.id),
  competency_id: integer("competency_id").references(() => competencies.id),
  assigned_at: timestamp("assigned_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
  is_completed: boolean("is_completed").notNull().default(false),
  user_feedback: text("user_feedback"),
  effectiveness_rating: integer("effectiveness_rating"),
});

export const insertMicroLearningAssignmentSchema = createInsertSchema(microLearningAssignments).omit({
  id: true,
  assigned_at: true,
});

// Прогресс по выполнению микро-обучающего контента
export const microLearningProgress = pgTable("micro_learning_progress", {
  id: serial("id").primaryKey(),
  assignment_id: integer("assignment_id").notNull().references(() => microLearningAssignments.id),
  progress_percentage: integer("progress_percentage").notNull().default(0),
  last_accessed_at: timestamp("last_accessed_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
  time_spent_seconds: integer("time_spent_seconds").notNull().default(0),
  quiz_score: integer("quiz_score"),
});

export const insertMicroLearningProgressSchema = createInsertSchema(microLearningProgress).omit({
  id: true,
  last_accessed_at: true,
});

export type CourseResource = typeof courseResources.$inferSelect;
export type InsertCourseResource = z.infer<typeof insertCourseResourceSchema>;

export type MicroLearningContent = typeof microLearningContent.$inferSelect;
export type InsertMicroLearningContent = z.infer<typeof insertMicroLearningContentSchema>;

export type MicroLearningAssignment = typeof microLearningAssignments.$inferSelect;
export type InsertMicroLearningAssignment = z.infer<typeof insertMicroLearningAssignmentSchema>;

export type MicroLearningProgress = typeof microLearningProgress.$inferSelect;
export type InsertMicroLearningProgress = z.infer<typeof insertMicroLearningProgressSchema>;

import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import {
  insertUserSchema, insertCourseSchema,
  insertEnrollmentSchema, insertActivitySchema,
  insertChatMessageSchema, insertMediaFileSchema,
  insertModuleSchema, insertLessonSchema, insertLessonMediaSchema,
  insertLearningPathSchema, insertLearningPathCourseSchema,
  insertEmployeeRoleSchema, insertCompetencySchema,
  insertAssessmentSchema, insertAssessmentQuestionSchema,
  insertAssessmentSessionSchema, insertAssessmentAnswerSchema,
  mediaTypeEnum, employeeLevelEnum, questionTypeEnum,
  difficultyLevelEnum, assessmentStatusEnum,
  learningPaths, courses, assessmentSessions
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { setupAuth } from "./auth";
import { CacheManager, coursesCache, usersCache, mediaCache, analyticsCache, assessmentsCache } from './utils/cache-manager';
import OpenAI from "openai";
import { generateAILearningPath } from "./utils/openai";
import multer from "multer";
import path from "path-browserify";
import fs from "fs-extra";
import sharp from "sharp";
import {
  generateLearningPath,
  analyzeUserProfileAndRecommend,
  generateCourseInsight
} from "./utils/openai";

// Initialize OpenAI для совместимости с существующим кодом
// (новый код будет использовать функции из ./utils/openai)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer storage
const uploadDir = "./uploads";
const mediaDir = "./uploads/media";
const thumbnailsDir = "./uploads/thumbnails";

// Ensure uploads directories exist
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(mediaDir);
fs.ensureDirSync(thumbnailsDir);

// Set up multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, mediaDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to check file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check mime type
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/webm', 'video/quicktime',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/webm',
    // Documents
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/html'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'));
  }
};

const upload = multer({
  storage: uploadStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max size
});

// Helper function to get media type from mime type
function getMediaTypeFromMimeType(mimeType: string): "image" | "video" | "audio" | "document" | "presentation" {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.startsWith('application/vnd.ms-powerpoint') ||
             mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml')) {
    return 'presentation';
  } else {
    return 'document';
  }
}

// Helper function to generate thumbnail for supported media types
async function generateThumbnail(filePath: string, mediaType: string, thumbnailPath: string): Promise<string | null> {
  try {
    if (mediaType === 'image') {
      await sharp(filePath)
        .resize(300, 300, { fit: 'inside' })
        .toFile(thumbnailPath);
      return thumbnailPath;
    }

    // For other media types, we would need more specific tools
    // For now, just return null for non-image files
    return null;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Настройка аутентификации на основе сессий
  setupAuth(app);
  // User routes
  app.get("/api/users", async (req, res) => {
    const users = await storage.listUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Auth route for login
  app.post("/api/auth/login", async (req, res) => {
    const loginSchema = z.object({
      username: z.string(),
      password: z.string(),
    });

    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, we would use sessions or JWT
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        avatar: user.avatar
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Course routes
  app.get("/api/courses", async (req, res) => {
    const department = req.query.department as string | undefined;
    const useCache = req.query.cache !== 'false'; // По умолчанию используем кеш
    
    // Формируем ключ кеша в зависимости от параметров
    const cacheKey = department ? `courses_dept_${department}` : 'courses_all';
    
    // Пытаемся получить данные из кеша, если кеширование разрешено
    if (useCache) {
      const cachedData = await coursesCache.get(cacheKey);
      if (cachedData) {
        console.log(`[Cache Hit] Using cached data for ${cacheKey}`);
        return res.json(cachedData);
      }
      console.log(`[Cache Miss] No cached data for ${cacheKey}`);
    }
    
    // Получаем данные из базы данных
    let courses;
    if (department) {
      courses = await storage.listCoursesByDepartment(department);
    } else {
      courses = await storage.listCourses();
    }
    
    // Сохраняем в кеш, если кеширование разрешено
    if (useCache) {
      await coursesCache.set(cacheKey, courses);
      console.log(`[Cache Set] Saved data to cache for ${cacheKey}`);
    }
    
    res.json(courses);
  });

  app.get("/api/courses/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const course = await storage.getCourse(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  });

  app.post("/api/courses", async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);

      // Создаем запись в активити
      await storage.createActivity({
        userId: req.user?.id || req.body.userId,
        courseId: course.id,
        type: "created_course"
      });

      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  // API для генерации курса с использованием ИИ
  app.post("/api/courses/generate", async (req, res) => {
    try {
      const { files, settings, useAI } = req.body;

      // Проверяем обязательные поля
      if (!settings || !settings.title || !settings.description) {
        return res.status(400).json({ error: "Отсутствуют обязательные параметры курса" });
      }

      // Получаем информацию о загруженных файлах
      const mediaFiles = [];
      if (files && files.length > 0) {
        for (const fileId of files) {
          const mediaFile = await storage.getMediaFile(parseInt(fileId));
          if (mediaFile) {
            mediaFiles.push(mediaFile);
          }
        }
      }

      // Если выбран режим ИИ-генерации
      if (useAI) {
        // Формируем краткое summary файлов (название и тип)
        let filesSummary = '';
        if (mediaFiles.length > 0) {
          filesSummary = mediaFiles.map(f => `- ${f.filename || f.originalFilename || 'Файл'} (${f.mediaType || f.mimeType || 'тип не определён'})`).join('\n');
        }
        // Импортируем функцию генерации через OpenAI
        const { generateCourseWithAI } = await import("./utils/openai");
        const aiCourse = await generateCourseWithAI(settings, filesSummary);

        // Сохраняем курс и модули/уроки в БД
        const newCourse = await storage.createCourse({
          title: aiCourse.title,
          description: aiCourse.description,
          createdById: req.user?.id || req.body.createdById || 1,
          department: "training",
          image: null,
          content: null,
          active: true
        });
        const modules = [];
        for (let i = 0; i < aiCourse.modules.length; i++) {
          const m = aiCourse.modules[i];
          const newModule = await storage.createModule({
            courseId: newCourse.id,
            title: m.title,
            description: m.description,
            order: i
          });
          const lessons = [];
          for (let j = 0; j < m.lessons.length; j++) {
            const l = m.lessons[j];
            const newLesson = await storage.createLesson({
              moduleId: newModule.id,
              title: l.title,
              content: l.content,
              order: j,
              duration: l.duration ? String(l.duration) : '15',
              type: l.type || 'text'
            });
            lessons.push({
              id: newLesson.id,
              title: newLesson.title,
              content: newLesson.content,
              duration: newLesson.duration,
              type: newLesson.type
            });
          }
          modules.push({
            id: newModule.id,
            title: newModule.title,
            description: newModule.description,
            lessons: lessons
          });
        }
        await storage.createActivity({
          userId: req.user?.id || req.body.userId || 1,
          courseId: newCourse.id,
          type: "created_course"
        });
        return res.status(201).json({
          id: newCourse.id,
          title: newCourse.title,
          description: newCourse.description,
          modules: modules
        });
      }

      // Функции для генерации заголовков и содержимого уроков
      const generateModuleTitle = (courseTitle: string, moduleIndex: number) => {
        const moduleTitles = [
          "Введение и основные концепции",
          "Основные принципы и практики",
          "Углубленное изучение",
          "Практическое применение",
          "Продвинутые техники"
        ];
        return moduleTitles[moduleIndex % moduleTitles.length];
      };

      const generateLessonTitle = (courseTitle: string, moduleIndex: number, lessonIndex: number) => {
        const lessonTitles = [
          ["Обзор и введение", "Ключевые концепции", "Практические основы"],
          ["Основные методики", "Рабочие процессы", "Решение типовых задач"],
          ["Углубленный анализ", "Специализированные приемы", "Разбор сложных случаев"],
          ["Практическое применение", "Работа с реальными примерами", "Интеграция в рабочий процесс"],
          ["Оптимизация процессов", "Инновационные подходы", "Повышение эффективности"]
        ];

        return lessonTitles[moduleIndex % lessonTitles.length][lessonIndex % 3];
      };

      const generateLessonContent = (courseTitle: string, moduleIndex: number, lessonIndex: number) => {
        const lorem = `
Данный урок охватывает важные аспекты работы в гостиничном бизнесе. Рассмотрим ключевые принципы обслуживания гостей и обеспечения высокого уровня сервиса.

## Основные положения

1. Профессиональное взаимодействие с гостями
2. Решение проблемных ситуаций
3. Обеспечение комфорта и безопасности
4. Командная работа в коллективе

## Практические рекомендации

- Всегда приветствуйте гостей с улыбкой
- Предвосхищайте потребности клиентов
- Оперативно реагируйте на запросы
- Поддерживайте порядок в рабочей зоне

> "Качественный сервис начинается с внимания к деталям"

### Алгоритм действий в стандартных ситуациях

1. Выслушать клиента
2. Уточнить детали запроса
3. Предложить оптимальное решение
4. Реализовать решение
5. Убедиться в удовлетворенности клиента

Этот материал поможет вам эффективно выполнять свои обязанности и поддерживать высокий уровень сервиса, которым славится наш отель.
`;
        return lorem;
      };

      // Создаем базовый курс в базе данных
      const newCourse = await storage.createCourse({
        title: settings.title,
        description: settings.description,
        createdById: req.user?.id || req.body.createdById || 1, // Используем ID пользователя из req.user или из тела запроса
        department: "training",
        image: null, // Опциональное изображение
        content: null, // Опциональный JSON-контент
        active: true // Курс активен по умолчанию
      });

      // Создаем модули курса
      const modules = [];
      for (let i = 0; i < settings.modulesCount; i++) {
        const moduleNumber = i + 1;
        const newModule = await storage.createModule({
          courseId: newCourse.id,
          title: `Модуль ${moduleNumber}: ${generateModuleTitle(settings.title, i)}`,
          description: `Описание модуля ${moduleNumber} курса "${settings.title}"`,
          order: i // Используем order вместо orderIndex
        });

        // Создаем уроки для каждого модуля
        const lessons = [];
        for (let j = 0; j < 3; j++) {
          const lessonNumber = j + 1;
          const newLesson = await storage.createLesson({
            moduleId: newModule.id,
            title: `Урок ${lessonNumber}: ${generateLessonTitle(settings.title, i, j)}`,
            content: generateLessonContent(settings.title, i, j),
            order: j, // Используем order вместо orderIndex
            duration: (Math.floor(Math.random() * 10) + 10).toString(), // duration должен быть строкой
            type: 'text' // Добавляем тип урока
          });

          lessons.push({
            id: newLesson.id,
            title: newLesson.title,
            content: newLesson.content,
            duration: newLesson.duration,
            type: newLesson.type
          });
        }

        modules.push({
          id: newModule.id,
          title: newModule.title,
          description: newModule.description,
          lessons: lessons
        });
      }

      // Создаем запись в активити
      await storage.createActivity({
        userId: req.user?.id || req.body.userId || 1,
        courseId: newCourse.id,
        type: "created_course"
      });

      // Возвращаем сгенерированный курс
      res.status(201).json({
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        modules: modules
      });
    } catch (error) {
      console.error("Failed to generate course:", error);
      res.status(500).json({ error: "Ошибка при генерации курса" });
    }
  });

  app.patch("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const courseData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, courseData);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  // Удалить курс
  app.delete("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Проверяем существование курса
      const existingCourse = await storage.getCourse(id);
      if (!existingCourse) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Получаем модули курса для удаления
      const modules = await storage.listModulesByCourse(id);

      // Удаляем все модули и их уроки
      for (const module of modules) {
        await storage.deleteModule(module.id);
      }

      // Удаляем все записи на курс
      const enrollments = await storage.listEnrollmentsByCourse(id);
      for (const enrollment of enrollments) {
        // Здесь можно добавить логику удаления записей о прогрессе уроков
        // если это необходимо
      }

      // Удаляем сам курс из базы данных
      const success = await db.delete(courses).where(eq(courses.id, id));

      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete course" });
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Enrollment routes
  app.get("/api/enrollments", async (req, res) => {
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

    if (userId && courseId) {
      const enrollment = await storage.getEnrollment(userId, courseId);
      return res.json(enrollment || null);
    }

    if (userId) {
      const enrollments = await storage.listEnrollmentsByUser(userId);
      return res.json(enrollments);
    }

    if (courseId) {
      // Получаем записи на курс и добавляем данные пользователей
      const enrollments = await storage.listEnrollmentsByCourse(courseId);

      // Добавляем информацию о пользователях для каждой записи
      const populatedEnrollments = await Promise.all(enrollments.map(async (enrollment) => {
        const user = await storage.getUser(enrollment.userId);
        return {
          ...enrollment,
          user: user ? {
            id: user.id,
            username: user.username
          } : null
        };
      }));

      return res.json(populatedEnrollments);
    }

    res.status(400).json({ message: "Missing userId or courseId parameter" });
  });

  app.post("/api/enrollments", async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);

      // Check if enrollment already exists
      const existingEnrollment = await storage.getEnrollment(
        enrollmentData.userId,
        enrollmentData.courseId
      );

      if (existingEnrollment) {
        return res.status(409).json({
          message: "User is already enrolled in this course",
          enrollment: existingEnrollment
        });
      }

      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create enrollment" });
    }
  });

  app.patch("/api/enrollments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollmentData = insertEnrollmentSchema.partial().parse(req.body);
      const enrollment = await storage.updateEnrollment(id, enrollmentData);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid enrollment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update enrollment" });
    }
  });

  app.post("/api/enrollments/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const enrollment = await storage.completeEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      res.json(enrollment);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete enrollment" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const activities = await storage.listRecentActivities(limit);

    // Populate user and course information for frontend display
    const populatedActivities = await Promise.all(activities.map(async (activity) => {
      const user = await storage.getUser(activity.userId);
      const course = activity.courseId ? await storage.getCourse(activity.courseId) : null;

      return {
        ...activity,
        user: user ? {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        } : null,
        course: course ? {
          id: course.id,
          title: course.title
        } : null
      };
    }));

    res.json(populatedActivities);
  });

  // Chat routes
  app.post("/api/chat", async (req, res) => {
    try {
      const chatData = insertChatMessageSchema.parse(req.body);

      // Create chat message in database
      const chatMessage = await storage.createChatMessage(chatData);

      try {
        // Get user for context
        const user = await storage.getUser(chatData.userId);

        // Get all courses for context
        const courses = await storage.listCourses();

        // Get the user's enrollments to know which courses they're taking
        const userEnrollments = user ? await storage.listEnrollmentsByUser(user.id) : [];
        const enrolledCourseIds = userEnrollments.map(e => e.courseId);

        // Get more details about enrolled courses, including modules and lessons
        let detailedCourseContent = "";

        if (enrolledCourseIds.length > 0) {
          for (const courseId of enrolledCourseIds) {
            const course = await storage.getCourse(courseId);
            if (!course) continue;

            const modules = await storage.listModulesByCourse(courseId);

            detailedCourseContent += `\nCourse: ${course.title}\nDescription: ${course.description}\nModules:\n`;

            for (const module of modules) {
              detailedCourseContent += `- Module: ${module.title}\n  Description: ${module.description}\n  Lessons:\n`;

              const lessons = await storage.listLessonsByModule(module.id);
              for (const lesson of lessons) {
                detailedCourseContent += `    * ${lesson.title}: ${lesson.description}\n`;

                // Get lesson media to have more context about the content
                const lessonMedia = await storage.listMediaByLesson(lesson.id);
                if (lessonMedia.length > 0) {
                  // Получаем медиафайлы для каждого элемента lessonMedia
                  const mediaDetails = await Promise.all(
                    lessonMedia.map(async (lm) => {
                      const mediaFile = await storage.getMediaFile(lm.mediaId);
                      return mediaFile ? mediaFile.originalFilename : "Неизвестный файл";
                    })
                  );
                  detailedCourseContent += `      Media: ${mediaDetails.join(', ')}\n`;
                }
              }
            }
          }
        }

        // Create context about the hotel training system
        const systemPrompt = `
          You are an AI assistant for a hotel staff training system called HotelLearn.
          The system helps with onboarding new staff and providing ongoing training.

          You have knowledge about the following courses:
          ${courses.map(c => `- ${c.title}: ${c.description} (Department: ${c.department})`).join('\n')}

          The user asking this question is ${user?.name || 'a hotel staff member'}
          who is a ${user?.role || 'staff member'}
          ${user?.department ? `in the ${user?.department} department` : ''}.

          ${detailedCourseContent ? `
          Here is detailed information about the courses this user is enrolled in:
          ${detailedCourseContent}
          ` : ''}

          Be helpful, concise, and knowledgeable about hotel operations and training.
          If you don't know something specific about this hotel, provide general best practices
          for the hospitality industry.

          If the user is asking about specific course content, refer to the detailed course information provided.
          If the user asks about modules or lessons they're enrolled in, you can provide specific information about those.
        `;

        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: chatData.message }
          ],
        });

        const aiResponse = openaiResponse.choices[0].message.content || "I'm sorry, I couldn't process that request.";

        // Update the chat message with AI response
        const updatedChatMessage = await storage.updateChatResponse(chatMessage.id, aiResponse);

        res.json(updatedChatMessage);
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);

        // Still return the chat message, but with an error response
        const errorResponse = "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.";
        const updatedChatMessage = await storage.updateChatResponse(chatMessage.id, errorResponse);

        res.json(updatedChatMessage);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/api/chat/history/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      const chatHistory = await storage.listChatMessagesByUser(userId, limit);
      res.json(chatHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Эндпоинт для загрузки файлов для анализа чат-ботом
  app.post("/api/chat/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Файл не был загружен" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "ID пользователя обязателен" });
      }

      // Сохраняем информацию о файле в базе данных
      const filePath = req.file.path;
      const relativePath = `/uploads/media/${req.file.filename}`;
      const fileType = getMediaTypeFromMimeType(req.file.mimetype);

      // Создаем запись о медиафайле
      const mediaFile = await storage.createMediaFile({
        originalFilename: req.file.originalname,
        path: relativePath,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        url: relativePath,
        uploadedById: parseInt(userId),
        mediaType: fileType,
        metadata: {
          description: "Файл для анализа чат-ботом",
          uploadedFor: "chatbot"
        }
      });

      // Извлекаем текст или содержимое файла (зависит от типа файла)
      let fileContent = "";

      if (fileType === "document" && (req.file.mimetype === "application/pdf" || req.file.mimetype.includes("text/plain"))) {
        // Для PDF или текстовых файлов можно использовать библиотеку для извлечения текста
        // Здесь упрощенный вариант для текстовых файлов
        if (req.file.mimetype.includes("text/plain")) {
          fileContent = fs.readFileSync(filePath, "utf8");
        } else {
          // Для PDF потребуется дополнительная обработка (в реальном проекте)
          fileContent = "Содержимое PDF-файла. В реальном проекте здесь был бы извлеченный текст.";
        }
      }

      // Формируем сообщение от пользователя
      const chatData = {
        userId: parseInt(userId),
        message: `Проанализируй файл: ${req.file.originalname}`,
        metadata: {
          fileId: mediaFile.id,
          filePath: relativePath,
          fileType: fileType,
          fileContent: fileContent
        }
      };

      // Создаем запись о сообщении в чате
      const chatMessage = await storage.createChatMessage(chatData);

      try {
        // Получаем пользователя для контекста
        const user = await storage.getUser(parseInt(userId));

        let systemPrompt = `
          Ты помощник по обучению в системе HotelLearn.
          Тебе предоставлен файл для анализа: ${req.file.originalname} (тип: ${fileType}).

          Пользователь ${user?.name || 'отель-менеджер'} просит проанализировать этот файл.
        `;

        // Добавляем содержимое файла в контекст, если оно доступно
        if (fileContent) {
          systemPrompt += `\n\nСодержимое файла:\n"""${fileContent}"""\n`;
        } else {
          systemPrompt += `\n\nСодержимое файла не может быть извлечено автоматически.`;
        }

        systemPrompt += `
          Проанализируй файл и предоставь полезную информацию для обучения сотрудников отеля.
          Если содержимое недоступно, предложи, как пользователь может предоставить информацию из файла
          в текстовом формате для анализа.
        `;

        // Запрос к OpenAI
        const openaiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Проанализируй файл "${req.file.originalname}" и предоставь полезную информацию.` }
          ],
        });

        const aiResponse = openaiResponse.choices[0].message.content || "Извините, не удалось проанализировать файл.";

        // Обновляем сообщение с ответом AI
        const updatedChatMessage = await storage.updateChatResponse(chatMessage.id, aiResponse);

        res.json({
          success: true,
          message: "Файл успешно загружен и проанализирован",
          chatMessage: updatedChatMessage,
          mediaFile
        });
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);

        // Всё равно возвращаем сообщение, но с ошибкой
        const errorResponse = "Извините, у меня возникли трудности с анализом файла. Пожалуйста, попробуйте позже или загрузите файл в другом формате.";
        const updatedChatMessage = await storage.updateChatResponse(chatMessage.id, errorResponse);

        res.json({
          success: true,
          message: "Файл загружен, но возникли проблемы с анализом",
          chatMessage: updatedChatMessage,
          mediaFile
        });
      }
    } catch (error) {
      console.error("Ошибка при обработке файла:", error);
      res.status(500).json({ message: "Не удалось обработать файл" });
    }
  });

  // Statistics routes for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const users = await storage.listUsers();
      const courses = await storage.listCourses();

      // Create simulated enrollments for stats
      const enrollments = courses.flatMap(course =>
        Array.from({ length: course.participantCount }, () => ({
          courseId: course.id,
          completed: Math.random() > 0.3  // Simulate some completed courses
        }))
      );

      const totalEmployees = users.filter(user => user.role === "staff").length;
      const activeCourses = courses.filter(course => course.active).length;
      const completedCourses = enrollments.filter(e => e.completed).length;

      // Calculate average progress (in a real app, this would come from actual enrollment data)
      const averageProgress = Math.floor(Math.random() * 30) + 70; // Random between 70-99

      res.json({
        totalEmployees,
        activeCourses,
        completedCourses,
        averageProgress: `${averageProgress}%`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Здесь были обработчики медиа-маршрутов, теперь они перемещены далее в файл

  // ====================================================================
  // API для модулей и уроков
  // ====================================================================

  // Получить все модули для курса
  app.get("/api/modules", async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;

      if (!courseId) {
        return res.status(400).json({ error: "Требуется ID курса" });
      }

      // Получаем модули
      const modules = await storage.listModulesByCourse(courseId);

      // Для каждого модуля получаем уроки
      const modulesWithLessons = await Promise.all(modules.map(async (module) => {
        const lessons = await storage.listLessonsByModule(module.id);
        return { ...module, lessons };
      }));

      res.json(modulesWithLessons);
    } catch (error) {
      console.error("Ошибка при получении модулей:", error);
      res.status(500).json({ error: "Не удалось получить модули курса" });
    }
  });

  // Создать новый модуль
  app.post("/api/modules", async (req, res) => {
    try {
      const parsedData = insertModuleSchema.parse(req.body);

      // Создаем модуль в базе данных
      const module = await storage.createModule(parsedData);

      res.status(201).json(module);
    } catch (error) {
      console.error("Ошибка при создании модуля:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: "Не удалось создать модуль" });
    }
  });

  // Получить модуль по ID
  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);

      // Получаем модуль из базы данных
      const module = await storage.getModule(moduleId);

      if (!module) {
        return res.status(404).json({ error: "Модуль не найден" });
      }

      // Получаем уроки для модуля
      const lessons = await storage.listLessonsByModule(moduleId);

      res.json({ ...module, lessons });
    } catch (error) {
      console.error("Ошибка при получении модуля:", error);
      res.status(500).json({ error: "Не удалось получить модуль" });
    }
  });

  // Обновить модуль
  app.patch("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);

      // Проверяем существование модуля
      const existingModule = await storage.getModule(moduleId);
      if (!existingModule) {
        return res.status(404).json({ error: "Модуль не найден" });
      }

      // Обновляем модуль
      const updatedModule = await storage.updateModule(moduleId, req.body);

      res.json(updatedModule);
    } catch (error) {
      console.error("Ошибка при обновлении модуля:", error);
      res.status(500).json({ error: "Не удалось обновить модуль" });
    }
  });

  // Удалить модуль
  app.delete("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);

      // Проверяем существование модуля
      const existingModule = await storage.getModule(moduleId);
      if (!existingModule) {
        return res.status(404).json({ error: "Модуль не найден" });
      }

      // Удаляем модуль
      const success = await storage.deleteModule(moduleId);

      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Не удалось удалить модуль" });
      }
    } catch (error) {
      console.error("Ошибка при удалении модуля:", error);
      res.status(500).json({ error: "Не удалось удалить модуль" });
    }
  });

  // API для уроков

  // Создать новый урок
  app.post("/api/lessons", async (req, res) => {
    try {
      const parsedData = insertLessonSchema.parse(req.body);

      // Проверяем существование модуля
      const module = await storage.getModule(parsedData.moduleId);
      if (!module) {
        return res.status(404).json({ error: "Модуль не найден" });
      }

      // Получаем существующие уроки для определения порядка
      const existingLessons = await storage.listLessonsByModule(parsedData.moduleId);
      if (!parsedData.order) {
        parsedData.order = existingLessons.length + 1;
      }

      // Конвертируем durationMinutes в строку для поля duration, если оно есть
      if ((parsedData as any).durationMinutes) {
        parsedData.duration = `${(parsedData as any).durationMinutes} мин.`;
        delete (parsedData as any).durationMinutes;
      }

      // Создаем урок
      const lesson = await storage.createLesson(parsedData);

      res.status(201).json(lesson);
    } catch (error) {
      console.error("Ошибка при создании урока:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: "Не удалось создать урок" });
    }
  });

  // Получить урок по ID
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      // Получаем урок из базы данных
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ error: "Урок не найден" });
      }

      // Получаем медиа для урока
      const media = await storage.listMediaByLesson(lessonId);

      res.json({ ...lesson, media });
    } catch (error) {
      console.error("Ошибка при получении урока:", error);
      res.status(500).json({ error: "Не удалось получить урок" });
    }
  });

  // Обновить урок
  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      // Проверяем существование урока
      const existingLesson = await storage.getLesson(lessonId);
      if (!existingLesson) {
        return res.status(404).json({ error: "Урок не найден" });
      }

      // Обновляем урок
      const updatedLesson = await storage.updateLesson(lessonId, req.body);

      res.json(updatedLesson);
    } catch (error) {
      console.error("Ошибка при обновлении урока:", error);
      res.status(500).json({ error: "Не удалось обновить урок" });
    }
  });

  // Удалить урок
  app.delete("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      // Проверяем существование урока
      const existingLesson = await storage.getLesson(lessonId);
      if (!existingLesson) {
        return res.status(404).json({ error: "Урок не найден" });
      }

      // Удаляем урок
      const success = await storage.deleteLesson(lessonId);

      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: "Не удалось удалить урок" });
      }
    } catch (error) {
      console.error("Ошибка при удалении урока:", error);
      res.status(500).json({ error: "Не удалось удалить урок" });
    }
  });

  // Onboarding progress for dashboard
  app.get("/api/onboarding-progress", async (req, res) => {
    try {
      // In a real app, this would pull actual onboarding data
      // For now, we'll return mock data for the UI
      res.json([
        {
          id: 1,
          name: "Михаил Иванов",
          department: "Ресепшн",
          progress: 25,
          duration: "3 дня"
        },
        {
          id: 2,
          name: "Ольга Смирнова",
          department: "Ресторан",
          progress: 75,
          duration: "1 неделя"
        },
        {
          id: 3,
          name: "Александр Петров",
          department: "Обслуживание номеров",
          progress: 90,
          duration: "2 недели"
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch onboarding data" });
    }
  });

  // Onboarding steps for walk-through guide
  app.get("/api/onboarding", async (req, res) => {
    try {
      res.json([
        {
          id: 1,
          name: "Добро пожаловать в HotelLearn",
          description: "Система обучения персонала гостиницы. Здесь вы найдете все необходимые учебные материалы, курсы и инструменты для эффективного обучения.",
          position: "bottom",
          selector: ".logo-container",
          action: "Давайте начнем знакомство с системой!"
        },
        {
          id: 2,
          name: "Дашборд",
          description: "Это главная страница системы, где отображается статистика, ваш прогресс обучения и последние активности.",
          position: "right",
          selector: "[data-section='stats']",
          action: "Здесь вы можете отслеживать эффективность обучения персонала."
        },
        {
          id: 3,
          name: "Навигация",
          description: "Используйте боковое меню для перехода между разделами системы.",
          position: "right",
          selector: "aside nav",
          action: "Нажмите на любой пункт меню, чтобы перейти в соответствующий раздел."
        },
        {
          id: 4,
          name: "Создание курсов",
          description: "Как тренинг-менеджер, вы можете создавать новые курсы, добавлять модули и уроки.",
          position: "bottom",
          selector: "[data-section='quick-actions']",
          action: "Нажмите 'Создать курс', чтобы приступить к созданию нового учебного материала."
        },
        {
          id: 5,
          name: "Чат-помощник",
          description: "У вас есть доступ к AI-ассистенту, который поможет ответить на вопросы по работе системы и учебным материалам.",
          position: "left",
          selector: "aside button:has(.material-icons:contains('chat'))",
          action: "Нажмите на кнопку чата, чтобы задать вопрос ассистенту."
        },
        {
          id: 6,
          name: "Геймификация",
          description: "Система включает элементы геймификации — достижения, баллы и рейтинги, чтобы сделать обучение более увлекательным.",
          position: "bottom",
          selector: "aside nav div:contains('Достижения')",
          action: "Исследуйте эти разделы, чтобы узнать больше о механиках игрофикации."
        },
        {
          id: 7,
          name: "Готово!",
          description: "Теперь вы знакомы с основными функциями HotelLearn. Если у вас возникнут вопросы, всегда можно нажать кнопку помощи или обратиться к AI-ассистенту.",
          position: "bottom",
          selector: "aside button.onboarding-button",
          action: "Нажмите на кнопку помощи (?), чтобы снова открыть это руководство в любое время."
        }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch onboarding steps" });
    }
  });

  // Media routes
  // Специфичные маршруты должны быть объявлены до общих маршрутов с параметрами
  // Маршрут для получения файла из Object Storage
  app.get("/api/media/file/:key", async (req, res) => {
    try {
      const key = decodeURIComponent(req.params.key);
      
      // Проверяем, является ли ключ числом (старый формат ID)
      if (!isNaN(parseInt(key))) {
        // Совместимость со старым API - если передан числовой ID
        const fileId = parseInt(key);
        const file = await storage.getMediaFile(fileId);
        
        if (!file) {
          return res.status(404).json({ error: "Файл не найден" });
        }
        
        // Формируем путь к файлу
        const filePath = file.path || (file.filename ? `uploads/media/${file.filename}` : null);
        
        if (!filePath) {
          return res.status(404).json({ error: "Путь к файлу не найден" });
        }
        
        // Отправляем файл клиенту
        return res.sendFile(filePath, { root: '.' });
      }
      
      // Новый формат - ключ из Object Storage
      const { getFile } = await import('./utils/object-storage');
      const fileContent = await getFile(key);
      
      if (!fileContent) {
        return res.status(404).json({ error: "Файл не найден" });
      }
      
      // Определяем тип контента на основе расширения файла
      const ext = path.extname(key).toLowerCase();
      let contentType = 'application/octet-stream'; // По умолчанию
      
      // Устанавливаем правильный Content-Type для распространенных типов файлов
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      else if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.webm') contentType = 'video/webm';
      else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';
      else if (ext === '.xls' || ext === '.xlsx') contentType = 'application/vnd.ms-excel';
      else if (ext === '.ppt' || ext === '.pptx') contentType = 'application/vnd.ms-powerpoint';
      
      // Устанавливаем заголовки и отправляем файл
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileContent.length);
      res.send(fileContent);
      
    } catch (error) {
      console.error("Ошибка при получении файла:", error);
      res.status(500).json({ error: "Не удалось получить файл" });
    }
  });
  
  // Сначала объявляем /api/media/list
  app.get("/api/media/list", async (req, res) => {
    try {
      console.log("[DEBUG] Запрос к /api/media/list получен");

      const limit = 100;
      const offset = 0;

      // Получаем список файлов
      const mediaFiles = await storage.listMediaFiles(limit, offset);

      if (!mediaFiles || !Array.isArray(mediaFiles)) {
        console.error("[DEBUG] Media files is not an array:", mediaFiles);
        return res.status(500).json({ message: "Invalid media files format" });
      }

      // Добавляем необходимые поля для совместимости с клиентским интерфейсом
      const formattedFiles = mediaFiles.map(file => {
        if (!file) return null;

        return {
          id: file.id?.toString() || '',
          name: file.originalFilename || 'Untitled',
          type: file.mimeType || 'application/octet-stream',
          size: file.fileSize || 0,
          url: file.url || (file.filename ? `/uploads/media/${file.filename}` : ''),
          status: 'completed',
          path: file.path || '',
          originalFilename: file.originalFilename || 'Untitled',
          mimeType: file.mimeType || 'application/octet-stream'
        };
      }).filter(Boolean);

      res.json(formattedFiles);
    } catch (error) {
      console.error("[DEBUG] Error fetching media files:", error);
      res.status(500).json({ message: "Failed to fetch media files" });
    }
  });

  // Затем общий маршрут для получения списка медиафайлов
  app.get("/api/media", async (req, res) => {
    try {
      const mediaType = req.query.type as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      let mediaFiles;
      if (mediaType) {
        mediaFiles = await storage.listMediaFilesByType(mediaType, limit, offset);
      } else {
        mediaFiles = await storage.listMediaFiles(limit, offset);
      }

      // Добавляем виртуальное поле name для совместимости с клиентским кодом
      const mediaFilesWithName = mediaFiles.map(file => ({
        ...file,
        name: file.originalFilename // Добавляем виртуальное поле name
      }));

      res.json(mediaFilesWithName);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media files" });
    }
  });

  // И наконец, маршрут с параметром :id
  app.get("/api/media/:id", async (req, res) => {
    try {
      // Проверяем, что id - число, а не строка "list"
      if (req.params.id === "list") {
        return res.status(404).json({ message: "Invalid media id" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid media id format" });
      }

      const mediaFile = await storage.getMediaFile(id);

      if (!mediaFile) {
        return res.status(404).json({ message: "Media file not found" });
      }

      // Добавляем виртуальное поле name для совместимости с клиентским кодом
      const mediaFileWithName = {
        ...mediaFile,
        name: mediaFile.originalFilename
      };

      res.json(mediaFileWithName);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch media file" });
    }
  });

  // Upload a new media file
  app.post("/api/media/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { uploadedById } = req.body;
      const userId = parseInt(uploadedById);

      // Determine media type from mime type
      const mediaType = getMediaTypeFromMimeType(req.file.mimetype);

      // Generate thumbnail for supported media types
      let thumbnail = null;
      const thumbnailName = `thumb_${req.file.filename}`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      const thumbnailResult = await generateThumbnail(req.file.path, mediaType, thumbnailPath);
      
      // Загрузка файла в Object Storage
      const { uploadFile, uploadThumbnail } = await import('./utils/object-storage');
      
      try {
        // Загружаем основной файл
        const objectStorageResult = await uploadFile(
          req.file.path,
          req.file.originalname,
          mediaType,
          req.file.mimetype
        );
        
        // Если была создана миниатюра, загружаем и её
        if (thumbnailResult) {
          thumbnail = await uploadThumbnail(thumbnailPath, req.file.originalname);
        }
        
        // Приведение mediaType к правильному типу данных согласно схеме
        const mediaTypeEnum = ["image", "video", "audio", "document", "presentation"] as const;
        let validMediaType = mediaType as "image" | "video" | "audio" | "document" | "presentation";

        // Проверяем, что mediaType является допустимым значением
        if (!mediaTypeEnum.includes(validMediaType as any)) {
          validMediaType = "document"; // Значение по умолчанию, если неизвестный тип
        }
        
        // Создаем запись о файле в БД
        const mediaFileData = {
          filename: objectStorageResult.key.split('/').pop() || req.file.filename,
          originalFilename: req.file.originalname,
          path: objectStorageResult.key,
          url: objectStorageResult.url,
          mediaType: validMediaType,
          thumbnail,
          fileSize: objectStorageResult.fileSize,
          mimeType: req.file.mimetype,
          uploadedById: userId,
          metadata: req.body.metadata ? JSON.parse(req.body.metadata) : null
        };

        const mediaFile = await storage.createMediaFile(mediaFileData);

        // Добавляем виртуальное поле name для совместимости с клиентским кодом
        const mediaFileWithName = {
          ...mediaFile,
          name: mediaFile.originalFilename
        };

        // Удаляем локальный файл, так как он уже загружен в Object Storage
        try {
          fs.unlinkSync(req.file.path);
          if (thumbnailResult) {
            fs.unlinkSync(thumbnailPath);
          }
        } catch (unlinkError) {
          console.warn("Ошибка при удалении временных файлов:", unlinkError);
        }

        res.status(201).json(mediaFileWithName);
      } catch (objectStorageError) {
        console.error("Ошибка при загрузке в Object Storage:", objectStorageError);
        
        // Запасной вариант - используем файловую систему
        console.warn("Используем файловую систему вместо Object Storage");
        
        const relativePath = `./uploads/media/${req.file.filename}`;
        const fileUrl = `/uploads/media/${req.file.filename}`;
        
        // Приведение mediaType к правильному типу данных согласно схеме
        const mediaTypeEnum = ["image", "video", "audio", "document", "presentation"] as const;
        let validMediaType = mediaType as "image" | "video" | "audio" | "document" | "presentation";

        // Проверяем, что mediaType является допустимым значением
        if (!mediaTypeEnum.includes(validMediaType as any)) {
          validMediaType = "document"; // Значение по умолчанию, если неизвестный тип
        }
        
        if (thumbnailResult) {
          thumbnail = `/uploads/thumbnails/${thumbnailName}`;
        }

        const mediaFileData = {
          filename: req.file.filename,
          originalFilename: req.file.originalname,
          path: relativePath,
          url: fileUrl,
          mediaType: validMediaType,
          thumbnail,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedById: userId,
          metadata: req.body.metadata ? JSON.parse(req.body.metadata) : null
        };

        const mediaFile = await storage.createMediaFile(mediaFileData);

        // Добавляем виртуальное поле name для совместимости с клиентским кодом
        const mediaFileWithName = {
          ...mediaFile,
          name: mediaFile.originalFilename
        };

        res.status(201).json(mediaFileWithName);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(id);

      if (!mediaFile) {
        return res.status(404).json({ message: "Media file not found" });
      }

      // Проверяем, хранится ли файл в Object Storage или в файловой системе
      if (mediaFile.path && mediaFile.path.startsWith('media/')) {
        // Файл в Object Storage
        const { deleteFile } = await import('./utils/object-storage');
        
        // Удаляем основной файл
        await deleteFile(mediaFile.path);
        
        // Удаляем миниатюру, если она существует
        if (mediaFile.thumbnail && mediaFile.thumbnail.includes('/api/media/file/')) {
          // Извлекаем ключ из URL
          const thumbnailKey = decodeURIComponent(mediaFile.thumbnail.split('/api/media/file/')[1]);
          if (thumbnailKey) {
            await deleteFile(thumbnailKey);
          }
        }
      } else {
        // Используем старый подход - удаление из файловой системы
        // Delete the file from the filesystem
        if (mediaFile.url) {
          const filePath = path.join(".", mediaFile.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete the thumbnail if it exists
        if (mediaFile.thumbnail) {
          const thumbnailPath = path.join(".", mediaFile.thumbnail);
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        }
      }

      // Delete from database
      const success = await storage.deleteMediaFile(id);

      if (success) {
        res.json({ success: true, message: "Media file deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete media file" });
      }
    } catch (error) {
      console.error("Error deleting media file:", error);
      res.status(500).json({ message: "Failed to delete media file" });
    }
  });

  // Serve static files from uploads directory
  app.use("/uploads", express.static(uploadDir));

  // Геймификация - Достижения
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.listAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/achievements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const achievement = await storage.getAchievement(id);

      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }

      res.json(achievement);
    } catch (error) {
      console.error("Error fetching achievement:", error);
      res.status(500).json({ error: "Failed to fetch achievement" });
    }
  });

  app.post("/api/achievements", async (req, res) => {
    try {
      const achievement = await storage.createAchievement(req.body);
      res.status(201).json(achievement);
    } catch (error) {
      console.error("Error creating achievement:", error);
      res.status(500).json({ error: "Failed to create achievement" });
    }
  });

  // Геймификация - Достижения пользователей
  app.get("/api/user-achievements/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userAchievements = await storage.listUserAchievementsByUser(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  app.post("/api/user-achievements", async (req, res) => {
    try {
      const userAchievement = await storage.createUserAchievement(req.body);
      res.status(201).json(userAchievement);
    } catch (error) {
      console.error("Error creating user achievement:", error);
      res.status(500).json({ error: "Failed to create user achievement" });
    }
  });

  // Геймификация - Вознаграждения
  app.get("/api/rewards", async (req, res) => {
    try {
      const onlyActive = req.query.active === "true";
      const rewards = onlyActive
        ? await storage.listActiveRewards()
        : await storage.listRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching rewards:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  app.get("/api/rewards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reward = await storage.getReward(id);

      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      res.json(reward);
    } catch (error) {
      console.error("Error fetching reward:", error);
      res.status(500).json({ error: "Failed to fetch reward" });
    }
  });

  app.post("/api/rewards", async (req, res) => {
    try {
      const reward = await storage.createReward(req.body);
      res.status(201).json(reward);
    } catch (error) {
      console.error("Error creating reward:", error);
      res.status(500).json({ error: "Failed to create reward" });
    }
  });

  // Геймификация - Вознаграждения пользователей
  app.get("/api/user-rewards/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userRewards = await storage.listUserRewardsByUser(userId);
      res.json(userRewards);
    } catch (error) {
      console.error("Error fetching user rewards:", error);
      res.status(500).json({ error: "Failed to fetch user rewards" });
    }
  });

  app.post("/api/user-rewards", async (req, res) => {
    try {
      const userReward = await storage.createUserReward(req.body);
      res.status(201).json(userReward);
    } catch (error) {
      console.error("Error creating user reward:", error);
      res.status(500).json({ error: "Failed to create user reward" });
    }
  });

  // Геймификация - Уровни пользователей
  app.get("/api/user-level/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userLevel = await storage.getUserLevel(userId);

      if (!userLevel) {
        // Если уровень пользователя не найден, возвращаем базовый уровень
        return res.json({
          userId,
          level: 1,
          points: 0,
          nextLevelPoints: 100,
          lastActivity: new Date(),
        });
      }

      res.json(userLevel);
    } catch (error) {
      console.error("Error fetching user level:", error);
      res.status(500).json({ error: "Failed to fetch user level" });
    }
  });

  app.post("/api/user-level/add-points", async (req, res) => {
    try {
      const { userId, points } = req.body;

      if (!userId || !points) {
        return res.status(400).json({ error: "userId and points are required" });
      }

      const userLevel = await storage.addUserPoints(userId, points);
      res.json(userLevel);
    } catch (error) {
      console.error("Error adding points to user:", error);
      res.status(500).json({ error: "Failed to add points to user" });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // AI Personal Learning Path routes

  // Маршрут для генерации персонализированного учебного плана с помощью AI
  app.post("/api/learning-paths/generate", async (req, res) => {
    try {
      console.log("Received request for learning path generation:", req.body);

      // Проверяем, что в запросе есть position или userRole
      if (req.body.position && !req.body.userRole) {
        req.body.userRole = req.body.position;
        delete req.body.position;
      }

      // Проверяем, что targetSkills является массивом
      if (req.body.targetSkills && typeof req.body.targetSkills === 'string') {
        req.body.targetSkills = req.body.targetSkills.split(',').filter((s: string) => s.trim() !== '').map((s: string) => s.trim());
      }

      console.log("Normalized request data:", req.body);

      const schema = z.object({
        userId: z.number(),
        createdById: z.number().default(1), // Значение по умолчанию для createdById, чтобы избежать ошибки
        userRole: z.string(),
        userLevel: z.string(),
        userDepartment: z.string().optional(), // Делаем необязательным
        targetSkills: z.array(z.string())
      });

      // Если userDepartment не указан, используем значение по умолчанию
      if (!req.body.userDepartment) {
        req.body.userDepartment = "General";
      }

      const data = schema.parse(req.body);

      // Проверяем существование пользователя
      const user = await storage.getUser(data.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Проверяем существование создателя
      const creator = await storage.getUser(data.createdById);
      if (!creator) {
        return res.status(404).json({ message: "Creator not found" });
      }

      // Получаем список всех курсов для подбора
      const allCourses = await storage.listCourses();

      // Используем OpenAI для генерации подходящего плана обучения
      // Передаем true в качестве последнего параметра, чтобы разрешить генерацию новых курсов
      const userDepartment = data.userDepartment || "General";

      const aiResult = await generateLearningPath(
        data.userRole,
        data.userLevel,
        userDepartment,
        allCourses,
        true // разрешаем предлагать новые курсы
      );

      // Создаем учебный план
      const learningPath = await storage.createLearningPath({
        userId: data.userId,
        createdById: data.createdById,
        position: data.userRole,
        level: data.userLevel as "junior" | "middle" | "senior",
        targetSkills: aiResult.targetSkills.join(", "),
        status: "active"
      });

      // Обрабатываем рекомендованные курсы
      const processedCourses = [];

      // Проходим по всем рекомендациям AI
      for (const courseRec of aiResult.recommendedCourses) {
        try {
          if (courseRec.isNewCourse && courseRec.title) {
            // Если это новый курс, рекомендованный AI - создаем его
            const newCourse = await storage.createCourse({
              title: courseRec.title,
              description: courseRec.description || `Рекомендованный AI курс для ${data.userRole}`,
              department: userDepartment, // Используем локальную переменную
              createdById: data.createdById, // Добавляем идентификатор создателя
              active: true,
              image: null
            });

            // Добавляем в учебный план
            // Удаляем поле rationale, если оно присутствует в запросе, но не существует в схеме
            const learningPathCourse = await storage.createLearningPathCourse({
              learningPathId: learningPath.id,
              courseId: newCourse.id,
              order: courseRec.order || processedCourses.length,
              priority: courseRec.priority || "normal"
            });

            processedCourses.push({
              ...learningPathCourse,
              course: newCourse
            });

          } else if (courseRec.courseId) {
            // Если это существующий курс
            const course = await storage.getCourse(courseRec.courseId);
            if (course) {
              // Удаляем поле rationale, если оно присутствует в запросе, но не существует в схеме
              const learningPathCourse = await storage.createLearningPathCourse({
                learningPathId: learningPath.id,
                courseId: courseRec.courseId,
                order: courseRec.order || processedCourses.length,
                priority: courseRec.priority || "normal"
              });

              processedCourses.push({
                ...learningPathCourse,
                course: course
              });
            }
          }
        } catch (error) {
          console.error("Error processing course recommendation:", error);
          // Продолжаем обработку других курсов
        }
      }

      // Регистрируем активность
      await storage.createActivity({
        userId: data.createdById,
        type: "generated_learning_path"
      });

      // Возвращаем созданный план обучения
      res.status(201).json({
        learningPath,
        courses: processedCourses,
        details: {
          targetSkills: aiResult.targetSkills,
          recommendedCourses: aiResult.recommendedCourses
        }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data for learning path generation", errors: error.errors });
      }

      console.error("Error generating AI learning path:", error);
      res.status(500).json({ message: "Failed to generate AI learning path" });
    }
  });
  // Предыдущий эндпоинт для генерации учебных путей перенесен в новый маршрут выше

  // API для получения дополнительной информации о курсе в контексте пользователя
  app.post("/api/courses/insight", async (req, res) => {
    try {
      // Валидируем входные данные
      const schema = z.object({
        courseId: z.number(),
        userRole: z.string(),
        userLevel: z.string()
      });

      const data = schema.parse(req.body);

      // Получаем информацию о курсе
      const course = await storage.getCourse(data.courseId);
      if (!course) {
        return res.status(404).json({ message: "Курс не найден" });
      }

      // Генерируем подробное объяснение пользы курса для данного пользователя
      const courseInsight = await generateCourseInsight(
        data.courseId,
        course.title,
        course.description,
        data.userRole,
        data.userLevel
      );

      res.json({
        courseId: data.courseId,
        courseTitle: course.title,
        insight: courseInsight
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Некорректные данные для анализа курса",
          errors: error.errors
        });
      }

      console.error("Error generating course insight:", error);
      res.status(500).json({ message: "Не удалось сгенерировать анализ курса" });
    }
  });

  // API для анализа профиля пользователя и рекомендации курсов
  app.post("/api/learning-paths/recommend", async (req, res) => {
    try {
      // Валидируем входные данные
      const schema = z.object({
        userId: z.number()
      });

      const data = schema.parse(req.body);

      // Получаем профиль пользователя
      const userProfile = await storage.getUser(data.userId);
      if (!userProfile) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Получаем завершенные курсы пользователя
      const enrollments = await storage.listEnrollmentsByUser(data.userId);
      const completedEnrollments = enrollments.filter(e => e.completed);

      // Получаем ID завершенных курсов
      const completedCourseIds = completedEnrollments.map(e => e.courseId);

      // Получаем детали завершенных курсов
      const completedCourses = await Promise.all(
        completedCourseIds.map(async (courseId) => storage.getCourse(courseId))
      );

      // Фильтруем пустые значения (на случай, если какие-то курсы не существуют)
      const validCompletedCourses = completedCourses.filter(Boolean);

      // Получаем список всех доступных курсов
      const availableCourses = await storage.listCourses();

      // Генерируем рекомендации на основе профиля и истории обучения
      const recommendations = await analyzeUserProfileAndRecommend(
        userProfile,
        validCompletedCourses,
        availableCourses
      );

      res.json({
        userId: data.userId,
        userName: userProfile.name || userProfile.username,
        userRole: userProfile.role,
        userDepartment: userProfile.department,
        completedCourses: validCompletedCourses.map(c => ({ id: c?.id || 0, title: c?.title || "" })),
        recommendations
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Некорректные данные для анализа профиля",
          errors: error.errors
        });
      }

      console.error("Error analyzing user profile:", error);
      res.status(500).json({ message: "Не удалось проанализировать профиль и сформировать рекомендации" });
    }
  });

  app.get("/api/learning-paths", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const createdById = req.query.createdById ? parseInt(req.query.createdById as string) : undefined;

      if (userId) {
        const learningPaths = await storage.listLearningPathsByUser(userId);
        return res.json(learningPaths);
      }

      if (createdById) {
        const learningPaths = await storage.listLearningPathsByCreator(createdById);
        return res.json(learningPaths);
      }

      // Если не указаны параметры userId или createdById,
      // возвращаем все доступные планы обучения
      const allPaths = await storage.listAllLearningPaths();
      return res.json(allPaths);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      res.status(500).json({ error: "Failed to fetch learning paths" });
    }
  });

  app.get("/api/learning-paths/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const learningPath = await storage.getLearningPath(id);

      if (!learningPath) {
        return res.status(404).json({ message: "Learning path not found" });
      }

      const courses = await storage.listDetailedCoursesByLearningPath(id);

      res.json({
        ...learningPath,
        courses
      });
    } catch (error) {
      console.error("Error fetching learning path:", error);
      res.status(500).json({ error: "Failed to fetch learning path" });
    }
  });

  app.post("/api/learning-paths", async (req, res) => {
    try {
      const learningPathData = insertLearningPathSchema.parse(req.body);
      const learningPath = await storage.createLearningPath(learningPathData);
      res.status(201).json(learningPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid learning path data", errors: error.errors });
      }
      console.error("Error creating learning path:", error);
      res.status(500).json({ message: "Failed to create learning path" });
    }
  });

  app.patch("/api/learning-paths/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const learningPathData = insertLearningPathSchema.partial().parse(req.body);
      const learningPath = await storage.updateLearningPath(id, learningPathData);

      if (!learningPath) {
        return res.status(404).json({ message: "Learning path not found" });
      }

      res.json(learningPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid learning path data", errors: error.errors });
      }
      console.error("Error updating learning path:", error);
      res.status(500).json({ message: "Failed to update learning path" });
    }
  });

  app.post("/api/learning-paths/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const learningPath = await storage.completeLearningPath(id);

      if (!learningPath) {
        return res.status(404).json({ message: "Learning path not found" });
      }

      res.json(learningPath);
    } catch (error) {
      console.error("Error completing learning path:", error);
      res.status(500).json({ message: "Failed to complete learning path" });
    }
  });

  app.delete("/api/learning-paths/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLearningPath(id);

      if (!success) {
        return res.status(404).json({ message: "Learning path not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting learning path:", error);
      res.status(500).json({ message: "Failed to delete learning path" });
    }
  });

  // AI personal learning path courses routes
  app.get("/api/learning-path-courses", async (req, res) => {
    try {
      const learningPathId = req.query.learningPathId ? parseInt(req.query.learningPathId as string) : undefined;

      if (!learningPathId) {
        return res.status(400).json({ message: "Missing learningPathId parameter" });
      }

      const courses = await storage.listCoursesByLearningPath(learningPathId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching learning path courses:", error);
      res.status(500).json({ error: "Failed to fetch learning path courses" });
    }
  });

  app.post("/api/learning-path-courses", async (req, res) => {
    try {
      // Удаляем поле rationale, если оно присутствует в запросе, но не существует в схеме
      const reqBody = { ...req.body };
      if ('rationale' in reqBody) {
        delete reqBody.rationale;
      }
      const learningPathCourseData = insertLearningPathCourseSchema.parse(reqBody);
      const learningPathCourse = await storage.createLearningPathCourse(learningPathCourseData);
      res.status(201).json(learningPathCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid learning path course data", errors: error.errors });
      }
      console.error("Error creating learning path course:", error);
      res.status(500).json({ message: "Failed to create learning path course" });
    }
  });

  app.patch("/api/learning-path-courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const learningPathCourseData = insertLearningPathCourseSchema.partial().parse(req.body);
      const learningPathCourse = await storage.updateLearningPathCourse(id, learningPathCourseData);

      if (!learningPathCourse) {
        return res.status(404).json({ message: "Learning path course not found" });
      }

      res.json(learningPathCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid learning path course data", errors: error.errors });
      }
      console.error("Error updating learning path course:", error);
      res.status(500).json({ message: "Failed to update learning path course" });
    }
  });

  app.post("/api/learning-path-courses/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const learningPathCourse = await storage.completeLearningPathCourse(id);

      if (!learningPathCourse) {
        return res.status(404).json({ message: "Learning path course not found" });
      }

      res.json(learningPathCourse);
    } catch (error) {
      console.error("Error completing learning path course:", error);
      res.status(500).json({ message: "Failed to complete learning path course" });
    }
  });

  app.delete("/api/learning-path-courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLearningPathCourse(id);

      if (!success) {
        return res.status(404).json({ message: "Learning path course not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting learning path course:", error);
      res.status(500).json({ message: "Failed to delete learning path course" });
    }
  });

  // Примечание: Основной маршрут для генерации персонализированных планов обучения
  // определен выше, в начале секции AI Personal Learning Path routes

  // ===================== API для системы оценки компетенций сотрудников =====================

  // API для работы с ролями сотрудников
  app.get("/api/employee-roles", async (req, res) => {
    try {
      const department = req.query.department as string | undefined;

      if (department) {
        const roles = await storage.listEmployeeRolesByDepartment(department);
        return res.json(roles);
      }

      const roles = await storage.listEmployeeRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching employee roles:", error);
      res.status(500).json({ message: "Failed to fetch employee roles" });
    }
  });

  app.get("/api/employee-roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const role = await storage.getEmployeeRole(id);

      if (!role) {
        return res.status(404).json({ message: "Employee role not found" });
      }

      res.json(role);
    } catch (error) {
      console.error("Error fetching employee role:", error);
      res.status(500).json({ message: "Failed to fetch employee role" });
    }
  });

  app.post("/api/employee-roles", async (req, res) => {
    try {
      const roleData = insertEmployeeRoleSchema.parse(req.body);
      const role = await storage.createEmployeeRole(roleData);
      res.status(201).json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Error creating employee role:", error);
      res.status(500).json({ message: "Failed to create employee role" });
    }
  });

  app.patch("/api/employee-roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roleData = insertEmployeeRoleSchema.partial().parse(req.body);
      const role = await storage.updateEmployeeRole(id, roleData);

      if (!role) {
        return res.status(404).json({ message: "Employee role not found" });
      }

      res.json(role);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid role data", errors: error.errors });
      }
      console.error("Error updating employee role:", error);
      res.status(500).json({ message: "Failed to update employee role" });
    }
  });

  app.delete("/api/employee-roles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEmployeeRole(id);

      if (!success) {
        return res.status(404).json({ message: "Employee role not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting employee role:", error);
      res.status(500).json({ message: "Failed to delete employee role" });
    }
  });

  // API для работы с компетенциями
  app.get("/api/competencies", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;

      if (category) {
        const competencies = await storage.listCompetenciesByCategory(category);
        return res.json(competencies);
      }

      const competencies = await storage.listCompetencies();
      res.json(competencies);
    } catch (error) {
      console.error("Error fetching competencies:", error);
      res.status(500).json({ message: "Failed to fetch competencies" });
    }
  });

  app.get("/api/competencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const competency = await storage.getCompetency(id);

      if (!competency) {
        return res.status(404).json({ message: "Competency not found" });
      }

      res.json(competency);
    } catch (error) {
      console.error("Error fetching competency:", error);
      res.status(500).json({ message: "Failed to fetch competency" });
    }
  });

  app.post("/api/competencies", async (req, res) => {
    try {
      const competencyData = insertCompetencySchema.parse(req.body);
      const competency = await storage.createCompetency(competencyData);
      res.status(201).json(competency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid competency data", errors: error.errors });
      }
      console.error("Error creating competency:", error);
      res.status(500).json({ message: "Failed to create competency" });
    }
  });

  app.patch("/api/competencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const competencyData = insertCompetencySchema.partial().parse(req.body);
      const competency = await storage.updateCompetency(id, competencyData);

      if (!competency) {
        return res.status(404).json({ message: "Competency not found" });
      }

      res.json(competency);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid competency data", errors: error.errors });
      }
      console.error("Error updating competency:", error);
      res.status(500).json({ message: "Failed to update competency" });
    }
  });

  app.delete("/api/competencies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCompetency(id);

      if (!success) {
        return res.status(404).json({ message: "Competency not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting competency:", error);
      res.status(500).json({ message: "Failed to delete competency" });
    }
  });

  // API для работы с ассесментами
  app.get("/api/assessments", async (req, res) => {
    try {
      const roleId = req.query.roleId ? parseInt(req.query.roleId as string) : undefined;

      if (roleId) {
        const assessments = await storage.listAssessmentsByRole(roleId);
        return res.json(assessments);
      }

      const assessments = await storage.listAssessments();
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Failed to fetch assessments" });
    }
  });

  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getAssessment(id);

      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Failed to fetch assessment" });
    }
  });

  app.post("/api/assessments", async (req, res) => {
    try {
      // Сохраняем пользовательские компетенции в отдельном поле
      const customCompetenciesList = req.body.customCompetencies || [];

      // Удаляем поле customCompetencies, так как оно не входит в схему
      delete req.body.customCompetencies;

      // Делаем dueDate необязательным
      if (req.body.dueDate === '') {
        req.body.dueDate = null;
      }

      // Создаем объект данных для ассесмента
      const assessmentData = {
        title: req.body.title,
        description: req.body.description || null,
        roleId: parseInt(req.body.roleId),
        status: req.body.status || "created",
        targetCompetencies: req.body.targetCompetencies || [],
        createdById: req.body.createdById || 1,
        timeLimit: req.body.timeLimit ? parseInt(req.body.timeLimit) : null,
        passingScore: parseInt(req.body.passingScore) || 70,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        targetLevel: req.body.targetLevel || "middle",
        customCompetencies: customCompetenciesList
      };

      // Создаем ассесмент
      const assessment = await storage.createAssessment(assessmentData);

      // Если указан userId, создаем сессию ассесмента для этого пользователя
      if (req.body.userId) {
        await storage.createAssessmentSession({
          userId: req.body.userId,
          assessmentId: assessment.id,
          status: "created"
        });
      }

      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
      }
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Failed to create assessment" });
    }
  });

  app.patch("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessmentData = insertAssessmentSchema.partial().parse(req.body);
      const assessment = await storage.updateAssessment(id, assessmentData);

      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
      }
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  app.delete("/api/assessments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssessment(id);

      if (!success) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ message: "Failed to delete assessment" });
    }
  });

  // API для работы с вопросами ассесмента
  app.get("/api/assessment-questions", async (req, res) => {
    try {
      const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string) : undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const competencyId = req.query.competencyId ? parseInt(req.query.competencyId as string) : undefined;

      if (!assessmentId) {
        return res.status(400).json({ message: "Assessment ID is required" });
      }

      if (difficulty) {
        const questions = await storage.listAssessmentQuestionsByDifficulty(assessmentId, difficulty);
        return res.json(questions);
      }

      if (competencyId) {
        const questions = await storage.listAssessmentQuestionsByCompetency(assessmentId, competencyId);
        return res.json(questions);
      }

      const questions = await storage.listAssessmentQuestions(assessmentId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching assessment questions:", error);
      res.status(500).json({ message: "Failed to fetch assessment questions" });
    }
  });

  app.get("/api/assessment-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getAssessmentQuestion(id);

      if (!question) {
        return res.status(404).json({ message: "Assessment question not found" });
      }

      res.json(question);
    } catch (error) {
      console.error("Error fetching assessment question:", error);
      res.status(500).json({ message: "Failed to fetch assessment question" });
    }
  });

  app.post("/api/assessment-questions", async (req, res) => {
    try {
      const questionData = insertAssessmentQuestionSchema.parse(req.body);
      const question = await storage.createAssessmentQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      console.error("Error creating assessment question:", error);
      res.status(500).json({ message: "Failed to create assessment question" });
    }
  });

  app.patch("/api/assessment-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const questionData = insertAssessmentQuestionSchema.partial().parse(req.body);
      const question = await storage.updateAssessmentQuestion(id, questionData);

      if (!question) {
        return res.status(404).json({ message: "Assessment question not found" });
      }

      res.json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid question data", errors: error.errors });
      }
      console.error("Error updating assessment question:", error);
      res.status(500).json({ message: "Failed to update assessment question" });
    }
  });

  app.delete("/api/assessment-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssessmentQuestion(id);

      if (!success) {
        return res.status(404).json({ message: "Assessment question not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting assessment question:", error);
      res.status(500).json({ message: "Failed to delete assessment question" });
    }
  });

  // API для работы с сессиями ассесмента
  app.get("/api/assessment-sessions", async (req, res) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const assessmentId = req.query.assessmentId ? parseInt(req.query.assessmentId as string) : undefined;

      if (userId) {
        const sessions = await storage.listAssessmentSessionsByUser(userId);
        return res.json(sessions);
      }

      if (assessmentId) {
        const sessions = await storage.listAssessmentSessionsByAssessment(assessmentId);
        return res.json(sessions);
      }

      return res.status(400).json({ message: "User ID or Assessment ID is required" });
    } catch (error) {
      console.error("Error fetching assessment sessions:", error);
      res.status(500).json({ message: "Failed to fetch assessment sessions" });
    }
  });

  app.get("/api/assessment-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getAssessmentSession(id);

      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching assessment session:", error);
      res.status(500).json({ message: "Failed to fetch assessment session" });
    }
  });

  app.post("/api/assessment-sessions", async (req, res) => {
    try {
      console.log("Creating assessment session with data:", req.body);
      
      // Получаем ID пользователя либо из запроса, либо из req.user
      let userId = req.body.userId;
      
      // Если userId не указан в теле запроса, но пользователь авторизован,
      // используем ID авторизованного пользователя
      if (!userId && req.isAuthenticated() && req.user) {
        userId = req.user.id;
      }
      
      // Проверяем, что userId существует
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      // Создаем объект данных для сессии
      const sessionData = {
        userId: parseInt(userId),
        assessmentId: parseInt(req.body.assessmentId),
        status: req.body.status || "created"
      };

      console.log("Parsed session data:", sessionData);

      const session = await storage.createAssessmentSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error creating assessment session:", error);
      res.status(500).json({ message: "Failed to create assessment session: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.patch("/api/assessment-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessionData = insertAssessmentSessionSchema.partial().parse(req.body);
      const session = await storage.updateAssessmentSession(id, sessionData);

      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      console.error("Error updating assessment session:", error);
      res.status(500).json({ message: "Failed to update assessment session" });
    }
  });

  app.post("/api/assessment-sessions/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getAssessmentSession(id);

      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      console.log("Starting assessment session:", id);

      // Обновляем статус сессии на "in_progress"
      const updatedSession = await db
        .update(assessmentSessions)
        .set({
          status: "in_progress"
        })
        .where(eq(assessmentSessions.id, id))
        .returning();

      res.json(updatedSession[0]);
    } catch (error) {
      console.error("Error starting assessment session:", error);
      res.status(500).json({ message: "Failed to start assessment session: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.post("/api/assessment-sessions/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.completeAssessmentSession(id, req.body);
      res.json(session);
    } catch (error) {
      console.error("Error completing assessment session:", error);
      res.status(500).json({ message: "Failed to complete assessment session" });
    }
  });

  // API для работы с ответами на вопросы ассесмента
  app.get("/api/assessment-answers", async (req, res) => {
    try {
      const sessionId = req.query.sessionId ? parseInt(req.query.sessionId as string) : undefined;

      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      const answers = await storage.listAssessmentAnswersBySession(sessionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching assessment answers:", error);
      res.status(500).json({ message: "Failed to fetch assessment answers" });
    }
  });

  app.get("/api/assessment-answers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const answer = await storage.getAssessmentAnswer(id);

      if (!answer) {
        return res.status(404).json({ message: "Assessment answer not found" });
      }

      res.json(answer);
    } catch (error) {
      console.error("Error fetching assessment answer:", error);
      res.status(500).json({ message: "Failed to fetch assessment answer" });
    }
  });

  app.post("/api/assessment-answers", async (req, res) => {
    try {
      const answerData = insertAssessmentAnswerSchema.parse(req.body);
      const answer = await storage.createAssessmentAnswer(answerData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      console.error("Error creating assessment answer:", error);
      res.status(500).json({ message: "Failed to create assessment answer" });
    }
  });

  app.patch("/api/assessment-answers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const answerData = insertAssessmentAnswerSchema.partial().parse(req.body);
      const answer = await storage.updateAssessmentAnswer(id, answerData);

      if (!answer) {
        return res.status(404).json({ message: "Assessment answer not found" });
      }

      res.json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      console.error("Error updating assessment answer:", error);
      res.status(500).json({ message: "Failed to update assessment answer" });
    }
  });

  // API для генерации вопросов с помощью ИИ
  app.post("/api/assessments/:id/generate-questions", async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const count = parseInt(req.body.count || "5");

      // Проверяем существование ассесмента
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const questions = await storage.generateAssessmentQuestions(assessmentId, count);
      res.json(questions);
    } catch (error) {
      console.error("Error generating assessment questions:", error);
      res.status(500).json({ message: "Failed to generate assessment questions" });
    }
  });

  // API для получения статистики и аналитики
  app.get("/api/assessments/:id/statistics", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getAssessmentStatistics(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching assessment statistics:", error);
      res.status(500).json({ message: "Failed to fetch assessment statistics" });
    }
  });

  app.get("/api/users/:id/assessment-results", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const results = await storage.getUserAssessmentResults(id);
      res.json(results);
    } catch (error) {
      console.error("Error fetching user assessment results:", error);
      res.status(500).json({ message: "Failed to fetch user assessment results" });
    }
  });

  // API для получения отчета по ассесменту
  app.get("/api/assessment-sessions/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getAssessmentSession(id);

      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      if (session.status !== "completed") {
        return res.status(400).json({ message: "Assessment session is not completed yet" });
      }

      // Получаем данные для генерации отчета
      const user = await storage.getUser(session.userId);
      const assessment = await storage.getAssessment(session.assessmentId);
      const questions = await storage.listAssessmentQuestions(session.assessmentId);
      const answers = await storage.listAssessmentAnswersBySession(id);
      // Получаем роль сотрудника
      const role = user && user.role ? await storage.getEmployeeRole(Number(user.role)) : null;

      if (!user || !assessment || !role) {
        return res.status(404).json({ message: "Required data for report generation not found" });
      }

      // Получаем компетенции для отчета
      type CompetencyResult = {
        id: number;
        name: string;
        description?: string;
        category?: string;
      };
      
      let competencies: CompetencyResult[] = [];
      if (assessment.targetCompetencies && Array.isArray(assessment.targetCompetencies)) {
        const competencyIds = assessment.targetCompetencies.map(c => c.id || c);
        const fetchedCompetencies = await Promise.all(
          competencyIds.map(async (id) => await storage.getCompetency(typeof id === 'object' ? id.id : id))
        );
        
        // Фильтруем undefined значения и приводим к нужному типу
        competencies = fetchedCompetencies
          .filter((comp): comp is NonNullable<typeof comp> => comp !== undefined)
          .map(comp => ({
            id: comp.id,
            name: comp.name,
            description: comp.description,
            category: comp.category
          }));
      }

      // Если компетенции не указаны, берем из роли
      if (competencies.length === 0 && role.requiredCompetencies) {
        const competencyIds = Array.isArray(role.requiredCompetencies) 
          ? role.requiredCompetencies.map(c => c.id || c)
          : [];
          
        const fetchedCompetencies = await Promise.all(
          competencyIds.map(async (id) => await storage.getCompetency(typeof id === 'object' ? id.id : id))
        );
        
        // Фильтруем undefined значения и приводим к нужному типу
        competencies = fetchedCompetencies
          .filter((comp): comp is NonNullable<typeof comp> => comp !== undefined)
          .map(comp => ({
            id: comp.id,
            name: comp.name,
            description: comp.description,
            category: comp.category
          }));
      }

      // Генерируем отчет с помощью OpenAI
      const { generateAssessmentReport } = await import('./utils/openai');

      // Вычисляем общий результат
      const totalQuestions = questions.length;
      const correctAnswers = answers.filter(a => a.isCorrect).length;
      const overallScore = Math.round((correctAnswers / totalQuestions) * 100);

      const report = await generateAssessmentReport(
        user.name,
        role.title,
        role.department,
        competencies,
        questions,
        answers,
        overallScore
      );

      // Сохраняем отчет в сессию
      await storage.updateAssessmentSession(id, {
        status: "completed" // Используем только поддерживаемые поля
      });

      // Сообщаем клиенту, что отчет сгенерирован
      res.json(report);
    } catch (error) {
      console.error("Error generating assessment report:", error);
      res.status(500).json({ message: "Failed to generate assessment report" });
    }
  });

  app.get("/api/departments/:department/assessment-results", async (req, res) => {
    try {
      const department = req.params.department;
      const results = await storage.getDepartmentAssessmentResults(department);
      res.json(results);
    } catch (error) {
      console.error("Error fetching department assessment results:", error);
      res.status(500).json({ message: "Failed to fetch department assessment results" });
    }
  });

  // ================ Маршруты для микро-обучающего контента ================

  // Получение списка всех микро-обучающих материалов
  app.get("/api/micro-learning", async (req, res) => {
    try {
      const content = await storage.listMicroLearningContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching micro-learning content:", error);
      res.status(500).json({ error: "Ошибка при получении микро-обучающих материалов" });
    }
  });

  // Получение микро-обучающего материала по ID (только для числовых ID)
  app.get("/api/micro-learning/:id([0-9]+)", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);

      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Некорректный ID материала" });
      }

      const content = await storage.getMicroLearningContent(contentId);

      if (!content) {
        return res.status(404).json({ error: "Микро-обучающий материал не найден" });
      }

      res.json(content);
    } catch (error) {
      console.error("Error fetching micro-learning content:", error);
      res.status(500).json({ error: "Ошибка при получении микро-обучающего материала" });
    }
  });

  // Создание нового микро-обучающего материала
  app.post("/api/micro-learning", async (req, res) => {
    try {
      const contentData = req.body;
      // Проверяем, что пользователь имеет право создавать контент
      if (req.session && req.session.user && (req.session.user.role === "admin" || req.session.user.role === "trainer")) {
        // Назначаем создателя
        contentData.created_by_id = req.session.user.id;
      } else {
        contentData.created_by_id = 1; // По умолчанию админ
      }

      // Добавляем дату создания
      contentData.created_at = new Date();

      const newContent = await storage.createMicroLearningContent(contentData);
      res.status(201).json(newContent);
    } catch (error) {
      console.error("Error creating micro-learning content:", error);
      res.status(500).json({ error: "Ошибка при создании микро-обучающего материала" });
    }
  });

  // Обновление микро-обучающего материала
  app.put("/api/micro-learning/:id([0-9]+)", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);

      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Некорректный ID материала" });
      }

      const contentData = req.body;

      // Обновляем дату изменения
      contentData.updated_at = new Date();

      const updatedContent = await storage.updateMicroLearningContent(contentId, contentData);

      if (!updatedContent) {
        return res.status(404).json({ error: "Микро-обучающий материал не найден" });
      }

      res.json(updatedContent);
    } catch (error) {
      console.error("Error updating micro-learning content:", error);
      res.status(500).json({ error: "Ошибка при обновлении микро-обучающего материала" });
    }
  });

  // Удаление микро-обучающего материала
  app.delete("/api/micro-learning/:id([0-9]+)", async (req, res) => {
    try {
      const contentId = parseInt(req.params.id);

      if (isNaN(contentId)) {
        return res.status(400).json({ error: "Некорректный ID материала" });
      }

      const deleted = await storage.deleteMicroLearningContent(contentId);

      if (!deleted) {
        return res.status(404).json({ error: "Микро-обучающий материал не найден" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting micro-learning content:", error);
      res.status(500).json({ error: "Ошибка при удалении микро-обучающего материала" });
    }
  });

  // Получение микро-обучающего контента по компетенции
  app.get("/api/micro-learning/by-competency/:competencyId", async (req, res) => {
    try {
      const competencyId = parseInt(req.params.competencyId);
      const content = await storage.listMicroLearningContentByCompetency(competencyId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching micro-learning content by competency:", error);
      res.status(500).json({ error: "Ошибка при получении микро-обучающего контента по компетенции" });
    }
  });

  // Получение микро-обучающего контента по уровню
  app.get("/api/micro-learning/by-level/:level", async (req, res) => {
    try {
      const level = req.params.level;
      const content = await storage.listMicroLearningContentByTargetLevel(level);
      res.json(content);
    } catch (error) {
      console.error("Error fetching micro-learning content by level:", error);
      res.status(500).json({ error: "Ошибка при получении микро-обучающего контента по уровню" });
    }
  });

  // Генерация микро-обучающего контента по результатам ассесмента
  app.post("/api/micro-learning/generate/:assessmentSessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.assessmentSessionId);
      const options = req.body;

      const content = await storage.generateMicroLearningContent(sessionId, options);
      res.status(201).json(content);
    } catch (error) {
      console.error("Error generating micro-learning content:", error);
      res.status(500).json({ error: "Ошибка при генерации микро-обучающего контента" });
    }
  });

  // ================ Маршруты для назначений микро-обучающего контента ================

  // Получение назначения по ID
  app.get("/api/micro-learning-assignments/:id([0-9]+)", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);

      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "Некорректный ID назначения" });
      }

      const assignment = await storage.getMicroLearningAssignment(assignmentId);

      if (!assignment) {
        return res.status(404).json({ error: "Назначение не найдено" });
      }

      res.json(assignment);
    } catch (error) {
      console.error("Error fetching micro-learning assignment:", error);
      res.status(500).json({ error: "Ошибка при получении назначения" });
    }
  });

  // Назначение микро-обучающего контента пользователю
  app.post("/api/micro-learning-assignments", async (req, res) => {
    try {
      const assignmentData = req.body;

      // Добавляем дату назначения
      assignmentData.assigned_at = new Date();

      const newAssignment = await storage.createMicroLearningAssignment(assignmentData);
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error creating micro-learning assignment:", error);
      res.status(500).json({ error: "Ошибка при создании назначения" });
    }
  });

  // Обновление назначения
  app.put("/api/micro-learning-assignments/:id([0-9]+)", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);

      if (isNaN(assignmentId)) {
        return res.status(400).json({ error: "Некорректный ID назначения" });
      }

      const assignmentData = req.body;

      const updatedAssignment = await storage.updateMicroLearningAssignment(assignmentId, assignmentData);

      if (!updatedAssignment) {
        return res.status(404).json({ error: "Назначение не найдено" });
      }

      res.json(updatedAssignment);
    } catch (error) {
      console.error("Error updating micro-learning assignment:", error);
      res.status(500).json({ error: "Ошибка при обновлении назначения" });
    }
  });

  // Получение всех назначений для пользователя
  app.get("/api/micro-learning-assignments/user/:userId([0-9]+)", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Некорректный ID пользователя" });
      }

      const assignments = await storage.listMicroLearningAssignmentsByUser(userId);

      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user's micro-learning assignments:", error);
      res.status(500).json({ error: "Ошибка при получении назначений пользователя" });
    }
  });

  // Завершение назначения микро-обучающего контента
  app.post("/api/micro-learning-assignments/:id/complete", async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const { feedback, rating } = req.body;

      const completedAssignment = await storage.completeMicroLearningAssignment(
        assignmentId,
        feedback,
        rating ? parseInt(rating) : undefined
      );

      if (!completedAssignment) {
        return res.status(404).json({ error: "Назначение не найдено" });
      }

      res.json(completedAssignment);
    } catch (error) {
      console.error("Error completing micro-learning assignment:", error);
      res.status(500).json({ error: "Ошибка при завершении назначения" });
    }
  });

  // ================ Маршруты для прогресса по микро-обучающему контенту ================

  // Создание или обновление прогресса
  app.post("/api/micro-learning-progress", async (req, res) => {
    try {
      const progressData = req.body;

      // Проверяем, существует ли уже прогресс для этого назначения
      let existingProgress;
      if (progressData.assignment_id) {
        const assignments = await storage.listMicroLearningProgress();
        existingProgress = assignments.find(p => p.assignment_id === progressData.assignment_id);
      }

      let progress;

      if (existingProgress) {
        // Обновляем существующий прогресс
        progress = await storage.updateMicroLearningProgress(existingProgress.id, progressData);
      } else {
        // Создаем новый прогресс
        progressData.started_at = progressData.started_at || new Date();
        progress = await storage.createMicroLearningProgress(progressData);
      }

      res.json(progress);
    } catch (error) {
      console.error("Error saving micro-learning progress:", error);
      res.status(500).json({ error: "Ошибка при сохранении прогресса" });
    }
  });

  // Обновление прогресса
  app.put("/api/micro-learning-progress/:id", async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const progressData = req.body;

      const updatedProgress = await storage.updateMicroLearningProgress(progressId, progressData);

      if (!updatedProgress) {
        return res.status(404).json({ error: "Прогресс не найден" });
      }

      res.json(updatedProgress);
    } catch (error) {
      console.error("Error updating micro-learning progress:", error);
      res.status(500).json({ error: "Ошибка при обновлении прогресса" });
    }
  });

  // Завершение прогресса
  app.post("/api/micro-learning-progress/:id/complete", async (req, res) => {
    try {
      const progressId = parseInt(req.params.id);
      const { quizScore } = req.body;

      const completedProgress = await storage.completeMicroLearningProgress(
        progressId,
        quizScore ? parseInt(quizScore) : undefined
      );

      if (!completedProgress) {
        return res.status(404).json({ error: "Прогресс не найден" });
      }

      res.json(completedProgress);
    } catch (error) {
      console.error("Error completing micro-learning progress:", error);
      res.status(500).json({ error: "Ошибка при завершении прогресса" });
    }
  });

  // ================ Рекомендации и аналитика микро-обучающего контента ================

  // Получение рекомендаций по микро-обучающему контенту для пользователя
  app.get("/api/micro-learning/recommendations/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const count = req.query.count ? parseInt(req.query.count as string) : 5;

      const recommendations = await storage.recommendMicroLearningForUser(userId, count);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting micro-learning recommendations:", error);
      res.status(500).json({ error: "Ошибка при получении рекомендаций" });
    }
  });

  // Получение рекомендаций по компетенции
  app.get("/api/micro-learning/recommendations/competency/:competencyId", async (req, res) => {
    try {
      const competencyId = parseInt(req.params.competencyId);
      const count = req.query.count ? parseInt(req.query.count as string) : 3;

      const recommendations = await storage.recommendMicroLearningByCompetency(competencyId, count);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting micro-learning recommendations by competency:", error);
      res.status(500).json({ error: "Ошибка при получении рекомендаций по компетенции" });
    }
  });

  // Получение общей статистики по микро-обучающему контенту
  app.get("/api/micro-learning/statistics", async (req, res) => {
    try {
      // Прямой ответ с базовой статистикой, чтобы избежать ошибок во время отладки
      // В будущем здесь можно использовать storage.getMicroLearningStatistics()
      res.json({
        totalContent: 0,
        totalAssignments: 0,
        completedAssignments: 0,
        completionRate: 0,
        contentByType: [],
        contentByLevel: [],
        contentByCompetency: []
      });
    } catch (error) {
      console.error("Error getting micro-learning statistics:", error);
      res.status(500).json({ error: "Ошибка при получении статистики" });
    }
  });

  // Получение статистики по микро-обучающему контенту для пользователя
  app.get("/api/micro-learning/statistics/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Заглушка на время разработки
      res.json({
        userId,
        totalAssignments: 0,
        completedAssignments: 0,
        completionRate: 0,
        averageRating: 0,
        competencyStats: [],
        contentTypes: [],
        recentAssignments: []
      });
    } catch (error) {
      console.error("Error getting user micro-learning statistics:", error);
      res.status(500).json({ error: "Ошибка при получении статистики пользователя" });
    }
  });

  // Получение статистики по микро-обучающему контенту для компетенции
  app.get("/api/micro-learning/statistics/competency/:competencyId", async (req, res) => {
    try {
      const competencyId = parseInt(req.params.competencyId);
      // Заглушка на время разработки
      res.json({
        competencyId,
        name: "Название компетенции",
        category: "Категория",
        description: "Описание компетенции",
        contentCount: 0,
        assignmentsCount: 0,
        completedAssignmentsCount: 0,
        completionRate: 0,
        averageEffectiveness: 0,
        contentByType: {},
        contentByLevel: {},
        mostPopularContent: []
      });
    } catch (error) {
      console.error("Error getting competency micro-learning statistics:", error);
      res.status(500).json({ error: "Ошибка при получении статистики по компетенции" });
    }
  });

  // Генерация описания курса с помощью ИИ
  app.post("/api/courses/describe", async (req, res) => {
    try {
      const { title, department, targetAudience } = req.body;
      if (!title) {
        return res.status(400).json({ error: "Не указано название курса" });
      }
      const { generateCourseDescriptionAI } = require("./utils/openai");
      const description = await generateCourseDescriptionAI(title, department, targetAudience);
      res.json({ description });
    } catch (error) {
      console.error("Ошибка генерации описания курса:", error);
      res.status(500).json({ error: "Не удалось сгенерировать описание курса" });
    }
  });
  
  // Генерация содержания курса с помощью ИИ
  app.post("/api/ai/generate-course-content", async (req, res) => {
    try {
      const { files, settings, useAI } = req.body;
      if (!settings) {
        return res.status(400).json({ error: "Не указаны настройки курса" });
      }
      
      // Получаем данные о файлах
      const mediaFiles = [];
      if (files && files.length > 0) {
        for (const fileId of files) {
          const mediaFile = await storage.getMediaFile(parseInt(fileId));
          if (mediaFile) {
            mediaFiles.push(mediaFile);
          }
        }
      }
      
      // Импортируем функцию для генерации контента
      const { generateCourseContent } = await import('./utils/openai');
      
      try {
        // Вызываем функцию генерации контента
        const generatedContent = await generateCourseContent(
          settings.title,
          settings.description,
          {
            targetAudience: settings.targetAudience || [],
            difficultyLevel: settings.difficultyLevel || 'beginner',
            modulesCount: settings.modulesCount || 3,
            format: settings.format || ['text'],
            includeTests: settings.includeTests || false,
            includeQuizzes: settings.includeQuizzes || false
          },
          mediaFiles.map(file => ({
            id: file.id.toString(),
            name: file.originalFilename || file.filename || 'Файл',
            type: file.mimeType || file.mediaType || 'unknown',
            url: file.url || ''
          }))
        );
        
        res.json(generatedContent);
      } catch (error) {
        console.error("Ошибка при вызове generateCourseContent:", error);
        
        // Если произошла ошибка с API, возвращаем заготовку
        const generatedContent = {
          title: settings.title,
          description: settings.description,
          modules: []
        };
        
        // Генерируем модули курса в зависимости от указанного количества
        for (let i = 0; i < settings.modulesCount; i++) {
          const module = {
            id: i + 1,
            title: `Модуль ${i + 1}`,
            description: `Описание модуля ${i + 1}`,
            lessons: []
          };
          
          // Генерируем уроки для каждого модуля
          for (let j = 0; j < 3; j++) {
            module.lessons.push({
              id: j + 1,
              title: `Урок ${j + 1}`,
              content: `Содержание урока ${j + 1}`,
              duration: 30, // числовой тип для длительности
              type: settings.format.includes("text") ? "text" : settings.format[0]
            });
          }
          
          generatedContent.modules.push(module);
        }
        
        res.json(generatedContent);
      }
    } catch (error) {
      console.error("Ошибка генерации содержания курса:", error);
      res.status(500).json({ error: "Не удалось сгенерировать содержание курса" });
    }
  });
  
  // Получение списка загруженных файлов
  app.get("/api/media/list", async (req, res) => {
    try {
      const files = await storage.listMediaFiles();
      res.json(files);
    } catch (error) {
      console.error("Ошибка получения списка файлов:", error);
      res.status(500).json({ error: "Не удалось получить список файлов" });
    }
  });
  
  // Генерация полного курса
  app.post("/api/courses/generate", async (req, res) => {
    try {
      const { files, settings, useAI } = req.body;
      if (!settings) {
        return res.status(400).json({ error: "Не указаны настройки курса" });
      }
      
      // Получаем данные о файлах
      const mediaFiles = [];
      if (files && files.length > 0) {
        for (const fileId of files) {
          const mediaFile = await storage.getMediaFile(parseInt(fileId));
          if (mediaFile) {
            mediaFiles.push(mediaFile);
          }
        }
      }
      
      // Создаем новый курс в базе данных
      const newCourse = await storage.createCourse({
        title: settings.title,
        description: settings.description,
        department: settings.targetAudience && settings.targetAudience.length > 0 ? settings.targetAudience[0] : "general",
        createdById: 1, // Временно устанавливаем ID создателя как 1 (админ)
        active: true
      });
      
      // Добавляем модули
      const modules = [];
      for (let i = 0; i < settings.modulesCount; i++) {
        const module = await storage.createModule({
          courseId: newCourse.id,
          title: `Модуль ${i + 1}`,
          description: `Описание модуля ${i + 1}`,
          order: i
        });
        
        const lessons = []; // Сохраняем уроки для включения в ответ
        
        // Добавляем уроки к модулю
        for (let j = 0; j < 3; j++) {
          const lesson = await storage.createLesson({
            moduleId: module.id,
            title: `Урок ${j + 1}`,
            content: `Содержание урока ${j + 1}`,
            order: j,
            duration: 30 // в минутах, числовое значение
          });
          
          // Добавляем информацию о созданном уроке
          lessons.push({
            id: lesson.id,
            title: lesson.title,
            content: lesson.content,
            duration: lesson.duration,
            type: 'text'
          });
        }
        
        // Сохраняем модуль с уроками
        modules.push({
          id: module.id,
          title: module.title,
          description: module.description,
          lessons: lessons
        });
      }
      
      // Добавляем связь с загруженными файлами
      if (mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          await storage.createCourseResource({
            courseId: newCourse.id,
            mediaId: file.id,
            type: "attachment"
          });
        }
      }
      
      // Возвращаем результат с созданным курсом и модулями, включая ID курса
      res.json({
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        modules: modules
      });
    } catch (error) {
      console.error("Ошибка генерации курса:", error);
      res.status(500).json({ error: "Не удалось сгенерировать курс" });
    }
  });

  // Маршруты для работы с кешем (Replit DB)
  app.get("/api/cache/get", async (req, res) => {
    try {
      const { prefix, key } = req.query;
      
      if (!prefix || !key) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required parameters: prefix and key" 
        });
      }
      
      // Получаем нужный кеш-менеджер по префиксу
      let cacheManager: CacheManager;
      switch (prefix) {
        case 'courses':
          cacheManager = coursesCache;
          break;
        case 'users':
          cacheManager = usersCache;
          break;
        case 'media':
          cacheManager = mediaCache;
          break;
        case 'analytics':
          cacheManager = analyticsCache;
          break;
        case 'assessments':
          cacheManager = assessmentsCache;
          break;
        default:
          // Если префикс не соответствует ни одному из предопределенных, создаем временный
          cacheManager = new CacheManager(prefix as string);
      }
      
      // Получаем данные из кеша
      const data = await cacheManager.get(key as string);
      
      return res.json({
        success: true,
        data,
        exists: data !== null,
        key,
        prefix
      });
    } catch (error) {
      console.error('Error getting cache:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to get data from cache" 
      });
    }
  });
  
  app.post("/api/cache/set", async (req, res) => {
    try {
      const { prefix, key, value, ttl } = req.body;
      
      if (!prefix || !key || value === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required parameters: prefix, key, and value" 
        });
      }
      
      // Получаем нужный кеш-менеджер по префиксу
      let cacheManager: CacheManager;
      switch (prefix) {
        case 'courses':
          cacheManager = coursesCache;
          break;
        case 'users':
          cacheManager = usersCache;
          break;
        case 'media':
          cacheManager = mediaCache;
          break;
        case 'analytics':
          cacheManager = analyticsCache;
          break;
        case 'assessments':
          cacheManager = assessmentsCache;
          break;
        default:
          // Если префикс не соответствует ни одному из предопределенных, создаем временный
          cacheManager = new CacheManager(prefix);
      }
      
      // Сохраняем данные в кеш
      const success = await cacheManager.set(key, value, ttl);
      
      return res.json({
        success,
        key,
        prefix,
        ttl: ttl || cacheManager.defaultTTL,
        expiresAt: new Date(Date.now() + (ttl || cacheManager.defaultTTL) * 1000)
      });
    } catch (error) {
      console.error('Error setting cache:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to set data in cache" 
      });
    }
  });
  
  app.delete("/api/cache/delete", async (req, res) => {
    try {
      const { prefix, key } = req.body;
      
      if (!prefix || !key) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required parameters: prefix and key" 
        });
      }
      
      // Получаем нужный кеш-менеджер по префиксу
      let cacheManager: CacheManager;
      switch (prefix) {
        case 'courses':
          cacheManager = coursesCache;
          break;
        case 'users':
          cacheManager = usersCache;
          break;
        case 'media':
          cacheManager = mediaCache;
          break;
        case 'analytics':
          cacheManager = analyticsCache;
          break;
        case 'assessments':
          cacheManager = assessmentsCache;
          break;
        default:
          // Если префикс не соответствует ни одному из предопределенных, создаем временный
          cacheManager = new CacheManager(prefix);
      }
      
      // Удаляем данные из кеша
      const success = await cacheManager.delete(key);
      
      return res.json({
        success,
        key,
        prefix
      });
    } catch (error) {
      console.error('Error deleting from cache:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to delete data from cache" 
      });
    }
  });
  
  app.delete("/api/cache/clear", async (req, res) => {
    try {
      const prefix = req.query.prefix as string;
      const key = req.query.key as string;
      
      if (!prefix) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required parameter: prefix" 
        });
      }
      
      // Если запрошено очистить все кеши
      if (prefix === 'all') {
        const results: Record<string, number> = {};
        
        if (key) {
          // Удаляем конкретный ключ из всех кешей
          results.courses = await coursesCache.delete(key) ? 1 : 0;
          results.users = await usersCache.delete(key) ? 1 : 0;
          results.media = await mediaCache.delete(key) ? 1 : 0;
          results.analytics = await analyticsCache.delete(key) ? 1 : 0;
          results.assessments = await assessmentsCache.delete(key) ? 1 : 0;
          
          return res.json({
            success: true,
            operation: `delete_key_from_all(${key})`,
            results
          });
        } else {
          // Очищаем все кеши
          results.courses = await coursesCache.clear();
          results.users = await usersCache.clear();
          results.media = await mediaCache.clear();
          results.analytics = await analyticsCache.clear();
          results.assessments = await assessmentsCache.clear();
          
          return res.json({
            success: true,
            operation: 'clear_all',
            results
          });
        }
      }
      
      // Получаем нужный кеш-менеджер по префиксу
      let cacheManager: CacheManager;
      switch (prefix) {
        case 'courses':
          cacheManager = coursesCache;
          break;
        case 'users':
          cacheManager = usersCache;
          break;
        case 'media':
          cacheManager = mediaCache;
          break;
        case 'analytics':
          cacheManager = analyticsCache;
          break;
        case 'assessments':
          cacheManager = assessmentsCache;
          break;
        default:
          // Если префикс не соответствует ни одному из предопределенных, создаем временный
          cacheManager = new CacheManager(prefix);
      }
      
      if (key) {
        // Удаляем конкретный ключ из указанного кеша
        const success = await cacheManager.delete(key);
        return res.json({
          success,
          operation: `delete_key(${key})`,
          prefix
        });
      } else {
        // Очищаем весь кеш с данным префиксом
        const deletedCount = await cacheManager.clear();
        
        return res.json({
          success: deletedCount >= 0,
          operation: 'clear_prefix',
          deletedCount,
          prefix
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to clear cache" 
      });
    }
  });
  
  // Оставим старый маршрут для обратной совместимости
  app.delete("/api/cache/clear/:prefix", async (req, res) => {
    try {
      const { prefix } = req.params;
      
      if (!prefix) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required parameter: prefix" 
        });
      }
      
      // Получаем нужный кеш-менеджер по префиксу
      let cacheManager: CacheManager;
      switch (prefix) {
        case 'courses':
          cacheManager = coursesCache;
          break;
        case 'users':
          cacheManager = usersCache;
          break;
        case 'media':
          cacheManager = mediaCache;
          break;
        case 'analytics':
          cacheManager = analyticsCache;
          break;
        case 'assessments':
          cacheManager = assessmentsCache;
          break;
        default:
          // Если префикс не соответствует ни одному из предопределенных, создаем временный
          cacheManager = new CacheManager(prefix);
      }
      
      // Очищаем весь кеш с данным префиксом
      const deletedCount = await cacheManager.clear();
      
      return res.json({
        success: deletedCount >= 0,
        deletedCount,
        prefix
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to clear cache" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

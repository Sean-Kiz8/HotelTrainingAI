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
  mediaTypeEnum, employeeLevelEnum,
  learningPaths, courses
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { setupAuth } from "./auth";
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

    if (department) {
      const courses = await storage.listCoursesByDepartment(department);
      return res.json(courses);
    }

    const courses = await storage.listCourses();
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
        userId: req.session.userId || 1,
        courseId: course.id,
        type: "created_course",
        timestamp: new Date()
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
      const { files, settings } = req.body;

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
        createdById: req.session?.userId || 1, // Используем сессию пользователя или 1 по умолчанию
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
            hasQuiz: newLesson.hasQuiz
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
        userId: req.session?.userId || 1,
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

      // Generate file paths
      const filePath = req.file.path;
      const relativePath = `./uploads/media/${req.file.filename}`;
      const fileUrl = `/uploads/media/${req.file.filename}`;

      // Determine media type from mime type
      const mediaType = getMediaTypeFromMimeType(req.file.mimetype);

      // Generate thumbnail for supported media types
      let thumbnail = null;
      const thumbnailName = `thumb_${req.file.filename}`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      const thumbnailResult = await generateThumbnail(filePath, mediaType, thumbnailPath);
      if (thumbnailResult) {
        thumbnail = `/uploads/thumbnails/${thumbnailName}`;
      }

      // Create the media file record in the database
      // Приведение mediaType к правильному типу данных согласно схеме
      const mediaTypeEnum = ["image", "video", "audio", "document", "presentation"] as const;
      let validMediaType = mediaType as "image" | "video" | "audio" | "document" | "presentation";

      // Проверяем, что mediaType является допустимым значением
      if (!mediaTypeEnum.includes(validMediaType as any)) {
        validMediaType = "document"; // Значение по умолчанию, если неизвестный тип
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
      const schema = z.object({
        userId: z.number(),
        createdById: z.number().default(1), // Значение по умолчанию для createdById, чтобы избежать ошибки
        userRole: z.string(),
        userLevel: z.string(),
        userDepartment: z.string(),
        targetSkills: z.array(z.string())
      });

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
      const aiResult = await generateLearningPath(
        data.userRole,
        data.userLevel,
        data.userDepartment,
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
              department: data.userDepartment,
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

      // Фильтруем null значения (на случай, если какие-то курсы не существуют)
      const validCompletedCourses = completedCourses.filter(course => course !== null);

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
        completedCourses: validCompletedCourses.map(c => ({ id: c.id, title: c.title })),
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

  const httpServer = createServer(app);
  return httpServer;
}

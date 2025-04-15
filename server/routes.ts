import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, insertCourseSchema, 
  insertEnrollmentSchema, insertActivitySchema,
  insertChatMessageSchema, insertMediaFileSchema,
  insertModuleSchema, insertLessonSchema, insertLessonMediaSchema,
  mediaTypeEnum
} from "@shared/schema";
import OpenAI from "openai";
import multer from "multer";
import path from "path-browserify";
import fs from "fs-extra";
import sharp from "sharp";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-fakekey" 
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
function getMediaTypeFromMimeType(mimeType: string): string {
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
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid course data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create course" });
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
      const enrollments = await storage.listEnrollmentsByCourse(courseId);
      return res.json(enrollments);
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
        
        // Create context about the hotel training system
        const systemPrompt = `
          You are an AI assistant for a hotel staff training system called HotelLearn.
          The system helps with onboarding new staff and providing ongoing training.
          You have knowledge about the following courses:
          ${courses.map(c => `- ${c.title}: ${c.description} (Department: ${c.department})`).join('\n')}
          
          The user asking this question is ${user?.name || 'a hotel staff member'} 
          who is a ${user?.role || 'staff member'} 
          ${user?.department ? `in the ${user?.department} department` : ''}.
          
          Be helpful, concise, and knowledgeable about hotel operations and training.
          If you don't know something specific about this hotel, provide general best practices
          for the hospitality industry.
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
  
  // Onboarding progress for dashboard
  app.get("/api/onboarding", async (req, res) => {
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

  // Media routes
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
      
      res.json(mediaFiles);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ message: "Failed to fetch media files" });
    }
  });
  
  app.get("/api/media/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaFile = await storage.getMediaFile(id);
      
      if (!mediaFile) {
        return res.status(404).json({ message: "Media file not found" });
      }
      
      res.json(mediaFile);
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
      
      res.status(201).json(mediaFile);
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

  const httpServer = createServer(app);
  return httpServer;
}

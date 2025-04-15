import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Функция для генерации персонализированного учебного плана
export async function generateLearningPath(
  userRole: string,
  userLevel: string,
  userDepartment: string,
  availableCourses: any[]
): Promise<{
  name: string;
  description: string;
  targetSkills: string[];
  recommendedCourses: {
    courseId: number;
    priority: number;
    rationale: string;
  }[];
}> {
  try {
    // Формируем структурированный запрос к модели
    const prompt = `
    Ты - эксперт по обучению персонала отеля. Тебе нужно создать персонализированный учебный план для сотрудника.

    Информация о сотруднике:
    - Должность: ${userRole}
    - Уровень: ${userLevel}
    - Отдел: ${userDepartment}

    Доступные курсы:
    ${availableCourses.map(course => `- ID: ${course.id}, Название: "${course.title}", Описание: "${course.description}", Отдел: "${course.department}"`).join('\n')}

    Создай персонализированный учебный план, который поможет сотруднику развить необходимые навыки для его должности и карьерного роста.
    
    Ответ предоставь в виде JSON-объекта следующего формата:
    {
      "name": "Название учебного плана",
      "description": "Подробное описание учебного плана и его целей",
      "targetSkills": ["Навык 1", "Навык 2", "Навык 3"],
      "recommendedCourses": [
        {
          "courseId": ID_курса,
          "priority": число_от_1_до_10,
          "rationale": "Объяснение, почему этот курс важен"
        }
      ]
    }

    Важно: 
    1. Рекомендуй только курсы из списка доступных курсов, используя их реальные ID
    2. Приоритет должен быть числом от 1 до 10, где 10 - наивысший приоритет
    3. Рекомендуй от 3 до 5 курсов, в зависимости от их релевантности
    4. Учитывай отдел сотрудника при выборе курсов
    5. Название и описание плана должны быть на русском языке
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы обучения персонала отеля HotelLearn." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }

    // Парсим JSON из ответа
    const learningPath = JSON.parse(content);
    return learningPath;
  } catch (error) {
    console.error("Ошибка при генерации учебного плана:", error);
    throw new Error("Не удалось сгенерировать персонализированный учебный план");
  }
}

// Функция для анализа профиля пользователя и рекомендации учебного плана
export async function analyzeUserProfileAndRecommend(
  userProfile: any,
  completedCourses: any[],
  availableCourses: any[]
): Promise<{
  strengths: string[];
  weaknesses: string[];
  recommendedPath: string;
  recommendedCourses: number[];
  explanation: string;
}> {
  try {
    // Формируем информацию о завершенных курсах
    const completedCoursesInfo = completedCourses.map(course => 
      `- ${course.title}: ${course.description}`
    ).join('\n');

    // Получаем ID завершенных курсов для исключения из рекомендаций
    const completedCourseIds = completedCourses.map(course => course.id);
    
    // Фильтруем доступные курсы, исключая уже завершенные
    const newAvailableCourses = availableCourses.filter(
      course => !completedCourseIds.includes(course.id)
    );

    // Формируем информацию о доступных курсах
    const availableCoursesInfo = newAvailableCourses.map(course => 
      `- ID: ${course.id}, ${course.title}: ${course.description}`
    ).join('\n');

    // Формируем запрос к модели
    const prompt = `
    Проанализируй профиль сотрудника отеля и его историю обучения, чтобы определить сильные и слабые стороны, а затем рекомендовать оптимальный путь обучения.

    Информация о сотруднике:
    - Имя: ${userProfile.name || 'Не указано'}
    - Должность: ${userProfile.role || 'Не указана'}
    - Опыт работы: ${userProfile.experience || 'Не указан'} 
    - Отдел: ${userProfile.department || 'Не указан'}
    - Уровень: ${userProfile.level || 'Не указан'}

    Завершенные курсы:
    ${completedCoursesInfo || 'Нет завершенных курсов'}

    Доступные курсы для рекомендации:
    ${availableCoursesInfo || 'Нет доступных курсов'}

    Предоставь анализ в формате JSON:
    {
      "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
      "weaknesses": ["Слабая сторона 1", "Слабая сторона 2"],
      "recommendedPath": "Название рекомендуемого пути обучения",
      "recommendedCourses": [ID_курса_1, ID_курса_2],
      "explanation": "Подробное объяснение рекомендаций"
    }

    Важно:
    1. Рекомендуй только курсы из списка доступных курсов, используя их реальные ID
    2. Учитывай отдел и должность сотрудника при выборе курсов
    3. Рекомендуй от 2 до 4 курсов в порядке приоритета
    4. Если нет доступных курсов, укажи пустой массив recommendedCourses
    5. Все текстовые поля должны быть на русском языке
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы обучения персонала отеля HotelLearn." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }

    // Парсим JSON из ответа
    const recommendation = JSON.parse(content);
    return recommendation;
  } catch (error) {
    console.error("Ошибка при анализе профиля и генерации рекомендаций:", error);
    throw new Error("Не удалось проанализировать профиль и сгенерировать рекомендации");
  }
}

// Функция для генерации подробного объяснения конкретного курса
export async function generateCourseInsight(
  courseId: number,
  courseTitle: string,
  courseDescription: string,
  userRole: string,
  userLevel: string
): Promise<{
  relevanceScore: number;
  keyBenefits: string[];
  skillsGained: string[];
  careerImpact: string;
  timeCommitment: string;
  personalization: string;
}> {
  try {
    const prompt = `
    Проанализируй курс обучения и предоставь подробную информацию о его пользе для конкретного сотрудника отеля.

    Информация о курсе:
    - ID: ${courseId}
    - Название: "${courseTitle}"
    - Описание: "${courseDescription}"

    Информация о сотруднике:
    - Должность: ${userRole}
    - Уровень: ${userLevel}

    Предоставь анализ в формате JSON:
    {
      "relevanceScore": число_от_1_до_10,
      "keyBenefits": ["Ключевая польза 1", "Ключевая польза 2", "Ключевая польза 3"],
      "skillsGained": ["Навык 1", "Навык 2", "Навык 3"],
      "careerImpact": "Как этот курс повлияет на карьерный рост",
      "timeCommitment": "Оцени примерное время, необходимое для изучения курса",
      "personalization": "Персонализированное сообщение, почему этот курс особенно подходит данному сотруднику"
    }

    Важно:
    1. Оценка релевантности (relevanceScore) должна быть числом от 1 до 10
    2. Укажи 3-5 ключевых преимуществ и приобретаемых навыков
    3. Все текстовые поля должны быть на русском языке
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы обучения персонала отеля HotelLearn." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }

    // Парсим JSON из ответа
    const courseInsight = JSON.parse(content);
    return courseInsight;
  } catch (error) {
    console.error("Ошибка при генерации информации о курсе:", error);
    throw new Error("Не удалось сгенерировать подробную информацию о курсе");
  }
}

export default openai;
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Проверка доступности API ключа
const isOpenAIKeyAvailable = () => {
  return !!process.env.OPENAI_API_KEY;
};

// Функция для генерации персонализированного учебного плана
export async function generateLearningPath(
  userRole: string,
  userLevel: string,
  userDepartment: string,
  availableCourses: any[],
  suggestNewCourses: boolean = false
): Promise<{
  name: string;
  description: string;
  targetSkills: string[];
  recommendedCourses: {
    courseId?: number;
    title?: string;
    description?: string;
    isNewCourse?: boolean;
    priority: string;
    order: number;
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

    ${availableCourses.length > 0 ? `Доступные курсы:
    ${availableCourses.map(course => `- ID: ${course.id}, Название: "${course.title}", Описание: "${course.description || "Нет описания"}", Отдел: "${course.department || "Общий"}"`).join('\n')}` : 'В системе пока нет курсов.'}

    Создай персонализированный учебный план, который поможет сотруднику развить необходимые навыки для его должности и карьерного роста.

    Ответ предоставь в виде JSON-объекта следующего формата:
    {
      "name": "Название учебного плана",
      "description": "Подробное описание учебного плана и его целей",
      "targetSkills": ["Навык 1", "Навык 2", "Навык 3"],
      "recommendedCourses": [
        ${suggestNewCourses ? `
        // Для существующего курса:
        {
          "courseId": ID_курса,
          "isNewCourse": false,
          "priority": "high|normal|low",
          "order": порядковый_номер_начиная_с_0,
          "rationale": "Объяснение, почему этот курс важен"
        },
        // Для нового предлагаемого курса:
        {
          "title": "Название нового курса",
          "description": "Описание нового курса",
          "isNewCourse": true,
          "priority": "high|normal|low",
          "order": порядковый_номер_начиная_с_0,
          "rationale": "Объяснение, почему этот курс важен"
        }
        ` : `
        {
          "courseId": ID_курса,
          "priority": "high|normal|low",
          "order": порядковый_номер_начиная_с_0,
          "rationale": "Объяснение, почему этот курс важен"
        }
        `}
      ]
    }

    Важно:
    ${suggestNewCourses ? `
    1. Рекомендуй как существующие курсы (используя их ID), так и предлагай новые курсы, которых еще нет в системе
    2. Для существующих курсов установи isNewCourse = false и укажи courseId
    3. Для новых курсов установи isNewCourse = true, придумай подходящее название и описание
    ` : `
    1. Рекомендуй только курсы из списка доступных курсов, используя их реальные ID
    `}
    2. Приоритет должен быть строкой с одним из значений: "high" (высокий), "normal" (средний), "low" (низкий)
    3. Order должен начинаться с 0 и указывать оптимальный порядок прохождения курсов
    4. Рекомендуй от 3 до 5 курсов, в зависимости от их релевантности
    5. Учитывай отдел сотрудника при выборе курсов
    6. Название и описание плана должны быть на русском языке
    ${suggestNewCourses ? `7. Предложи минимум 1-2 новых курса, которые могли бы дополнить обучение сотрудника
    8. Для новых курсов придумай содержательное название и подробное описание в 3-4 предложения` : ""}
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

// Функция для генерации учебного плана на основе параметров из формы AI-генерации
export async function generateAILearningPath(
  userRole: string,
  userLevel: string,
  userDepartment: string,
  targetSkills: string[],
  availableCourses: any[]
): Promise<{
  name: string;
  description: string;
  targetSkills: string[];
  recommendedCourses: {
    courseId: number;
    priority: string;
    order: number;
    rationale: string;
  }[];
}> {
  try {
    // Преобразуем целевые навыки в строку для запроса
    const skillsText = targetSkills.join(", ");

    // Формируем структурированный запрос к модели
    const prompt = `
    Ты - эксперт по обучению персонала отеля. Тебе нужно создать персонализированный учебный план для сотрудника.

    Информация о сотруднике:
    - Должность: ${userRole}
    - Уровень: ${userLevel}
    - Отдел: ${userDepartment}
    - Целевые навыки для развития: ${skillsText}

    Доступные курсы:
    ${availableCourses.map(course => `- ID: ${course.id}, Название: "${course.title}", Описание: "${course.description || 'Нет описания'}", Отдел: "${course.department || 'Общий'}" ${course.duration ? `, Длительность: ${course.duration}` : ''}`).join('\n')}

    Создай персонализированный учебный план, который поможет сотруднику развить указанные целевые навыки с учетом его должности, уровня и отдела.

    Ответ предоставь в виде JSON-объекта следующего формата:
    {
      "name": "Название учебного плана",
      "description": "Подробное описание учебного плана и его целей",
      "targetSkills": ["Навык 1", "Навык 2", "Навык 3"],
      "recommendedCourses": [
        {
          "courseId": ID_курса,
          "priority": "high|normal|low",
          "order": порядковый_номер_начиная_с_0,
          "rationale": "Объяснение, почему этот курс важен"
        }
      ]
    }

    Важно:
    1. Рекомендуй только курсы из списка доступных курсов, используя их реальные ID
    2. Приоритет должен быть строкой с одним из значений: "high" (высокий), "normal" (средний), "low" (низкий)
    3. Order должен начинаться с 0 и указывать оптимальный порядок прохождения курсов
    4. Рекомендуй от 3 до 5 курсов, в зависимости от их релевантности
    5. Учитывай отдел сотрудника и целевые навыки при выборе курсов
    6. Название и описание плана должны быть на русском языке и быть информативными
    7. Дай краткое и чёткое обоснование каждого курса (rationale) - почему он важен для развития указанных навыков
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы обучения персонала отеля HotelLearn. Отвечай только валидным JSON." },
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
    console.error("Ошибка при генерации учебного плана с помощью AI:", error);
    throw new Error("Не удалось сгенерировать персонализированный учебный план");
  }
}

// Функция для генерации вопросов ассесмента
export async function generateAssessmentQuestions(
  roleName: string,
  department: string,
  competencies: any[],
  count: number = 10,
  includeExplanations: boolean = true
): Promise<{
  questions: {
    text: string;
    type: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: string;
    competencyId: number;
    points: number;
  }[];
}> {
  try {
    // Формируем структурированный запрос к модели
    const prompt = `
    Ты - эксперт по оценке компетенций персонала отеля. Тебе нужно создать вопросы для ассесмента сотрудника.

    Информация о должности:
    - Название: ${roleName}
    - Отдел: ${department}

    Компетенции для оценки:
    ${competencies.map(comp => `- ID: ${comp.id}, Название: "${comp.name}", Описание: "${comp.description || 'Нет описания'}", Категория: "${comp.category || 'Общая'}"`).join('\n')}

    Создай ${count} вопросов для оценки указанных компетенций. Вопросы должны быть разного уровня сложности и разных типов.

    Ответ предоставь в виде JSON-объекта следующего формата:
    {
      "questions": [
        {
          "text": "Текст вопроса",
          "type": "multiple_choice|true_false|text_answer|image_based",
          "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"], // только для multiple_choice
          "correctAnswer": "Правильный ответ",
          ${includeExplanations ? '"explanation": "Объяснение правильного ответа",' : ''}
          "difficulty": "easy|medium|hard",
          "competencyId": ID_компетенции,
          "points": количество_баллов_за_правильный_ответ
        }
      ]
    }

    Важно:
    1. Тип вопроса должен быть одним из: "multiple_choice" (с вариантами ответов), "true_false" (да/нет), "text_answer" (свободный ответ), "image_based" (на основе изображения)
    2. Для вопросов типа multiple_choice обязательно укажи массив options с вариантами ответов (от 3 до 5 вариантов)
    3. Для вопросов типа true_false в options укажи ["Да", "Нет"]
    4. Для вопросов типа text_answer не указывай options
    5. Для вопросов типа image_based укажи в тексте вопроса описание изображения в скобках, например: "(На изображении: стойка регистрации отеля с двумя сотрудниками и гостем)"
    6. Сложность должна быть одной из: "easy" (легкий), "medium" (средний), "hard" (сложный)
    7. CompetencyId должен соответствовать ID одной из указанных компетенций
    8. Количество баллов (points) должно быть от 1 до 5, в зависимости от сложности вопроса
    9. Распредели вопросы равномерно между всеми компетенциями
    10. Все вопросы должны быть на русском языке и соответствовать специфике работы в отеле
    11. Вопросы должны быть разнообразными и охватывать различные аспекты работы в отеле
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы оценки компетенций персонала отеля HotelLearn." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }

    // Парсим JSON из ответа
    const assessmentQuestions = JSON.parse(content);
    return assessmentQuestions;
  } catch (error) {
    console.error("Ошибка при генерации вопросов для ассесмента:", error);
    throw new Error("Не удалось сгенерировать вопросы для ассесмента");
  }
}

// Функция для анализа ответов и генерации следующего вопроса с адаптивной сложностью
export async function generateAdaptiveQuestion(
  roleName: string,
  department: string,
  competencies: any[],
  previousQuestions: any[],
  previousAnswers: any[],
  currentPerformance: number // от 0 до 100
): Promise<{
  question: {
    text: string;
    type: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    difficulty: string;
    competencyId: number;
    points: number;
  };
}> {
  try {
    // Определяем сложность следующего вопроса на основе текущей производительности
    let targetDifficulty = "medium";
    if (currentPerformance < 40) {
      targetDifficulty = "easy";
    } else if (currentPerformance > 75) {
      targetDifficulty = "hard";
    }

    // Находим компетенции, которые еще не были достаточно проверены
    const competencyIds = competencies.map(c => c.id);
    const askedCompetencyIds = previousQuestions.map(q => q.competencyId);

    // Подсчитываем, сколько раз каждая компетенция была проверена
    const competencyCount: Record<number, number> = {};
    askedCompetencyIds.forEach(id => {
      competencyCount[id] = (competencyCount[id] || 0) + 1;
    });

    // Находим наименее проверенные компетенции
    const sortedCompetencies = [...competencyIds].sort((a, b) =>
      (competencyCount[a] || 0) - (competencyCount[b] || 0)
    );

    // Выбираем компетенцию для следующего вопроса (предпочитаем наименее проверенные)
    const targetCompetencyId = sortedCompetencies[0];
    const targetCompetency = competencies.find(c => c.id === targetCompetencyId);

    // Формируем запрос к модели
    const prompt = `
    Ты - эксперт по оценке компетенций персонала отеля. Тебе нужно создать адаптивный вопрос для ассесмента сотрудника.

    Информация о должности:
    - Название: ${roleName}
    - Отдел: ${department}

    Целевая компетенция для оценки:
    - ID: ${targetCompetency.id}
    - Название: "${targetCompetency.name}"
    - Описание: "${targetCompetency.description || 'Нет описания'}"
    - Категория: "${targetCompetency.category || 'Общая'}"

    Текущая производительность сотрудника: ${currentPerformance}%
    Целевая сложность следующего вопроса: ${targetDifficulty}

    ${previousQuestions.length > 0 ? `
    Предыдущие вопросы:
    ${previousQuestions.map((q, i) => `${i+1}. ${q.text} (${q.difficulty}, компетенция: ${competencies.find(c => c.id === q.competencyId)?.name})`).join('\n')}
    ` : ''}

    ${previousAnswers.length > 0 ? `
    Ответы сотрудника на предыдущие вопросы:
    ${previousAnswers.map((a, i) => `${i+1}. Вопрос: ${previousQuestions[i]?.text}\nОтвет: ${a.answer}\nПравильно: ${a.isCorrect ? 'Да' : 'Нет'}`).join('\n\n')}
    ` : ''}

    Создай один адаптивный вопрос для оценки указанной компетенции с учетом текущей производительности сотрудника и его предыдущих ответов.

    Ответ предоставь в виде JSON-объекта следующего формата:
    {
      "question": {
        "text": "Текст вопроса",
        "type": "multiple_choice|true_false|text_answer|image_based",
        "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"], // только для multiple_choice
        "correctAnswer": "Правильный ответ",
        "explanation": "Объяснение правильного ответа",
        "difficulty": "${targetDifficulty}",
        "competencyId": ${targetCompetency.id},
        "points": количество_баллов_за_правильный_ответ
      }
    }

    Важно:
    1. Вопрос должен соответствовать указанной сложности (${targetDifficulty})
    2. Вопрос должен оценивать указанную компетенцию
    3. Вопрос не должен повторять предыдущие вопросы
    4. Вопрос должен быть адаптирован к текущему уровню знаний сотрудника
    5. Тип вопроса выбери наиболее подходящий для оценки данной компетенции
    6. Количество баллов (points) должно быть от 1 до 5, в зависимости от сложности вопроса
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы адаптивной оценки компетенций персонала отеля HotelLearn." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }

    // Парсим JSON из ответа
    const adaptiveQuestion = JSON.parse(content);
    return adaptiveQuestion;
  } catch (error) {
    console.error("Ошибка при генерации адаптивного вопроса:", error);
    throw new Error("Не удалось сгенерировать адаптивный вопрос");
  }
}

// Функция для анализа результатов ассесмента и генерации отчета
export async function generateAssessmentReport(
  userName: string,
  roleName: string,
  department: string,
  competencies: any[],
  questions: any[],
  answers: any[],
  overallScore: number
): Promise<{
  summary: string;
  level: string;
  strengths: string[];
  areasForImprovement: string[];
  competencyResults: {
    competencyId: number;
    name: string;
    score: number;
    feedback: string;
  }[];
  recommendedLearning: string[];
}> {
  try {
    // Подготавливаем данные о результатах по компетенциям
    const competencyResults: Record<number, {
      id: number;
      name: string;
      category: string;
      totalPoints: number;
      earnedPoints: number;
      questions: number;
    }> = {};

    // Инициализируем результаты для каждой компетенции
    competencies.forEach(comp => {
      competencyResults[comp.id] = {
        id: comp.id,
        name: comp.name,
        category: comp.category,
        totalPoints: 0,
        earnedPoints: 0,
        questions: 0
      };
    });

    // Подсчитываем результаты по каждой компетенции
    questions.forEach((q, index) => {
      const answer = answers[index];
      if (competencyResults[q.competencyId]) {
        competencyResults[q.competencyId].questions++;
        competencyResults[q.competencyId].totalPoints += q.points;
        if (answer && answer.isCorrect) {
          competencyResults[q.competencyId].earnedPoints += q.points;
        }
      }
    });

    // Рассчитываем процент для каждой компетенции
    Object.values(competencyResults).forEach((result: any) => {
      result.percentage = result.totalPoints > 0
        ? Math.round((result.earnedPoints / result.totalPoints) * 100)
        : 0;
    });

    // Определяем уровень сотрудника на основе общего результата
    let level = "junior";
    if (overallScore >= 80) {
      level = "senior";
    } else if (overallScore >= 60) {
      level = "middle";
    }

    // Формируем запрос к модели
    const prompt = `
    Ты - эксперт по оценке компетенций персонала отеля. Тебе нужно проанализировать результаты ассесмента сотрудника и создать подробный отчет.

    Информация о сотруднике:
    - Имя: ${userName}
    - Должность: ${roleName}
    - Отдел: ${department}

    Общий результат: ${overallScore}% (Уровень: ${level})

    Результаты по компетенциям:
    ${Object.values(competencyResults).map((result: any) =>
      `- ${result.name} (${result.category}): ${result.percentage}% (${result.earnedPoints}/${result.totalPoints} баллов)`
    ).join('\n')}

    Создай подробный отчет о результатах ассесмента, включая сильные стороны, области для улучшения и рекомендации по обучению.

    Ответ предоставь в виде JSON-объекта следующего формата:
    {
      "summary": "Краткое резюме результатов ассесмента",
      "level": "${level}",
      "strengths": ["Сильная сторона 1", "Сильная сторона 2", "Сильная сторона 3"],
      "areasForImprovement": ["Область для улучшения 1", "Область для улучшения 2", "Область для улучшения 3"],
      "competencyResults": [
        {
          "competencyId": ID_компетенции,
          "name": "Название компетенции",
          "score": процент_выполнения,
          "feedback": "Подробный отзыв по данной компетенции"
        }
      ],
      "recommendedLearning": ["Рекомендация по обучению 1", "Рекомендация по обучению 2", "Рекомендация по обучению 3"]
    }

    Важно:
    1. В summary дай краткую оценку общего уровня сотрудника и его ключевых компетенций
    2. В strengths укажи 3-5 сильных сторон на основе компетенций с наивысшими результатами
    3. В areasForImprovement укажи 3-5 областей для улучшения на основе компетенций с наименьшими результатами
    4. В competencyResults предоставь детальный анализ по каждой компетенции
    5. В recommendedLearning дай 3-5 конкретных рекомендаций по обучению для улучшения слабых компетенций
    6. Все рекомендации должны быть конкретными и применимыми в контексте работы в отеле
    7. Используй профессиональный, но доброжелательный тон
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты - AI-ассистент для системы оценки компетенций персонала отеля HotelLearn." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }

    // Парсим JSON из ответа
    const assessmentReport = JSON.parse(content);
    return assessmentReport;
  } catch (error) {
    console.error("Ошибка при генерации отчета по ассесменту:", error);
    throw new Error("Не удалось сгенерировать отчет по ассесменту");
  }
}

// Генерация курса с помощью OpenAI
export async function generateCourseWithAI(
  settings: {
    title: string;
    description: string;
    targetAudience: string[];
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    format: ('text' | 'video' | 'interactive')[];
    estimatedDuration: number;
    includeTests: boolean;
    includeQuizzes: boolean;
    includeSimulations: boolean;
    modulesCount: number;
  },
  filesSummary?: string // Краткое описание/список загруженных файлов (опционально)
): Promise<{
  title: string;
  description: string;
  modules: {
    title: string;
    description: string;
    lessons: {
      title: string;
      content: string;
      duration: string;
      type: string;
    }[];
  }[];
}> {
  try {
    const prompt = `
Ты — эксперт по обучению персонала отеля. На основе предоставленных данных сгенерируй подробный учебный курс для сотрудников.

Информация о курсе:
- Название: ${settings.title}
- Описание: ${settings.description}
- Целевая аудитория: ${settings.targetAudience.join(", ") || 'Не указана'}
- Уровень сложности: ${settings.difficultyLevel}
- Формат: ${settings.format.join(", ")}
- Ожидаемая длительность: ${settings.estimatedDuration} минут
- Включать тесты: ${settings.includeTests ? 'да' : 'нет'}
- Включать квизы: ${settings.includeQuizzes ? 'да' : 'нет'}
- Включать симуляции: ${settings.includeSimulations ? 'да' : 'нет'}
- Количество модулей: ${settings.modulesCount}
${filesSummary ? `\nМатериалы пользователя:\n${filesSummary}` : ''}

Требования к структуре:
1. Раздели курс на ${settings.modulesCount} логически связанных модулей.
2. В каждом модуле должно быть 2-4 урока (темы), соответствующих теме модуля.
3. Для каждого урока укажи:
   - title: краткое название
   - content: подробное содержимое (1-2 страницы текста, с примерами, списками, подзаголовками)
   - duration: примерная длительность в минутах (10-30)
   - type: один из ["text", "video", "interactive"] (ориентируйся на формат курса)
4. Если includeTests или includeQuizzes — добавь отдельный урок с тестом/квизом в конце соответствующего модуля.
5. Если includeSimulations — добавь отдельный урок-симуляцию в последнем модуле.
6. Все тексты должны быть на русском языке, профессионально и понятно.
7. Не используй "Lorem ipsum" или шаблонные фразы — делай содержательно по теме курса.

Ответ верни в формате JSON:
{
  "title": "...",
  "description": "...",
  "modules": [
    {
      "title": "...",
      "description": "...",
      "lessons": [
        { "title": "...", "content": "...", "duration": "...", "type": "..." },
        ...
      ]
    },
    ...
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты — AI-ассистент для системы обучения персонала отеля HotelLearn. Отвечай только валидным JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }
    return JSON.parse(content);
  } catch (error) {
    console.error("Ошибка при генерации курса через OpenAI:", error);
    throw new Error("Не удалось сгенерировать курс с помощью ИИ");
  }
}

// Генерация описания курса с помощью OpenAI
export async function generateCourseDescriptionAI(
  title: string,
  department?: string,
  targetAudience?: string[]
): Promise<string> {
  try {
    const prompt = `
Ты — эксперт по обучению персонала отеля. На основе данных сгенерируй подробное, профессиональное и мотивирующее описание учебного курса для сотрудников.

Информация о курсе:
- Название: ${title}
${department ? `- Отдел: ${department}` : ''}
${targetAudience && targetAudience.length > 0 ? `- Целевая аудитория: ${targetAudience.join(", ")}` : ''}

Требования:
1. Описание должно быть на русском языке, 4-6 предложений.
2. Укажи, чему научатся сотрудники, какие навыки и пользу они получат.
3. Сделай текст привлекательным и понятным для персонала отеля.
4. Не используй шаблонные фразы и "Lorem ipsum".
`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Ты — AI-ассистент для системы обучения персонала отеля HotelLearn. Отвечай только текстом описания." },
        { role: "user", content: prompt }
      ]
    });
    const content = response.choices[0].message.content;
    if (!content) throw new Error("Не удалось получить ответ от OpenAI");
    return content.trim();
  } catch (error) {
    console.error("Ошибка при генерации описания курса через OpenAI:", error);
    throw new Error("Не удалось сгенерировать описание курса с помощью ИИ");
  }
}

// Функция для генерации содержания курса на основе загруженных файлов
export async function generateCourseContent(
  title: string,
  description: string,
  settings: {
    targetAudience: string[];
    difficultyLevel: string;
    modulesCount: number;
    format: string[];
    includeTests: boolean;
    includeQuizzes: boolean;
  },
  files: {
    id: string;
    name: string;
    type: string;
    url?: string;
  }[]
): Promise<{
  title: string;
  description: string;
  modules: {
    id: number;
    title: string;
    description: string;
    lessons: {
      id: number;
      title: string;
      content: string;
      duration: number; // в минутах
      type: string;
    }[];
  }[];
}> {
  try {
    // Проверяем наличие API ключа
    if (!isOpenAIKeyAvailable()) {
      console.warn("OpenAI API ключ не установлен, возвращаем заготовку контента");
      
      // Если API ключ не доступен, возвращаем заготовку
      return {
        title,
        description,
        modules: Array.from({ length: settings.modulesCount }, (_, i) => ({
          id: i + 1,
          title: `Модуль ${i + 1}`,
          description: `Описание модуля ${i + 1}`,
          lessons: Array.from({ length: 3 }, (_, j) => ({
            id: j + 1,
            title: `Урок ${j + 1}`,
            content: `Содержание урока ${j + 1}`,
            duration: 30, // 30 минут
            type: settings.format[0] || 'text'
          }))
        }))
      };
    }
    
    // Формируем информацию о файлах
    const filesInfo = files.map(file => 
      `- Название: "${file.name}", Тип: ${file.type}`
    ).join('\n');

    // Формируем информацию о целевой аудитории
    const audienceMap: Record<string, string> = {
      "administrators": "Администраторы",
      "receptionists": "Администраторы ресепшн",
      "housekeeping": "Горничные",
      "security": "Служба безопасности",
      "kitchen": "Кухонный персонал",
      "waiters": "Официанты",
      "bartenders": "Бармены",
      "concierge": "Консьержи",
      "maintenance": "Технический персонал"
    };
    
    const audience = settings.targetAudience
      .map(a => audienceMap[a] || a)
      .join(", ");
      
    // Формируем информацию о форматах
    const formatMap: Record<string, string> = {
      "text": "Текстовый материал",
      "video": "Видеоматериал",
      "interactive": "Интерактивные элементы"
    };
    
    const formats = settings.format
      .map(f => formatMap[f] || f)
      .join(", ");

    // Структура запроса к GPT
    const prompt = `
    Разработай детальную структуру курса обучения для персонала отеля на основе следующей информации:
    
    Название курса: "${title}"
    
    Описание курса: "${description}"
    
    Параметры курса:
    - Целевая аудитория: ${audience}
    - Уровень сложности: ${settings.difficultyLevel}
    - Количество модулей: ${settings.modulesCount}
    - Форматы обучения: ${formats}
    - Включает тесты: ${settings.includeTests ? 'Да' : 'Нет'}
    - Включает опросы: ${settings.includeQuizzes ? 'Да' : 'Нет'}
    
    ${filesInfo ? `Доступные материалы:\n${filesInfo}` : 'Дополнительные материалы отсутствуют.'}
    
    Структурируй курс таким образом, чтобы:
    1. Каждый модуль имел четкую тему и цель обучения
    2. Каждый модуль содержал 3 урока
    3. Каждый урок имел заголовок, краткое содержание и примерную продолжительность в минутах
    4. Формат уроков соответствовал указанным форматам обучения
    5. Содержание соответствовало уровню сложности и целевой аудитории
    
    Предоставь результат в формате JSON:
    {
      "title": "Название курса",
      "description": "Описание курса",
      "modules": [
        {
          "id": 1,
          "title": "Название модуля",
          "description": "Описание модуля",
          "lessons": [
            {
              "id": 1,
              "title": "Название урока",
              "content": "Краткое содержание урока",
              "duration": продолжительность_в_минутах,
              "type": "text|video|interactive"
            }
          ]
        }
      ]
    }
    
    Важно:
    1. Все названия и описания должны быть на русском языке
    2. Указывай реалистичную продолжительность уроков в минутах
    3. Каждый модуль должен логически следовать за предыдущим
    4. Тип урока должен быть одним из: "text", "video", "interactive"
    5. Содержание должно быть конкретным и полезным для сотрудников отеля
    6. Краткое содержание каждого урока должно состоять из 2-3 предложений
    7. Модули должны охватывать разные аспекты темы курса
    8. Общая структура курса должна быть логичной и последовательной
    `;
    
    // Отправляем запрос к OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - эксперт по разработке образовательных программ для индустрии гостеприимства."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Не удалось получить ответ от OpenAI");
    }
    
    // Парсим JSON из ответа
    const courseContent = JSON.parse(content);
    
    // Приводим типы данных в соответствие с ожидаемыми
    const formattedContent = {
      ...courseContent,
      modules: courseContent.modules.map((module: any, moduleIndex: number) => ({
        ...module,
        id: moduleIndex + 1, // Убедимся, что ID модулей последовательны
        lessons: module.lessons.map((lesson: any, lessonIndex: number) => ({
          ...lesson,
          id: lessonIndex + 1, // Убедимся, что ID уроков последовательны
          duration: typeof lesson.duration === 'number' ? lesson.duration : parseInt(lesson.duration, 10) || 30
        }))
      }))
    };
    
    return formattedContent;
    
  } catch (error) {
    console.error("Ошибка при генерации содержания курса:", error);
    throw new Error("Не удалось сгенерировать содержание курса");
  }
}

export default openai;
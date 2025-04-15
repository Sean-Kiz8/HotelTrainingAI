-- Создание перечислений (если их нет)
DO $$ 
BEGIN
    -- Создание перечисления question_type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'text_answer', 'image_based');
    END IF;
    
    -- Создание перечисления difficulty_level
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
    END IF;
    
    -- Создание перечисления assessment_status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assessment_status') THEN
        CREATE TYPE assessment_status AS ENUM ('created', 'in_progress', 'completed');
    END IF;
END $$;

-- Создание таблиц для системы оценки компетенций

-- Таблица ролей сотрудников
CREATE TABLE IF NOT EXISTS employee_roles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL,
    required_competencies JSONB,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Таблица компетенций
CREATE TABLE IF NOT EXISTS competencies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Таблица ассесментов
CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    role_id INTEGER NOT NULL,
    status assessment_status NOT NULL DEFAULT 'created',
    target_competencies JSONB,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    time_limit INTEGER,
    passing_score INTEGER NOT NULL DEFAULT 70
);

-- Таблица вопросов для ассесментов
CREATE TABLE IF NOT EXISTS assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    type question_type NOT NULL,
    options JSONB,
    correct_answer TEXT,
    explanation TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    media_id INTEGER,
    competency_id INTEGER NOT NULL,
    difficulty difficulty_level NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Таблица сессий прохождения ассесментов
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    assessment_id INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    status assessment_status NOT NULL DEFAULT 'in_progress',
    score INTEGER,
    score_percentage INTEGER,
    time_spent INTEGER,
    competencies_result JSONB,
    level employee_level,
    recommended_learning_path_id INTEGER
);

-- Таблица ответов пользователя на вопросы ассесмента
CREATE TABLE IF NOT EXISTS assessment_answers (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    is_correct BOOLEAN,
    points INTEGER DEFAULT 0,
    time_spent INTEGER,
    answered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Добавление внешних ключей
ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_role 
FOREIGN KEY (role_id) REFERENCES employee_roles(id) ON DELETE CASCADE;

ALTER TABLE assessment_questions 
ADD CONSTRAINT fk_assessment_questions_assessment 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE assessment_questions 
ADD CONSTRAINT fk_assessment_questions_competency 
FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE;

ALTER TABLE assessment_questions 
ADD CONSTRAINT fk_assessment_questions_media 
FOREIGN KEY (media_id) REFERENCES media_files(id) ON DELETE SET NULL;

ALTER TABLE assessment_sessions 
ADD CONSTRAINT fk_assessment_sessions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE assessment_sessions 
ADD CONSTRAINT fk_assessment_sessions_assessment 
FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

ALTER TABLE assessment_sessions 
ADD CONSTRAINT fk_assessment_sessions_learning_path 
FOREIGN KEY (recommended_learning_path_id) REFERENCES learning_paths(id) ON DELETE SET NULL;

ALTER TABLE assessment_answers 
ADD CONSTRAINT fk_assessment_answers_session 
FOREIGN KEY (session_id) REFERENCES assessment_sessions(id) ON DELETE CASCADE;

ALTER TABLE assessment_answers 
ADD CONSTRAINT fk_assessment_answers_question 
FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE;
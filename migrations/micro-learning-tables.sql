-- Создание перечислений (если их нет)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'micro_learning_type') THEN
        CREATE TYPE micro_learning_type AS ENUM ('text', 'video', 'quiz', 'interactive');
    END IF;
END $$;

-- Таблица для микро-обучающего контента
CREATE TABLE IF NOT EXISTS micro_learning_content (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    type micro_learning_type NOT NULL,
    content TEXT NOT NULL,
    media_id INTEGER REFERENCES media_files(id),
    competency_id INTEGER REFERENCES competencies(id),
    target_level employee_level NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    has_quiz BOOLEAN NOT NULL DEFAULT FALSE,
    keywords TEXT[] DEFAULT '{}'::TEXT[]
);

-- Таблица для назначения микро-обучающего контента пользователям
CREATE TABLE IF NOT EXISTS micro_learning_assignments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content_id INTEGER NOT NULL REFERENCES micro_learning_content(id),
    assessment_session_id INTEGER REFERENCES assessment_sessions(id),
    competency_id INTEGER REFERENCES competencies(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_feedback TEXT,
    effectiveness_rating INTEGER
);

-- Таблица для отслеживания прогресса по микро-обучающему контенту
CREATE TABLE IF NOT EXISTS micro_learning_progress (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES micro_learning_assignments(id),
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    quiz_score INTEGER
);

-- Индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_micro_learning_content_competency ON micro_learning_content (competency_id);
CREATE INDEX IF NOT EXISTS idx_micro_learning_content_target_level ON micro_learning_content (target_level);
CREATE INDEX IF NOT EXISTS idx_micro_learning_assignments_user ON micro_learning_assignments (user_id);
CREATE INDEX IF NOT EXISTS idx_micro_learning_assignments_content ON micro_learning_assignments (content_id);
CREATE INDEX IF NOT EXISTS idx_micro_learning_assignments_completed ON micro_learning_assignments (is_completed);
CREATE INDEX IF NOT EXISTS idx_micro_learning_progress_assignment ON micro_learning_progress (assignment_id);
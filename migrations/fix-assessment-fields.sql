-- Добавление полей в таблицу assessments, если они не существуют
DO $$
BEGIN
    -- Проверяем, существует ли колонка due_date
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'assessments' AND column_name = 'due_date'
    ) THEN
        -- Добавляем колонку due_date
        ALTER TABLE assessments ADD COLUMN due_date TIMESTAMP;
    END IF;

    -- Проверяем, существует ли колонка target_level
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'assessments' AND column_name = 'target_level'
    ) THEN
        -- Добавляем колонку target_level
        ALTER TABLE assessments ADD COLUMN target_level employee_level;
    END IF;
END $$;

-- Добавление новых полей в таблицу assessments
ALTER TABLE assessments
ADD COLUMN due_date TIMESTAMP,
ADD COLUMN target_level employee_level;

-- Обновление существующих записей (опционально)
-- UPDATE assessments SET target_level = 'middle' WHERE target_level IS NULL;

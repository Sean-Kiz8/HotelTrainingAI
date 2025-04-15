-- Изменение значения по умолчанию для поля status в таблице assessment_sessions
ALTER TABLE assessment_sessions 
ALTER COLUMN status SET DEFAULT 'created';

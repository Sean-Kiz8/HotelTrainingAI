# Product Concept Document

1. Executive Summary

Employee Skill Assessment — интеллектуальная система на основе ИИ, предназначенная для автоматической оценки уровня знаний и компетенций сотрудников отелей. Система задаёт серию вопросов по специфике работы и хоспиталити, адаптированных под конкретную роль сотрудника, а затем выдаёт итоговую оценку уровня подготовки. Результаты ассесмента используются для составления персонализированных планов обучения.

⸻

2. Problem Statement

Отели испытывают сложности в объективной и быстрой оценке компетенций своих сотрудников. Ручные проверки занимают много времени, требуют вовлечения квалифицированных сотрудников и могут быть необъективными. Это препятствует эффективной персонализации обучения и снижает общую результативность работы команды.

⸻

3. Target Users

Основные пользователи:
	•	HR-менеджеры и рекрутеры отелей
	•	Тренинг-менеджеры
	•	Руководители департаментов (ресепшен, уборка, F&B и т.д.)

Основные потребности:
	•	Быстрая и объективная оценка уровня сотрудников
	•	Персонализация программ обучения
	•	Выявление пробелов в знаниях и навыках сотрудников

⸻

4. Proposed Solution

Автоматизированный инструмент на базе ИИ, который проводит онлайн-ассесмент сотрудников, задавая ряд вопросов по hospitality и рабочим задачам в зависимости от роли (ресепшенист, официант, менеджер и т.д.). По итогам тестирования система автоматически формирует подробный отчёт об уровне знаний сотрудника, выявляет области для улучшения и рекомендует персонализированный план обучения.

Решение на базе OPENAI API, которая будет использоваться для генерации вопросов и ответов.
Промпт с chain of thought, чтобы система могла корректно обрабатывать вопросы и ответы.


⸻

5. Key Features

- Настройка и персонализация ассесмента:
- Выбор должности сотрудника (ресепшен, хаускипинг, F&B, менеджмент и др.)
- Уточнение дополнительных параметров (опыт работы, текущие обязанности)
- Автоматическое проведение тестирования:
- Генерация адаптивных вопросов на основе роли и уровня сотрудника
- Вопросы в виде текста, изображений, видео и кейсов из реальных ситуаций в отеле
- Адаптивность вопросов: сложность корректируется на основе ответов сотрудника
- Автоматический анализ и отчёт:
- Подсчёт баллов и формирование итоговой оценки (junior, middle, senior)
- Детализированный отчёт по компетенциям и знаниям сотрудника
- Связь с персональным планом обучения:
- Автоматическое формирование рекомендаций по дальнейшему обучению на основе результатов ассесмента
- Возможность немедленного создания персонализированного плана обучения
- Аналитическая панель управления:
- Доступ руководителей и HR к результатам ассесментов
- Аналитика по сотрудникам и подразделениям

⸻

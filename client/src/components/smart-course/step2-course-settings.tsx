import { CourseSettings } from "./smart-course-creator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Step2CourseSettingsProps {
  settings: CourseSettings;
  onSettingsChange: (settings: Partial<CourseSettings>) => void;
}

export function Step2CourseSettings({ settings, onSettingsChange }: Step2CourseSettingsProps) {
  const [audienceInput, setAudienceInput] = useState("");

  const handleFormatChange = (format: 'text' | 'video' | 'interactive') => {
    const updatedFormats = settings.format.includes(format)
      ? settings.format.filter(f => f !== format)
      : [...settings.format, format];
    
    // Убедимся, что хотя бы один формат выбран всегда
    if (updatedFormats.length > 0) {
      onSettingsChange({ format: updatedFormats });
    }
  };

  const addTargetAudience = () => {
    if (audienceInput.trim() && !settings.targetAudience.includes(audienceInput.trim())) {
      onSettingsChange({
        targetAudience: [...settings.targetAudience, audienceInput.trim()]
      });
      setAudienceInput("");
    }
  };

  const removeTargetAudience = (audience: string) => {
    onSettingsChange({
      targetAudience: settings.targetAudience.filter(a => a !== audience)
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-lg font-medium mb-2">Настройки учебного курса</Label>
        <p className="text-sm text-muted-foreground mb-6">
          Укажите основные параметры курса для его автоматической генерации
        </p>
      </div>
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Название курса</Label>
          <Input
            id="title"
            placeholder="Введите название курса"
            value={settings.title}
            onChange={(e) => onSettingsChange({ title: e.target.value })}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Описание курса</Label>
          <Textarea
            id="description"
            placeholder="Подробное описание содержания курса"
            value={settings.description}
            onChange={(e) => onSettingsChange({ description: e.target.value })}
            rows={4}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <Label>Целевая аудитория</Label>
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Добавить целевую аудиторию"
            value={audienceInput}
            onChange={(e) => setAudienceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTargetAudience();
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            onClick={addTargetAudience}
            disabled={!audienceInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {settings.targetAudience.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {settings.targetAudience.map((audience) => (
              <Badge key={audience} variant="secondary" className="flex items-center gap-1">
                {audience}
                <button
                  type="button"
                  className="ml-1 rounded-full"
                  onClick={() => removeTargetAudience(audience)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <Label>Уровень сложности</Label>
        <RadioGroup
          value={settings.difficultyLevel}
          onValueChange={(value) => 
            onSettingsChange({ 
              difficultyLevel: value as 'beginner' | 'intermediate' | 'advanced' 
            })
          }
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="beginner" id="beginner" />
            <Label htmlFor="beginner" className="cursor-pointer">Начальный (для новичков)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="intermediate" id="intermediate" />
            <Label htmlFor="intermediate" className="cursor-pointer">Средний (для опытных сотрудников)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="advanced" id="advanced" />
            <Label htmlFor="advanced" className="cursor-pointer">Продвинутый (для экспертов)</Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <Label>Формат материалов</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="text-format"
              checked={settings.format.includes('text')}
              onCheckedChange={() => handleFormatChange('text')}
            />
            <Label htmlFor="text-format" className="cursor-pointer">Текстовые материалы</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="video-format"
              checked={settings.format.includes('video')}
              onCheckedChange={() => handleFormatChange('video')}
            />
            <Label htmlFor="video-format" className="cursor-pointer">Видеоуроки</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="interactive-format"
              checked={settings.format.includes('interactive')}
              onCheckedChange={() => handleFormatChange('interactive')}
            />
            <Label htmlFor="interactive-format" className="cursor-pointer">Интерактивные элементы</Label>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label>Приблизительная длительность (в минутах): {settings.estimatedDuration}</Label>
          <Slider
            min={30}
            max={240}
            step={15}
            value={[settings.estimatedDuration]}
            onValueChange={([value]) => onSettingsChange({ estimatedDuration: value })}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>30 мин</span>
            <span>2 часа</span>
            <span>4 часа</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Количество модулей: {settings.modulesCount}</Label>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[settings.modulesCount]}
          onValueChange={([value]) => onSettingsChange({ modulesCount: value })}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <Label>Дополнительные элементы</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-tests"
              checked={settings.includeTests}
              onCheckedChange={(checked) => 
                onSettingsChange({ includeTests: checked as boolean })
              }
            />
            <Label htmlFor="include-tests" className="cursor-pointer">Включить итоговые тесты</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-quizzes"
              checked={settings.includeQuizzes}
              onCheckedChange={(checked) => 
                onSettingsChange({ includeQuizzes: checked as boolean })
              }
            />
            <Label htmlFor="include-quizzes" className="cursor-pointer">Включить промежуточные опросы</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-simulations"
              checked={settings.includeSimulations}
              onCheckedChange={(checked) => 
                onSettingsChange({ includeSimulations: checked as boolean })
              }
            />
            <Label htmlFor="include-simulations" className="cursor-pointer">Включить симуляции рабочих ситуаций</Label>
          </div>
        </div>
      </div>
    </div>
  );
}
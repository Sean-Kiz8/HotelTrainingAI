import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const DescriptionWithAI = ({ value, onChange, courseTitle, department, targetAudience }: { value: string, onChange: (value: string) => void, courseTitle: string, department: string, targetAudience: string }) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: courseTitle, department, targetAudience }),
      });
      const data = await res.json();
      if (data.description) onChange(data.description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Button type="button" size="sm" variant="outline" onClick={handleGenerate} disabled={loading || !courseTitle}>
          {loading ? "Генерация..." : "Сгенерировать с помощью ИИ"}
        </Button>
      </div>
      <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Введите описание курса" rows={5} />
    </div>
  );
};
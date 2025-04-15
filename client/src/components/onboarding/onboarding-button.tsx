import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";

type OnboardingButtonProps = {
  className?: string;
};

export function OnboardingButton({ className }: OnboardingButtonProps) {
  const { startOnboarding } = useOnboarding();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={startOnboarding}
      title="Помощь"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
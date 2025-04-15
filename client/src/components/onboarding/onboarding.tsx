import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingStep } from "./onboarding-step";
import { createPortal } from "react-dom";

export function Onboarding() {
  const {
    isOnboardingActive,
    currentStep,
    steps,
    nextStep,
    prevStep,
    skipOnboarding,
    closeOnboarding,
  } = useOnboarding();

  if (!isOnboardingActive) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return createPortal(
    <OnboardingStep
      title={currentStepData.title}
      description={currentStepData.description}
      position={currentStepData.position}
      elementSelector={currentStepData.element}
      action={currentStepData.action}
      isFirst={currentStep === 0}
      isLast={currentStep === steps.length - 1}
      totalSteps={steps.length}
      currentStep={currentStep}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={closeOnboarding}
    />,
    document.body
  );
}
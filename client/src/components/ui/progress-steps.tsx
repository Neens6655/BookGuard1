import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  title: string;
  description: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ steps, currentStep, className }: ProgressStepsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isPending = stepNumber > currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-start space-x-4 step-indicator",
              isActive && "active"
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
              {isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              ) : isActive ? (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">{stepNumber}</span>
                </div>
              )}
            </div>
            <div className="flex-1 pt-1">
              <h4 className={cn(
                "font-semibold",
                isCompleted || isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
              {(isCompleted || isActive) && (
                <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: isCompleted ? "100%" : "65%" }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

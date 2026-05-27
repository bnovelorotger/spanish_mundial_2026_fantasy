"use client";

import { useEffect, useMemo, useState } from "react";

import type { OnboardingStep, OnboardingTourId } from "@/lib/onboarding/tours";

import { CoachMark } from "./CoachMark";

interface OnboardingTourProps {
  children: React.ReactNode;
  steps: OnboardingStep[];
  tourId: OnboardingTourId;
}

const START_DELAY_MS = 50;

function onboardingStorageKey(tourId: OnboardingTourId) {
  return `onboarding:${tourId}`;
}

function skippedStorageKey(tourId: OnboardingTourId) {
  return `onboarding:${tourId}:skippedAt`;
}

function findStepTarget(
  steps: OnboardingStep[],
  startIndex: number,
) {
  for (let index = startIndex; index < steps.length; index += 1) {
    const target = document.querySelector<HTMLElement>(steps[index].target);

    if (target) {
      return {
        element: target,
        index,
      };
    }
  }

  return null;
}

function resolveSide(rect: DOMRect) {
  return rect.top + rect.height / 2 > window.innerHeight * 0.58 ? "top" : "bottom";
}

export function OnboardingTour({
  children,
  steps,
  tourId,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const activeStep = steps[currentStep] ?? null;
  const storageKey = useMemo(() => onboardingStorageKey(tourId), [tourId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (window.localStorage.getItem(storageKey) === "done") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const match = findStepTarget(steps, 0);

      if (!match) {
        return;
      }

      const rect = match.element.getBoundingClientRect();
      setCurrentStep(match.index);
      setTargetRect(rect);
      setSide(resolveSide(rect));
      setIsReady(true);
      setIsOpen(true);
    }, START_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [steps, storageKey]);

  useEffect(() => {
    if (!isOpen || !activeStep) {
      return undefined;
    }

    const updatePosition = () => {
      const target = document.querySelector<HTMLElement>(activeStep.target);

      if (!target) {
        goToNextStep();
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
      setSide(resolveSide(rect));
    };

    const goToNextStep = () => {
      setCurrentStep((previousStep) => {
        const nextMatch = findStepTarget(steps, previousStep + 1);

        if (!nextMatch) {
          window.localStorage.setItem(storageKey, "done");
          setIsOpen(false);
          return previousStep;
        }

        const rect = nextMatch.element.getBoundingClientRect();
        setTargetRect(rect);
        setSide(resolveSide(rect));
        return nextMatch.index;
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activeStep, isOpen, steps, storageKey]);

  function handleNext() {
    const nextMatch = findStepTarget(steps, currentStep + 1);

    if (!nextMatch) {
      window.localStorage.setItem(storageKey, "done");
      setIsOpen(false);
      return;
    }

    const rect = nextMatch.element.getBoundingClientRect();
    setCurrentStep(nextMatch.index);
    setTargetRect(rect);
    setSide(resolveSide(rect));
  }

  function handleSkip() {
    window.localStorage.setItem(storageKey, "done");
    window.localStorage.setItem(skippedStorageKey(tourId), new Date().toISOString());
    setIsOpen(false);
  }

  return (
    <>
      {children}
      {isReady && isOpen && activeStep && targetRect ? (
        <CoachMark
          anchorRect={targetRect}
          currentStep={currentStep}
          description={activeStep.description}
          onNext={handleNext}
          onOpenChange={setIsOpen}
          onSkip={currentStep === 0 ? handleSkip : undefined}
          open={isOpen}
          side={side}
          title={activeStep.title}
          totalSteps={steps.length}
        />
      ) : null}
    </>
  );
}

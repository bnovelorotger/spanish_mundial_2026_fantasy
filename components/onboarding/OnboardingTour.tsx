"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { OnboardingStep, OnboardingTourId } from "@/lib/onboarding/tours";

import { CoachMark } from "./CoachMark";

interface OnboardingTourProps {
  children: React.ReactNode;
  steps: OnboardingStep[];
  tourId: OnboardingTourId;
}

const START_DELAY_MS = 50;
const TOUR_STORAGE_DONE = "done";
const TOUR_STORAGE_SKIPPED = "skipped";

export type OnboardingPersistStatus = "completed" | "missing-targets" | "skipped";
export type OnboardingPersistResult = "done" | "incomplete" | "skipped";

function onboardingStorageKey(tourId: OnboardingTourId) {
  return `onboarding:${tourId}`;
}

function skippedStorageKey(tourId: OnboardingTourId) {
  return `onboarding:${tourId}:skippedAt`;
}

export function shouldRunOnboarding(storedValue: string | null) {
  return storedValue !== TOUR_STORAGE_DONE && storedValue !== TOUR_STORAGE_SKIPPED;
}

export function persistOnboardingResult(input: {
  now?: string;
  shownStepCount: number;
  skippedAtStorageKey: string;
  status: OnboardingPersistStatus;
  storage: Pick<Storage, "setItem">;
  storageKey: string;
}): OnboardingPersistResult {
  if (input.status === "skipped") {
    input.storage.setItem(input.storageKey, TOUR_STORAGE_SKIPPED);
    input.storage.setItem(
      input.skippedAtStorageKey,
      input.now ?? new Date().toISOString(),
    );
    return "skipped";
  }

  if (input.shownStepCount > 0) {
    input.storage.setItem(input.storageKey, TOUR_STORAGE_DONE);
    return "done";
  }

  return "incomplete";
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
  const shownStepIndexesRef = useRef<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [side, setSide] = useState<"bottom" | "top">("bottom");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const activeStep = steps[currentStep] ?? null;
  const storageKey = useMemo(() => onboardingStorageKey(tourId), [tourId]);
  const skippedAtKey = useMemo(() => skippedStorageKey(tourId), [tourId]);

  const registerShownStep = useCallback((stepIndex: number) => {
    shownStepIndexesRef.current.add(stepIndex);
  }, []);

  const moveToStep = useCallback((match: { element: HTMLElement; index: number }) => {
    const rect = match.element.getBoundingClientRect();
    registerShownStep(match.index);
    setCurrentStep(match.index);
    setTargetRect(rect);
    setSide(resolveSide(rect));
  }, [registerShownStep]);

  const finalizeTour = useCallback((status: OnboardingPersistStatus) => {
    if (typeof window === "undefined") {
      return;
    }

    persistOnboardingResult({
      shownStepCount: shownStepIndexesRef.current.size,
      skippedAtStorageKey: skippedAtKey,
      status,
      storage: window.localStorage,
      storageKey,
    });
    setIsOpen(false);
  }, [skippedAtKey, storageKey]);

  const advanceToNextVisibleStep = useCallback((
    fromStep: number,
    exhaustedStatus: Exclude<OnboardingPersistStatus, "skipped">,
  ) => {
    const nextMatch = findStepTarget(steps, fromStep + 1);

    if (!nextMatch) {
      finalizeTour(exhaustedStatus);
      return false;
    }

    moveToStep(nextMatch);
    return true;
  }, [finalizeTour, moveToStep, steps]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!shouldRunOnboarding(window.localStorage.getItem(storageKey))) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const match = findStepTarget(steps, 0);

      if (!match) {
        return;
      }

      moveToStep(match);
      setIsReady(true);
      setIsOpen(true);
    }, START_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [moveToStep, steps, storageKey]);

  useEffect(() => {
    if (!isOpen || !activeStep) {
      return undefined;
    }

    const goToNextStep = () => {
      advanceToNextVisibleStep(currentStep, "missing-targets");
    };

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

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [activeStep, advanceToNextVisibleStep, currentStep, isOpen, steps]);

  function handleNext() {
    advanceToNextVisibleStep(currentStep, "completed");
  }

  function handleSkip() {
    finalizeTour("skipped");
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

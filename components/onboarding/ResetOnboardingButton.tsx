"use client";

export function ResetOnboardingButton() {
  function handleReset() {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith("onboarding:")) {
        window.localStorage.removeItem(key);
      }
    }

    window.location.reload();
  }

  return (
    <button
      className="text-sm font-medium text-text-muted transition-colors duration-150 hover:text-accent-primary"
      onClick={handleReset}
      type="button"
    >
      Volver a ver el tutorial
    </button>
  );
}

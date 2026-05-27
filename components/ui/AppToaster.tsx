"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function AppToaster() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      setIsDesktop(window.innerWidth >= 640);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  return (
    <Toaster
      closeButton={false}
      duration={3500}
      offset={isDesktop ? "24px" : "calc(96px + env(safe-area-inset-bottom))"}
      position={isDesktop ? "bottom-right" : "bottom-center"}
      richColors
      theme="dark"
      toastOptions={{
        classNames: {
          description: "text-text-secondary",
          toast:
            "border border-border-subtle bg-surface-elevated text-text-primary shadow-card",
        },
      }}
    />
  );
}

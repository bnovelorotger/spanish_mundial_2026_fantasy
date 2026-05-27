import { Suspense } from "react";

import { AuthToastSurface } from "@/components/auth/AuthToastSurface";
import { AppToaster } from "@/components/ui/AppToaster";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <AppToaster />
      <Suspense fallback={null}>
        <AuthToastSurface />
      </Suspense>
    </>
  );
}

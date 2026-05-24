import { ScreenSkeleton } from "@/components/ui/ScreenSkeleton";

export default function ProtectedLoading() {
  return <ScreenSkeleton cards={4} title="Loading your protected tournament view." />;
}
